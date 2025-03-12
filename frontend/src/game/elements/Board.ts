import * as BABYLON from '@babylonjs/core';
import { Scene, AbstractMesh } from '@babylonjs/core';

import { Square } from './Square';
import { Piece, createPiece } from './Piece';
import { Position, ChessPieceType, SquareHighlightState } from '../../types/chess';
import { BOARD_SIZE, SQUARE_SIZE, BOARD_OFFSET, COLORS } from '../../util/constants';


export class Board {
  private squares: Map<string, Square> = new Map();
  private scene: Scene;
  private piecesByType: Map<ChessPieceType, Map<string, Piece>> = new Map();
  private materials: Map<string, BABYLON.StandardMaterial> = new Map();
  private savedState: {
    pieces: { position: Position; type: ChessPieceType; isWhite: boolean; meshPosition: BABYLON.Vector3 }[];
    currentTurn: 'white' | 'black';
    moveHistory: any[];
  } | null = null;

  constructor(scene: Scene, squares?: Map<string, Square>) {
    this.scene = scene;
    this.squares = squares || new Map();
    
    if (this.squares.size === 0) {
      this.createVisualBoard();
      this.createInitialPieces();
    } else {
      console.log('Using pre-initialized squares map with size:', this.squares.size);
    }
  }

  private createVisualBoard(): void {
    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 },
      this.scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
    ground.position.y = -0.1;

