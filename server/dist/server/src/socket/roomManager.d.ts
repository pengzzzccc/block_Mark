import type { PlayerState, RoomState, GameState } from '@shared/types.js';
import type { Server } from 'socket.io';
declare const rooms: Map<string, RoomState>;
/** Create a room and return its state */
export declare function createRoom(hostPlayer: PlayerState): RoomState;
/** Join an existing room */
export declare function joinRoom(roomId: string, player: PlayerState): RoomState | null;
/** Leave a room */
export declare function leaveRoom(roomId: string, playerId: string, io: Server): RoomState | null;
/** Start the game for a room */
export declare function startGame(roomId: string, playerId: string): {
    room: RoomState;
    success: boolean;
    message: string;
};
/** Get a room by ID */
export declare function getRoom(roomId: string): RoomState | undefined;
/**
 * Build a sanitized game state for broadcasting — hides other players' hands.
 * Returns a GameState where other players' hands are replaced with count-only placeholders.
 */
export declare function sanitizedGameState(game: GameState, viewerId: string): GameState;
/** Handle reconnection — update player's connected status */
export declare function handleReconnect(roomId: string, playerId: string): RoomState | null;
/** Handle disconnection — mark player as disconnected */
export declare function handleDisconnect(roomId: string, playerId: string): RoomState | null;
/** Export rooms for debugging/inspection */
export { rooms };
