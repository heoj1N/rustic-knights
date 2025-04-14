import * as BABYLON from '@babylonjs/core';

import { Board } from './Board';
import { setCurrentTurn } from './Piece';
import { ChessGame } from '../rules/ChessGame';
import { Position, SquareHighlightState } from '../../types/chess';

export interface GameState {
  currentTurn: 'white' | 'black';
  turnCount: number;
  timeElapsed: number;
  whiteScore: number;
  blackScore: number;
}

export type GameStateUpdateCallback = (gameState: GameState) => void;

export class GameScene {
  private scene: BABYLON.Scene;
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;
  private board!: Board;
  private chessGame: ChessGame;
  private selectedPiece: BABYLON.AbstractMesh | null = null;
  private onGameStateUpdate: GameStateUpdateCallback | null = null;
  private fpsElement: any = null;
  private moveMadeThisTurn: boolean = false;
  private gameState: GameState = {
    currentTurn: 'white',
    turnCount: 1,
    timeElapsed: 0,
    whiteScore: 0,
    blackScore: 0
  };

  constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    this.scene = this.createScene();
    this.board = new Board(this.scene);
    
    if (!this.scene.metadata) {
      this.scene.metadata = {};
    }
    this.scene.metadata.board = this.board;
    
    this.chessGame = new ChessGame(this.board);
    this.moveMadeThisTurn = false;
    this.setupEventHandlers();
    this.setupFPSDisplay();
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  public getFPSElement(): any {
    return this.fpsElement;
  }

