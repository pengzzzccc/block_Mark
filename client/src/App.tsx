import { useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import LobbyPage from './components/LobbyPage';
import WaitingRoom from './components/WaitingRoom';
import GameBoard from './components/GameBoard';
import VictoryScreen from './components/VictoryScreen';

function App() {
    const {
        socket,
        connected,
        connecting,
        page,
        error,
        notification,
        connect,
        disconnect,
    } = useGameStore();

    // Auto-connect on mount
    useEffect(() => {
        if (!socket) {
            connect();
        }
        return () => {
            // Cleanup on unmount
        };
    }, []);

    if (connecting) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-felt-900">
                <div className="animate-spin-slow w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full mb-6" />
                <p className="text-gold-400 font-mono text-lg">Connecting to server...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative z-10">
            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neon-red/90 text-white px-6 py-3 rounded-lg shadow-lg font-mono text-sm animate-shake">
                    {error}
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gold-500/90 text-felt-900 px-6 py-3 rounded-lg shadow-lg font-mono text-sm animate-fly-in">
                    {notification}
                </div>
            )}

            {/* Connection Status */}
            {!connected && (
                <div className="fixed bottom-4 right-4 z-50 bg-neon-red/20 border border-neon-red/50 text-neon-red px-4 py-2 rounded-lg text-xs font-mono">
                    Disconnected
                </div>
            )}

            {/* Page Router */}
            {page === 'lobby' && <LobbyPage />}
            {page === 'waiting' && <WaitingRoom />}
            {page === 'game' && <GameBoard />}
            {page === 'finished' && <VictoryScreen />}
        </div>
    );
}

export default App;