import { Scene, PickingInfo, AbstractMesh } from '@babylonjs/core';
import { ChessPiece, Position, MoveResult, ChessPieceType } from '../../types/chess';
import { isValidMove } from './validation';

interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
}

type BoardEntry = {
  piece: ChessPiece;
  position: Position;
  lastMoveTurn: number;
};

export class ChessGame {

  private board: Map<string, BoardEntry> = new Map();
  private scene: Scene;
  private turnCounter: number = 0;

  private players: Player[] = [];

  private currentTurn: 'white' | 'black' = 'white';
  private selectedPiece: AbstractMesh | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeBoard();
  }

  // Setup

  private initializeBoard(): void {
    const pieces = this.scene.meshes.filter((mesh) => mesh && this.isPiece(mesh));
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

      this.board.set(this.getBoardKey(position), {
        piece: {
          type: type as ChessPieceType,
          color: color,
          position,
        },
        position,
        lastMoveTurn: 0,
      });
    });

    this.printBoardState();
    this.printPieceNames();
  }

  // Gameplay

  public debugPickAction(pickInfo: PickingInfo): void {
    if (!pickInfo.hit || !pickInfo.pickedMesh) return;

    const pickedMesh = pickInfo.pickedMesh;
    console.log('Picked mesh:', pickedMesh.name);

    if (this.isPiece(pickedMesh)) {
      console.log(
        'Is piece, color:',
        this.getPieceColor(pickedMesh),
        'current turn:',
        this.currentTurn
      );
      const pieceColor = this.getPieceColor(pickedMesh);
      if (pieceColor === this.currentTurn) {
        this.selectedPiece = pickedMesh;
        console.log('pickedMesh:', this.selectedPiece);
        console.log('Selected piece:', this.selectedPiece.name);
      }
      return;
    } else if (this.isValidSquare(pickedMesh) && this.selectedPiece) {
      console.log(
        'Is valid square:',
        this.isValidSquare(pickedMesh),
        'Selected piece:',
        this.selectedPiece?.name
      );
      if (this.selectedPiece) {
        console.log('Moving piece:', this.selectedPiece.name);
        this.movePiece(this.selectedPiece, pickedMesh);
      }
    }
  }

  private movePiece(piece: AbstractMesh, targetSquare: AbstractMesh): MoveResult {
    
    const targetPos = this.getSquarePosition(targetSquare);
    console.log('Checking move:', piece.name, 'to', targetPos);

    if (this.checkMove(piece, targetPos)) {

      console.log('Moving piece:', piece.name);
      console.log('to target:', targetPos);

      const targetKey = this.getBoardKey(targetPos);
      console.log('targetKey:', targetKey);

      const capturedPiece = this.board.get(targetKey);
      console.log('capturedPiece:', capturedPiece);

      if (capturedPiece) {
        const capturedMesh = this.scene.getMeshByName(
          `piece_${capturedPiece.piece.type}_${capturedPiece.piece.color}_${targetKey}`
        );
        if (capturedMesh) {
          capturedMesh.dispose();
        }
      }

      const fromPos = this.getSquarePosition(piece);
      console.log('fromPos:', fromPos);
      const toPos = this.getSquarePosition(targetSquare);
      console.log('toPos:', toPos);
      
      this.board.delete(this.getBoardKey(fromPos));
      console.log('board:', this.board);
      const pieceData = {
        piece: {
          type: piece.name.split('_')[0] as ChessPieceType,
          color: this.getPieceColor(piece),
          position: toPos
        },
        position: toPos,
        lastMoveTurn: this.turnCounter,
      };

      this.board.set(this.getBoardKey(toPos), pieceData);
      
      piece.position.x = targetSquare.position.x;
      piece.position.z = targetSquare.position.z;
      
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      this.selectedPiece = null;

      this.printBoardState();
      this.printPieceNames();
      return { valid: true };
    }
    return { valid: false, message: 'Invalid move' };
  }

  private checkMove(piece: AbstractMesh, targetPos: Position): boolean {

    const pieceMatch = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
    if (!pieceMatch) return false;
    const [_, type, initial_x, initial_y] = pieceMatch;

    const pieceType = type as ChessPieceType;
    const pieceColor = this.getPieceColor(piece);
    
    // Search for the piece in the board state by type and color
    let boardEntry: BoardEntry | undefined;
    let fromPos: Position | null = null;
    
    // Find the piece in the board state
    for (const [key, entry] of this.board.entries()) {
      console.log('entry', entry);
      // if (entry.piece.type === pieceType && entry.piece.color === pieceColor) {
      //   boardEntry = entry;
      //   fromPos = entry.position;
        
      //   break;
      // }
    }
    
    if (!boardEntry || !fromPos) {
      console.warn(`Could not find ${pieceType} (${pieceColor}) in board state`);
      return false;
    }
    
    console.log('fromPos', fromPos);
    console.log('targetPos', targetPos);
    console.log('boardEntry.lastMoveTurn', boardEntry.lastMoveTurn);

    // Print detailed information for debugging
    this.printBoardState();
    // this.printPieceNames();

    return isValidMove({
      pieceType: pieceType,
      isWhite: pieceColor === 'white',
      from: fromPos,
      to: targetPos,
      board: new Map(
        [...this.board].map(([key, entry]) => [
          key,
          {
            type: entry.piece.type,
            isWhite: entry.piece.color === 'white',
          },
        ])
      ),
    });
  }

  // Helpers

  private isPiece(mesh: AbstractMesh): boolean {
    return mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_/) !== null;
  }

  private getPieceColor(piece: AbstractMesh): 'white' | 'black' {
    const match = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
    if (match) {
      console.log('match:', match);
      const [,,,y] = match;
      const row = parseInt(y);
      return row <= 1 ? 'white' : 'black';
    }
    const pos = this.getSquarePosition(piece);
    const pieceData = this.board.get(this.getBoardKey(pos));
    return pieceData?.piece.color || 'white';
  }

  private isValidSquare(mesh: AbstractMesh | null): boolean {
    return mesh?.name.includes('square_') ?? false;
  }

  private getSquarePosition(mesh: AbstractMesh): Position {
    const [_, x, y] = mesh.name.split('_').map(Number);
    return { x, y };
  }

  private getBoardKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  private printBoardState(): void {
    console.log('=== CURRENT BOARD STATE ===');
    
    // Create an 8x8 empty board representation
    const boardRepresentation = Array(8).fill(null).map(() => Array(8).fill('...'));
    
    // Fill in the pieces from the board map
    this.board.forEach((piece, key) => {
      const [x, y] = key.split(',').map(Number);
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        // Create a short representation of piece type and color
        const pieceSymbol = piece.piece.color === 'white' ? piece.piece.type.charAt(0).toUpperCase() : piece.piece.type.charAt(0).toLowerCase();
        boardRepresentation[y][x] = pieceSymbol;
      }
    });
    
    // Print the board representation
    console.log('  0 1 2 3 4 5 6 7');
    boardRepresentation.forEach((row, index) => {
      console.log(`${index} ${row.join(' ')}`);
    });
    
    // Print the raw board data
    console.log('Raw board data:');
    this.board.forEach((piece, key) => {
      console.log(`${key}: ${piece.piece.type} (${piece.piece.color})`);
    });
    
    console.log('========================');
  }

  private printPieceNames(): void {
    console.log('=== PIECE NAMES AND POSITIONS ===');
    
    // Get all piece meshes from the scene
    const pieceMeshes = this.scene.meshes.filter(mesh => this.isPiece(mesh));
    
    // Print each piece's name and current position
    pieceMeshes.forEach(mesh => {
      const pieceMatch = mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
      if (pieceMatch) {
        const [_, type, initialX, initialY] = pieceMatch;
        const initialPos = `${initialX},${initialY}`;
        const currentPos = `${Math.round(mesh.position.x)},${Math.round(mesh.position.z)}`;
        const color = this.getPieceColor(mesh);
        
        console.log(`${mesh.name}: initial(${initialPos}) current(${currentPos}) color(${color})`);
      }
    });
    
    console.log('================================');
  }

}