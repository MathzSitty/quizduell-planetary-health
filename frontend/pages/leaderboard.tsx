// frontend/pages/leaderboard.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { User, ApiResponse } from '../types';
import Spinner from '../components/ui/Spinner';
import { Trophy, ShieldCheck } from 'lucide-react';

interface LeaderboardEntry extends Partial<User> {
    rank?: number;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<ApiResponse<{ leaderboard: User[] }>>('/users/leaderboard?limit=20');
                if (response.data.status === 'success' && response.data.data?.leaderboard) {
                    const rankedLeaderboard = response.data.data.leaderboard.map((user, index) => ({
                        ...user,
                        rank: index + 1,
                    }));
                    setLeaderboard(rankedLeaderboard);
                } else {
                    throw new Error(response.data.message || 'Leaderboard konnte nicht geladen werden.');
                }
            } catch (err: any) {
                console.error("Fehler beim Laden des Leaderboards:", err);
                setError(err.message || 'Ein Fehler ist aufgetreten.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <>
            <Head>
                <title>Leaderboard - QuizDuell</title>
            </Head>
            <div className="main-container">
                <h1 className="text-4xl font-bold text-center text-primary mb-10 flex items-center justify-center">
                    <Trophy size={40} className="mr-3 text-accent" /> Leaderboard
                </h1>

                {isLoading && <Spinner className="mt-10" size="lg" />}
                {error && <p className="text-center text-red-500 mt-10 bg-red-100 p-4 rounded-md">{error}</p>}

                {!isLoading && !error && leaderboard.length === 0 && (
                    <p className="text-center text-textSecondary mt-10">
                        Noch keine Einträge im Leaderboard. Sei der Erste!
                    </p>
                )}

                {!isLoading && !error && leaderboard.length > 0 && (
                    <div className="overflow-x-auto shadow-lg rounded-lg">
                        <table className="min-w-full divide-y divide-neutral bg-surface">
                            <thead className="bg-neutral-light">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                                    Rang
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                                    Uni-Kürzel
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                                    Punkte
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral">
                            {leaderboard.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-light/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                        ${user.rank === 1 ? 'bg-yellow-400 text-yellow-800' : user.rank === 2 ? 'bg-gray-300 text-gray-700' : user.rank === 3 ? 'bg-yellow-600/70 text-yellow-900' : 'bg-primary/10 text-primary'}`}>
                        {user.rank}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary flex items-center">
                                        {user.name}
                                        {user.role === 'ADMIN' && <ShieldCheck size={16} className="ml-2 text-primary" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                                        {user.uniHandle || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary">
                                        {user.score}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}