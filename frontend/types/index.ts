// frontend/types/index.ts

export interface User {
    id: string;
    name: string;
    email: string;
    uniHandle?: string | null;
    role: 'USER' | 'ADMIN';
    score: number;
    createdAt?: string; // ISO Date String
}

export interface Question {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption?: string; // Wird für Spieler nicht immer gesendet
    category?: string | null;
    authorId?: string;
    author?: { name: string; id: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface GameRound {
    id: string;
    gameId: string;
    questionId: string;
    question: Question; // Enthält die Frage-Details für die Runde
    roundNumber: number;
    player1AnsweredOption?: string | null;
    player2AnsweredOption?: string | null;
    player1Correct?: boolean | null;
    player2Correct?: boolean | null;
    createdAt?: string;
}

export type GameStatus = 'PENDING' | 'ACTIVE' | 'ROUND_ENDED' | 'FINISHED' | 'CANCELLED';

export interface Game {
    id: string;
    player1Id: string;
    player2Id?: string | null;
    player1: Partial<User>; // Nur die wichtigsten Infos
    player2?: Partial<User> | null;
    status: GameStatus;
    currentQuestionIdx: number;
    player1Score: number;
    player2Score: number;
    winnerId?: string | null;
    winner?: Partial<User> | null;
    rounds: GameRound[]; // Die Runden mit den Fragen
    createdAt?: string;
    updatedAt?: string;
}

// Für Socket Events
export interface GameStartedPayload {
    game: Game;
    questions: Question[]; // Die Fragen für das gesamte Spiel (ohne korrekte Antwort)
    timeLimit: number;
}

export interface RoundResultPayload {
    gameId: string;
    roundNumber: number;
    questionId: string;
    player1Answer?: string | null;
    player2Answer?: string | null;
    correctOption: string; // Jetzt wird die korrekte Option gesendet
    player1Correct?: boolean | null;
    player2Correct?: boolean | null;
    player1CurrentScore: number;
    player2CurrentScore: number;
    nextQuestion?: Question | null; // Nächste Frage (ohne korrekte Antwort)
    gameStatus: GameStatus;
}

// Typ für AuthContext
export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string, uniHandle?: string) => Promise<void>;
    logout: () => void;
    fetchCurrentUser: () => Promise<void>; // Um User-Daten nachzuleaden
}

// Typ für SocketContext
export interface SocketContextType {
    socket: import('socket.io-client').Socket | null;
    isConnected: boolean;
}

// Typ für API-Antworten (generisch)
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    // Für paginierte Listen
    questions?: T; // Spezifisch für Question-Liste
    total?: number;
    totalPages?: number;
    currentPage?: number;
}