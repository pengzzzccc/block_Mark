import { motion } from 'framer-motion';
import type { PublicPlayerInfo } from '../../../shared/types';

interface PlayerPanelProps {
    player: PublicPlayerInfo;
    isCurrentTurn: boolean;
    compact?: boolean;
}

export default function PlayerPanel({ player, isCurrentTurn, compact }: PlayerPanelProps) {
    return (
        <motion.div
            animate={{
                borderColor: isCurrentTurn ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 215, 0, 0.1)',
                scale: isCurrentTurn ? 1.02 : 1,
            }}
            className={`
                glass-card transition-all
                ${compact ? 'p-3 w-32' : 'p-4 w-44'}
                ${isCurrentTurn ? 'shadow-gold-lg' : ''}
            `}
        >
            {/* Player avatar circle */}
            <div className="flex items-center gap-2 mb-2">
                <div
                    className={`
                        rounded-full flex items-center justify-center font-display text-sm font-bold
                        ${compact ? 'w-8 h-8 text-xs' : 'w-10 h-10'}
                        ${isCurrentTurn
                            ? 'bg-gold-400/20 text-gold-400'
                            : 'bg-gold-400/10 text-gold-400/60'}
                    `}
                >
                    {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-gold-300 font-display truncate ${compact ? 'text-xs' : 'text-sm'}`}
                        title={player.name}
                    >
                        {player.name}
                    </p>
                    <p className="text-gold-400/40 font-mono text-[10px]">
                        {player.handCount} cards
                    </p>
                </div>
            </div>

            {/* Cash */}
            <div className="flex items-center gap-1">
                <span className="text-gold-400/40 text-xs">💰</span>
                <motion.span
                    key={player.cash}
                    initial={{ scale: 1.3, color: '#FFD700' }}
                    animate={{ scale: 1, color: '#D4A017' }}
                    className={`text-gold-400 font-mono font-bold ${compact ? 'text-sm' : 'text-base'}`}
                >
                    ${player.cash}
                </motion.span>
            </div>

            {/* Black block indicator */}
            {player.hasBlackBlock && (
                <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs">🛡️</span>
                    <span className="text-gold-400/40 text-[10px] font-mono">Protected</span>
                </div>
            )}

            {/* Turn indicator */}
            {isCurrentTurn && !compact && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 pt-2 border-t border-gold-400/10"
                >
                    <p className="text-neon-green text-[10px] font-mono uppercase tracking-wider animate-pulse">
                        ▶ Thinking...
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}