    // Create board squares
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        const name = `square_${x}_${z}`;
        const square = BABYLON.MeshBuilder.CreateBox(
          name, 
          { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE }, 
          this.scene
        );
        const squareObj = new Square(square, name);
        const key = `${x},${z}`;
        this.squares.set(key, squareObj);
        square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
        square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
        const defaultMaterial = new BABYLON.StandardMaterial(`square_material_${x}_${z}`, this.scene);
        defaultMaterial.diffuseColor = (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE : COLORS.DARK_SQUARE;
        const highlightMaterial = new BABYLON.StandardMaterial(`square_highlight_${x}_${z}`, this.scene);
        highlightMaterial.diffuseColor =
          (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE.scale(1.3) : COLORS.DARK_SQUARE.scale(1.3);
        highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
        square.material = defaultMaterial;
        square.actionManager = new BABYLON.ActionManager(this.scene);
        square.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
            const squareObj = this.squares.get(`${x},${z}`);
            if (squareObj && squareObj.getHighlightState() === SquareHighlightState.DEFAULT) {
              square.scaling = new BABYLON.Vector3(1, 1.1, 1);
              square.material = highlightMaterial;
            }
          })
        );
        square.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
            const squareObj = this.squares.get(`${x},${z}`);
            if (squareObj && squareObj.getHighlightState() === SquareHighlightState.DEFAULT) {
              square.scaling = new BABYLON.Vector3(1, 1, 1);
              square.material = defaultMaterial;
            }
          })
        );
      }
    }
    // Rest
    this.createBoardLabels();
    this.createExtendedGrid();
  }
  
  private createBoardLabels(): void {
    const createLabelTile = (text: string, x: number, z: number, isFile: boolean) => {
      const tile = BABYLON.MeshBuilder.CreateBox(
        `label_${x}_${z}`,
        { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
        this.scene
      );
      tile.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
      tile.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
      tile.position.y = 0;
      
      const material = new BABYLON.StandardMaterial(`label_material_${x}_${z}`, this.scene);
      material.diffuseColor = new BABYLON.Color3(183/255, 65/255, 14/255); // Brown color
      tile.material = material;
      
      const texture = new BABYLON.DynamicTexture(
        `label_texture_${x}_${z}`,
        { width: 256, height: 256 },
        this.scene
      );

      const textContext = texture.getContext() as CanvasRenderingContext2D;
      textContext.font = 'bold 128px Arial';
      textContext.fillStyle = 'white';
      textContext.textAlign = 'center';
      textContext.textBaseline = 'middle';
      textContext.fillText(text, 128, 128);
      texture.update();

      material.diffuseTexture = texture;
      
      if (!isFile) {
        tile.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        if (z < 0) {
          tile.rotation.y = Math.PI / 2;
        } else {
          tile.rotation.y = -Math.PI / 2;
        }
      }
    };

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    files.forEach((file, index) => {
      createLabelTile(file, index, -1, true);
      createLabelTile(file, index, 8, true);
    });

    for (let rank = 0; rank < 8; rank++) {
      createLabelTile((rank + 1).toString(), -1, rank, false);
      createLabelTile((rank + 1).toString(), 8, rank, false);
    }
  }

  public getSquare(position: Position): Square | undefined {
    const key = this.getSquareKey(position);
    const square = this.squares.get(key);
    return square;
  }

  public getSquareKey(position: Position): string {
    return `${position.x},${position.y}`;
  }

  public getSquares(): Map<string, Square> {
    return this.squares;
  }

  public getSquarePosition(mesh: AbstractMesh): Position {
    let match;
    if (this.isPiece(mesh)) {
      match = mesh.name.match(/^(?:pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
      if (match) {
        const [, x, y] = match;
        console.log(`Found position from piece name: x=${x}, y=${y}`);
        return { x: Number(x), y: Number(y) };
      }
    } else if (mesh.name.startsWith('square_')) {
      match = mesh.name.match(/^square_(\d+)_(\d+)/);
      if (match) {
        const [, x, y] = match;
        return { x: Number(x), y: Number(y) };
      }
    }
    const parts = mesh.name.split('_').map(Number);
    return { x: parts[1] || 0, y: parts[2] || 0 };
  }

  public getPieceColor(piece: AbstractMesh): 'white' | 'black' {
    const match = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
    if (match) {
      console.log('match:', match);
      const [,,,y] = match;
      const row = parseInt(y);
      return row <= 1 ? 'white' : 'black';
    }
    const pos = this.getSquarePosition(piece);
    const pieceData = this.squares.get(this.getSquareKey(pos));
    return pieceData?.getPiece()?.getColor() || 'white';
  }

  public isPiece(mesh: AbstractMesh): boolean {
    return mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_/) !== null;
  }

  public printPieceNames(): void {
    console.log('=== PIECE NAMES AND POSITIONS ===');
    const pieceMeshes = this.scene.meshes.filter(mesh => this.isPiece(mesh));
    pieceMeshes.forEach(mesh => {
      const pieceMatch = mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
      if (pieceMatch) {
        const [_, _type, initialX, initialY] = pieceMatch;
        const initialPos = `${initialX},${initialY}`;
        const currentPos = `${Math.round(mesh.position.x)},${Math.round(mesh.position.z)}`;
        const color = this.getPieceColor(mesh);
        
        console.log(`${mesh.name}: initial(${initialPos}) current(${currentPos}) color(${color})`);
      }
    });
    console.log('================================');
  }

  public printBoardState(): void {
    console.log('=== CURRENT BOARD STATE ===');
    const boardRepresentation = Array(8).fill(null).map(() => Array(8).fill('...'));
    this.squares.forEach((square, key) => {
      const piece = square.getPiece();
      if (piece) {
        const [x, y] = key.split(',').map(Number);
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pieceSymbol = piece.getColor() === 'white' ? 
          piece.getType().charAt(0).toUpperCase() : piece.getType().charAt(0).toLowerCase();
          boardRepresentation[y][x] = pieceSymbol;
        }
      }
    });
    console.log('0 1 2 3 4 5 6 7');
    boardRepresentation.forEach((row, index) => {
      console.log(`${index} ${row.join(' ')}`);
    });
    console.log('========================');
  }

  public isSquare(mesh: AbstractMesh): boolean {
    return mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_/) === null && 
           mesh.name.startsWith('square_') &&
           !mesh.name.startsWith('extended_square_');
  }

  public movePiece(fromPos: Position, toPos: Position): boolean {
    const fromSquare = this.getSquare(fromPos);
    const toSquare = this.getSquare(toPos);
    if (!fromSquare || !toSquare) return false;
    const piece = fromSquare.getPiece();
    if (!piece) return false;
    const capturedPiece = toSquare.getPiece();
    if (capturedPiece) this.removePiece(capturedPiece);
    fromSquare.setPiece(null);
    toSquare.setPiece(piece);
    return true;
  }

  public removePiece(piece: Piece): void {
    // Remove the piece from the board
    // This might involve hiding the mesh or removing it from the scene
    const mesh = piece.getMesh();
    if (mesh) {
      mesh.setEnabled(false); // Hide the piece instead of destroying it
      // Or mesh.dispose(); // If you want to completely remove it
    }
  }

  public createInitialPieces(): void {
    console.log('Creating initial pieces');
    
    // Create shared materials for each piece type and color
    this.createPieceMaterials();
    
    // Define the initial board layout
    const initialLayout: [ChessPieceType, boolean, number, number][] = [
      // White pieces (back row and pawns)
      ['rook', true, 0, 0],
      ['knight', true, 1, 0],
      ['bishop', true, 2, 0],
      ['queen', true, 3, 0],
      ['king', true, 4, 0],
      ['bishop', true, 5, 0],
      ['knight', true, 6, 0],
      ['rook', true, 7, 0],
      
      // White pawns
      ...Array(8).fill(0).map((_, i) => ['pawn', true, i, 1] as [ChessPieceType, boolean, number, number]),
      
      // Black pieces (back row and pawns)
      ['rook', false, 0, 7],
      ['knight', false, 1, 7],
      ['bishop', false, 2, 7],
      ['queen', false, 3, 7],
      ['king', false, 4, 7],
      ['bishop', false, 5, 7],
      ['knight', false, 6, 7],
      ['rook', false, 7, 7],
      
      // Black pawns
      ...Array(8).fill(0).map((_, i) => ['pawn', false, i, 6] as [ChessPieceType, boolean, number, number])
    ];
    
    // Create all pieces and place them on their squares
    for (const [type, isWhite, x, y] of initialLayout) {
      const colorStr = isWhite ? 'white' : 'black';
      const materialKey = `${type}_${colorStr}`;
      const material = this.materials.get(materialKey);
      const mesh = createPiece(type, isWhite, x, y, this.scene, material);
      const position = { x, y };
      const square = this.getSquare(position);
      
      if (square) {
        const piece = new Piece(mesh, position, isWhite, type); // Create the piece object and place it on the square
        square.setPiece(piece);
        if (!this.piecesByType.has(type)) { // Store the piece for easy lookup
          this.piecesByType.set(type, new Map());
        }
        const pieceMap = this.piecesByType.get(type)!;
        pieceMap.set(`${x},${y}`, piece);
      } else {
        console.warn(`Square not found for position ${x},${y}`);
      }
    }
  }
  
  private createPieceMaterials(): void {
    const pieceTypes: ChessPieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    
    for (const type of pieceTypes) {
      // White pieces
      const whiteMaterial = new BABYLON.StandardMaterial(`${type}_white_material`, this.scene);
      whiteMaterial.diffuseColor = COLORS.WHITE;
      this.materials.set(`${type}_white`, whiteMaterial);
      
      // Black pieces
      const blackMaterial = new BABYLON.StandardMaterial(`${type}_black_material`, this.scene);
      blackMaterial.diffuseColor = COLORS.BLACK;
      this.materials.set(`${type}_black`, blackMaterial);
    }
  }

  public createExtendedGrid(): void {
    const ground = BABYLON.MeshBuilder.CreateGround(
      'extended_ground',
      { width: 1000, height: 1000 },
      this.scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('extendedGroundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
    ground.position.y = -0.1;

    // Calculate the extent based on the chess board size
    const boardStart = -1; // First label tile position
    const boardEnd = 8;    // Last label tile position
    const extendedSize = 20; // How far we want to extend from the board edges

    // Create extended grid
    for (let x = boardStart - extendedSize; x < boardEnd + extendedSize; x++) {
      for (let z = boardStart - extendedSize; z < boardEnd + extendedSize; z++) {
        const isCornerTile = (x === -1 || x === 8) && (z === -1 || z === 8);
        const isInBoardArea = x >= boardStart && x <= boardEnd && z >= boardStart && z <= boardEnd;
        
        if (isInBoardArea && !isCornerTile) {
          continue;
        }

        const square = BABYLON.MeshBuilder.CreateBox(
          `extended_square_${x}_${z}`,
          { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
          this.scene
        );

        square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
        square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

        const material = new BABYLON.StandardMaterial(`extended_square_material_${x}_${z}`, this.scene);
        material.diffuseColor = (x + z) % 2 === 0 ? COLORS.EXTENDED_LIGHT : COLORS.EXTENDED_DARK;
        square.material = material;
      }
    }
  }

  /**
   * Save the current board state when pausing the game
   */
  public saveGameState(currentTurn: 'white' | 'black', moveHistory: any[] = []): void {
    const pieces: { position: Position; type: ChessPieceType; isWhite: boolean; meshPosition: BABYLON.Vector3 }[] = [];
    
    // Collect all pieces and their current positions
    this.squares.forEach((square, key) => {
      const piece = square.getPiece();
      if (piece) {
        const mesh = piece.getMesh();
        pieces.push({
          position: piece.getPosition(),
          type: piece.getType(),
          isWhite: piece.isWhitePiece(),
          meshPosition: new BABYLON.Vector3(mesh.position.x, mesh.position.y, mesh.position.z)
        });
      }
    });
    
    // Save the current state
    this.savedState = {
      pieces,
      currentTurn,
      moveHistory: [...moveHistory]
    };
    
    console.log('Game state saved:', this.savedState);
  }

  public restoreGameState(): 'white' | 'black' | null {
    if (!this.savedState) {
      console.warn('No saved game state to restore');
      return null;
    }
    
    console.log('Restoring game state:', this.savedState);
    
    this.squares.forEach(square => {
      if (square.getPiece()) {
        square.setPiece(null);
      }
    });
    
    for (const pieceData of this.savedState.pieces) {
      const { position, type, isWhite, meshPosition } = pieceData;
      
      const square = this.getSquare(position);
      if (square) {
        const meshName = `${type}_${position.x}_${position.y}`;
        let mesh = this.scene.getMeshByName(meshName) as BABYLON.Mesh;
        
        if (!mesh) {
          mesh = createPiece(type, isWhite, position.x, position.y, this.scene);
        }
        
        // Restore mesh position
        mesh.position.x = meshPosition.x;
        mesh.position.y = meshPosition.y;
        mesh.position.z = meshPosition.z;
        
        // Create piece and assign to square
        const piece = new Piece(mesh, position, isWhite, type);
        square.setPiece(piece);
      }
    }
    
    return this.savedState.currentTurn;
  }

  public hasSavedState(): boolean {
    return this.savedState !== null;
  }

  public highlightValidMoves(piece: Piece): void {
    // Clear any existing highlights first
    this.clearHighlights();
    
    // Get valid moves for this piece
    const validMoves = piece.getValidMoves(this);
    console.log(`Found ${validMoves.length} valid moves for ${piece.getType()} at ${piece.getPosition().x},${piece.getPosition().y}`);
    
    // Highlight the selected piece's square
    const piecePos = piece.getPosition();
    const pieceSquare = this.getSquare(piecePos);
    if (pieceSquare) {
      pieceSquare.setHighlightState(SquareHighlightState.SELECTED);
    }
    
    // Highlight each valid move square
    validMoves.forEach(position => {
      const square = this.getSquare(position);
      if (square) {
        square.highlightAsValidMove();
      }
    });
  }
  
  public clearHighlights(): void {
    this.squares.forEach(square => {
      square.resetHighlight();
    });
  }
  
  public isValidMoveSquare(position: Position): boolean {
    const square = this.getSquare(position);
    return square ? 
      square.getHighlightState() === SquareHighlightState.VALID_MOVE : 
      false;
  }
}

export const createChessBoard = (scene: BABYLON.Scene): Board => {
  const squares = new Map<string, Square>();
  console.log(squares.size);
  console.log('Creating chess board with initial squares map:', squares);
  const board = new Board(scene, squares);
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground', { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 }, scene
  );
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  ground.material = groundMaterial;
  ground.position.y = -0.1;

  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let z = 0; z < BOARD_SIZE; z++) {
      const name = `square_${x}_${z}`;
      const square = BABYLON.MeshBuilder.CreateBox(name, { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE }, scene);
      const squareObj = new Square(square, name);
      const key = `${x},${z}`;
      squares.set(key, squareObj);
      square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
      square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
      const defaultMaterial = new BABYLON.StandardMaterial(`square_material_${x}_${z}`, scene);
      defaultMaterial.diffuseColor = (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE : COLORS.DARK_SQUARE;
      const highlightMaterial = new BABYLON.StandardMaterial(`square_highlight_${x}_${z}`, scene);
      highlightMaterial.diffuseColor =
        (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE.scale(1.3) : COLORS.DARK_SQUARE.scale(1.3);
      highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
      square.material = defaultMaterial;
      square.actionManager = new BABYLON.ActionManager(scene);
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          const squareObj = squares.get(`${x},${z}`);
          if (squareObj && squareObj.getHighlightState() === SquareHighlightState.DEFAULT) {
            square.scaling = new BABYLON.Vector3(1, 1.1, 1);
            square.material = highlightMaterial;
          }
        })
      );
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          const squareObj = squares.get(`${x},${z}`);
          if (squareObj && squareObj.getHighlightState() === SquareHighlightState.DEFAULT) {
            square.scaling = new BABYLON.Vector3(1, 1, 1);
            square.material = defaultMaterial;
          }
        })
      );
    }
  }

  const createLabelTile = (text: string, x: number, z: number, isFile: boolean) => {
    const tile = BABYLON.MeshBuilder.CreateBox(
      `label_${x}_${z}`,
      { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
      scene
    );
    tile.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.y = 0;
    const material = new BABYLON.StandardMaterial(`label_material_${x}_${z}`, scene);
    // material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gray color
    material.diffuseColor = new BABYLON.Color3(183/255, 65/255, 14/255); // Gray color
    tile.material = material;
    const texture = new BABYLON.DynamicTexture( // Create dynamic texture for text
      `label_texture_${x}_${z}`,
      { width: 256, height: 256 },
      scene
    );

    const textContext = texture.getContext() as CanvasRenderingContext2D;
    textContext.font = 'bold 128px Arial';
    textContext.fillStyle = 'white';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.fillText(text, 128, 128);
    texture.update();

    material.diffuseTexture = texture; // Apply texture
    if (!isFile) {
      tile.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      if (z < 0) {
        tile.rotation.y = Math.PI / 2;
      } else {
        tile.rotation.y = -Math.PI / 2;
      }
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  files.forEach((file, index) => {
    createLabelTile(file, index, -1, true);
    createLabelTile(file, index, 8, true);
  });

  for (let rank = 0; rank < 8; rank++) {
    createLabelTile((rank + 1).toString(), -1, rank, false);
    createLabelTile((rank + 1).toString(), 8, rank, false);
  }

  return board;
};

export const createExtendedGrid = (scene: BABYLON.Scene): void => {
    const ground = BABYLON.MeshBuilder.CreateGround(
        'ground', { width: 1000, height: 1000 }, scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
    ground.position.y = -0.1;

    const boardStart = -1;
    const boardEnd = 8;
    const extendedSize = 20;

    for (let x = boardStart - extendedSize; x < boardEnd + extendedSize; x++) {
        for (let z = boardStart - extendedSize; z < boardEnd + extendedSize; z++) {

            const isCornerTile = (x === -1 || x === 8) && (z === -1 || z === 8);
            const isInBoardArea = x >= boardStart && x <= boardEnd && z >= boardStart && z <= boardEnd;
            if (isInBoardArea && !isCornerTile) {
                continue;
            }

            const square = BABYLON.MeshBuilder.CreateBox(
                `extended_square_${x}_${z}`,
                { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
                scene
            );
            square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
            square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

            const material = new BABYLON.StandardMaterial(`extended_square_material_${x}_${z}`, scene);
            material.diffuseColor = (x + z) % 2 === 0 ? COLORS.EXTENDED_LIGHT : COLORS.EXTENDED_DARK;
            square.material = material;
        }
    }
};

/*This function is now just a wrapper that delegates to the Board class*/
export const createInitialPieces = (scene: BABYLON.Scene): void => {
  const tempBoard = new Board(scene); // We create a temporary board just to use its createInitialPieces method
  tempBoard.createInitialPieces();
};

