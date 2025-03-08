import { AbstractMesh } from '@babylonjs/core';
import { Piece } from './Piece';
import { Position } from '../../types/chess';

export class Square {

  private mesh: AbstractMesh;
  public name: string;
  private piece: Piece | null = null;

  constructor(mesh: AbstractMesh, name: string) {
    this.mesh = mesh;
    this.name = name;
    
    mesh.metadata = {
      type: 'square',
      square: this
    };
  }

  public getName(): string {
    return this.name;
  }

  public setPiece(piece: Piece | null): void {
    this.piece = piece;
    if (piece) {
      piece.setPosition(this.getPosition());
    }
  }
  
  public getPiece(): Piece | null {
    return this.piece;
  }
  
  public getMesh(): AbstractMesh {
    return this.mesh;
  }
  
  public isEmpty(): boolean {
    return this.piece === null;
  }
  
  public getPosition(): Position {
    const match = this.name.match(/^square_(\d+)_(\d+)/);
    if (!match) {
      throw new Error(`Invalid square name format: ${this.name}`);
    }
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2])
    };
  }
  
  public canBeOccupiedBy(piece: Piece): boolean {
    if (this.isEmpty()) return true;
    return this.piece!.getColor() !== piece.getColor();
  }
}
