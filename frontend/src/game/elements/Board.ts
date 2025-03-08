import * as BABYLON from '@babylonjs/core';
import { Scene, AbstractMesh } from '@babylonjs/core';
import { Square } from './Square';
import { Position, ChessPieceType } from '../../types/chess';
import { BOARD_SIZE, SQUARE_SIZE, BOARD_OFFSET, COLORS } from '../../util/constants';
import { Piece, createPiece } from './Piece';

export class Board {
  
  private squares: Map<string, Square> = new Map();
  private scene: Scene;

  constructor(scene: Scene, squares: Map<string, Square>) {
    this.scene = scene;
    this.squares = squares;
    
    if (this.squares.size === 0) {
      this.initializeBoard(scene);
    } else {
      console.log('Using pre-initialized squares map with size:', this.squares.size);
      this.printBoardState();
    }
  }

  public initializeBoard(scene: Scene): void {
    const pieces = scene.meshes.filter((mesh) => mesh && this.isPiece(mesh));
    if (!pieces || pieces.length === 0) {
      console.warn('No chess pieces found in the scene');
      return;
    }

    pieces.forEach((piece) => {
      const match = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
      if (!match) return;
      const [_, type, x, y] = match;
      const position = { x: parseInt(x), y: parseInt(y) };
      const color = parseInt(y) <= 1 ? 'white' : 'black';
      const xNum = parseInt(x);
      const yNum = parseInt(y);
      const mesh = createPiece(type as ChessPieceType, color === 'white', xNum, yNum, this.scene);
      const square = this.squares.get(this.getSquareKey(position));
      if (square) {
        square.setPiece(new Piece(mesh, position, color === 'white', type as ChessPieceType));
      }
    });

    this.printBoardState();
    this.printPieceNames();
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
    console.log('Raw board data:');
    this.squares.forEach((square, key) => {
      const piece = square.getPiece();
      if (piece) {
        console.log(`${key}: ${piece.getType()} (${piece.getColor()})`);
      }
    });
    
    console.log('========================');
  }

  public isSquare(mesh: AbstractMesh): boolean {
    return mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_/) === null;
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
}

export const createChessBoard = (scene: BABYLON.Scene): Board => {
  // TODO: while iterating to create the board, we should also create the squares
  // and add them to the squares map
  const squares = new Map<string, Square>();

  // Add debug log to show initial squares state
  console.log('Creating chess board with initial squares map:', squares);

  const board = new Board(scene, squares);
  
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 },
    scene
  );
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  ground.material = groundMaterial;
  ground.position.y = -0.1;

  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let z = 0; z < BOARD_SIZE; z++) {
      const name = `square_${x}_${z}`;
      const square = BABYLON.MeshBuilder.CreateBox(
        name,
        { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
        scene
      );
      // Create a Square object and add it to the squares map
      const squareObj = new Square(square, name);
      const key = `${x},${z}`;
      squares.set(key, squareObj);
      
      // Rest of the existing code for square appearance...
      square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
      square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

      // Create default material
      const defaultMaterial = new BABYLON.StandardMaterial(`square_material_${x}_${z}`, scene);
      defaultMaterial.diffuseColor = (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE : COLORS.DARK_SQUARE;

      // Create highlight material
      const highlightMaterial = new BABYLON.StandardMaterial(`square_highlight_${x}_${z}`, scene);
      highlightMaterial.diffuseColor =
        (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE.scale(1.3) : COLORS.DARK_SQUARE.scale(1.3);
      highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
      square.material = defaultMaterial;
      square.actionManager = new BABYLON.ActionManager(scene);

      // Hover effects
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          square.scaling = new BABYLON.Vector3(1, 1.1, 1);
          square.material =
            square.material === defaultMaterial ? highlightMaterial : defaultMaterial;
        })
      );
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          square.scaling = new BABYLON.Vector3(1, 1, 1);
          square.material =
            square.material === defaultMaterial ? highlightMaterial : defaultMaterial;
        })
      );
    }
  }

  const createLabelTile = (text: string, x: number, z: number, isFile: boolean) => {
    // Create tile
    const tile = BABYLON.MeshBuilder.CreateBox(
      `label_${x}_${z}`,
      { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
      scene
    );

    // Position tile
    tile.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.y = 0;

    // Create material
    const material = new BABYLON.StandardMaterial(`label_material_${x}_${z}`, scene);
    // material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gray color
    material.diffuseColor = new BABYLON.Color3(183/255, 65/255, 14/255); // Gray color
    tile.material = material;

    // Create dynamic texture for text
    const texture = new BABYLON.DynamicTexture(
      `label_texture_${x}_${z}`,
      { width: 256, height: 256 },
      scene
    );

    // Cast the context to CanvasRenderingContext2D
    const textContext = texture.getContext() as CanvasRenderingContext2D;
    textContext.font = 'bold 128px Arial';
    textContext.fillStyle = 'white';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.fillText(text, 128, 128);
    texture.update();

    // Apply texture
    material.diffuseTexture = texture;

    // Rotate text for rank labels (numbers)
    if (!isFile) {
      // Rank labels on left side face outward, right side face inward
      tile.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      // File labels (letters) rotation
      if (z < 0) {
        // Bottom row - rotate to face the bottom player
        tile.rotation.y = Math.PI / 2;
      } else {
        // Top row - rotate to face the top player
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
        'ground',
        { width: 1000, height: 1000 },
        scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
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