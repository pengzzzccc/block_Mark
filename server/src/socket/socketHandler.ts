import type { Server, Socket } from 'socket.io';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    PlayerState,
    ClientGameState,
    GameState,
    RoomState,
    DuelState,
    DuelDiceResult,
} from '../../../shared/types.js';
import {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    getRoom,
    handleReconnect,
    handleDisconnect,
    sanitizedGameState,
} from './roomManager.js';
import {
    startTurn,
    executeBuy,
    executeSwap,
    initiateNegotiation,
    handleNegotiationReply,
    initiateForcedTrade,
    rollDuelAction,
    resolveDuel,
    advanceToNextPlayer,
} from '../game/turnEngine.js';
import { checkWinCondition } from '../game/winCheck.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Map playerId => roomId for quick lookup
const playerRooms = new Map<string, string>();

export function registerSocketHandlers(io: TypedServer): void {
    io.on('connection', (socket: TypedSocket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // ---- Room Events ----

        socket.on('room:create', (data) => {
            const { playerName } = data;
            const playerId = socket.id;
            const player: PlayerState = {
                id: playerId,
                name: playerName,
                cash: 200,
                hand: [],
                connected: true,
                isHost: true,
            };

            const room = createRoom(player);
            playerRooms.set(playerId, room.roomId);
            socket.join(room.roomId);

            socket.emit('room:created', { roomId: room.roomId, roomCode: room.roomCode });
        });

        socket.on('room:join', (data) => {
            const { roomCode, playerName } = data;
            const playerId = socket.id;
            const player: PlayerState = {
                id: playerId,
                name: playerName,
                cash: 200,
                hand: [],
                connected: true,
                isHost: false,
            };

            const room = joinRoom(roomCode, player);
            if (!room) {
                socket.emit('room:error', { message: '房间不存在或已满' });
                return;
            }

            playerRooms.set(playerId, room.roomId);
            socket.join(room.roomId);

            io.to(room.roomId).emit('room:updated', room);
        });

        socket.on('room:leave', () => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;

            const room = leaveRoom(roomId, socket.id, io);
            socket.leave(roomId);
            playerRooms.delete(socket.id);

            if (room) {
                io.to(room.roomId).emit('room:updated', room);
            }
        });

        // ---- Game Events ----

        socket.on('game:start', () => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;

            const result = startGame(roomId, socket.id);
            if (!result.success) {
                socket.emit('game:error', { message: result.message! });
                return;
            }

            const room = result.room!;
            const gameState = room.gameState!;

            // Broadcast client-specific game state to each player
            for (const player of room.players) {
                const clientState = buildClientGameState(gameState, player.id);
                const playerSocket = io.sockets.sockets.get(player.id);
                if (playerSocket) {
                    playerSocket.emit('game:started', { gameState: clientState });
                }
            }

            // Start first turn — auto roll dice
            const turnResult = startTurn(gameState);
            room.gameState = turnResult.game;
            // Emit dice result to the first player
            const firstPlayerSocket = io.sockets.sockets.get(room.players[0].id);
            if (firstPlayerSocket) {
                firstPlayerSocket.emit('turn:diceResult', turnResult.incomeResult);
            }
            broadcastGameUpdate(io, room.roomId, turnResult.game);
        });

        socket.on('turn:rollDice', () => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;
            if (room.gameState.phase !== 'settlement') return;

            const turnResult = startTurn(room.gameState);
            room.gameState = turnResult.game;
            socket.emit('turn:diceResult', turnResult.incomeResult);
            broadcastGameUpdate(io, roomId, turnResult.game);
        });

        socket.on('turn:buy', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;
            if (room.gameState.phase !== 'action') return;

            const result = executeBuy(room.gameState, socket.id, {
                blockId: data.blockId,
                source: data.source,
            });
            room.gameState = result.game;
            socket.emit('turn:actionResult', { success: result.success, message: result.message });
            broadcastGameUpdate(io, roomId, result.game);
            handlePostAction(io, roomId, result.game);
        });

        socket.on('turn:swap', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;
            if (room.gameState.phase !== 'action') return;

            const result = executeSwap(room.gameState, socket.id, {
                sellBlockId: data.sellBlockId,
                buyBlockId: data.buyBlockId,
            });
            room.gameState = result.game;
            socket.emit('turn:actionResult', { success: result.success, message: result.message });
            broadcastGameUpdate(io, roomId, result.game);
            handlePostAction(io, roomId, result.game);
        });

        socket.on('turn:negotiate', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;
            if (room.gameState.phase !== 'action') return;

            const result = initiateNegotiation(room.gameState, socket.id, {
                targetPlayerId: data.targetPlayerId,
                offeredBlockId: data.offeredBlockId,
                requestedBlockId: data.requestedBlockId,
                cashOffered: data.cashOffered,
                cashRequested: data.cashRequested,
            });
            room.gameState = result.game;

            if (result.success && result.game.negotiation) {
                const targetSocket = io.sockets.sockets.get(data.targetPlayerId);
                if (targetSocket) {
                    targetSocket.emit('negotiate:request', result.game.negotiation);
                }
            }

            socket.emit('turn:actionResult', { success: result.success, message: result.message });
            broadcastGameUpdate(io, roomId, result.game);
        });

        socket.on('turn:negotiateReply', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;

            const result = handleNegotiationReply(room.gameState, socket.id, data.accept);
            room.gameState = result.game;

            const offer = room.gameState.negotiation;
            if (offer) {
                const fromSocket = io.sockets.sockets.get(offer.fromPlayerId);
                const response = { accepted: data.accept, offerId: '' };
                if (fromSocket) fromSocket.emit('negotiate:response', response);
                socket.emit('negotiate:response', response);
            }

            broadcastGameUpdate(io, roomId, result.game);
            handlePostAction(io, roomId, result.game);
        });

        socket.on('turn:forcedTrade', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;
            if (room.gameState.phase !== 'action') return;

            const result = initiateForcedTrade(room.gameState, socket.id, {
                targetPlayerId: data.targetPlayerId,
                targetBlockId: data.targetBlockId,
            });
            room.gameState = result.game;

            socket.emit('turn:actionResult', { success: result.success, message: result.message });

            if (result.success && result.game.duelState) {
                io.to(roomId).emit('duel:initiated', result.game.duelState);
            }

            broadcastGameUpdate(io, roomId, result.game);
        });

        socket.on('turn:duelRoll', () => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState?.duelState) return;

            const duelResult = rollDuelAction(room.gameState);
            if (!duelResult) return;
            room.gameState = duelResult.game;

            const duelState = duelResult.result;
            const diceResult: DuelDiceResult = {
                attacker: duelState.result?.attackerRoll
                    ? { red: Math.floor(duelState.result.attackerRoll / 2), green: duelState.result.attackerRoll % 6 || 6 }
                    : { red: 1, green: 1 },
                defender: duelState.result?.defenderRoll
                    ? { red: Math.floor(duelState.result.defenderRoll / 2), green: duelState.result.defenderRoll % 6 || 6 }
                    : { red: 1, green: 1 },
                attackerSum: duelState.result?.attackerRoll ?? 0,
                defenderSum: duelState.result?.defenderRoll ?? 0,
                attackerDoubles: duelState.result?.attackerDoubles ?? false,
                defenderDoubles: duelState.result?.defenderDoubles ?? false,
                blackBlockHalved: duelState.result?.blackBlockHalved ?? false,
            };
            io.to(roomId).emit('duel:rolled', diceResult);

            const resolved = resolveDuel(duelResult.game);
            room.gameState = resolved.game;

            if (resolved.success) {
                const defender = resolved.game.players.find((p) => p.id === duelState.defenderId);
                const attacker = resolved.game.players.find((p) => p.id === duelState.attackerId);
                const targetBlockId = duelState.targetBlockId;
                const defenderHasBlock = defender?.hand.some((b) => b.id === targetBlockId) ?? false;
                const winnerId = duelState.result?.winnerId ?? '';
                const blockTransferred = attacker?.hand.find((b) => b.id === targetBlockId) ?? defender?.hand.find((b) => b.id === targetBlockId);
                if (blockTransferred) {
                    io.to(roomId).emit('duel:result', {
                        winnerId,
                        blockTransferred,
                        cashTransferred: defenderHasBlock ? duelState.wagerAmount : 0,
                    });
                }
            }

            broadcastGameUpdate(io, roomId, resolved.game);
            handlePostAction(io, roomId, resolved.game);
        });

        socket.on('turn:end', () => {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) return;
            const room = getRoom(roomId);
            if (!room?.gameState) return;

            const updated = advanceToNextPlayer(room.gameState);
            room.gameState = updated;
            broadcastGameUpdate(io, roomId, updated);
        });

        // ---- Connection Events ----

        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
            const roomId = playerRooms.get(socket.id);
            if (roomId) {
                const room = handleDisconnect(roomId, socket.id);
                if (room) {
                    io.to(roomId).emit('room:updated', room);
                }
            }
        });
    });
}

