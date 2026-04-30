import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types.js';
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export declare function registerSocketHandlers(io: TypedServer): void;
export {};
