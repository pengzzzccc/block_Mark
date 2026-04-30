import { useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';

export default function LobbyPage() {
    const {
        connected,
        playerName,
        setPlayerName,
        createRoom,
        joinRoom,
    } = useGameStore();

    const [name, setName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

    // Generate stable particle positions
    const particles = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            delay: `${(i * 0.7) % 3}s`,
            duration: `${3 + (i * 1.3) % 4}s`,
            size: i % 3 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1',
        })), []);

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            {/* Floating gold particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className={`absolute ${p.size} rounded-full animate-float`}
                        style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                            background: i % 5 === 0
                                ? 'radial-gradient(circle, rgba(232,197,74,0.4) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%)',
                        }}
                    />
                ))}
            </div>

            {/* Logo & Title */}
            <div className="mb-12 text-center relative z-10">
                <div className="mb-6">
                    {/* Decorative block icons */}
                    <div className="flex justify-center gap-3 mb-4">
                        {['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'].map((c, i) => (
                            <div
                                key={i}
                                className={`w-5 h-5 ${c} rounded-md shadow-lg animate-float`}
                                style={{ animationDelay: `${i * 0.3}s` }}
                            />
                        ))}
                    </div>
                    <h1
                        className="text-6xl md:text-8xl font-black tracking-tight text-glow"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        BLOCK
                        <br />
                        <span className="text-5xl md:text-7xl">MARKET</span>
                    </h1>
                </div>
                <p
                    className="font-mono text-sm tracking-[0.3em] uppercase"
                    style={{ color: 'rgba(232,197,74,0.5)' }}
                >
                    Collect · Trade · Win
                </p>
                <div className="mt-4 h-px w-48 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,197,74,0.4), transparent)' }} />
            </div>

            {/* Connection Status */}
            {!connected ? (
                <div className="glass-card p-8 mb-8 text-center animate-slide-up">
                    <div className="flex items-center gap-3 justify-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <p className="text-gold-300 font-mono text-sm tracking-wider">CONNECTING TO SERVER...</p>
                    </div>
                </div>
            ) : mode === 'menu' ? (
                <div className="flex flex-col gap-4 w-full max-w-md animate-slide-up">
                    <div className="glass-card p-8">
                        <label className="block text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(232,197,74,0.5)' }}>
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name..."
                            className="input-glass mb-6"
                            maxLength={16}
                        />
                        <button
                            onClick={() => name.trim() && setMode('create')}
                            disabled={!name.trim()}
                            className="btn-gold w-full mb-3 text-base"
                        >
                            ⚡ Create Room
                        </button>
                        <button
                            onClick={() => name.trim() && setMode('join')}
                            disabled={!name.trim()}
                            className="btn-glass w-full text-base"
                        >
                            🔑 Join Room
                        </button>
                    </div>
                </div>
            ) : mode === 'create' ? (
                <div className="glass-card p-8 w-full max-w-md text-center animate-slide-up">
                    <h2 className="text-3xl font-bold mb-6 text-gold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Create Room
                    </h2>
                    <div className="glass-card p-4 mb-6" style={{ background: 'rgba(8,20,12,0.5)' }}>
                        <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'rgba(232,197,74,0.5)' }}>Host</p>
                        <p className="text-xl font-bold" style={{ color: '#E8C54A' }}>{name}</p>
                    </div>
                    <button onClick={handleCreate} className="btn-gold w-full mb-3 text-base">
                        ⚡ Create & Enter
                    </button>
                    <button onClick={() => setMode('menu')} className="btn-glass w-full">
                        ← Back
                    </button>
                </div>
            ) : (
                <div className="glass-card p-8 w-full max-w-md text-center animate-slide-up">
                    <h2 className="text-3xl font-bold mb-6 text-gold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Join Room
                    </h2>
                    <div className="glass-card p-4 mb-4" style={{ background: 'rgba(8,20,12,0.5)' }}>
                        <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'rgba(232,197,74,0.5)' }}>Player</p>
                        <p className="text-xl font-bold" style={{ color: '#E8C54A' }}>{name}</p>
                    </div>
                    <label className="block text-xs font-mono tracking-widest uppercase mb-2 text-left" style={{ color: 'rgba(232,197,74,0.5)' }}>
                        Room Code
                    </label>
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABCDEF"
                        className="input-glass mb-6 text-center text-2xl tracking-[0.5em] font-bold"
                        maxLength={6}
                    />
                    <button
                        onClick={handleJoin}
                        disabled={joinCode.trim().length < 6}
                        className="btn-gold w-full mb-3 text-base"
                    >
                        🔑 Join
                    </button>
                    <button onClick={() => setMode('menu')} className="btn-glass w-full">
                        ← Back
                    </button>
                </div>
            )}

            {/* Rules Brief */}
            <div className="mt-12 glass-card p-8 max-w-lg text-center relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3
                    className="text-lg font-bold mb-4 text-gold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    📜 How to Play
                </h3>
                <div className="grid grid-cols-2 gap-3 text-left text-sm" style={{ color: 'rgba(240,215,140,0.7)' }}>
                    <div className="flex gap-2">
                        <span>🎲</span>
                        <span>Roll dice for income</span>
                    </div>
                    <div className="flex gap-2">
                        <span>🛒</span>
                        <span>Buy blocks from market</span>
                    </div>
                    <div className="flex gap-2">
                        <span>🔄</span>
                        <span>Swap or negotiate</span>
                    </div>
                    <div className="flex gap-2">
                        <span>⚔️</span>
                        <span>Force trade via duel</span>
                    </div>
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(232,197,74,0.15)' }}>
                    <p className="text-sm" style={{ color: 'rgba(240,215,140,0.5)' }}>
                        Collect 8 blocks: <span className="text-neon-green font-bold">2 Sets + 1 Pair</span> to win!
                    </p>
                </div>
            </div>
        </div>
    );
}