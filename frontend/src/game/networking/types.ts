export interface GameState {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
  currentTurn: 'white' | 'black';
  moves: GameMove[];
  status: GameStatus;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameMove {
  from: Position;
  to: Position;
  piece: string;
  player: string;
  timestamp: number;
}

export type GameStatus = 'waiting' | 'active' | 'completed';

export interface GameStateUpdate {
  type: 'MOVE' | 'JOIN' | 'LEAVE' | 'GAME_OVER';
  payload: any;
}
