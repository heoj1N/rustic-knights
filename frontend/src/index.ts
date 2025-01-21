import * as BABYLON from '@babylonjs/core';
import { createGameScene } from './scenes/GameScene';

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
const LIGHT_SQUARE_COLOR = new BABYLON.Color3(0.8, 0.8, 0.7);
const DARK_SQUARE_COLOR = new BABYLON.Color3(0.4, 0.25, 0.15);

const createScene = (engine: BABYLON.Engine): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    
    // Camera setup
    const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        Math.PI / 2,
        Math.PI / 3,
        15,
        new BABYLON.Vector3(0, 0, 0),
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 20;

    // Lighting
    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 10, 0),
        scene
    );
    light.intensity = 0.7;

    // Create the chess board
    createChessBoard(scene);
    
    // We'll implement pieces later
    // createInitialPieces(scene);

    return scene;
};

const createChessBoard = (scene: BABYLON.Scene): void => {
    // Create ground plane
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 },
        scene
    );
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
    ground.position.y = -0.1;

    // Create chess board squares
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let z = 0; z < BOARD_SIZE; z++) {
            const square = BABYLON.MeshBuilder.CreateBox(
                `square_${x}_${z}`,
                { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
                scene
            );

            square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
            square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

            const material = new BABYLON.StandardMaterial(`square_material_${x}_${z}`, scene);
            material.diffuseColor = (x + z) % 2 === 0 ? LIGHT_SQUARE_COLOR : DARK_SQUARE_COLOR;
            square.material = material;
        }
    }
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

    switch (type) {
        case 'pawn':
        case 'knight':
        case 'queen':
        case 'king':
            mesh = BABYLON.MeshBuilder.CreateCylinder(
                `${type}_${x}_${z}`,
                options,
                scene
            );
            break;
        case 'rook':
            mesh = BABYLON.MeshBuilder.CreateBox(
                `${type}_${x}_${z}`,
                options,
                scene
            );
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

window.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        const engine = new BABYLON.Engine(canvas, true);
        const scene = createGameScene(engine, canvas);
        
        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener('resize', () => {
            engine.resize();
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
}); 