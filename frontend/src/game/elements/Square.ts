import { AbstractMesh } from '@babylonjs/core';
import { Piece } from './Piece';
import { Position } from '../../types/chess';

export class Square {

    private mesh: AbstractMesh;
    private piece: Piece | null = null;
    public position: Position;
  
    constructor(mesh: AbstractMesh, position: Position) {
      this.mesh = mesh;
      this.position = position;
    }
  
    public setPiece(piece: Piece | null): void {
      this.piece = piece;
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
        return this.position;
    }
}
