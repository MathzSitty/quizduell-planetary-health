import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { AlertTriangle, CheckCircle, Trophy, Swords, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import QuestionDisplay from '../../components/game/QuestionDisplay';
import GameStatusDisplay from '../../components/game/GameStatusDisplay';
import TimerDisplay from '../../components/game/TimerDisplay';
import { Game, Question, RoundResultPayload, GameStartedPayload, User } from '../../types';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';

const GamePage = () => {
  const router = useRouter();
  const { gameId } = router.query as { gameId: string };

  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();

  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnsweredThisRound, setHasAnsweredThisRound] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResultPayload | null>(null);

  const [opponent, setOpponent] = useState<Partial<User> | null>(null);
  const [timeLimit, setTimeLimit] = useState(30); // Default, wird von Server überschrieben
  const [timerKey, setTimerKey] = useState(0); // Key zum Reset des Timers
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- Helper to always set the correct opponent ---
  const determineOpponent = useCallback(
    (gameObj: Game | null, userId: string | undefined | null) => {
      if (!gameObj || !userId) return null;
      if (gameObj.player1Id === userId) {
        return gameObj.player2 ?? null;
      } else if (gameObj.player2Id === userId) {
        return gameObj.player1 ?? null;
      }
      return null;
    },
    []
  );

  const fetchGameDetails = useCallback(async () => {
    if (!gameId || !currentUser) return;

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/games/${gameId}`);
      if (response.data.status === 'success') {
        const fetchedGame = response.data.data.game as Game;

        setGame(fetchedGame);

        setOpponent(determineOpponent(fetchedGame, currentUser.id));

        // Aktuelle Frage basierend auf dem Spielstatus setzen
        if (fetchedGame.status === 'ACTIVE') {
          const currentQIdx = fetchedGame.currentQuestionIdx;
          const currentRnd = fetchedGame.rounds.find(r => r.roundNumber === currentQIdx + 1);
          if (currentRnd) {
            setCurrentQuestion(currentRnd.question);
            setCurrentRoundNumber(currentRnd.roundNumber);
            setTimerKey(prev => prev + 1);
            setIsTimerRunning(true);
          } else if (fetchedGame.rounds.length > 0 && currentQIdx >= fetchedGame.rounds.length) {
            setGame(g => g ? { ...g, status: 'FINISHED' } : null);
            setIsTimerRunning(false);
          }
        } else if (fetchedGame.status === 'FINISHED' || fetchedGame.status === 'CANCELLED') {
          setIsTimerRunning(false);
        }
      } else {
        throw new Error(response.data.message || 'Spieldetails konnten nicht geladen werden.');
      }
    } catch (err: any) {
      console.error("Fehler beim Laden der Spieldetails:", err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
      toast.error(err.message || 'Fehler beim Laden des Spiels.');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, currentUser, determineOpponent]);

  useEffect(() => {
    if (gameId && currentUser) {
      fetchGameDetails();
    }
  }, [gameId, currentUser, fetchGameDetails]);

  useEffect(() => {
    if (!socket || !isConnected || !gameId || !currentUser) return;

    const handleGameStarted = (data: GameStartedPayload) => {
      if (data.game.id !== gameId) return;

      setGame(data.game);
      setTimeLimit(data.timeLimit);

      const currentQIdx = data.game.currentQuestionIdx;
      const currentRnd = data.game.rounds.find(r => r.roundNumber === currentQIdx + 1);
      if (currentRnd) {
        setCurrentQuestion(currentRnd.question);
        setCurrentRoundNumber(currentRnd.roundNumber);
      }

      setOpponent(determineOpponent(data.game, currentUser.id));

      setSelectedOption(null);
      setHasAnsweredThisRound(false);
      setShowRoundResult(false);
      setTimerKey(prev => prev + 1);
      setIsTimerRunning(true);
      setIsLoading(false);
      setError(null);
    };

    const handleRoundResult = (data: RoundResultPayload & { forcedByTimeout?: boolean }) => {
      if (data.gameId !== gameId) return;

      setLastRoundResult(data);

      const bothAnswered = data.player1Answer !== null && data.player2Answer !== null;
      const forceProgress = data.forcedByTimeout === true;

      if (bothAnswered || forceProgress) {
        setIsTimerRunning(false);
        setShowRoundResult(true);

        if (data.nextQuestion && data.gameStatus === 'ACTIVE') {
          setTimeout(() => {
            setCurrentQuestion(data.nextQuestion!);
            setCurrentRoundNumber(prev => prev + 1);
            setSelectedOption(null);
            setHasAnsweredThisRound(false);
            setShowRoundResult(false);
            setLastRoundResult(null);
            setTimerKey(prev => prev + 1);
            setIsTimerRunning(true);
          }, 3000);
        }
      }

      setGame(prevGame => {
        if (!prevGame) return null;
        return {
          ...prevGame,
          player1Score: data.player1CurrentScore,
          player2Score: data.player2CurrentScore,
          status: data.gameStatus,
          currentQuestionIdx: data.nextQuestion ? prevGame.currentQuestionIdx + 1 : prevGame.currentQuestionIdx,
        };
      });

      setHasAnsweredThisRound(true);
    };

    const handleGameOver = (finishedGame: Game) => {
      if (finishedGame.id !== gameId) return;
      setGame(finishedGame);
      setIsTimerRunning(false);
      setShowRoundResult(false);
      toast.success('Spiel beendet!', { duration: 4000 });
    };

    const handleOpponentAnswered = (data: { playerId: string }) => {
      if (data.playerId !== currentUser?.id) {
        toast(`${opponent?.name || 'Gegner'} hat geantwortet.`, { duration: 1500, icon: '🤫' });
      }
    };

    const handleOpponentLeftOrForfeited = (data: { gameId: string, leaverId?: string, forfeitedPlayerId?: string, winnerId?: string }) => {
      if (data.gameId !== gameId) return;
      const leaverName = opponent?.name || 'Gegner';
      toast.error(`${leaverName} hat das Spiel verlassen.`, { duration: 4000 });
      setGame(prev => prev ? { ...prev, status: 'CANCELLED', winnerId: data.winnerId } : null);
      setIsTimerRunning(false);
    };

    const handleGameUpdate = (updatedGame: Game) => {
      if (updatedGame.id !== gameId) return;
      setGame(updatedGame);
      setOpponent(determineOpponent(updatedGame, currentUser?.id));
    };

    socket.on('game_started', handleGameStarted);
    socket.on('round_result', handleRoundResult);
    socket.on('game_over', handleGameOver);
    socket.on('opponent_answered', handleOpponentAnswered);
    socket.on('opponent_left', handleOpponentLeftOrForfeited);
    socket.on('opponent_forfeited', handleOpponentLeftOrForfeited);
    socket.on('game_updated', handleGameUpdate);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('round_result', handleRoundResult);
      socket.off('game_over', handleGameOver);
      socket.off('opponent_answered', handleOpponentAnswered);
      socket.off('opponent_left', handleOpponentLeftOrForfeited);
      socket.off('opponent_forfeited', handleOpponentLeftOrForfeited);
      socket.off('game_updated', handleGameUpdate);
    };
  }, [socket, isConnected, gameId, currentUser, opponent?.name, determineOpponent]);

  const handleAnswer = (selectedOpt: 'A' | 'B' | 'C' | 'D') => {
    if (!socket || !game || hasAnsweredThisRound || showRoundResult || game.status !== 'ACTIVE') return;

    setSelectedOption(selectedOpt);
    setHasAnsweredThisRound(true);

    socket.emit('submit_answer', {
      gameId: game.id,
      roundNumber: currentRoundNumber,
      selectedOption: selectedOpt,
    }, (response: { success?: boolean; error?: string; currentScore?: number; bothAnswered?: boolean }) => {
      if (response.error) {
        toast.error(response.error);
        setHasAnsweredThisRound(false);
        setSelectedOption(null);
      }

      if (response.bothAnswered) {
        setShowRoundResult(true);
      }
    });
  };

  const handleTimeout = useCallback(() => {
    if (!hasAnsweredThisRound && game && game.status === 'ACTIVE') {
      toast.error('Zeit abgelaufen!', { icon: '⏳' });
      setHasAnsweredThisRound(true);

      socket?.emit(
        'answer_timeout',
        {
          gameId: game.id,
          roundNumber: currentRoundNumber,
        },
        (response: { error?: string; bothAnswered?: boolean }) => {
          if (response.error) {
            console.error("Timeout error:", response.error);
          }

          if (response.bothAnswered) {
            setShowRoundResult(true);
          }
        }
      );
    }
  }, [hasAnsweredThisRound, game, currentRoundNumber, socket]);

  const handleLeaveGame = () => {
    if (socket && game) {
      if (confirm("Möchtest du das Spiel wirklich verlassen? Dein Gegner gewinnt dadurch (falls vorhanden).")) {
        socket.emit('leave_game', { gameId: game.id });
        router.push('/game');
      }
    }
  };

  if (isLoading) return <div className="main-container text-center py-20"><Spinner size="lg" /><p className="mt-4 text-textSecondary">Lade Spiel...</p></div>;
  if (error) return <div className="main-container text-center py-20 card bg-red-50"><AlertTriangle size={48} className="text-red-500 mx-auto mb-4" /><p className="text-red-700">{error}</p><Button onClick={() => router.push('/game')} className="mt-6">Zurück zur Lobby</Button></div>;

  if (!game || !currentUser) return <div className="main-container text-center py-20"><p>Spiel nicht gefunden oder Initialisierung fehlgeschlagen.</p><Button onClick={() => router.push('/game')} className="mt-6">Zurück zur Lobby</Button></div>;

  const totalQuestions = game.rounds.length;
  const gameIsOver = game.status === 'FINISHED' || game.status === 'CANCELLED';

  return (
    <>
      <Head>
        <title>QuizDuell: {game.player1?.name || 'Spieler 1'} vs {opponent?.name || game.player2?.name || 'Spieler 2'}</title>
      </Head>
      <div className="main-container">
        <GameStatusDisplay game={game} currentUser={currentUser} opponent={opponent} />

        {gameIsOver ? (
          <div className="card text-center py-10 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Spiel beendet!</h2>
            {game.status === 'CANCELLED' && (
              <p className="text-xl text-accent mb-4">Das Spiel wurde abgebrochen.</p>
            )}
            {game.winnerId ? (
              <p className="text-2xl text-secondary mb-2">
                <Trophy size={30} className="inline mr-2 text-yellow-400" />
                Gewinner: {game.winnerId === game.player1Id ? game.player1.name : game.player2?.name}
              </p>
            ) : game.status === 'FINISHED' ? (
              <p className="text-2xl text-textPrimary mb-2">Unentschieden!</p>
            ) : null}
            <p className="text-xl mt-4">
              Endstand: {game.player1.name}: {game.player1Score} - {game.player2?.name || 'Gegner'}: {game.player2Score}
            </p>
            <div className="mt-8 space-x-4">
              <Button onClick={() => router.push('/game')} variant="primary" size="lg" leftIcon={<Swords />}>Neue Runde</Button>
              <Button onClick={() => router.push('/leaderboard')} variant="outline" size="lg" leftIcon={<Trophy />}>Leaderboard</Button>
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            <p className="text-center text-sm text-textSecondary mb-2">
              Frage {currentRoundNumber} von {totalQuestions}
            </p>
            <TimerDisplay
              key={timerKey}
              initialTime={timeLimit}
              onTimeout={handleTimeout}
              isRunning={isTimerRunning && !showRoundResult && !hasAnsweredThisRound}
            />
            <QuestionDisplay
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabledOptions={hasAnsweredThisRound || showRoundResult || !isTimerRunning}
              selectedOption={selectedOption}
              correctOption={showRoundResult ? lastRoundResult?.correctOption : null}
              opponentAnswer={showRoundResult ? (currentUser?.id === game.player1Id ? lastRoundResult?.player2Answer : lastRoundResult?.player1Answer) : null}
            />

            {showRoundResult && lastRoundResult && (
              <div className="card mt-6 text-center animate-fadeIn bg-opacity-90 backdrop-blur-sm border border-primary/30">
                <h3 className="text-xl font-semibold mb-3 text-primary">Ergebnis Runde {lastRoundResult.roundNumber}</h3>
                
                {(() => {
                  // DIREKTE PRÜFUNG: Die einzige zuverlässige Methode, den Erfolg zu ermitteln, 
                  // ist der Vergleich der Spielerantwort mit der korrekten Antwort
                  const isCorrect = selectedOption === lastRoundResult.correctOption;
                  
                  // Haben wir überhaupt geantwortet?
                  const didAnswer = selectedOption !== null && selectedOption !== undefined;
                  
                  // Zeige die entsprechende Nachricht basierend auf der lokalen Auswahl
                  if (isCorrect) {
                    return (
                      <p className="text-green-600 font-bold flex items-center justify-center">
                        <CheckCircle className="mr-2"/> Deine Antwort war richtig!
                      </p>
                    );
                  } else if (didAnswer) {
                    return (
                      <p className="text-red-600 font-bold flex items-center justify-center">
                        <XCircle className="mr-2"/> Deine Antwort war falsch.
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-textSecondary font-medium">
                        Du hast nicht (rechtzeitig) geantwortet.
                      </p>
                    );
                  }
                })()}
                
                <p className="text-sm text-textSecondary mt-1">Die korrekte Antwort war: Option {lastRoundResult.correctOption}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <Spinner size="md" />
            <p className="mt-3 text-textSecondary">Warte auf nächste Frage oder Spielstart...</p>
          </div>
        )}

        {!gameIsOver && (
          <div className="mt-8 text-center">
            <Button onClick={handleLeaveGame} variant="danger" className="ml-auto">
              Spiel verlassen
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default GamePage;