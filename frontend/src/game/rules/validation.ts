import { ChessPieceType, Position } from '../../types/chess';
import { isValidPawnMove, isValidRookMove, isValidKnightMove, isValidBishopMove, isValidQueenMove, isValidKingMove } from './moves';

export interface MoveValidationParams {
    pieceType: ChessPieceType;
    isWhite: boolean;
    from: Position;
    to: Position;
    board: Map<string, { type: ChessPieceType; isWhite: boolean }>;
}

export const isValidMove = (params: MoveValidationParams): boolean => {
    const { pieceType, to } = params;
    
    if (!isWithinBounds(to)) return false;
    
    switch (pieceType) {
        case 'pawn':
            return isValidPawnMove(params);
        case 'rook':
            return isValidRookMove(params);
        case 'knight':
            return isValidKnightMove(params);
        case 'bishop':
            return isValidBishopMove(params);
        case 'queen':
            return isValidQueenMove(params);
        case 'king':
            return isValidKingMove(params);
        default:
            return false;
    }
};

const isWithinBounds = (pos: Position): boolean => {
    return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8;
};

const getBoardKey = (pos: Position): string => `${pos.x},${pos.y}`;
