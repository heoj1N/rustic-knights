import { Position } from '../../types/chess';
import { Square } from '../elements/Square';
import { Piece } from '../elements/Piece';
import { Board } from '../elements/Board';

export class Move {
  private from: Piece;
  private to: Piece | Square;
  private board: Board;

  constructor(from: Piece, to: Piece | Square, board: Board) {
    this.from = from;
    this.to = to;
    this.board = board;
  }
  
  // Getters

  public getFromPiece(): Piece {
    return this.from;
  }

  public getFromPosition(): Position {
    return this.from.getPosition();
  }

  public getToPiece(): Piece | Square {
    return this.to;
  }

  public getToPosition(): Position {
    return this.to.getPosition();
  }

  private getPieceType(): string {
    const piece = this.getFromPiece();
    if (!piece) return '';
    if ('getType' in piece && typeof piece.getType === 'function') {
      return piece.getType();
    }
    if ('getName' in piece && typeof piece.getName === 'function') {
      const match = piece.getName().match(/^(pawn|rook|knight|bishop|queen|king)_/);
      return match ? match[1] : '';
    }
    return '';
  }

  private getPieceColor(piece?: Piece): 'white' | 'black' {
    const pieceToCheck = piece || this.from;
    if (!pieceToCheck) return 'white';
    return pieceToCheck.getColor();
  }

  public getCapturedPiece(): Piece | null {
    const target = this.to as any;
    if (target instanceof Piece) {
      return target;
    }
    if (target && typeof target.getPiece === 'function') {
      return target.getPiece();
    }
    return null;
  }

  // Validation

  public isWhiteTurn(): boolean {
    if (!this.from) return false;
    if ('getColor' in this.from && typeof this.from.getColor === 'function') {
      return this.from.getColor() === 'white';
    }
    const match = this.from.getName().match(/^(?:pawn|rook|knight|bishop|queen|king)_\d+_(\d+)/);
    if (match) {
      const row = parseInt(match[1]);
      return row <= 1;
    }
    return false;
  }

  public isCapture(): boolean {
    return !!this.to;
  }

  private isSquare(obj: any): obj is Square {
    return obj && typeof obj.getPiece === 'function' && 'name' in obj;
  }

  public isOnTurn(_turnNumber: number, _isWhiteMove: boolean): boolean {
    return this.isWhiteTurn() === _isWhiteMove;
  }
  
  public isValid(): boolean {
    const piece = this.getFromPiece();
    if (!piece) return false;
    const pieceType = this.getPieceType();
    switch (pieceType) {
      case 'pawn':
        return this.isValidPawnMove();
      case 'rook':
        return this.isValidRookMove();
      case 'knight':
        return this.isValidKnightMove();
      case 'bishop':
        return this.isValidBishopMove();
      case 'queen':
        return this.isValidQueenMove();
      case 'king':
        return this.isValidKingMove();
      default:
        return false;
    }
  }

  private isValidPawnMove(): boolean {
    console.log('Validating pawn move...');
    const piece = this.getFromPiece();
    if (!piece) return false;
    const isWhite = this.getPieceColor(piece) === 'white';
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const direction = isWhite ? 1 : -1;
    
    // CASE 1: Forward move (one square)
    if (fromPos.x === toPos.x && toPos.y === fromPos.y + direction) {
      const targetPiece = this.getCapturedPiece();
      if (!targetPiece) return true;
      if (this.isSquare(targetPiece)) {
        return !(targetPiece as any).getPiece();
      }
      return false;
    }
    
    // CASE 2: Initial double move
    const isInitialPosition = (isWhite && fromPos.y === 1) || (!isWhite && fromPos.y === 6);
    if (fromPos.x === toPos.x && isInitialPosition && 
        toPos.y === fromPos.y + (2 * direction)) {  
      // First check if destination is empty
      const targetPiece = this.getCapturedPiece();
      if (targetPiece) {
        if (this.isSquare(targetPiece)) {
          const squarePiece = (targetPiece as any).getPiece();
          if (squarePiece) {
            return false;
          }
        } else {
          return false; // If target is directly a piece, invalid move
        }
      }
      // Then check the middle square - it must be empty
      const middleY = fromPos.y + direction;
      const middlePos = { x: fromPos.x, y: middleY };
      const middleSquare = this.board.getSquare(middlePos);
      if (!middleSquare) {
        return false;
      }
      const middlePiece = middleSquare.getPiece();
      if (middlePiece) {
        return false;
      }
      return true;
    }
    
    // CASE 3: Diagonal capture
    if (Math.abs(toPos.x - fromPos.x) === 1 && toPos.y === fromPos.y + direction) {
      const targetObject = this.getCapturedPiece();
      if (!targetObject) return false;
      // If targeting a Square
      if (this.isSquare(targetObject)) {
        const squarePiece = (targetObject as any).getPiece();
        if (!squarePiece) return false;
        return squarePiece.getColor() !== this.getPieceColor();
      }
      // If targeting a Piece directly 
      if (targetObject instanceof Piece) {
        return targetObject.getColor() !== this.getPieceColor();
      }
      return this.canCaptureAt(toPos);
    }

    return false;
  }

