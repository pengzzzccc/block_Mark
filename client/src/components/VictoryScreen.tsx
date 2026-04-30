import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

export default function VictoryScreen() {
    const { gameState, myPlayerId, winResult, winnerName, players, setPage } = useGameStore();

    if (!gameState || gameState.phase !== 'finished') return null;

    const isWinner = myPlayerId === gameState.winnerId;

    const getBlockColor = (color: string) => {
        const map: Record<string, string> = {
            red: '#ef4444',
            yellow: '#eab308',
            blue: '#3b82f6',
            green: '#22c55e',
            purple: '#a855f7',
            black: '#78716c',
        };
        return map[color] ?? '#888';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/90 backdrop-blur-md"
        >
            <div className="text-center space-y-6 max-w-lg mx-4">
                {isWinner ? (
                    <motion.h1
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-display font-bold bg-gradient-to-r from-gold-400 via-amber-300 to-gold-400 bg-clip-text text-transparent"
                    >
                        ★ WINNER! ★
                    </motion.h1>
                ) : (
                    <motion.h1
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl md:text-4xl font-display text-gold-400/60"
                    >
                        Game Over
                    </motion.h1>
                )}

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gold-400 font-display text-xl"
                >
                    {winnerName ?? 'Unknown'}
                    {isWinner && ' 👑'}
                </motion.p>

                {/* Winning hand display */}
                {winResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3"
                    >
                        <p className="text-gold-400/40 font-mono text-[10px] uppercase tracking-widest">
                            Winning Hand
                        </p>

                        {/* Sets */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {winResult.sets.map((set, i) => (
                                <motion.div
                                    key={`set-${i}`}
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.8 + i * 0.2, type: 'spring' }}
                                    className="glass-card px-4 py-3 text-center"
                                >
                                    <span className="text-gold-400/40 text-[8px] font-mono uppercase block mb-1">
                                        {set.type === 'sequence' ? 'Sequence' : set.type === 'triplet' ? 'Triplet' : 'Rainbow'}
                                    </span>
                                    <div className="flex gap-1">
                                        {set.blocks.map((block, j) => (
                                            <div
                                                key={j}
                                                className="w-8 h-10 rounded-md flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    backgroundColor: getBlockColor(block.color) + '30',
                                                    borderColor: getBlockColor(block.color) + '60',
                                                    borderWidth: 1,
                                                    color: getBlockColor(block.color),
                                                }}
                                            >
                                                {block.number ?? '★'}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pair */}
                        {winResult.pair && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.4, type: 'spring' }}
                                className="glass-card px-4 py-3 text-center inline-block"
                            >
                                <span className="text-gold-400/40 text-[8px] font-mono uppercase block mb-1">
                                    Pair
                                </span>
                                <div className="flex gap-1 justify-center">
                                    {winResult.pair.blocks.map((block, j) => (
                                        <div
                                            key={j}
                                            className="w-8 h-10 rounded-md flex items-center justify-center text-xs font-bold"
                                            style={{
                                                backgroundColor: getBlockColor(block.color) + '30',
                                                borderColor: getBlockColor(block.color) + '60',
                                                borderWidth: 1,
                                                color: getBlockColor(block.color),
                                            }}
                                        >
                                            {block.number ?? '★'}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Final standings */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    {players.map((p, i) => (
                        <div key={p.id} className="text-center">
                            <span className="text-gold-400/40 font-mono text-[9px] block">
                                #{i + 1}
                            </span>
                            <span className={`text-sm ${p.name === winnerName ? 'text-gold-400 font-bold' : 'text-gold-400/40'}`}>
                                {p.name} · ${p.cash}
                            </span>
                        </div>
                    ))}
                </motion.div>

                {/* Gold rain effect (decorative) */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                opacity: 0,
                                x: Math.random() * window.innerWidth,
                                y: -20,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                y: window.innerHeight + 20,
                            }}
                            transition={{
                                duration: 2 + Math.random() * 3,
                                delay: Math.random() * 2,
                                repeat: Infinity,
                                repeatDelay: Math.random() * 3,
                            }}
                            className="absolute text-xs"
                        >
                            💰
                        </motion.div>
                    ))}
                </div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="flex gap-4 justify-center"
                >
                    <button
                        onClick={() => setPage('lobby')}
                        className="px-6 py-3 bg-gradient-to-r from-gold-400/20 to-gold-400/10 border border-gold-400/30 rounded-lg text-gold-400 font-display text-sm hover:bg-gold-400/30"
                    >
                        Back to Lobby
                    </button>
                    <button
                        onClick={() => setPage('lobby')}
                        className="px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-500 text-felt-900 rounded-lg font-display text-sm hover:shadow-gold-lg"
                    >
                        Play Again
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}