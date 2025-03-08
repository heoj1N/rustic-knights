import * as BABYLON from '@babylonjs/core';
import { createChessBoard, createExtendedGrid, Board } from './Board';
import { createInitialPieces } from './Piece';
import { ChessGame } from '../rules/ChessGame';

export class GameScene {

  private scene: BABYLON.Scene;
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;
  private board!: Board;
  private chessGame: ChessGame;
  private selectedPiece: BABYLON.AbstractMesh | null = null;

  constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    this.scene = this.createScene();
    this.board = createChessBoard(this.scene);
    this.chessGame = new ChessGame(this.board);
    this.setupEventHandlers();
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  private createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(this.engine);
    this.setupCamera(scene);
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 10, 0), scene);
    light.intensity = 0.7;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);
    this.board = createChessBoard(scene);
    createExtendedGrid(scene);
    createInitialPieces(scene);
    this.setupFPSDisplay();
    return scene;
  }

  private setupEventHandlers(): void {
    this.scene.onPointerDown = (_evt, pickInfo) => {
      if (!pickInfo?.hit || !pickInfo.pickedMesh) return;
      const pickedMesh = pickInfo.pickedMesh;
      console.log('Picked mesh:', pickedMesh.name);
      if (this.board.isPiece(pickedMesh)) {
        this.handlePieceSelection(pickedMesh);
      } else {
        this.handleSquareSelection(pickedMesh);
      }
    };
  }

  private handlePieceSelection(mesh: BABYLON.AbstractMesh): void {
    if (!this.board.isPiece(mesh)) return;
    const pieceColor = this.board.getPieceColor(mesh);
    if (pieceColor === this.chessGame.getCurrentTurn()) {
      this.selectedPiece = mesh;
    }
  }

  private handleSquareSelection(mesh: BABYLON.AbstractMesh): void {
    if (!this.board.isSquare(mesh) || !this.selectedPiece) return;

    console.log('Selected piece mesh:', this.selectedPiece.name);
    const fromSquarePos = this.board.getSquarePosition(this.selectedPiece);
    const toSquarePos = this.board.getSquarePosition(mesh);
    console.log('From position:', fromSquarePos);
    console.log('To position:', toSquarePos);

    if (!fromSquarePos || !toSquarePos) {
      console.error('Could not determine square positions');
      return;
    }

    const fromSquare = this.board.getSquare(fromSquarePos);
    const toSquare = this.board.getSquare(toSquarePos);
    console.log('From square:', fromSquare);
    console.log('To square:', toSquare);

    // Try to get the piece from the board's internal state
    // Also try to fetch it by direct lookup if the normal way fails
    let fromPiece = fromSquare?.getPiece();
    
    // If we can't find the piece at the expected square, search for it
    if (!fromPiece && this.selectedPiece) {
      // Try getting the piece from the board based on the mesh name
      const pieces = Array.from(this.board.getSquares().values())
        .map(square => square.getPiece())
        .filter(piece => piece !== null);
      
      console.log('Searching through all pieces on board:', pieces.length);
      
      // Find any piece that matches our selected mesh
      fromPiece = pieces.find(piece => 
        piece?.getMesh().name === this.selectedPiece?.name
      ) || null;
      
      if (fromPiece) {
        console.log('Found piece by mesh name match:', fromPiece);
      }
    }
    
    const toPiece = toSquare?.getPiece();
    console.log('fromPiece:', fromPiece);
    console.log('toPiece:', toPiece);
    
    if (!fromPiece || !toSquare) {
      console.error('Missing required piece or target square');
      return;
    }
    
    const target = toPiece || toSquare;
    const result = this.chessGame.makeMove(fromPiece, target);

    if (result.valid) {
        this.selectedPiece.position.x = mesh.position.x;
        this.selectedPiece.position.z = mesh.position.z;
        const capturedPiece = toSquare.getPiece();
        if (capturedPiece) {
          const capturedMesh = this.scene.getMeshByName(
            `piece_${capturedPiece.getType()}_${capturedPiece.getColor()}_${toSquarePos.x},${toSquarePos.y}`
          );
          if (capturedMesh) {
            capturedMesh.dispose();
          }
        }
        console.log('Game notation:', this.chessGame.getGameNotation());
        this.board.printBoardState();
      } else {
        console.log('Invalid move:', result.message);
      }

    this.selectedPiece = null;
  }

  private setupCamera(scene: BABYLON.Scene): void {
    const camera = new BABYLON.ArcRotateCamera(
      'Camera', 
      Math.PI / 2, 
      Math.PI / 3, 
      12,
      BABYLON.Vector3.Zero(), 
      scene
    );
    camera.setPosition(new BABYLON.Vector3(0, 8, -12));
    camera.attachControl(this.canvas, true);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 20;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerAlphaLimit = Math.PI;
    camera.upperAlphaLimit = 2 * Math.PI;
  }

  private setupFPSDisplay(): void {
    const fpsDisplay = document.createElement('div');
    fpsDisplay.style.position = 'absolute';
    fpsDisplay.style.top = '10px';
    fpsDisplay.style.left = '10px';
    fpsDisplay.style.color = 'white';
    fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDisplay.style.padding = '5px';
    fpsDisplay.style.borderRadius = '3px';
    fpsDisplay.style.fontFamily = 'monospace';
    document.body.appendChild(fpsDisplay);
    this.engine.onEndFrameObservable.add(() => {
      fpsDisplay.textContent = `FPS: ${this.engine.getFps().toFixed(0)}`;
    });
  }
}

export const createGameScene = (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
): BABYLON.Scene => {
  const gameScene = new GameScene(engine, canvas);
  return gameScene.getScene();
};
