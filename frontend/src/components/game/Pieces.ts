import * as BABYLON from '@babylonjs/core';
import { PieceType, PieceMeshOptions } from '../../types';
import { BOARD_OFFSET, SQUARE_SIZE, COLORS } from '../../utils/constants';

export const createPiece = (type: PieceType, isWhite: boolean, x: number, z: number, scene: BABYLON.Scene): BABYLON.Mesh => {
    let mesh: BABYLON.Mesh;
    const color = isWhite ? COLORS.WHITE : COLORS.BLACK;
    const material = new BABYLON.StandardMaterial(`${type}_material`, scene);
    material.diffuseColor = color;

    const options = getPieceMeshOptions(type);

    switch (type) {
        case 'pawn':
        case 'knight':
        case 'queen':
        case 'king':
            mesh = BABYLON.MeshBuilder.CreateCylinder(`${type}_${x}_${z}`, options, scene);
            break;
        case 'rook':
            mesh = BABYLON.MeshBuilder.CreateBox(`${type}_${x}_${z}`, options, scene);
            break;
        case 'bishop':
            // Use CreateCylinder as a cone, setting the top diameter to 0
            mesh = BABYLON.MeshBuilder.CreateCylinder(
                `${type}_${x}_${z}`,
                {
                    height: options.height,
                    diameterTop: 0,                          // <---- key for cone
                    diameterBottom: options.diameter || 0.3, // or use diameterBottom if you want
                },
                scene
            );
            break;
        default:
            throw new Error(`Unknown piece type: ${type}`);
    }

    mesh.material = material;
    mesh.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
    mesh.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
    mesh.position.y = mesh.scaling.y / 2;

    return mesh;
};

export const getPieceMeshOptions = (type: PieceType): PieceMeshOptions => {
    switch (type) {
        case 'pawn':
            return { height: 0.75, diameter: 0.3 };
        case 'rook':
            return { height: 0.8, width: 0.3, depth: 0.3 };
        case 'knight':
            return { height: 0.8, diameterTop: 0.2, diameterBottom: 0.3 };
        case 'bishop':
            return { height: 0.9, diameter: 0.3 };
        case 'queen':
            return { height: 1, diameterTop: 0.1, diameterBottom: 0.4 };
        case 'king':
            return { height: 1.2, diameterTop: 0.2, diameterBottom: 0.4 };
    }
};

export const createInitialPieces = (scene: BABYLON.Scene): void => {
    // Create pawns
    for (let i = 0; i < 8; i++) {
        createPiece('pawn', true, i, 1, scene);  // White pawns
        createPiece('pawn', false, i, 6, scene); // Black pawns
    }

    // Create other pieces
    const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    pieceOrder.forEach((piece, i) => {
        createPiece(piece, true, i, 0, scene);  // White pieces
        createPiece(piece, false, i, 7, scene); // Black pieces
    });
};
