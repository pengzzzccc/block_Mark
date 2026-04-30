import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import {
    io,
    Socket as SocketClient,
} from 'socket.io-client';
import type { ClientGameState, RoomState, Block, NegotiationOffer, DuelState, IncomeResult, DuelDiceResult, WinResult } from '../../../shared/types.js';

// Re-export types for client components
export type { ClientGameState, RoomState, Block, NegotiationOffer, DuelState, IncomeResult, DuelDiceResult, WinResult };

export type Page = 'lobby' | 'waiting' | 'game' | 'finished';

export interface PlayerInfo {
    id: string;
    name: string;
    cash: number;
    handCount: number;
    connected: boolean;
    isHost: boolean;
    hasBlackBlock: boolean;
}

export interface GameStore {
    // Connection
    socket: SocketClient | null;
    connected: boolean;
    connecting: boolean;

    // UI State
    page: Page;
    error: string | null;
    notification: string | null;

    // Room
    roomId: string | null;
    roomCode: string | null;
    players: PlayerInfo[];
    hostId: string | null;
    maxPlayers: number;

    // My player
    myPlayerId: string | null;
    playerName: string;

    // Game State
    gameState: ClientGameState | null;

    // Duel
    duelDice: DuelDiceResult | null;

    // Victory
    winResult: WinResult | null;
    winnerName: string | null;

    // Actions
    connect: () => void;
    disconnect: () => void;
    setPlayerName: (name: string) => void;
    createRoom: (playerName: string, maxPlayers?: number) => void;
    joinRoom: (roomCode: string, playerName: string) => void;
    leaveRoom: () => void;
    startGame: () => void;
    setPage: (page: Page) => void;
    setError: (error: string | null) => void;
    setNotification: (notification: string | null) => void;

    // Game actions
    rollDice: () => void;
    buyBlock: (blockId: string, source: 'market' | 'blind') => void;
    swapBlock: (sellBlockId: string, buyBlockId: string) => void;
    negotiate: (data: {
        targetPlayerId: string;
        offeredBlockId: string | null;
        requestedBlockId: string | null;
        cashOffered: number;
        cashRequested: number;
    }) => void;
    negotiateReply: (accept: boolean) => void;
    forcedTrade: (targetPlayerId: string, targetBlockId: string) => void;
    duelRoll: () => void;
    endTurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    socket: null,
    connected: false,
    connecting: false,

    page: 'lobby',
    error: null,
    notification: null,

    roomId: null,
    roomCode: null,
    players: [],
    hostId: null,
    maxPlayers: 4,

    myPlayerId: null,
    playerName: '',

    gameState: null,
    duelDice: null,
    winResult: null,
    winnerName: null,

