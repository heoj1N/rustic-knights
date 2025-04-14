import { MoveResult, Position } from '../../types/chess';
import { Move } from './Move';
import { Player } from '../p2p/Player';
import { Board } from '../elements/Board';
import { Piece } from '../elements/Piece';
import { Square } from '../elements/Square';

export class ChessGame {
  private moves: Move[] = [];
  private players: Player[] = [];
  private currentTurn: 'white' | 'black' = 'white';
  private board: Board;

  constructor(board: Board) {
    this.board = board;

  }

  public getCurrentTurn(): 'white' | 'black' {
    return this.currentTurn;
  }

  public saveGameState(): void {
    this.board.saveGameState(this.currentTurn, this.moves);
  }

  public restoreGameState(): boolean {
    const restoredTurn = this.board.restoreGameState();
    if (restoredTurn !== null) {
      this.currentTurn = restoredTurn;
      return true;
    }
    return false;
  }

  public getMoves(): Move[] {
    return [...this.moves];
  }

  public getPlayers(): Player[] {
    return [...this.players];
  }

  public makeMove(from: Piece, to: Piece | Square): MoveResult {
    const move = new Move(from, to, this.board);

    if (!move.isValid()) {
      console.log('Invalid move: Move validation failed');
      return { valid: false, message: 'Invalid move' };
    }

    const fromPos = from.getPosition();
    const toPos = to.getPosition();
    const pieceColor = from.getColor();

    if (this.isKingInCheck(pieceColor)) {
      // Save current board state
      this.board.saveGameState(this.currentTurn);
      
      // Try the move
      const moveSuccess = this.board.movePiece(fromPos, toPos);
      if (!moveSuccess) {
        this.board.restoreGameState();
        return { valid: false, message: 'Move execution failed' };
      }
      
      // Check if the king is still in check after the move
      if (this.isKingInCheck(pieceColor)) {
        // If still in check, restore the board and reject the move
        this.board.restoreGameState();
        return { valid: false, message: 'King is still in check after this move' };
      }
      
      // Move resolves check - restore board and proceed with actual move
      this.board.restoreGameState();
    }
    
    // Clear ALL highlights before making the move
    this.board.clearAllHighlights();
    const moveSuccess = this.board.movePiece(fromPos, toPos);

    if (moveSuccess) {
      console.log('Move successful');
      
      // Switch turns
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      this.moves.push(move);
      
      const opponentColor = this.currentTurn;
      if (this.isKingInCheck(opponentColor)) {
        console.log(`${opponentColor} king is in check!`);
        this.board.highlightKingInCheck(opponentColor);
      }
      
      const endangeredPositions = this.board.findEndangeredPieces(this.currentTurn);
      if (endangeredPositions.length > 0) {
        endangeredPositions.forEach(pos => {
          this.board.highlightEndangeredPiece(pos);
        });
      }
      return { valid: true };
    }
    return { valid: false, message: 'Move execution failed' };
  }

  public getGameNotation(): string {
    return this.moves
      .map((move, index) => {
        const turnNumber = Math.floor(index / 2) + 1;
        const isWhiteMove = index % 2 === 0;
        return move.toNotation(turnNumber, isWhiteMove);
      })
      .join(' ');
  }

  private isKingInCheck(color: 'white' | 'black'): boolean {
    // Find the king of the specified color
    let kingPosition: Position | null = null;
    
    for (const [_, square] of this.board.getSquares()) {
      const piece = square.getPiece();
      if (piece && piece.getType() === 'king' && piece.getColor() === color) {
        kingPosition = piece.getPosition();
        break;
      }
    }
    
    if (!kingPosition) {
      console.error(`Could not find ${color} king on the board`);
      return false;
    }
    
    // Get all opponent pieces
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check if any opponent piece can capture the king
    for (const [_, square] of this.board.getSquares()) {
      const piece = square.getPiece();
      if (piece && piece.getColor() === opponentColor) {
        const validMoves = piece.getValidMoves(this.board);
        for (const movePos of validMoves) {
          if (movePos.x === kingPosition.x && movePos.y === kingPosition.y) {
            return true; // King is in check
          }
        }
      }
    }
    
    return false;
  }

}