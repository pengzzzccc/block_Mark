import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function WaitingRoom() {
    const {
        roomCode,
        players,
        hostId,
        myPlayerId,
        maxPlayers,
        leaveRoom,
        startGame,
    } = useGameStore();

    const isHost = myPlayerId === hostId;
    const canStart = players.length >= 2;

    const copyRoomCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="glass-card p-8 w-full max-w-lg">
                {/* Header */}
                <h1 className="text-3xl font-display text-gold-400 text-center mb-2">
                    Waiting Room
                </h1>
                <p className="text-gold-300/50 font-mono text-xs text-center mb-6 uppercase tracking-widest">
                    {players.length}/{maxPlayers} Players
                </p>

                {/* Room Code */}
                <div className="text-center mb-8">
                    <p className="text-gold-300/50 font-mono text-xs mb-1">Room Code</p>
                    <div
                        className="inline-flex items-center gap-3 bg-felt-900/50 border border-gold-400/30 rounded-lg px-6 py-3 cursor-pointer hover:border-gold-400/60 transition-colors"
                        onClick={copyRoomCode}
                        title="Click to copy"
                    >
                        <span className="text-gold-400 font-mono text-2xl tracking-[0.3em] font-bold">
                            {roomCode ?? '----'}
                        </span>
                        <span className="text-gold-400/40 text-sm">📋</span>
                    </div>
                </div>

                {/* Player Slots */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {Array.from({ length: maxPlayers }).map((_, i) => {
                        const player = players[i];
                        return (
                            <div
                                key={i}
                                className={`glass-card p-4 text-center transition-all ${player
                                        ? player.connected
                                            ? 'border-gold-400/30'
                                            : 'border-neon-red/30 opacity-60'
                                        : 'border-gold-400/10 opacity-40'
                                    }`}
                            >
                                {player ? (
                                    <>
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div
                                                className={`w-2 h-2 rounded-full ${player.connected ? 'bg-neon-green' : 'bg-neon-red'
                                                    }`}
                                            />
                                            <span className="text-gold-300 font-display text-sm">
                                                {player.name}
                                            </span>
                                            {player.isHost && (
                                                <span className="text-gold-400 text-xs">👑</span>
                                            )}
                                        </div>
                                        <p className="text-gold-300/40 font-mono text-xs">
                                            {player.connected ? 'Ready' : 'Disconnected'}
                                        </p>
                                    </>
                                ) : (
                                    <div className="py-2">
                                        <p className="text-gold-300/20 font-mono text-xs">
                                            Waiting for player...
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {isHost && (
                        <button
                            onClick={startGame}
                            disabled={!canStart}
                            className="btn-gold flex-1 text-lg"
                        >
                            {canStart ? 'Start Game' : `Need ${2 - players.length} more`}
                        </button>
                    )}
                    <button onClick={leaveRoom} className="btn-glass flex-1">
                        Leave Room
                    </button>
                </div>

                {/* Rules Summary */}
                <div className="mt-6 pt-6 border-t border-gold-400/10">
                    <h3 className="text-gold-400/60 font-display text-sm mb-2 text-center">Quick Rules</h3>
                    <ul className="text-gold-300/40 text-xs space-y-1 font-mono">
                        <li>🎲 Each turn: roll dice → earn income → take action</li>
                        <li>🎯 Goal: Collect 8 blocks (2 Sets + 1 Pair)</li>
                        <li>🛡️ Black blocks protect against forced trades</li>
                        <li>🟣 Purple blocks are wild - any color/number</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}