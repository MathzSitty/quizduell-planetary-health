// frontend/components/game/GameStatusDisplay.tsx
import React from 'react';
import { Game, User } from '../../types';
import { Trophy, Brain } from 'lucide-react';
 
interface GameStatusDisplayProps {
    game: Game;
    currentUser: User | null;
    opponent: Partial<User> | null;
    isSolo?: boolean; // NEU: Optional isSolo prop
}

const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ game, currentUser, opponent, isSolo }) => {
    // NEU: Solo-Spiele haben eine andere Anzeige
    if (isSolo || game.isSolo) {
        return (
            <div className="mb-8 p-6 bg-surface rounded-xl shadow-md">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <Brain className="text-primary" size={24} />
                        <h2 className="text-2xl font-bold text-textPrimary">Solo-Training</h2>
                    </div>
                    
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{currentUser?.name || 'Du'}</h3>
                        <p className="text-3xl font-bold mt-1 text-primary">{game.player1Score}</p>
                        <p className="text-sm text-textSecondary mt-1">
                            {game.difficulty && (
                                <>Schwierigkeit: {
                                    game.difficulty === 'EASY' ? '🟢 Leicht' :
                                    game.difficulty === 'MEDIUM' ? '🟡 Mittel' : '🔴 Schwer'
                                }</>
                            )}
                            {!game.difficulty && 'Gemischte Schwierigkeit'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Bestehende PvP-Logik
    // Bestimme, ob der aktuelle Benutzer Spieler 1 ist (wichtig für die Punktedarstellung)
    const isPlayer1 = currentUser && game.player1Id === currentUser.id;
    
    // Hole die korrekten Punktestände basierend auf der Spieler-Identität
    const userScore = isPlayer1 ? game.player1Score : game.player2Score;
    const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;

    return (
        <div className="mb-8 p-6 bg-surface rounded-xl shadow-md">
            <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{currentUser?.name || 'Du'}</h3>
                    <p className="text-3xl font-bold mt-1 text-primary">{userScore}</p>
                </div>
                
                <div className="text-xl font-semibold px-4">VS</div>
                
                <div className="text-center">
                    <h3 className="text-xl font-semibold">{opponent?.name || 'Gegner'}</h3>
                    <p className="text-3xl font-bold mt-1 text-accent">{opponentScore}</p>
                </div>
                
                {game.winnerId && (
                    <div className="w-full text-center mt-2">
                        <div className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            <Trophy size={14} className="mr-1" />
                            Führend: {game.winnerId === currentUser?.id ? 'Du' : opponent?.name || 'Gegner'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameStatusDisplay;