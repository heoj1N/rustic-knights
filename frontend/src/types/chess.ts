export type ChessPieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type ChessColor = 'white' | 'black';

export interface ChessPiece {
  type: ChessPieceType;
  color: ChessColor;
  position: Position;
}

export interface Position {
  x: number;
  y: number;
}

export interface MoveResult {
  valid: boolean;
  message?: string;
}

export interface MoveRecord {
  piece: ChessPieceType;
  from: Position;
  to: Position;
  isWhite: boolean;
  turn: number;
}

export enum SquareHighlightState {
  DEFAULT,
  HOVER,
  SELECTED,
  VALID_MOVE,
  LAST_MOVE,
  CHECK
}