    connect: () => {
        if (get().socket?.connected) return;

        set({ connecting: true });
        const socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            set({ socket, connected: true, connecting: false, myPlayerId: socket.id ?? null });
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            set({ connected: false, gameState: null });
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
            set({ connecting: false, error: '无法连接到服务器' });
        });

        // Room events
        socket.on('room:created', (data: { roomId: string; roomCode: string }) => {
            set({ roomId: data.roomId, roomCode: data.roomCode, page: 'waiting' });
        });

        socket.on('room:updated', (data: RoomState) => {
            set({
                roomId: data.roomId,
                roomCode: data.roomCode,
                players: data.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    cash: p.cash,
                    handCount: p.hand.length,
                    connected: p.connected,
                    isHost: p.isHost,
                    hasBlackBlock: p.hand.some((b) => b.category === 'black'),
                })),
                hostId: data.hostId,
                maxPlayers: data.maxPlayers,
            });
        });

        socket.on('room:error', (data: { message: string }) => {
            set({ error: data.message });
        });

        // Game events
        socket.on('game:started', (data: { gameState: ClientGameState }) => {
            set({
                page: 'game',
                gameState: data.gameState,
                duelDice: null,
                winResult: null,
                winnerName: null,
                notification: '游戏开始！',
            });
            setTimeout(() => set({ notification: null }), 3000);
        });

        socket.on('game:stateUpdate', (data: { gameState: ClientGameState }) => {
            set({ gameState: data.gameState });
        });

        socket.on('turn:diceResult', (data: IncomeResult) => {
            const state = get().gameState;
            if (state) {
                set({
                    gameState: { ...state, diceResult: data },
                    notification: `收入 $${data.income}!`,
                });
                setTimeout(() => set({ notification: null }), 3000);
            }
        });

        socket.on('turn:actionResult', (data: { success: boolean; message: string }) => {
            set({ notification: data.message });
            setTimeout(() => set({ notification: null }), 3000);
        });

        socket.on('duel:initiated', (data: DuelState) => {
            const state = get().gameState;
            if (state) {
                set({ gameState: { ...state, duelState: data }, notification: '对决开始！' });
                setTimeout(() => set({ notification: null }), 2000);
            }
        });

        socket.on('duel:rolled', (data: DuelDiceResult) => {
            set({ duelDice: data });
        });

        socket.on('duel:result', (data: { winnerId: string; blockTransferred: Block; cashTransferred: number }) => {
            const winner = get().players.find((p) => p.id === data.winnerId);
            set({
                duelDice: null,
                notification: `${winner?.name ?? '?'} 赢得对决！`,
            });
            setTimeout(() => set({ notification: null }), 3000);
        });

        socket.on('negotiate:request', (data: NegotiationOffer) => {
            set({ notification: '收到协商请求！' });
            setTimeout(() => set({ notification: null }), 3000);
        });

        socket.on('negotiate:response', (data: { accepted: boolean; offerId: string }) => {
            set({ notification: data.accepted ? '协商成功！' : '协商被拒绝' });
            setTimeout(() => set({ notification: null }), 3000);
        });

        socket.on('game:winner', (data: { playerId: string; playerName: string; winResult: WinResult }) => {
            set({
                page: 'finished',
                winResult: data.winResult,
                winnerName: data.playerName,
            });
        });

        socket.on('game:error', (data: { message: string }) => {
            set({ error: data.message });
            setTimeout(() => set({ error: null }), 4000);
        });

        socket.on('player:reconnected', (data: { playerId: string }) => {
            set({ notification: `玩家已重连` });
            setTimeout(() => set({ notification: null }), 2000);
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        socket?.disconnect();
        set({
            socket: null,
            connected: false,
            connecting: false,
            page: 'lobby',
            roomId: null,
            roomCode: null,
            players: [],
            gameState: null,
            duelDice: null,
            winResult: null,
            winnerName: null,
            error: null,
            notification: null,
        });
    },

    setPlayerName: (name: string) => set({ playerName: name }),

    createRoom: (playerName: string, maxPlayers?: number) => {
        get().socket?.emit('room:create', { playerName, maxPlayers });
    },

    joinRoom: (roomCode: string, playerName: string) => {
        get().socket?.emit('room:join', { roomCode, playerName });
    },

    leaveRoom: () => {
        get().socket?.emit('room:leave');
        set({ page: 'lobby', roomId: null, roomCode: null, players: [], gameState: null });
    },

    startGame: () => {
        get().socket?.emit('game:start');
    },

    setPage: (page: Page) => set({ page }),
    setError: (error: string | null) => set({ error }),
    setNotification: (notification: string | null) => set({ notification }),

    rollDice: () => get().socket?.emit('turn:rollDice'),
    buyBlock: (blockId: string, source: 'market' | 'blind') =>
        get().socket?.emit('turn:buy', { blockId, source }),
    swapBlock: (sellBlockId: string, buyBlockId: string) =>
        get().socket?.emit('turn:swap', { sellBlockId, buyBlockId }),
    negotiate: (data) => get().socket?.emit('turn:negotiate', data),
    negotiateReply: (accept: boolean) => get().socket?.emit('turn:negotiateReply', { accept }),
    forcedTrade: (targetPlayerId: string, targetBlockId: string) =>
        get().socket?.emit('turn:forcedTrade', { targetPlayerId, targetBlockId }),
    duelRoll: () => get().socket?.emit('turn:duelRoll'),
    endTurn: () => get().socket?.emit('turn:end'),
}));