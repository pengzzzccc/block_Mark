import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function LobbyPage() {
    const {
        connected,
        playerName,
        setPlayerName,
        createRoom,
        joinRoom,
        roomCode,
    } = useGameStore();

    const [name, setName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

    const handleCreate = () => {
        if (!name.trim()) return;
        setPlayerName(name);
        createRoom(name);
    };

    const handleJoin = () => {
        if (!name.trim() || !joinCode.trim()) return;
        setPlayerName(name);
        joinRoom(joinCode.toUpperCase(), name);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Background particles (CSS-based) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-gold-400/20 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Logo & Title */}
            <div className="mb-12 text-center relative z-10">
                <h1 className="text-6xl md:text-7xl font-display font-black text-gold-400 animate-glow mb-4">
                    Block Market
                </h1>
                <p className="text-gold-300/60 font-mono text-sm tracking-widest uppercase">
                    Collect · Trade · Win
                </p>
            </div>

            {/* Connection Status */}
            {!connected ? (
                <div className="glass-card p-6 mb-8 animate-pulse">
                    <p className="text-gold-300 font-mono">⏳ Connecting to server...</p>
                </div>
            ) : mode === 'menu' ? (
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <div className="glass-card p-6">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            className="input-glass mb-4"
                            maxLength={16}
                        />
                        <button
                            onClick={() => name.trim() && setMode('create')}
                            disabled={!name.trim()}
                            className="btn-gold w-full mb-3 text-lg"
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => name.trim() && setMode('join')}
                            disabled={!name.trim()}
                            className="btn-glass w-full text-lg"
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            ) : mode === 'create' ? (
                <div className="glass-card p-8 w-full max-w-md text-center">
                    <h2 className="text-2xl font-display text-gold-400 mb-6">Create Room</h2>
                    <p className="text-gold-300/70 mb-2 font-mono text-sm">Player</p>
                    <p className="text-gold-400 text-xl font-display mb-8">{name}</p>
                    <button onClick={handleCreate} className="btn-gold w-full mb-3 text-lg">
                        Create & Enter
                    </button>
                    <button onClick={() => setMode('menu')} className="btn-glass w-full">
                        Back
                    </button>
                </div>
            ) : (
                <div className="glass-card p-8 w-full max-w-md text-center">
                    <h2 className="text-2xl font-display text-gold-400 mb-6">Join Room</h2>
                    <p className="text-gold-300/70 mb-2 font-mono text-sm">Player</p>
                    <p className="text-gold-400 text-xl font-display mb-4">{name}</p>
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Room Code"
                        className="input-glass mb-4 text-center text-xl tracking-widest"
                        maxLength={6}
                    />
                    <button
                        onClick={handleJoin}
                        disabled={!joinCode.trim()}
                        className="btn-gold w-full mb-3 text-lg"
                    >
                        Join
                    </button>
                    <button onClick={() => setMode('menu')} className="btn-glass w-full">
                        Back
                    </button>
                </div>
            )}

            {/* Rules Brief */}
            <div className="mt-12 glass-card p-6 max-w-lg text-center relative z-10">
                <h3 className="text-gold-400 font-display text-lg mb-3">How to Play</h3>
                <p className="text-gold-300/60 text-sm leading-relaxed">
                    Collect 8 blocks forming <span className="text-gold-400">2 Sets + 1 Pair</span>.<br />
                    Sets can be <span className="text-neon-green">sequences</span> (same color, consecutive numbers)
                    or <span className="text-neon-green">triplets</span> (3 identical blocks).<br />
                    Each turn: roll dice for income, then take an action
                    (buy, swap, negotiate, or forced trade).
                </p>
            </div>
        </div>
    );
}