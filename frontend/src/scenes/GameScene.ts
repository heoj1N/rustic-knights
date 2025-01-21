import * as BABYLON from '@babylonjs/core';
import { createChessBoard } from '../components/game/Board';
import { createInitialPieces } from '../components/game/Pieces';

export const createGameScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
    const scene = new BABYLON.Scene(engine);
    
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

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 10, 0),
        scene
    );
    light.intensity = 0.7;

    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);

    createChessBoard(scene);
    createInitialPieces(scene);

    return scene;
};
