import * as BABYLON from '@babylonjs/core';
import { createChessBoard, createExtendedGrid} from './Board';
import { createInitialPieces } from './Piece';
import { ChessGame } from '../rules/ChessGame';

export const createGameScene = (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
): BABYLON.Scene => {
  
  const scene = new BABYLON.Scene(engine);
  setupCamera(scene, canvas);
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 10, 0), scene);
  light.intensity = 0.7;
  scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);

  setupFPSDisplay(engine);

  const board = createChessBoard(scene);
  createExtendedGrid(scene);
  createInitialPieces(scene);

  const chessGame = new ChessGame();
  let selectedPiece: BABYLON.AbstractMesh | null = null;
  //let selectedSquare: BABYLON.AbstractMesh | null = null;

  const handlePieceSelection = (mesh: BABYLON.AbstractMesh) => {
    if (!board.isPiece(mesh)) return;
    const pieceColor = board.getPieceColor(mesh);
    console.log('Is piece, color:', pieceColor, 'current turn:', chessGame.getCurrentTurn());
    if (pieceColor === chessGame.getCurrentTurn()) {
      selectedPiece = mesh;
      console.log(
        'Selected piece:', selectedPiece.name, 
        'color:', pieceColor, 
        'current turn:', chessGame.getCurrentTurn()
      );
    }
  };

  const handleSquareSelection = (mesh: BABYLON.AbstractMesh) => {
    if (!board.isSquare(mesh) || !selectedPiece) return;
    
    console.log('Moving piece:', selectedPiece.name, 'to square:', mesh.name);
    const fromPos = board.getSquarePosition(selectedPiece);
    const toPos = board.getSquarePosition(mesh);
    
    if (fromPos && toPos) {
      const fromSquare = board.getSquare(fromPos);
      const toSquare = board.getSquare(toPos);

      console.log('From square:', fromSquare);
      console.log('To square:', toSquare);
      
      if (fromSquare && toSquare) {
        const result = chessGame.makeMove(fromSquare, toSquare);
        if (result.valid) {
          // Update visual position
          selectedPiece.position.x = mesh.position.x;
          selectedPiece.position.z = mesh.position.z;
          
          // Handle captured piece if any
          const capturedPiece = toSquare.getPiece();
          if (capturedPiece) {
            const capturedMesh = scene.getMeshByName(
              `piece_${capturedPiece.getType()}_${capturedPiece.getColor()}_${toPos.x},${toPos.y}`
            );
            if (capturedMesh) {
              capturedMesh.dispose();
            }
          }
          
          // Print the current game notation
          console.log('Game notation:', chessGame.getGameNotation());
          
          // Print the board state for debugging
          board.printBoardState();
        } else {
          console.log('Invalid move:', result.message);
        }
      }
    }
    
    selectedPiece = null;
  };

  scene.onPointerDown = (_evt, pickInfo) => {
    if (!pickInfo?.hit || !pickInfo.pickedMesh) return;

    const pickedMesh = pickInfo.pickedMesh;
    console.log('Picked mesh:', pickedMesh.name);

    if (board.isPiece(pickedMesh)) {
      handlePieceSelection(pickedMesh);
    } else {
      handleSquareSelection(pickedMesh);
    }
  };

  return scene;
};

const setupFPSDisplay = (engine: BABYLON.Engine) => {
  const fpsDisplay = document.createElement('div');
  fpsDisplay.id = 'fps';
  fpsDisplay.style.position = 'absolute';
  fpsDisplay.style.backgroundColor = 'black';
  fpsDisplay.style.color = 'white';
  fpsDisplay.style.padding = '6px';
  fpsDisplay.style.left = '0px';
  fpsDisplay.style.top = '0px';
  fpsDisplay.style.zIndex = '10';
  document.body.appendChild(fpsDisplay);
  engine.onEndFrameObservable.add(() => {
    fpsDisplay.innerHTML = engine.getFps().toFixed() + ' fps';
  });
};

const setupCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement) => {
  const camera = new BABYLON.ArcRotateCamera(
    'Camera',
    Math.PI / 2,
    Math.PI / 3,
    12,
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

  // Limit horizontal rotation (alpha) to 90 degrees each side from initial
  camera.lowerAlphaLimit = Math.PI;
  camera.upperAlphaLimit = 2 * Math.PI;

  return camera;
};
