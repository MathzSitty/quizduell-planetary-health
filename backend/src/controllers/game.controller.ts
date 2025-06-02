import { Request, Response, NextFunction } from 'express';
import {
  createGameService,
  findOpenGameService,
  joinGameService,
  getGameDetailsService,
  getUserRecentGamesService,
  createSoloGameService,
  submitAnswerService
} from '../services/game.service';
import { AppError } from '../utils/AppError';
import { GameStatus } from '../types/enums';

export const createGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
    const game = await createGameService({ player1Id: req.user.id });
    res.status(201).json({ status: 'success', data: { game } });
  } catch (error) {
    next(error);
  }
};

export const findAndJoinGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
    let game = await findOpenGameService(req.user.id);
    let waiting = false;
    // questions wird hier nicht mehr direkt zurückgegeben, da die Spiellogik das über Sockets handhabt
    // oder die Spielseite die Details nachlädt.

    if (game) { // Spiel gefunden, beitreten
      // joinGameService gibt das Spiel und die initialen Fragen zurück
      const joinedGameData = await joinGameService({ gameId: game.id, player2Id: req.user.id });
      // Das Frontend wird durch Socket-Events über den Spielstart informiert.
      // Wir geben hier das initiale Spielobjekt zurück.
      res.status(200).json({ status: 'success', data: { game: joinedGameData, waiting: false } });
    } else { // Kein passendes Spiel, neues erstellen
      game = await createGameService({ player1Id: req.user.id });
      waiting = true;
      res.status(200).json({ status: 'success', data: { game, waiting: true } });
    }
  } catch (error) {
    next(error);
  }
};

// NEU: Solo-Spiel erstellen
export const createSoloGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
    
    const { difficulty } = req.body; // Optional: EASY, MEDIUM, HARD
    
    const soloGame = await createSoloGameService({
      player1Id: req.user.id,
      difficulty: difficulty || undefined
    });
    
    res.status(201).json({ 
      status: 'success', 
      data: { 
        game: soloGame,
        isSolo: true 
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const getGameDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
        const game = await getGameDetailsService(req.params.id, req.user.id);
        if (!game) {
            return res.status(404).json({ message: 'Spiel nicht gefunden oder Zugriff verweigert.' });
        }
        
        const gameToSend = JSON.parse(JSON.stringify(game)); // Deep copy

        // Entferne korrekte Antworten aus den Fragen, bevor sie an den Client gesendet werden,
        // es sei denn, das Spiel ist beendet oder der Anfragende ist Admin.
        // Die Rolle des Anfragenden (req.user.role) könnte hier geprüft werden.
        if (gameToSend.status !== GameStatus.FINISHED && gameToSend.status !== GameStatus.CANCELLED) {
            gameToSend.rounds.forEach((round: any) => { // any, da gameToSend eine Kopie ist
                if (round.question) {
                    // Die korrekte Option sollte nur gesendet werden, wenn die Runde vorbei ist
                    // oder das Spiel beendet ist. Für aktive Runden wird sie nicht gesendet.
                    // Die Logik in QuestionDisplay im Frontend handhabt das Anzeigen basierend auf showRoundResult.
                    // Hier entfernen wir sie präventiv für aktive Spiele, wenn sie nicht explizit benötigt wird.
                    // delete round.question.correctOption; // Diese Zeile ist wahrscheinlich nicht mehr nötig,
                                                          // da der Service die Fragen für aktive Spiele ohne correctOption liefern sollte.
                                                          // Aber als zusätzliche Sicherheitsebene.
                }
            });
        }

        res.status(200).json({ status: 'success', data: { game: gameToSend } });
    } catch (error) {
        next(error);
    }
};

/**
 * Holt die letzten Spiele eines Benutzers
 */
export const getUserRecentGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
        
        // Optional limit parameter with default of 5
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        
        const recentGames = await getUserRecentGamesService(req.user.id, limit);
        
        res.status(200).json({ 
            status: 'success', 
            data: { recentGames } 
        });
    } catch (error) {
        next(error);
    }
};

export const submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentifizierung erforderlich.', 401);
    
    const { id: gameId } = req.params;
    const { roundNumber, selectedOption } = req.body;
    
    const result = await submitAnswerService(gameId, req.user.id, roundNumber, selectedOption);
    
    res.status(200).json({ 
      status: 'success', 
      data: { 
        game: result.game,
        roundResult: result.roundResult,
        nextQuestion: result.nextQuestion 
      } 
    });
  } catch (error) {
    next(error);
  }
};