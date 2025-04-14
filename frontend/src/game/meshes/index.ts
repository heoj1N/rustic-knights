import { createRookMesh } from './rook';
import { createBishopMesh } from './bishop';
import { createKnightMesh } from './knight';
import { createPawnMesh } from './pawn';
import { createQueenMesh } from './queen';
import { createKingMesh } from './king';
import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import { ChessPieceType } from '../../types/chess';

// Scale factors for different piece types to ensure consistent sizing
const PIECE_SCALES = {
    pawn: 1.2,    // Increased from 0.9 for better visibility
    rook: 0.6,    // Reduced from 0.75
    bishop: 0.6,  // Reduced from 0.75
    knight: 1.5,  // Reduced from 0.75
    queen: 1.5,   // Increased by 1.5x for better proportion
    king: 1.5     // Increased by 1.5x for better proportion
} as const;

// Color-based scaling to ensure white and black pieces are the same size
const COLOR_SCALES = {
    white: 1.0,
    black: 1.0
} as const;

type ChessColor = keyof typeof COLOR_SCALES;

export const createCustomMesh = (
    type: ChessPieceType,
    scene: Scene,
    color: string,
    position?: { x: number; y: number }  // Add optional position parameter
): Mesh | null => {
    let mesh: Mesh | null = null;

    switch (type) {
        case 'rook':
            mesh = createRookMesh(scene, color);
            break;
        case 'bishop':
            mesh = createBishopMesh(scene, color);
            break;
        case 'knight':
            mesh = createKnightMesh(scene, color);
            break;
        case 'pawn':
            mesh = createPawnMesh(scene, color);
            break;
        case 'queen':
            mesh = createQueenMesh(scene, color);
            break;
        case 'king':
            mesh = createKingMesh(scene, color);
            break;
    }

    // Apply piece-specific and color-based scaling
    if (mesh) {
        const pieceScale = PIECE_SCALES[type];
        const colorScale = COLOR_SCALES[color.toLowerCase() as ChessColor] || 1.0;
        const finalScale = pieceScale * colorScale;
        mesh.scaling = new Vector3(finalScale, finalScale, finalScale);
        
        // Ensure the piece is grounded by adjusting its position
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const height = boundingBox.maximum.y - boundingBox.minimum.y;
        mesh.position.y = height / 2;  // Place bottom of piece at y=0

        // Set the mesh name to match the expected format for movement logic
        if (position) {
            mesh.name = `${type}_${position.x}_${position.y}`;
        }

        // Add metadata required for game logic
        mesh.metadata = {
            type: 'piece',
            pieceType: type,
            isWhite: color.toLowerCase() === 'white',
            position: position || { x: 0, y: 0 },
            originalScale: mesh.scaling.clone()
        };
    }

    return mesh;
}; 