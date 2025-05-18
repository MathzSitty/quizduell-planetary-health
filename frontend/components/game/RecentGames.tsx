import React from 'react';
import { Game, User } from '../../types';
import { Trophy, AlertTriangle, Clock } from 'lucide-react';
import Spinner from '../ui/Spinner';
import Link from 'next/link';

interface RecentGamesProps {
    games: Game[];
    currentUser: User | null;
    isLoading: boolean;
}

const RecentGames: React.FC<RecentGamesProps> = ({ games, currentUser, isLoading }) => {
    if (isLoading) {
        return (
            <div className="text-center py-4">
                <Spinner size="sm" />
                <p className="text-textSecondary text-sm mt-2">Lade letzte Spiele...</p>
            </div>
        );
    }

    if (!games || games.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-textSecondary">Noch keine Spiele gespielt.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {games.map((game) => {
                if (!currentUser) return null;
                
                // Bestimme Gegner basierend auf aktuellem Benutzer
                const isPlayer1 = game.player1Id === currentUser.id;
                const opponent = isPlayer1 ? game.player2 : game.player1;
                
                // Bestimme Ergebnis
                const userScore = isPlayer1 ? game.player1Score : game.player2Score;
                const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
                
                // Bestimme Spielstatus
                let statusText = '';
                let statusClass = '';
                if (game.status === 'FINISHED') {
                    if (game.winnerId === currentUser.id) {
                        statusText = 'Gewonnen';
                        statusClass = 'text-green-600';
                    } else if (game.winnerId) {
                        statusText = 'Verloren';
                        statusClass = 'text-red-600';
                    } else {
                        statusText = 'Unentschieden';
                        statusClass = 'text-yellow-600';
                    }
                } else if (game.status === 'CANCELLED') {
                    statusText = 'Abgebrochen';
                    statusClass = 'text-neutral';
                }
                
                // Formatiere Datum
                const date = game.updatedAt ? new Date(game.updatedAt) : new Date();
                const formattedDate = new Intl.DateTimeFormat('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
                
                return (
                    <Link href={`/game/${game.id}`} key={game.id}>
                        <div className="p-3 border border-neutral rounded-md hover:bg-neutral-light/30 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    {game.status === 'FINISHED' && game.winnerId === currentUser.id && (
                                        <Trophy size={16} className="text-yellow-500 mr-2" />
                                    )}
                                    {game.status === 'CANCELLED' && (
                                        <AlertTriangle size={16} className="text-neutral mr-2" />
                                    )}
                                    <span className="font-medium">
                                        {opponent ? opponent.name : 'Unbekannter Gegner'}
                                    </span>
                                </div>
                                <span className={`text-sm font-medium ${statusClass}`}>
                                    {statusText}
                                </span>
                            </div>
                            <div className="mt-1 text-sm text-textSecondary flex justify-between items-center">
                                <span>{formattedDate}</span>
                                <span className="font-medium">{userScore}:{opponentScore}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default RecentGames;