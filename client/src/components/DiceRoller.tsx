import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import type { IncomeResult, TurnPhase } from '../../../shared/types';

interface DiceRollerProps {
    diceResult: IncomeResult | null;
    isMyTurn: boolean;
    phase: TurnPhase;
}

export default function DiceRoller({ diceResult, isMyTurn, phase }: DiceRollerProps) {
    const { socket } = useGameStore();
    const [rolling, setRolling] = useState(false);

    const handleRoll = () => {
        if (!isMyTurn || !socket) return;
        setRolling(true);
        socket.emit('turn:rollDice');
        setTimeout(() => setRolling(false), 1500);
    };

    const diceFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    return (
        <div className="glass-card p-4 w-full max-w-sm">
            <h3 className="text-gold-400/50 font-mono text-xs uppercase tracking-widest text-center mb-3">
                Dice
            </h3>

            <div className="flex items-center justify-center gap-6 mb-3">
                {/* Red dice */}
                <motion.div
                    animate={rolling ? { rotateY: 720 } : { rotateY: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-red/30 to-neon-red/10 border-2 border-neon-red/40 flex items-center justify-center shadow-lg shadow-neon-red/20"
                >
                    <span className="text-3xl">
                        {diceResult ? diceFaces[diceResult.dice.red] : '?'}
                    </span>
                </motion.div>

                {/* Green dice */}
                <motion.div
                    animate={rolling ? { rotateY: -720 } : { rotateY: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green/30 to-neon-green/10 border-2 border-neon-green/40 flex items-center justify-center shadow-lg shadow-neon-green/20"
                >
                    <span className="text-3xl">
                        {diceResult ? diceFaces[diceResult.dice.green] : '?'}
                    </span>
                </motion.div>
            </div>

            {/* Result display */}
            <AnimatePresence mode="wait">
                {diceResult ? (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <motion.span
                            initial={{ scale: 1.5 }}
                            animate={{ scale: 1 }}
                            className="text-gold-400 font-mono text-lg font-bold"
                        >
                            +${diceResult.income}
                        </motion.span>
                        {diceResult.isDouble6 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="text-amber-400 font-display text-xs tracking-wider animate-pulse"
                            >
                                ★ DOUBLE 6 BONUS! ★
                            </motion.span>
                        )}
                    </motion.div>
                ) : phase === 'settlement' ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRoll}
                        disabled={!isMyTurn}
                        className={`
                            px-6 py-2 rounded-lg font-display text-sm tracking-wider
                            ${isMyTurn
                                ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-felt-900 cursor-pointer hover:shadow-gold-lg'
                                : 'bg-gold-400/10 text-gold-400/30 cursor-not-allowed'}
                        `}
                    >
                        🎲 Roll Dice
                    </motion.button>
                ) : null}
            </AnimatePresence>
        </div>
    );
}