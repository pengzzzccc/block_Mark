import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

interface NegotiationModalProps {
    onClose: () => void;
}

export default function NegotiationModal({ onClose }: NegotiationModalProps) {
    const { gameState, myPlayerId, socket } = useGameStore();
    const [targetPlayerId, setTargetPlayerId] = useState('');
    const [selectedBlockId, setSelectedBlockId] = useState('');
    const [cashOffer, setCashOffer] = useState(0);
    const [counter, setCounter] = useState(30);

    const negotiation = gameState?.negotiation;
    const otherPlayers = gameState?.players.filter((p) => p.id !== myPlayerId) ?? [];
    const myHand = gameState?.myHand ?? [];

    const isIncoming = negotiation !== null && negotiation !== undefined;

    // Auto-reject countdown for incoming negotiation
    useEffect(() => {
        if (!isIncoming || !negotiation) return;
        if (counter <= 0) {
            socket?.emit('negotiate:reply', {
                accepted: false,
                fromPlayerId: negotiation.fromPlayerId,
            });
            onClose();
            return;
        }
        const timer = setInterval(() => setCounter((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [counter, isIncoming, negotiation, socket, onClose]);

    const handlePropose = () => {
        if (!targetPlayerId || !selectedBlockId || !socket) return;
        socket.emit('turn:negotiate', {
            targetPlayerId,
            myBlockId: selectedBlockId,
            cashOffer,
        });
        onClose();
    };

    const handleReply = (accepted: boolean) => {
        if (!negotiation || !socket) return;
        socket.emit('negotiate:reply', {
            accepted,
            fromPlayerId: negotiation.fromPlayerId,
        });
        onClose();
    };

    const getBlockLabel = (block: { color: string; number: number | null; category: string } | null) => {
        if (!block) return 'Unknown';
        return `${block.color}${block.number !== null ? ' #' + block.number : ''}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
        >
            <div className="glass-card p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gold-400 font-display text-xl">
                        🤝 Negotiate
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gold-400/40 hover:text-gold-400 text-lg"
                    >
                        ✕
                    </button>
                </div>

                {isIncoming && negotiation ? (
                    /* Incoming offer */
                    <div className="space-y-4">
                        <p className="text-gold-300 text-sm text-center">
                            Player offers a trade:
                        </p>

                        <div className="glass-card p-4 flex items-center justify-center gap-4">
                            <div className="text-center">
                                <span className="text-gold-400/40 text-[10px] font-mono block">Giving</span>
                                <span className="text-gold-400 font-display text-sm">
                                    {getBlockLabel(negotiation.offeredBlock)}
                                </span>
                            </div>
                            <span className="text-gold-400/20 text-xl">↔</span>
                            <div className="text-center">
                                <span className="text-gold-400/40 text-[10px] font-mono block">Asking</span>
                                <span className="text-gold-400 font-display text-sm">
                                    {getBlockLabel(negotiation.requestedBlock)}
                                </span>
                            </div>
                        </div>

                        {negotiation.cashOffered > 0 && (
                            <p className="text-center text-gold-400 font-mono text-sm">
                                + ${negotiation.cashOffered}
                            </p>
                        )}

                        <p className="text-gold-400/30 text-[10px] font-mono text-center">
                            Auto-reject in {counter}s
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleReply(true)}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-neon-green/20 to-neon-green/10 border border-neon-green/40 text-neon-green font-display text-sm hover:bg-neon-green/30"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleReply(false)}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-neon-red/20 to-neon-red/10 border border-neon-red/40 text-neon-red font-display text-sm hover:bg-neon-red/30"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Outgoing proposal */
                    <div className="space-y-4">
                        {/* Select player */}
                        <div>
                            <label className="text-gold-400/40 font-mono text-[10px] uppercase block mb-1">
                                Target Player
                            </label>
                            <select
                                value={targetPlayerId}
                                onChange={(e) => setTargetPlayerId(e.target.value)}
                                className="w-full bg-felt-800 border border-gold-400/20 rounded-lg px-3 py-2 text-gold-400 text-sm focus:border-gold-400/50 outline-none"
                            >
                                <option value="">Select player...</option>
                                {otherPlayers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select my block */}
                        <div>
                            <label className="text-gold-400/40 font-mono text-[10px] uppercase block mb-1">
                                Your Block to Offer
                            </label>
                            <select
                                value={selectedBlockId}
                                onChange={(e) => setSelectedBlockId(e.target.value)}
                                className="w-full bg-felt-800 border border-gold-400/20 rounded-lg px-3 py-2 text-gold-400 text-sm focus:border-gold-400/50 outline-none"
                            >
                                <option value="">Select block...</option>
                                {myHand.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {getBlockLabel(b)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cash offer */}
                        <div>
                            <label className="text-gold-400/40 font-mono text-[10px] uppercase block mb-1">
                                Cash Offer (optional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={cashOffer}
                                onChange={(e) => setCashOffer(Number(e.target.value))}
                                className="w-full bg-felt-800 border border-gold-400/20 rounded-lg px-3 py-2 text-gold-400 text-sm focus:border-gold-400/50 outline-none"
                                placeholder="0"
                            />
                        </div>

                        <button
                            onClick={handlePropose}
                            disabled={!targetPlayerId || !selectedBlockId}
                            className={`
                                w-full py-2 rounded-lg font-display text-sm
                                ${targetPlayerId && selectedBlockId
                                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-felt-900 cursor-pointer hover:shadow-gold-lg'
                                    : 'bg-gold-400/10 text-gold-400/30 cursor-not-allowed'}
                            `}
                        >
                            Propose Trade
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}