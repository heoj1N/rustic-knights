export interface GameState {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
  currentTurn: 'white' | 'black';
  moves: GameMove[];
  status: GameStatus;
}

export interface GameMove {
  from: Position;
  to: Position;
  piece: string;
  player: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
}

export type GameStatus = 'waiting' | 'active' | 'completed';

export interface Position {
  x: number;
  y: number;
}

export interface GameStateUpdate {
  type: 'MOVE' | 'JOIN' | 'LEAVE' | 'GAME_OVER';
  payload: Record<string, unknown>;
}

export interface GameStateData {
  gameState: GameState;
}

export interface MoveResultData {
  success: boolean;
  message?: string;
  gameState?: GameState;
}

export interface GameOverData {
  winner: string | null;
  reason: string;
  gameState: GameState;
}

export interface ServerMessage {
  type: string;
  data: GameStateData | MoveResultData | GameOverData;
}