// ---- Helpers ----

function buildClientGameState(gameState: GameState, playerId: string): ClientGameState {
    const sanitized = sanitizedGameState(gameState, playerId);
    return {
        myPlayerId: playerId,
        myHand: sanitized.players.find((p) => p.id === playerId)?.hand ?? [],
        players: sanitized.players.map((p) => ({
            id: p.id,
            name: p.name,
            cash: p.cash,
            handCount: p.hand.length,
            connected: p.connected,
            isHost: p.isHost,
            hasBlackBlock: p.hand.some((b) => b.category === 'black'),
        })),
        currentPlayerIndex: sanitized.currentPlayerIndex,
        currentTurn: sanitized.currentTurn,
        phase: sanitized.phase,
        openMarket: sanitized.openMarket,
        blindPileCount: sanitized.blindPile.length,
        discardPileCount: sanitized.discardPile.length,
        diceResult: sanitized.diceResult,
        duelState: sanitized.duelState,
        negotiation: sanitized.negotiation,
        winnerId: sanitized.winnerId,
        turnDeadline: sanitized.turnDeadline,
        extraAction: sanitized.extraAction,
    };
}

function broadcastGameUpdate(io: TypedServer, roomId: string, gameState: GameState): void {
    for (const player of gameState.players) {
        const clientState = buildClientGameState(gameState, player.id);
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
            playerSocket.emit('game:stateUpdate', { gameState: clientState });
        }
    }
}

/**
 * After an action resolves:
 * - If there's a winner, announce and stop.
 * - Otherwise, auto-advance to next player for next turn's settlement.
 */
function handlePostAction(io: TypedServer, roomId: string, gameState: GameState): void {
    if (gameState.winnerId) {
        const winner = gameState.players.find((p) => p.id === gameState.winnerId);
        if (winner) {
            const winResult = checkWinCondition(winner.hand);
            io.to(roomId).emit('game:winner', {
                playerId: winner.id,
                playerName: winner.name,
                winResult,
            });
        }
        return;
    }

    // Advance to next player and write back to room
    const nextState = advanceToNextPlayer(gameState);
    const room = getRoom(roomId);
    if (room) room.gameState = nextState;
    broadcastGameUpdate(io, roomId, nextState);
}