  public setGameStateUpdateCallback(callback: GameStateUpdateCallback): void {
    this.onGameStateUpdate = callback;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  private updateGameState(partialState: Partial<GameState>): void {
    this.gameState = {
      ...this.gameState,
      ...partialState
    };
    
    if (this.onGameStateUpdate) {
      this.onGameStateUpdate(this.gameState);
    }
  }

  private createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(this.engine);
    this.setupCamera(scene);
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 10, 0), scene);
    light.intensity = 0.7;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);
    return scene;
  }

  private handlePieceSelection(mesh: BABYLON.AbstractMesh): void {
    console.log('handlePieceSelection', mesh);
    this.board.clearAllHighlights();
    
    // If a move was made and player is trying to select the same piece again
    if (this.moveMadeThisTurn && this.selectedPiece && mesh === this.selectedPiece) {
      console.log('Move already made this turn with this piece - ignoring selection');
      return;
    }
    
    if (this.selectedPiece) {
      console.log('Cancelling previous selection');
      this.cancelSelection();
    }
    
    const squarePos = this.board.getSquarePositionFromPieceMesh(mesh);
    const pieceColor = this.board.getPieceColorFromMesh(mesh);
    console.log(`Selected piece at ${squarePos?.x},${squarePos?.y} with color ${pieceColor}`);
    console.log(`Current turn: ${this.gameState.currentTurn}, moveMadeThisTurn: ${this.moveMadeThisTurn}`);

    if (!squarePos || !pieceColor || pieceColor !== this.gameState.currentTurn) {
      console.log('Invalid piece selection');
      return;
    }

    this.selectedPiece = mesh;
    
    // Only highlight valid moves if no move was made this turn yet
    if (!this.moveMadeThisTurn) {
      console.log('Highlighting valid moves for selected piece');
      this.board.highlightValidMovesFromPosition(squarePos);
    } else {
      console.log('Not highlighting moves - a move was already made this turn');
    }
  }

  private handleSquareSelection(mesh: BABYLON.AbstractMesh): void {
    console.log('handleSquareSelection', mesh);
    if (!this.selectedPiece) 
      return;

    const fromSquarePos = this.board.getSquarePosition(this.selectedPiece);
    const toSquarePos = this.board.getSquarePosition(mesh);
    
    if (!fromSquarePos || !toSquarePos) {
      console.error('Could not determine square positions');
      this.cancelSelection();
      return;
    }

    // Get the target square and check if it's a valid move
    const toSquare = this.board.getSquare(toSquarePos);
    if (!toSquare) {
      console.error('Could not find target square');
      this.cancelSelection();
      return;
    }

    // Check if this is a valid move square (either empty or capturable)
    const isValidMoveSquare = this.board.isValidMoveSquare(toSquarePos);
    const isEndangeredSquare = toSquare.getHighlightState() === SquareHighlightState.ENDANGERED;
    if (!isValidMoveSquare && !isEndangeredSquare) {
      console.log('Not a valid move target');
      this.cancelSelection();
      return;
    }

    const fromSquare = this.board.getSquare(fromSquarePos);
    let fromPiece = fromSquare?.getPiece();
    if (!fromPiece && this.selectedPiece) {
      const pieces = Array.from(this.board.getSquares().values())
        .map(square => square.getPiece())
        .filter(piece => piece !== null);
      console.log('Searching through all pieces on board:', pieces.length);
      fromPiece = pieces.find(piece => 
        piece?.getMesh().name === this.selectedPiece?.name
      ) || null;
      if (fromPiece) {
        console.log('Found piece by mesh name match:', fromPiece);
      }
    }

    if (!fromPiece || !toSquare) {
      console.error('Missing required piece or target square');
      this.cancelSelection();
      return;
    }

    const capturedPiece = toSquare.getPiece();
    this.board.clearAllHighlights();
    const result = this.chessGame.makeMove(fromPiece, toSquare);
    
    if (result.valid) {
      this.moveMadeThisTurn = true;
      console.log('Move made this turn: setting moveMadeThisTurn = true');
      
      if (capturedPiece) {
        this.board.removePiece(capturedPiece);
        
        if (capturedPiece.getColor() === 'white') {
          this.updateGameState({ 
            blackScore: this.gameState.blackScore + this.getPieceValue(capturedPiece.getType()) 
          });
        } else {
          this.updateGameState({ 
            whiteScore: this.gameState.whiteScore + this.getPieceValue(capturedPiece.getType()) 
          });
        }
      }
      
      // Update turn information
      const newTurn = this.chessGame.getCurrentTurn();
      const isNewTurn = newTurn !== this.gameState.currentTurn;
      
      this.updateGameState({
        currentTurn: newTurn,
        turnCount: isNewTurn && newTurn === 'white' ? this.gameState.turnCount + 1 : this.gameState.turnCount
      });
      
      // Reset moveMadeThisTurn flag when the turn changes
      if (isNewTurn) {
        this.moveMadeThisTurn = false;
        console.log('Turn changed: resetting moveMadeThisTurn = false');
        
        // Flip camera when turn changes
        this.flipCamera();
      }
      
      console.log('Game notation:', this.chessGame.getGameNotation());
      this.board.printBoardState();
      setCurrentTurn(this.chessGame.getCurrentTurn());
    } else {
      console.log('Invalid move:', result.message);
    }

    // After move completion, ensure all highlights are cleared
    this.board.clearAllHighlights();
    
    // Clear selected piece
    this.selectedPiece = null;
  }
  
  private getPieceValue(pieceType: string): number {
    switch (pieceType.toLowerCase()) {
      case 'pawn': return 1;
      case 'knight': return 3;
      case 'bishop': return 3;
      case 'rook': return 5;
      case 'queen': return 9;
      default: return 0;
    }
  }
  
  private cancelSelection(): void {
    console.log('Cancelling piece selection and clearing highlights');
    this.board.clearAllHighlights();
    this.selectedPiece = null;
    
    // Reset the moveMadeThisTurn flag when a piece is explicitly deselected
    // This allows players to select the same piece again and see valid moves
    this.moveMadeThisTurn = false;
    console.log('Piece deselected: resetting moveMadeThisTurn = false');
  }

  private setupEventHandlers(): void {
    this.scene.onPointerDown = (_evt, pickInfo) => {
      if (!pickInfo?.hit) {
        this.cancelSelection();
        return;
      }
      if (!pickInfo.pickedMesh) return;
      const pickedMesh = pickInfo.pickedMesh;
      console.log('Picked mesh:', pickedMesh.name);
      if (pickedMesh.name === 'ground' || pickedMesh.name.startsWith('extended_ground')) {
        this.cancelSelection();
        return;
      }
      if (this.board.isPiece(pickedMesh)) {
        this.handlePieceSelection(pickedMesh);
      } else {
        this.handleSquareSelection(pickedMesh);
      }
    };
    
    // Add keyboard event listener for testing
    document.addEventListener('keydown', (event) => {
      if (event.key === 't' || event.key === 'T') {
        console.log('Test key pressed - showing check and endangered highlighting');
        this.testCheckAndEndangeredHighlighting();
      }
    });
  }

  private setupCamera(scene: BABYLON.Scene): void {
    
    const whiteCamera = new BABYLON.ArcRotateCamera(
      'WhiteCamera', 
      Math.PI / 2, 
      Math.PI / 3, 
      12, 
      BABYLON.Vector3.Zero(), 
      scene
    );
    whiteCamera.setPosition(new BABYLON.Vector3(0, 8, -12));
    whiteCamera.lowerRadiusLimit = 8;
    whiteCamera.upperRadiusLimit = 20;
    whiteCamera.lowerBetaLimit = 0.1;
    whiteCamera.upperBetaLimit = Math.PI / 2.2;
    whiteCamera.lowerAlphaLimit = Math.PI;
    whiteCamera.upperAlphaLimit = 2 * Math.PI;
    
    
    const blackCamera = new BABYLON.ArcRotateCamera(
      'BlackCamera', 
      Math.PI / 2, 
      Math.PI / 3, 
      12, 
      BABYLON.Vector3.Zero(), 
      scene
    );
    blackCamera.setPosition(new BABYLON.Vector3(0, 8, 12));
    blackCamera.lowerRadiusLimit = 8;
    blackCamera.upperRadiusLimit = 20;
    blackCamera.lowerBetaLimit = 0.1;
    blackCamera.upperBetaLimit = Math.PI / 2.2;
    blackCamera.lowerAlphaLimit = 0;
    blackCamera.upperAlphaLimit = Math.PI;
    
    // Start with white camera active
    whiteCamera.attachControl(this.canvas, true);
    scene.activeCamera = whiteCamera;
    
    // Store cameras in scene metadata
    if (!scene.metadata) {
      scene.metadata = {};
    }
    scene.metadata.whiteCamera = whiteCamera;
    scene.metadata.blackCamera = blackCamera;
    scene.metadata.currentCamera = 'white';
  }

  private flipCamera(): void {
    if (!this.scene.metadata) {
      console.error('Scene metadata not found');
      return;
    }
    
    const whiteCamera = this.scene.metadata.whiteCamera as BABYLON.ArcRotateCamera;
    const blackCamera = this.scene.metadata.blackCamera as BABYLON.ArcRotateCamera;
    const currentCamera = this.scene.metadata.currentCamera;
    
    if (!whiteCamera || !blackCamera) {
      console.error('Camera not found in scene metadata');
      return;
    }
    
    // Detach current camera controls
    if (this.scene.activeCamera) {
      (this.scene.activeCamera as BABYLON.ArcRotateCamera).detachControl();
    }
    
    // Switch to the other camera
    if (currentCamera === 'white') {
      this.scene.activeCamera = blackCamera;
      blackCamera.attachControl(this.canvas, true);
      this.scene.metadata.currentCamera = 'black';
      console.log('Switched to black camera view');
    } else {
      this.scene.activeCamera = whiteCamera;
      whiteCamera.attachControl(this.canvas, true);
      this.scene.metadata.currentCamera = 'white';
      console.log('Switched to white camera view');
    }
  }

  private setupFPSDisplay(): void {
    const fpsDisplay = document.createElement('div');
    fpsDisplay.style.position = 'static';
    fpsDisplay.style.color = 'white';
    fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDisplay.style.padding = '0.5rem 1rem';
    fpsDisplay.style.borderRadius = '4px';
    fpsDisplay.style.fontFamily = 'monospace';
    fpsDisplay.style.fontWeight = 'bold';
    fpsDisplay.style.marginRight = '1rem';
    fpsDisplay.className = 'fps-counter';
    
    this.engine.onEndFrameObservable.add(() => {
      fpsDisplay.textContent = `FPS: ${this.engine.getFps().toFixed(0)}`;
    });
    
    this.fpsElement = fpsDisplay;
  }

  public testCheckAndEndangeredHighlighting(): void {
    console.log('Testing check and endangered highlighting');
    
    this.board.clearAllHighlights();
    const kingPosition: Position = { x: 4, y: 1 };
    const pawnPosition: Position = { x: 5, y: 1 };
    const kingSquare = this.board.getSquare(kingPosition);
    const pawnSquare = this.board.getSquare(pawnPosition);
    
    if (kingSquare && kingSquare.getPiece() && kingSquare.getPiece()!.getType() === 'king') {
      this.board.highlightKingInCheck(kingSquare.getPiece()!.getColor());
      console.log(`Highlighted king at ${kingPosition.x},${kingPosition.y} as in check`);
    } else {
      console.warn(`No king found at ${kingPosition.x},${kingPosition.y}`);
    }
    
    if (pawnSquare && pawnSquare.getPiece() && pawnSquare.getPiece()!.getType() === 'pawn') {
      this.board.highlightEndangeredPiece(pawnPosition);
      console.log(`Highlighted pawn at ${pawnPosition.x},${pawnPosition.y} as endangered`);
    } else {
      console.warn(`No pawn found at ${pawnPosition.x},${pawnPosition.y}`);
    }
  }

}

export const createGameScene = (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement,
  onGameStateUpdate?: GameStateUpdateCallback
): BABYLON.Scene => {
  const gameScene = new GameScene(engine, canvas);
  
  if (onGameStateUpdate) {
    gameScene.setGameStateUpdateCallback(onGameStateUpdate);
  }
  
  const scene = gameScene.getScene();
  
  // Add the gameScene instance to the scene's metadata so it can be accessed later
  if (!scene.metadata) {
    scene.metadata = {};
  }
  scene.metadata.gameSceneInstance = gameScene;
  
  return scene;
};