  private isValidRookMove(): boolean {
    console.log('Validating rook move...');
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    if (fromPos.x !== toPos.x && fromPos.y !== toPos.y) {
      return false;
    }
    return !this.isPathBlocked(fromPos, toPos) && this.canCaptureAt(toPos);
  }

  private isValidKnightMove(): boolean {
    console.log('Validating knight move...');
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const dx = Math.abs(toPos.x - fromPos.x);
    const dy = Math.abs(toPos.y - fromPos.y);
    return ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) && this.canCaptureAt(toPos);
  }

  private isValidBishopMove(): boolean {
    console.log('Validating bishop move...');
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const dx = Math.abs(toPos.x - fromPos.x);
    const dy = Math.abs(toPos.y - fromPos.y);
    if (dx !== dy) {
      return false;
    }
    
    return !this.isPathBlocked(fromPos, toPos) && this.canCaptureAt(toPos);
  }

  private isValidQueenMove(): boolean {
    console.log('Validating queen move...');
    return this.isValidRookMove() || this.isValidBishopMove();
  }

  private isValidKingMove(): boolean {
    console.log('Validating king move...');
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const dx = Math.abs(toPos.x - fromPos.x);
    const dy = Math.abs(toPos.y - fromPos.y);
    return dx <= 1 && dy <= 1 && this.canCaptureAt(toPos);
  }

  private isPathBlocked(from: Position, to: Position): boolean {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    if (dx === 0 && dy === 0) return false;
    let x = from.x + dx;
    let y = from.y + dy;

    while (x !== to.x || y !== to.y) {
      const position = { x, y };
      const square = this.board.getSquare(position);
      if (!square) {
        console.log(`Square at ${x},${y} does not exist`);
        return true;
      }
      const piece = square.getPiece();
      if (piece) {
        console.log(`Path blocked at ${x},${y} by piece:`, piece);
        return true;
      }
      x += dx;
      y += dy;
    }

    return false;
  }

  private canCaptureAt(pos: Position): boolean {
    const movingPiece = this.getFromPiece();
    if (!movingPiece) return false;
    const toPos = this.getToPosition();
    if (pos.x === toPos.x && pos.y === toPos.y) {
      const targetPiece = this.getCapturedPiece();
      if (!targetPiece) return true;
      if (this.isSquare(targetPiece)) {
        const squarePiece = (targetPiece as any).getPiece();
        if (!squarePiece) return true;
        return squarePiece.getColor() !== this.getPieceColor();
      }
      if (targetPiece instanceof Piece) {
        return targetPiece.getColor() !== this.getPieceColor();
      }
      return false;
    }
    return true;
  }

  // Notation

  public toNotation(turnNumber: number, isWhiteMove: boolean): string {
    return `${isWhiteMove ? `${turnNumber}. ` : ''}${this.toString()}`;
  }

  public toString(): string {
    const piece = this.getFromPiece();
    if (!piece) return 'Invalid move';
    const fromPos = this.from.getPosition();
    const toPos = this.to.getPosition();
    const pieceSymbol = this.getPieceType().charAt(0).toUpperCase();
    const captureSymbol = this.isCapture() ? 'x' : '';
    return `${pieceSymbol}${String.fromCharCode(97 + fromPos.x)}${fromPos.y + 1}${captureSymbol}${String.fromCharCode(97 + toPos.x)}${toPos.y + 1}`;
  }
}
