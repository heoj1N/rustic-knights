import { Position } from '../../types/chess';
import { MoveValidationParams } from './validation';

export const isValidPawnMove = ({ from, to, isWhite, board }: MoveValidationParams): boolean => {
    const direction = isWhite ? 1 : -1;
    const startRank = isWhite ? 1 : 6;
    
    // Basic forward movement
    if (from.x === to.x && to.y === from.y + direction) {
        return !getPieceAt(to, board);
    }
    
    // Initial two-square movement
    if (from.x === to.x && from.y === startRank && to.y === from.y + 2 * direction) {
        const intermediatePos = { x: from.x, y: from.y + direction };
        return !getPieceAt(intermediatePos, board) && !getPieceAt(to, board);
    }
    
    // Capture moves
    if (Math.abs(to.x - from.x) === 1 && to.y === from.y + direction) {
        const pieceAtTarget = getPieceAt(to, board);
        return pieceAtTarget && pieceAtTarget.isWhite !== isWhite;
    }
    
    return false;
};

export const isValidRookMove = ({ from, to, board }: MoveValidationParams): boolean => {
    return (from.x === to.x || from.y === to.y) && !isPathBlocked(from, to, board);
};

export const isValidKnightMove = ({ from, to }: MoveValidationParams): boolean => {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
};

export const isValidBishopMove = ({ from, to, board }: MoveValidationParams): boolean => {
    return Math.abs(to.x - from.x) === Math.abs(to.y - from.y) && !isPathBlocked(from, to, board);
};

export const isValidQueenMove = (params: MoveValidationParams): boolean => {
    return isValidRookMove(params) || isValidBishopMove(params);
};

export const isValidKingMove = ({ from, to }: MoveValidationParams): boolean => {
    return Math.abs(to.x - from.x) <= 1 && Math.abs(to.y - from.y) <= 1;
};

const isPathBlocked = (from: Position, to: Position, board: Map<string, any>): boolean => {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let current = { x: from.x + dx, y: from.y + dy };
    
    while (current.x !== to.x || current.y !== to.y) {
        if (getPieceAt(current, board)) return true;
        current = { x: current.x + dx, y: current.y + dy };
    }
    
    return false;
};

const getPieceAt = (pos: Position, board: Map<string, any>) => {
    return board.get(`${pos.x},${pos.y}`);
};