import * as BABYLON from '@babylonjs/core';
import { ChessGame } from './game/ChessGame';
import { createChessBoard } from './components/game/Board';

// Types
type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

interface PieceMeshOptions {
    height: number;
    diameter?: number;
    diameterTop?: number;
    diameterBottom?: number;
    width?: number;
    depth?: number;
}

// Constants
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const BOARD_SIZE = 8;
const SQUARE_SIZE = 1;
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2;

// Colors
const WHITE_COLOR = new BABYLON.Color3(0.9, 0.9, 0.9);
const BLACK_COLOR = new BABYLON.Color3(0.2, 0.2, 0.2);

const createScene = (): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        Math.PI / 2,
        Math.PI / 3,
        15,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 20;

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );

    createChessBoard(scene);
    createInitialPieces(scene);

    const chessGame = new ChessGame(scene);
    
    scene.onPointerDown = (evt, pickInfo) => {
        if (pickInfo) {
            chessGame.handlePointerDown(pickInfo);
        }
    };

    return scene;
};

const createInitialPieces = (scene: BABYLON.Scene): void => {
    // Create pawns
    for (let i = 0; i < BOARD_SIZE; i++) {
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

const createPiece = (
    type: PieceType,
    isWhite: boolean,
    x: number,
    z: number,
    scene: BABYLON.Scene
): BABYLON.Mesh => {
    let mesh: BABYLON.Mesh;
    const color = isWhite ? WHITE_COLOR : BLACK_COLOR;
    const material = new BABYLON.StandardMaterial(`${type}_material`, scene);
    material.diffuseColor = color;

    const options: PieceMeshOptions = getPieceMeshOptions(type);
    const colorName = isWhite ? 'white' : 'black';

    switch (type) {
        case 'pawn':
        case 'knight':
        case 'queen':
        case 'king':
            mesh = BABYLON.MeshBuilder.CreateCylinder(
                `piece_${type}_${colorName}_${x}_${z}`,
                options,
                scene
            );
            break;
        case 'rook':
            mesh = BABYLON.MeshBuilder.CreateBox(
                `piece_${type}_${colorName}_${x}_${z}`,
                options,
                scene
            );
            break;
        case 'bishop':
            // Use CreateCylinder as a cone, setting the top diameter to 0
            mesh = BABYLON.MeshBuilder.CreateCylinder(
                `piece_${type}_${colorName}_${x}_${z}`,
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

const getPieceMeshOptions = (type: PieceType): PieceMeshOptions => {
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

const engine = new BABYLON.Engine(canvas, true);
const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener('resize', () => {
    engine.resize();
}); 