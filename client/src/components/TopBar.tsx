import { motion } from 'framer-motion';
import type { TurnPhase } from '../../../shared/types';

interface TopBarProps {
    turnNumber: number;
    phase: TurnPhase;
    currentPlayerName: string;
    isMyTurn: boolean;
    deadline: number | null;
}

export default function TopBar({ turnNumber, phase, currentPlayerName, isMyTurn, deadline }: TopBarProps) {
    const phaseLabels: Record<TurnPhase, string> = {
        settlement: '💰 Settlement',
        action: '🎯 Action',
        negotiation: '🤝 Negotiating',
        duel: '⚔️ Duel',
        finished: '🏁 Round End',
    };

    return (
        <div className="glass-card border-b border-gold-400/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="text-gold-400/40 font-mono text-sm">Turn</span>
                <motion.span
                    key={turnNumber}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-gold-400 font-display text-2xl font-bold tabular-nums"
                >
                    {turnNumber}
                </motion.span>
            </div>

            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                    <span className="text-gold-300/50 font-mono text-xs uppercase tracking-wider">
                        {phaseLabels[phase] ?? phase}
                    </span>
                    {isMyTurn && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-neon-green shadow-lg shadow-neon-green/50"
                        />
                    )}
                </div>
                <p className="text-gold-300 font-display text-sm mt-0.5">
                    {currentPlayerName}
                    {isMyTurn && " (You)"}
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-neon-green' : 'bg-neon-red/50'}`} />
                <span className="text-gold-400/40 font-mono text-sm">
                    {isMyTurn ? 'Your Turn' : 'Waiting...'}
                </span>
            </div>
        </div>
    );
}