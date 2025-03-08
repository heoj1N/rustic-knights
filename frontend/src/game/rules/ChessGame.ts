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
  private turnCounter: number = 1;
  private board: Board;

  constructor(board: Board) {
    this.board = board;
    // Initialize game state
  }

  public getCurrentTurn(): 'white' | 'black' {
    return this.currentTurn;
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
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      this.moves.push(move);
      console.log('Move successful');
      return { valid: true };
    }
    console.log('Move execution failed');
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
    // TODO: Implement check detection logic
    return false;
  }
}

