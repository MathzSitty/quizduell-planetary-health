// frontend/types/index.ts
export interface User {
    id: string;
    name: string;
    email: string;
    uniHandle?: string | null;
    role: string;
    score: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Question {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption?: string;
    category?: string | null;
    source?: string | null;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    authorId?: string | null;
    author?: { name: string; id: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface GameRound {
    id: string;
    gameId: string;
    questionId: string;
    question: Question;
    roundNumber: number;
    player1AnsweredOption?: string | null;
    player2AnsweredOption?: string | null;
    player1Correct?: boolean | null;
    player2Correct?: boolean | null;
    createdAt?: string;
}

export type GameStatus = 'PENDING' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export interface Game {
    id: string;
    player1Id: string;
    player2Id?: string | null;
    player1: Partial<User>;
    player2?: Partial<User> | null;
    status: GameStatus;
    currentQuestionIdx: number;
    player1Score: number;
    player2Score: number;
    winnerId?: string | null;
    winner?: Partial<User> | null;
    rounds: GameRound[];
    isSolo?: boolean;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    createdAt?: string;
    updatedAt?: string;
}

// Für Socket Events
export interface GameStartedPayload {
    game: Game;
    questions: Question[];
    timeLimit: number;
}

export interface RoundResultPayload {
    gameId: string;
    roundNumber: number;
    questionId: string;
    player1Answer?: string | null;
    player2Answer?: string | null;
    correctOption: string;
    player1Correct?: boolean | null;
    player2Correct?: boolean | null;
    player1CurrentScore: number;
    player2CurrentScore: number;
    nextQuestion?: Question | null;
    gameStatus: GameStatus;
    forcedByTimeout?: boolean;
}

// AUTH CONTEXT TYPES - Diese fehlten!
export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, uniHandle?: string) => Promise<void>;
    logout: () => void;
    fetchCurrentUser: (token?: string | null) => Promise<void>;
}

// SOCKET CONTEXT TYPES
export interface SocketContextType {
    socket: any | null;
    isConnected: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    uniHandle?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
}