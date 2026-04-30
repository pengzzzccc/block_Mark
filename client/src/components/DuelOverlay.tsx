import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

export default function DuelOverlay() {
    const { gameState, myPlayerId, socket } = useGameStore();

    const duel = gameState?.duelState;
    if (!duel) return null;

    const isAttacker = duel.attackerId === myPlayerId;
    const isDefender = duel.defenderId === myPlayerId;

    const handleRoll = () => {
        if ((isAttacker || isDefender) && socket) {
            socket.emit('duel:roll');
        }
    };

    const attackerPlayer = gameState?.players.find(p => p.id === duel.attackerId);
    const defenderPlayer = gameState?.players.find(p => p.id === duel.defenderId);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
        >
            <div className="glass-card p-8 max-w-lg w-full mx-4">
                <motion.h2
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-center text-gold-400 font-display text-2xl mb-6"
                >
                    ⚔️ Duel
                </motion.h2>

                <div className="flex items-center justify-between gap-8">
                    {/* Attacker */}
                    <div className={`flex flex-col items-center gap-2 ${isAttacker ? 'scale-110' : ''}`}>
                        <div className="w-12 h-12 rounded-full bg-neon-red/20 border-2 border-neon-red/40 flex items-center justify-center">
                            <span className="text-neon-red font-display font-bold">
                                {attackerPlayer?.name.charAt(0).toUpperCase() ?? 'A'}
                            </span>
                        </div>
                        <span className="text-gold-300 font-display text-sm">
                            {attackerPlayer?.name ?? 'Attacker'}
                        </span>
                        {isAttacker && (
                            <span className="text-neon-red text-[10px] font-mono animate-pulse">You</span>
                        )}
                    </div>

                    {/* VS */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-4xl"
                    >
                        ⚡
                    </motion.div>

                    {/* Defender */}
                    <div className={`flex flex-col items-center gap-2 ${isDefender ? 'scale-110' : ''}`}>
                        <div className="w-12 h-12 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center">
                            <span className="text-neon-green font-display font-bold">
                                {defenderPlayer?.name.charAt(0).toUpperCase() ?? 'D'}
                            </span>
                        </div>
                        <span className="text-gold-300 font-display text-sm">
                            {defenderPlayer?.name ?? 'Defender'}
                        </span>
                        {isDefender && (
                            <span className="text-neon-green text-[10px] font-mono animate-pulse">You</span>
                        )}
                    </div>
                </div>

                {/* Target block info */}
                <div className="mt-4 text-center">
                    <span className="text-gold-400/40 text-xs font-mono">Target Block</span>
                    <p className="text-gold-400 font-display text-sm mt-1">
                        {duel.targetBlockId}
                    </p>
                </div>

                {/* Roll button for involved players */}
                <AnimatePresence>
                    {(isAttacker || isDefender) && duel.phase === 'selecting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 flex justify-center"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRoll}
                                className="px-8 py-3 bg-gradient-to-r from-gold-400 to-gold-500 text-felt-900 rounded-lg font-display text-sm tracking-wider hover:shadow-gold-lg"
                            >
                                🎲 Roll for Duel
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Waiting state */}
                {duel.phase === 'rolling' && (
                    <div className="mt-6 flex justify-center">
                        <div className="animate-spin-slow w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}