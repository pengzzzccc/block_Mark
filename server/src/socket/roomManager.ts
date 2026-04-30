import type { PlayerState, RoomState, GameState, Block, BlockColor, BlockCategory } from '../../../shared/types.js';
import type { Server, Socket } from 'socket.io';
import { initBlockPool, setupOpenMarket } from '../game/blocks.js';
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

// In-memory store (replace with Redis eventually)
const rooms = new Map<string, RoomState>();

/** Generate a 6-character room code */
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/** Create a room and return its state */
export function createRoom(hostPlayer: PlayerState): RoomState {
    const roomCode = generateRoomCode();
    const room: RoomState = {
        roomId: roomCode,
        roomCode,
        players: [hostPlayer],
        gameState: null,
        status: 'waiting',
        hostId: hostPlayer.id,
        maxPlayers: 4,
        createdAt: Date.now(),
    };
    rooms.set(roomCode, room);
    return room;
}

/** Join an existing room */
export function joinRoom(roomId: string, player: PlayerState): RoomState | null {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'waiting') return null;
    if (room.players.length >= 4) return null;

    room.players.push(player);
    return room;
}

/** Leave a room */
export function leaveRoom(roomId: string, playerId: string, io: Server): RoomState | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
        rooms.delete(roomId);
        return null;
    }

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
    }

    return room;
}

/** Start the game for a room */
export function startGame(roomId: string, playerId: string): { room: RoomState; success: boolean; message: string } {
    const room = rooms.get(roomId);
    if (!room) return { room: null as unknown as RoomState, success: false, message: '房间不存在' };
    if (room.hostId !== playerId) return { room, success: false, message: '只有房主可以开始游戏' };
    if (room.players.length < 2) return { room, success: false, message: '至少需要2名玩家' };

    // Initialize game state
    const blindPile = initBlockPool();
    const { openMarket, blindPile: remainingPile } = setupOpenMarket(blindPile);

    // Give each player $200 starting cash
    room.players.forEach((p) => {
        p.cash = 200;
        p.hand = [];
    });

    const gameState: GameState = {
        players: room.players.map((p) => ({ ...p })),
        currentPlayerIndex: 0,
        currentTurn: 1,
        openMarket,
        blindPile: remainingPile,
        discardPile: [],
        phase: 'settlement',
        winnerId: null,
        diceResult: null,
        currentAction: null,
        duelState: null,
        negotiation: null,
        turnDeadline: null,
        extraAction: false,
    };

    room.gameState = gameState;
    room.status = 'playing';

    return { room, success: true, message: '游戏开始' };
}

/** Get a room by ID */
export function getRoom(roomId: string): RoomState | undefined {
    return rooms.get(roomId);
}

/**
 * Build a sanitized game state for broadcasting — hides other players' hands.
 * Returns a GameState where other players' hands are replaced with count-only placeholders.
 */
export function sanitizedGameState(game: GameState, viewerId: string): GameState {
    return {
        ...game,
        players: game.players.map((p) => {
            if (p.id === viewerId) return p;
            // Replace hidden hand with opaque blocks (keep only id)
            const hiddenHand: Block[] = p.hand.map((b) => ({ ...b, color: 'black' as BlockColor, number: null, category: 'black' as BlockCategory, basePrice: 0 }));
            return { ...p, hand: hiddenHand };
        }),
    };
}

/** Handle reconnection — update player's connected status */
export function handleReconnect(roomId: string, playerId: string): RoomState | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
        player.connected = true;
    }

    return room;
}

/** Handle disconnection — mark player as disconnected */
export function handleDisconnect(roomId: string, playerId: string): RoomState | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
        player.connected = false;
    }

    return room;
}

/** Export rooms for debugging/inspection */
export { rooms };