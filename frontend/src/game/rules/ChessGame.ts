import { MoveResult } from '../../types/chess';
import { Move } from './Move';
import { Square } from '../elements/Square';
import { Player } from '../p2p/Player';

export class ChessGame {
  private moves: Move[] = [];
  private players: Player[] = [];
  private currentTurn: 'white' | 'black' = 'white';
  private turnCounter: number = 1;

  constructor() {
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

  public makeMove(fromSquare: Square, toSquare: Square): MoveResult {
    const move = new Move(fromSquare, toSquare);
    
    if (!move.getPiece()) {
      return { valid: false, message: 'No piece selected' };
    }

    if (move.isWhiteTurn() !== (this.currentTurn === 'white')) {
      return { valid: false, message: 'Wrong turn' };
    }

    if (!move.isValid()) {
      return { valid: false, message: 'Invalid move' };
    }

    this.moves.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    if (this.currentTurn === 'white') {
      this.turnCounter++;
    }

    return { valid: true };
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
}

