export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface PieceMeshOptions {
    height: number;
    diameter?: number;
    diameterTop?: number;
    diameterBottom?: number;
    width?: number;
    depth?: number;
} 