import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import TopBar from './TopBar';
import PlayerPanel from './PlayerPanel';
import OpenMarket from './OpenMarket';
import DiceRoller from './DiceRoller';
import MyHand from './MyHand';
import ActionBar from './ActionBar';
import DuelOverlay from './DuelOverlay';
import NegotiationModal from './NegotiationModal';

export default function GameBoard() {
    const { gameState, myPlayerId, players } = useGameStore();
    const [showNegotiation, setShowNegotiation] = useState(false);

    if (!gameState || !myPlayerId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin-slow w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === myPlayerId;
    const phase = gameState.phase;
    const duelActive = gameState.duelState !== undefined;
    const otherPlayers = gameState.players.filter((p) => p.id !== myPlayerId);
    const myHand = gameState.myHand;

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Top Bar */}
            <TopBar
                turnNumber={gameState.currentTurn}
                phase={phase}
                currentPlayerName={currentPlayer?.name ?? 'Unknown'}
                isMyTurn={isMyTurn}
                deadline={gameState.turnDeadline}
            />

            <div className="flex-1 flex flex-col relative">
                {/* Other players (top) */}
                <div className="flex justify-around items-start px-4 pt-2 pb-4">
                    {otherPlayers.slice(0, 1).map((player) => (
                        <PlayerPanel
                            key={player.id}
                            player={player}
                            isCurrentTurn={player.id === currentPlayer?.id}
                        />
                    ))}
                </div>

                {/* Center area */}
                <div className="flex-1 flex items-center justify-center relative px-4">
                    {/* Left players */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                        {otherPlayers.slice(1, 2).map((player) => (
                            <PlayerPanel
                                key={player.id}
                                player={player}
                                isCurrentTurn={player.id === currentPlayer?.id}
                                compact
                            />
                        ))}
                    </div>

                    {/* Center: Market & Dice */}
                    <div className="flex flex-col items-center gap-6">
                        {/* Open Market */}
                        <OpenMarket
                            blocks={gameState.openMarket}
                            blindCount={gameState.blindPileCount}
                            isMyTurn={isMyTurn}
                            phase={phase}
                        />

                        {/* Dice Area */}
                        <DiceRoller
                            diceResult={gameState.diceResult}
                            isMyTurn={isMyTurn}
                            phase={phase}
                        />
                    </div>

                    {/* Right players */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                        {otherPlayers.slice(2, 3).map((player) => (
                            <PlayerPanel
                                key={player.id}
                                player={player}
                                isCurrentTurn={player.id === currentPlayer?.id}
                                compact
                            />
                        ))}
                    </div>
                </div>

                {/* My Hand */}
                <MyHand
                    blocks={myHand}
                    isMyTurn={isMyTurn}
                    phase={phase}
                />

                {/* Action Bar */}
                <ActionBar
                    cash={currentPlayer?.cash ?? 0}
                    isMyTurn={isMyTurn}
                    phase={phase}
                    onNegotiate={() => setShowNegotiation(true)}
                />
            </div>

            {/* Duel Overlay */}
            <AnimatePresence>
                {duelActive && <DuelOverlay />}
            </AnimatePresence>

            {/* Negotiation Modal */}
            <AnimatePresence>
                {showNegotiation && (
                    <NegotiationModal onClose={() => setShowNegotiation(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}