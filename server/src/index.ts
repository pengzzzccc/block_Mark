import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types.js';
import { registerSocketHandlers } from './socket/socketHandler.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`[Server] Block Market server running on port ${PORT}`);
});
