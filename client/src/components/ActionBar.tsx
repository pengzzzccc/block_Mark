import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import type { TurnPhase } from '../../../shared/types';

interface ActionBarProps {
    cash: number;
    isMyTurn: boolean;
    phase: TurnPhase;
    onNegotiate: () => void;
}

export default function ActionBar({ cash, isMyTurn, phase, onNegotiate }: ActionBarProps) {
    const { socket } = useGameStore();
    const isActionPhase = isMyTurn && phase === 'action';

    const actions = [
        { label: 'Buy', emoji: '🛒', onClick: () => { }, ready: isActionPhase },
        { label: 'Swap', emoji: '🔄', onClick: () => { }, ready: isActionPhase },
        { label: 'Negotiate', emoji: '🤝', onClick: onNegotiate, ready: isActionPhase },
        { label: 'Force Trade', emoji: '⚔️', onClick: () => { }, ready: isActionPhase },
    ];

    return (
        <div className="glass-card border-t border-gold-400/20 px-4 py-3 flex items-center justify-between">
            {/* Cash display */}
            <motion.div
                key={cash}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
            >
                <span className="text-gold-400/40 text-sm">💰</span>
                <span className="text-gold-400 font-mono text-lg font-bold tabular-nums">
                    ${cash}
                </span>
            </motion.div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {actions.map((action) => (
                    <motion.button
                        key={action.label}
                        whileHover={action.ready ? { scale: 1.05, y: -2 } : {}}
                        whileTap={action.ready ? { scale: 0.95 } : {}}
                        onClick={action.onClick}
                        disabled={!action.ready}
                        className={`
                            px-4 py-2 rounded-lg font-display text-xs tracking-wider transition-colors
                            ${action.ready
                                ? 'bg-gradient-to-r from-gold-400/20 to-gold-400/10 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 hover:border-gold-400/50 cursor-pointer'
                                : 'bg-gold-400/5 border border-gold-400/10 text-gold-400/20 cursor-not-allowed'}
                        `}
                    >
                        <span className="mr-1">{action.emoji}</span>
                        {action.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}