import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Game, Question } from '../../types';
import toast from 'react-hot-toast';
import { UserPlus, Clock, Search } from 'lucide-react';

const GamePage = () => {
  const { user } = useRequireAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  
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
  
  return (
    <>
      <Head>
        <title>Spielelobby | Planetary Health Quiz</title>
      </Head>
      <div className="main-container">
        <h1 className="text-3xl font-bold mb-6 text-textPrimary">Spielelobby</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-textPrimary">
              <Search className="mr-2" size={20} /> Spiel finden
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
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-textPrimary">
              <Clock className="mr-2" size={20} /> Letzte Spiele
            </h2>
            <p className="text-textSecondary">
              Hier könnten deine letzten Spiele angezeigt werden (noch nicht implementiert).
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamePage;