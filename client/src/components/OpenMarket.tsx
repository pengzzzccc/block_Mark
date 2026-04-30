import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import BlockCard from './BlockCard';
import type { Block } from '../stores/gameStore';
import type { TurnPhase } from '../../../shared/types';

interface OpenMarketProps {
    blocks: Block[];
    blindCount: number;
    isMyTurn: boolean;
    phase: TurnPhase;
}

export default function OpenMarket({ blocks, blindCount, isMyTurn, phase }: OpenMarketProps) {
    const { socket, myPlayerId } = useGameStore();

    const canBuy = isMyTurn && phase === 'action';

    const handleBuy = (block: Block) => {
        if (!canBuy || !socket) return;
        socket.emit('turn:buy', { blockId: block.id, source: 'market' });
    };

    const handleBlindDraw = () => {
        if (!canBuy || !socket) return;
        socket.emit('turn:buy', { blockId: 'blind', source: 'blind' });
    };

    return (
        <div className="glass-card p-6 w-full max-w-lg">
            <h3 className="text-gold-400/50 font-mono text-xs uppercase tracking-widest text-center mb-4">
                Open Market
            </h3>
            <div className="flex items-center justify-center gap-4">
                {/* Market blocks */}
                {blocks.map((block, i) => (
                    <motion.div
                        key={block.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <BlockCard
                            block={block}
                            size="lg"
                            onClick={canBuy ? () => handleBuy(block) : undefined}
                        />
                    </motion.div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 4 - blocks.length }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="w-20 h-28 rounded-lg border border-dashed border-gold-400/10 flex items-center justify-center"
                    >
                        <span className="text-gold-400/10 text-2xl">?</span>
                    </div>
                ))}
            </div>

            {/* Blind draw pile */}
            <div className="mt-4 flex justify-center">
                <motion.div
                    whileHover={canBuy ? { scale: 1.05, y: -2 } : {}}
                    whileTap={canBuy ? { scale: 0.95 } : {}}
                    onClick={handleBlindDraw}
                    className={`
                        relative cursor-pointer
                        ${canBuy ? 'hover:shadow-gold-lg' : 'opacity-50 cursor-not-allowed'}
                    `}
                >
                    {/* Stacked card backs */}
                    <div className="absolute -top-1 -left-1 w-12 h-16 rounded bg-felt-800 border border-gold-400/20" />
                    <div className="relative w-12 h-16 rounded bg-gradient-to-br from-felt-700 to-felt-900 border border-gold-400/30 flex flex-col items-center justify-center">
                        <span className="text-gold-400/30 text-lg">?</span>
                        <span className="text-gold-400/20 text-[10px] font-mono">{blindCount}</span>
                    </div>
                    <p className="text-gold-400/40 text-[10px] font-mono mt-1 text-center">$40</p>
                </motion.div>
            </div>
        </div>
    );
}