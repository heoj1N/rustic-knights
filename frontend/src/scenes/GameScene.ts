import * as BABYLON from '@babylonjs/core';
import { createChessBoard, createExtendedGrid } from '../game/elements/Board';
import { createInitialPieces } from '../game/elements/Pieces';
import { ChessGame } from '../game/rules/ChessGame';

export const createGameScene = (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
): BABYLON.Scene => {
  
  const scene = new BABYLON.Scene(engine);
  setupCamera(scene, canvas);
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 10, 0), scene);
  light.intensity = 0.7;
  scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);

  // Enable inspector with explicit options
  // TODO make dev dependent?
  const fpsDisplay = document.createElement("div");
  fpsDisplay.id = "fps";
  fpsDisplay.style.position = "absolute";
  fpsDisplay.style.backgroundColor = "black";
  fpsDisplay.style.color = "white";
  fpsDisplay.style.padding = "6px";
  fpsDisplay.style.left = "0px";
  fpsDisplay.style.top = "0px";
  fpsDisplay.style.zIndex = "10";
  document.body.appendChild(fpsDisplay);

  // Update FPS counter
  engine.onEndFrameObservable.add(() => {
    fpsDisplay.innerHTML = engine.getFps().toFixed() + " fps";
  });

  // Rest of your scene setup...
  createChessBoard(scene);
  createExtendedGrid(scene);
  createInitialPieces(scene);

  const chessGame = new ChessGame(scene);

  scene.onPointerDown = (_evt, pickInfo) => {
    if (pickInfo) {
      chessGame.debugPickAction(pickInfo);
    }
  };

  return scene;
};

const setupCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement) => {
  const camera = new BABYLON.ArcRotateCamera(
    'Camera',
    Math.PI / 2, // Initial alpha - facing white's side
    Math.PI / 3, // beta
    12, // radius
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
  camera.lowerAlphaLimit = Math.PI; // 90 degrees left from initial
  camera.upperAlphaLimit = 2 * Math.PI; // 90 degrees right from initial

  return camera;
};
