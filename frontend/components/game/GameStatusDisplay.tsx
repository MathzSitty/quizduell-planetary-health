// frontend/components/game/GameStatusDisplay.tsx
import React from 'react';
import { Game, User } from '../../types';

interface GameStatusDisplayProps {
    game: Game | null;
    currentUser: User | null;
    opponent?: Partial<User> | null;
}

const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ game, currentUser, opponent }) => {
    if (!game || !currentUser) return null;

    const player1Name = game.player1?.name || 'Spieler 1';
    const player2Name = opponent?.name || game.player2?.name || 'Spieler 2';

    return (
        <div className="flex justify-around items-center p-4 mb-6 bg-neutral-light rounded-lg shadow">
            <div className="text-center">
                <p className="text-lg font-semibold text-primary">
                    {player1Name} {game.player1Id === currentUser.id ? '(Du)' : ''}
                </p>
                <p className="text-2xl font-bold text-secondary">{game.player1Score}</p>
            </div>
            <div className="text-2xl font-bold text-textSecondary vs-text">VS</div>
            <div className="text-center">
                <p className="text-lg font-semibold text-primary">
                    {player2Name} {game.player2Id === currentUser.id ? '(Du)' : ''}
                </p>
                <p className="text-2xl font-bold text-secondary">{game.player2Score}</p>
            </div>
        </div>
    );
};

export default GameStatusDisplay;