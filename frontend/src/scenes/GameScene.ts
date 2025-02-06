import * as BABYLON from '@babylonjs/core';
import { createChessBoard } from '../game/Board';
import { createInitialPieces } from '../game/Pieces';
import { ChessGame } from '../game/ChessGame';

export const createGameScene = (
    engine: BABYLON.Engine, 
    canvas: HTMLCanvasElement
): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    setupCamera(scene, canvas);
    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 10, 0),
        scene
    );
    light.intensity = 0.7;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);

    // Setup Chessboard
    createChessBoard(scene);
    createInitialPieces(scene);

    // Setup ChessGame
    const chessGame = new ChessGame(scene);

    // Handle Pointer Down
    scene.onPointerDown = (_evt, pickInfo) => {
        if (pickInfo) {
            chessGame.handlePointerDown(pickInfo);
        }
    };

    return scene;
};

const setupCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement) => {
    const camera = new BABYLON.ArcRotateCamera(
        "Camera",
        Math.PI / 2,  // Initial alpha - facing white's side
        Math.PI / 3,  // beta
        12,           // radius
        BABYLON.Vector3.Zero(),
        scene
    );

    // Set initial position
    camera.setPosition(new BABYLON.Vector3(0, 8, -12));
    camera.attachControl(canvas, true);
    
    // Set radius limits (zoom)
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 20;
    
    // Limit vertical rotation (beta)
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;
    
    // Limit horizontal rotation (alpha) to 90 degrees each side from initial position
    camera.lowerAlphaLimit = Math.PI;       // 90 degrees left from initial
    camera.upperAlphaLimit = 2*Math.PI;     // 90 degrees right from initial
    
    return camera;
};
