import { MoveResult } from '../../types/chess';
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

    if ('getColor' in from && typeof from.getColor === 'function') {
      if (this.isKingInCheck(from.getColor())) {
        console.log('Invalid move: King is in check');
        return { valid: false, message: 'Your king is in check' };
      }
    }

    const fromPos = from.getPosition();
    const toPos = to.getPosition();
    const moveSuccess = this.board.movePiece(fromPos, toPos);

    if (moveSuccess) {
      console.log('Move successful');
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      this.moves.push(move);
      this.board.clearHighlights();
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
    console.log('Todo: Checking if king is in check');
    return false;
  }
}