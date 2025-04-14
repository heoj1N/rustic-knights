import * as BABYLON from '@babylonjs/core';
import { AbstractMesh } from '@babylonjs/core';
import { Piece } from './Piece';
import { Position, SquareHighlightState } from '../../types/chess';
import { COLORS, SQUARE_SIZE } from '../../util/constants';

export class Square {
  private mesh: AbstractMesh;
  public name: string;
  private piece: Piece | null = null;
  private defaultMaterial: BABYLON.StandardMaterial | null = null;
  private currentState: SquareHighlightState = SquareHighlightState.DEFAULT;
  private scene: BABYLON.Scene;
  private contourLines: BABYLON.LinesMesh[] = [];

  constructor(mesh: AbstractMesh, name: string) {
    this.mesh = mesh;
    this.name = name;
    this.scene = mesh.getScene();
    mesh.metadata = {
      type: 'square',
      square: this
    };
    this.defaultMaterial = mesh.material as BABYLON.StandardMaterial;
  }

  private createContourLines(color: BABYLON.Color3): void {
    // Clean up existing contour lines
    this.clearContours();

    if (!this.mesh) return;

    // Get the dimensions of the square
    const width = SQUARE_SIZE;
    const height = 0.3; // Square height
    const depth = SQUARE_SIZE;
    const x = this.mesh.position.x;
    const baseY = this.mesh.position.y;
    const z = this.mesh.position.z;

    // Define all corners of the cube
    const corners = [
      // Bottom corners
      new BABYLON.Vector3(x - width/2, baseY - height/2, z - depth/2), // Front left
      new BABYLON.Vector3(x + width/2, baseY - height/2, z - depth/2), // Front right
      new BABYLON.Vector3(x + width/2, baseY - height/2, z + depth/2), // Back right
      new BABYLON.Vector3(x - width/2, baseY - height/2, z + depth/2), // Back left
      // Top corners
      new BABYLON.Vector3(x - width/2, baseY + height/2, z - depth/2), // Front left
      new BABYLON.Vector3(x + width/2, baseY + height/2, z - depth/2), // Front right
      new BABYLON.Vector3(x + width/2, baseY + height/2, z + depth/2), // Back right
      new BABYLON.Vector3(x - width/2, baseY + height/2, z + depth/2)  // Back left
    ];

    // Define all edges of the cube
    const edges = [
      // Bottom square
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Top square
      [4, 5], [5, 6], [6, 7], [7, 4],
      // Vertical edges connecting top and bottom
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // Create lines for each edge
    edges.forEach((edge, index) => {
      const points = [
        corners[edge[0]],
        corners[edge[1]]
      ];
      
      const lines = BABYLON.MeshBuilder.CreateLines(
        `contour_${this.name}_${index}`,
        { points },
        this.scene
      );
      
      lines.color = color;
      lines.alpha = 1;
      lines.renderingGroupId = 1; // Ensure lines render on top
      
      this.contourLines.push(lines);
    });
  }

  private clearContours(): void {
    this.contourLines.forEach(line => line.dispose());
    this.contourLines = [];
  }

  public setHighlightState(state: SquareHighlightState): void {
    this.currentState = state;
    
    // Clear existing contours
    this.clearContours();
    
    // Apply new highlight based on state
    switch (state) {
      case SquareHighlightState.HOVER:
        this.createContourLines(COLORS.SELECTED_HIGHLIGHT.scale(0.7));
        break;
      case SquareHighlightState.SELECTED:
        this.createContourLines(COLORS.SELECTED_HIGHLIGHT);
        break;
      case SquareHighlightState.VALID_MOVE:
        this.createContourLines(COLORS.VALID_MOVE_HIGHLIGHT);
        break;
      case SquareHighlightState.ENDANGERED:
        this.createContourLines(COLORS.ENDANGERED_HIGHLIGHT);
        break;
      case SquareHighlightState.LAST_MOVE:
        this.createContourLines(new BABYLON.Color3(0.1, 0.6, 0.9)); // Blue
        break;
      case SquareHighlightState.CHECK:
        this.createContourLines(COLORS.CHECK_HIGHLIGHT);
        break;
      case SquareHighlightState.DEFAULT:
      default:
        // No contours for default state
        break;
    }
  }

  public resetHighlight(): void {
    this.clearContours();
    this.currentState = SquareHighlightState.DEFAULT;
    if (this.mesh && this.defaultMaterial) {
      this.mesh.material = this.defaultMaterial.clone(`default_${this.name}_clone`);
    }
  }

  public getHighlightState(): SquareHighlightState {
    return this.currentState;
  }

  public highlightAsValidMove(): void {
    this.setHighlightState(SquareHighlightState.VALID_MOVE);
  }

  public highlightAsCheck(): void {
    this.setHighlightState(SquareHighlightState.CHECK);
  }

  public highlightAsEndangered(): void {
    this.setHighlightState(SquareHighlightState.ENDANGERED);
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
