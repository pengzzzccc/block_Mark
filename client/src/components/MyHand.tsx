import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockCard from './BlockCard';
import { useGameStore } from '../stores/gameStore';
import type { Block } from '../stores/gameStore';
import type { TurnPhase } from '../../../shared/types';

interface MyHandProps {
    blocks: Block[];
    isMyTurn: boolean;
    phase: TurnPhase;
}

export default function MyHand({ blocks, isMyTurn, phase }: MyHandProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { socket } = useGameStore();

    const toggleSelect = (id: string) => {
        if (!isMyTurn) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectedBlocks = blocks.filter(b => selectedIds.has(b.id));

    const canSell = isMyTurn && phase === 'action' && selectedIds.size === 1;

    const handleSell = () => {
        if (!canSell || !socket) return;
        socket.emit('turn:sell', { blockId: selectedBlocks[0].id });
        setSelectedIds(new Set());
    };

    const handleSwap = () => {
        if (!canSell || !socket) return;
        socket.emit('turn:swap', { sellBlockId: selectedBlocks[0].id });
        setSelectedIds(new Set());
    };

    return (
        <div className="glass-card border-t border-gold-400/20 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gold-400/50 font-mono text-[10px] uppercase tracking-widest">
                    My Hand · {blocks.length} cards
                </h3>
                {canSell && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSell}
                            className="text-[10px] font-mono uppercase tracking-wider text-neon-red/70 hover:text-neon-red px-2 py-1 rounded border border-neon-red/20 hover:border-neon-red/40"
                        >
                            Sell (+$40)
                        </button>
                        <button
                            onClick={handleSwap}
                            className="text-[10px] font-mono uppercase tracking-wider text-gold-400/70 hover:text-gold-400 px-2 py-1 rounded border border-gold-400/20 hover:border-gold-400/40"
                        >
                            Swap
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
                <AnimatePresence>
                    {blocks.map((block, i) => {
                        const angle = (i - (blocks.length - 1) / 2) * 3;
                        return (
                            <motion.div
                                key={block.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{
                                    opacity: 1,
                                    y: selectedIds.has(block.id) ? -16 : 0,
                                    rotate: angle,
                                }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -20, scale: 1.1 }}
                                onClick={() => toggleSelect(block.id)}
                                className="cursor-pointer flex-shrink-0"
                            >
                                <BlockCard
                                    block={block}
                                    size="sm"
                                    selected={selectedIds.has(block.id)}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}