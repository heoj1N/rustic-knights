import { Position } from '../../types/chess';
import { MoveValidationParams } from './validation';

export const isValidPawnMove = ({ from, to, isWhite, board }: MoveValidationParams): boolean => {
  console.log('Validating pawn move:', { from, to, isWhite });
  const direction = isWhite ? 1 : -1;

  // Basic forward movement
  if (from.x === to.x && to.y === from.y + direction) {
    const targetPiece = getPieceAt(to, board);
    return !targetPiece;
  }

  // Initial two-square movement
  if (
    from.x === to.x &&
    ((isWhite && from.y === 1 && to.y === 3) || (!isWhite && from.y === 6 && to.y === 4))
  ) {
    const intermediatePos = { x: from.x, y: from.y + direction };
    const intermediatePiece = getPieceAt(intermediatePos, board);
    const targetPiece = getPieceAt(to, board);
    return !intermediatePiece && !targetPiece;
  }

  // Capture moves
  if (Math.abs(to.x - from.x) === 1 && to.y === from.y + direction) {
    const pieceAtTarget = getPieceAt(to, board);
    return pieceAtTarget && pieceAtTarget.color !== (isWhite ? 'white' : 'black');
  }

  return false;
};

export const isValidRookMove = ({ from, to, isWhite, board }: MoveValidationParams): boolean => {
  console.log('Validating rook move:', { from, to, isWhite, boardSize: board?.size });
  
  // First check if it's a valid rook movement pattern (same row or column)
  if (from.x !== to.x && from.y !== to.y) {
    return false;
  }
  
  // If board is empty or undefined, just validate the movement pattern
  if (!board || board.size === 0) {
    return true;
  }
  
  // Otherwise check for path blocking and capture
  return !isPathBlocked(from, to, board) && 
         canCaptureAt(to, board, { color: isWhite ? 'white' : 'black' });
};

export const isValidKnightMove = ({ from, to }: MoveValidationParams): boolean => {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
};

export const isValidBishopMove = ({ from, to, board, isWhite }: MoveValidationParams): boolean => {
  // Check if it's a valid diagonal move
  if (Math.abs(to.x - from.x) !== Math.abs(to.y - from.y)) {
    return false;
  }
  
  // If board is empty or undefined, just validate the movement pattern
  if (!board || board.size === 0) {
    return true;
  }
  
  // Check for path blocking and capture
  return !isPathBlocked(from, to, board) && 
         canCaptureAt(to, board, { color: isWhite ? 'white' : 'black' });
};

export const isValidQueenMove = (params: MoveValidationParams): boolean => {
  return isValidRookMove(params) || isValidBishopMove(params);
};

export const isValidKingMove = ({ from, to }: MoveValidationParams): boolean => {
  return Math.abs(to.x - from.x) <= 1 && Math.abs(to.y - from.y) <= 1;
};

const isPathBlocked = (from: Position, to: Position, board: Map<string, any>): boolean => {
  try {
    console.log('Checking path details:', { from, to, boardEntries: Array.from(board.entries()).length });
    
    // Calculate direction
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    
    // Start from the square after the origin
    let current = { x: from.x + dx, y: from.y + dy };
    
    // Check each square until we reach the destination
    while (current.x !== to.x || current.y !== to.y) {
      const key = `${current.x},${current.y}`;
      const piece = board.get(key);
      console.log('Checking square:', current, 'key:', key, 'piece:', piece);
      
      if (piece) {
        console.log('Path blocked at:', current);
        return true; // Path is blocked
      }
      
      current = { x: current.x + dx, y: current.y + dy };
    }
    
    return false; // Path is clear
  } catch (error) {
    console.error('Error in isPathBlocked:', error);
    // If there's an error, assume the path is clear to allow movement
    return false;
  }
};

const getPieceAt = (pos: Position, board: Map<string, any>) => {
  return board.get(`${pos.x},${pos.y}`);
};

const canCaptureAt = (pos: Position, board: Map<string, any>, movingPiece: any): boolean => {
  const pieceAtTarget = getPieceAt(pos, board);
  // Allow moves to empty squares or squares with opponent pieces
  return !pieceAtTarget || pieceAtTarget.color !== movingPiece.color;
};
