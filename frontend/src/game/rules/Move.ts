import { Position } from '../../types/chess';
import { Square } from '../elements/Square';
import { Piece } from '../elements/Piece';

export class Move {
  
  private fromSquare: Square;
  private toSquare: Square;

  constructor(fromSquare: Square, toSquare: Square) {
    this.fromSquare = fromSquare;
    this.toSquare = toSquare;
  }
  
  public getFromSquare(): Square {
    return this.fromSquare;
  }

  public getToSquare(): Square {
    return this.toSquare;
  }

  public getFromPosition(): Position {
    return this.fromSquare.getPosition();
  }

  public getToPosition(): Position {
    return this.toSquare.getPosition();
  }

  public getPiece(): Piece | null {
    return this.fromSquare.getPiece();
  }

  public getCapturedPiece(): Piece | null {
    return this.toSquare.getPiece();
  }

  public isWhiteTurn(): boolean {
    const piece = this.getPiece();
    return piece ? piece.getColor() === 'white' : false;
  }

  public isCapture(): boolean {
    return this.getCapturedPiece() !== null;
  }

  public toString(): string {
    const piece = this.getPiece();
    if (!piece) return 'Invalid move';
    
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const pieceSymbol = piece.getType().charAt(0).toUpperCase();
    const captureSymbol = this.isCapture() ? 'x' : '';
    
    return `${pieceSymbol}${String.fromCharCode(97 + fromPos.x)}${fromPos.y + 1}${captureSymbol}${String.fromCharCode(97 + toPos.x)}${toPos.y + 1}`;
  }

  public isValid(): boolean {
    const piece = this.getPiece();
    if (!piece) return false;
    const pieceType = piece.getType();
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
    const piece = this.getPiece();
    if (!piece) return false;
    
    const isWhite = piece.getColor() === 'white';
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    const direction = isWhite ? 1 : -1;
    
    if (fromPos.x === toPos.x && toPos.y === fromPos.y + direction) {
      return !this.getCapturedPiece();
    }
    
    if (
      fromPos.x === toPos.x &&
      ((isWhite && fromPos.y === 1 && toPos.y === 3) || (!isWhite && fromPos.y === 6 && toPos.y === 4))
    ) {
      return !this.getCapturedPiece();
    }
    
    if (Math.abs(toPos.x - fromPos.x) === 1 && toPos.y === fromPos.y + direction) {
      const capturedPiece = this.getCapturedPiece();
      return !!capturedPiece && capturedPiece.getColor() !== piece.getColor();
    }
    
    return false;
  }

  private isValidRookMove(): boolean {
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    
    if (fromPos.x !== toPos.x && fromPos.y !== toPos.y) {
      return false;
    }
    
    return !this.isPathBlocked(fromPos, toPos) && this.canCaptureAt(toPos);
  }

  private isValidKnightMove(): boolean {
    const fromPos = this.getFromPosition();
    const toPos = this.getToPosition();
    
    const dx = Math.abs(toPos.x - fromPos.x);
    const dy = Math.abs(toPos.y - fromPos.y);
    
    return ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) && this.canCaptureAt(toPos);
  }

  private isValidBishopMove(): boolean {
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
    return this.isValidRookMove() || this.isValidBishopMove();
  }

  private isValidKingMove(): boolean {
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
    
    // Since we don't have access to the board, we can only check the destination
    // This is a limitation - path blocking will need to be checked by the Board class
    return false;
  }

  private canCaptureAt(pos: Position): boolean {
    const movingPiece = this.getPiece();
    if (!movingPiece) return false;
    
    const toPos = this.getToPosition();
    // Only check capture if the position is the destination square
    if (pos.x === toPos.x && pos.y === toPos.y) {
      const targetPiece = this.getCapturedPiece();
      return !targetPiece || targetPiece.getColor() !== movingPiece.getColor();
    }
    
    return true;
  }

  public isOnTurn(_turnNumber: number, _isWhiteMove: boolean): boolean {
    return this.isWhiteTurn() === _isWhiteMove;
  }

  public toNotation(turnNumber: number, isWhiteMove: boolean): string {
    return `${isWhiteMove ? `${turnNumber}. ` : ''}${this.toString()}`;
  }
}
