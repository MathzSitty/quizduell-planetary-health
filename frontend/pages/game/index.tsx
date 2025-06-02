// frontend/pages/game/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useSocket } from '../../contexts/SocketContext';
import { Game } from '../../types';
import { Search, UserPlus, Clock, Brain } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/apiClient';
import RecentGames from '../../components/game/RecentGames';

export default function GamePage() {
  const { user: currentUser } = useAuth();
  // Schützt die Seite vor nicht-eingeloggten Benutzern
  const { isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  
  const { socket, isConnected } = useSocket();
  
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  
  // Zustand für "Letzte Spiele"
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  
  // NEU: Zustand für Solo-Training
  const [isStartingSolo, setIsStartingSolo] = useState(false);
  
  // Socket-Events für Matchmaking
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handlePlayerJoined = ({ game, opponent }: { game: Game, opponent: { id: string, name: string } }) => {
      toast.success(`${opponent.name} ist beigetreten!`, {
        id: 'player-joined'
      });
    };
    
    const handleGameStarted = ({ game }: { game: Game }) => {
      toast.dismiss('waiting-toast');
      setIsFindingMatch(false);
      setWaitingForOpponent(false);
      router.push(`/game/${game.id}`);
    };
    
    socket.on('player_joined', handlePlayerJoined);
    socket.on('game_started', handleGameStarted);
    
    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, isConnected, router]);
  
  const handleStartMatch = () => {
    if (!socket || !isConnected) {
      toast.error('Keine Verbindung zum Server. Bitte aktualisieren Sie die Seite.');
      return;
    }
    
    setIsFindingMatch(true);
    
    socket.emit('find_game', (response: { game?: Game, waiting?: boolean, error?: string }) => {
      if (response.error) {
        toast.error(response.error);
        setIsFindingMatch(false);
        return;
      }
      
      // Wenn ein Spiel direkt gefunden wurde, wird der Client von game_started zum Spiel weitergeleitet
      if (response.waiting && response.game) {
        setCurrentGameId(response.game.id);
        setWaitingForOpponent(true);
        toast.loading('Warte auf einen Gegenspieler...', {
          id: 'waiting-toast',
          duration: Infinity,
        });
      }
    });
  };
  
  const handleCancelSearch = () => {
    if (!socket || !isConnected) {
        setIsFindingMatch(false);
        setWaitingForOpponent(false);
        setCurrentGameId(null);
        toast.dismiss('waiting-toast');
        return;
    }
    
    // Sende Cancel-Event an Server
    socket.emit('cancel_search', (response: { success?: boolean; error?: string }) => {
        if (response.error) {
            toast.error(response.error);
        } else if (response.success) {
            console.log("Suche erfolgreich abgebrochen");
        }
    });
    
    toast.dismiss('waiting-toast');
    setIsFindingMatch(false);
    setWaitingForOpponent(false);
    setCurrentGameId(null);
  };

  // NEU: Solo-Training-Handler
  const handleStartSoloTraining = async (difficulty?: 'EASY' | 'MEDIUM' | 'HARD') => {
    if (!currentUser) return;
    
    setIsStartingSolo(true);
    try {
      const response = await apiClient.post('/games/solo', { difficulty });
      if (response.data.status === 'success') {
        const soloGame = response.data.data.game;
        router.push(`/game/${soloGame.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Fehler beim Starten des Solo-Trainings');
    } finally {
      setIsStartingSolo(false);
    }
  };

  // Laden der letzten Spiele
  useEffect(() => {
    const fetchRecentGames = async () => {
        if (!currentUser) return;
        
        setIsLoadingGames(true);
        try {
            const response = await apiClient.get('/games/recent');
            if (response.data.status === 'success' && response.data.data?.recentGames) {
                setRecentGames(response.data.data.recentGames);
            }
        } catch (error) {
            console.error('Fehler beim Laden der letzten Spiele:', error);
        } finally {
            setIsLoadingGames(false);
        }
    };
    
    fetchRecentGames();
  }, [currentUser]);
  
  if (authLoading) {
    return <div className="main-container text-center py-20"><Spinner size="lg" /><p className="mt-4 text-textSecondary">Lade...</p></div>;
  }
  
  return (
    <>
      <Head>
        <title>Spielelobby | Planetary Health Quiz</title>
      </Head>
      <div className="main-container">
        <h1 className="text-3xl font-bold mb-6 text-textPrimary">Spielelobby</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* PvP-Spiel */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-textPrimary">
              <Search className="mr-2" size={20} /> PvP-Duell
            </h2>
            <p className="mb-6 text-textSecondary">
              Finde einen Gegner und starte ein neues Quiz-Duell zu Planetary Health Themen!
            </p>
            
            {!isFindingMatch ? (
              <Button
                onClick={handleStartMatch}
                className="w-full"
                disabled={!isConnected}
              >
                <UserPlus className="mr-2" size={18} />
                Spielpartner suchen
              </Button>
            ) : (
              <div className="space-y-4">
                {waitingForOpponent ? (
                  <div className="flex items-center justify-center space-x-2 p-4 bg-neutral-light rounded-md">
                    <Spinner size="sm" />
                    <span className="text-textSecondary">Warte auf einen Gegenspieler...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 p-4 bg-neutral-light rounded-md">
                    <Spinner size="sm" />
                    <span className="text-textSecondary">Suche nach offenen Spielen...</span>
                  </div>
                )}
                <Button
                  onClick={handleCancelSearch}
                  variant="danger"
                  className="w-full"
                >
                  Suche abbrechen
                </Button>
              </div>
            )}
          </div>

          {/* NEU: Solo-Training */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-textPrimary">
              <Brain className="mr-2" size={20} /> Solo-Training
            </h2>
            <p className="mb-6 text-textSecondary">
              Trainiere alleine und verbessere dein Wissen in verschiedenen Schwierigkeitsgraden!
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleStartSoloTraining('EASY')} 
                variant="outline" 
                className="w-full"
                disabled={isStartingSolo}
              >
                🟢 Leichtes Training
              </Button>
              <Button 
                onClick={() => handleStartSoloTraining('MEDIUM')} 
                variant="outline" 
                className="w-full"
                disabled={isStartingSolo}
              >
                🟡 Mittleres Training
              </Button>
              <Button 
                onClick={() => handleStartSoloTraining('HARD')} 
                variant="outline" 
                className="w-full"
                disabled={isStartingSolo}
              >
                🔴 Schweres Training
              </Button>
              <Button 
                onClick={() => handleStartSoloTraining()} 
                variant="primary" 
                className="w-full"
                disabled={isStartingSolo}
                isLoading={isStartingSolo}
              >
                🎲 Gemischtes Training
              </Button>
            </div>
          </div>

          {/* Letzte Spiele */}
          <div className="card md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-textPrimary">
              <Clock className="mr-2" size={20} /> Letzte Spiele
            </h2>
            {currentUser && (
                <RecentGames 
                    games={recentGames} 
                    currentUser={currentUser} 
                    isLoading={isLoadingGames} 
                />
            )}
          </div>
        </div>
      </div>
    </>
  );
}