import * as BABYLON from '@babylonjs/core';
import { AbstractMesh } from '@babylonjs/core';
import { Piece } from './Piece';
import { Position, SquareHighlightState } from '../../types/chess';
import { COLORS } from '../../util/constants';

export class Square {
  private mesh: AbstractMesh;
  public name: string;
  private piece: Piece | null = null;
  private materials: Map<SquareHighlightState, BABYLON.StandardMaterial> = new Map();
  private defaultMaterial: BABYLON.StandardMaterial | null = null;
  private currentState: SquareHighlightState = SquareHighlightState.DEFAULT; // Normalize state def?
  private scene: BABYLON.Scene;

  constructor(mesh: AbstractMesh, name: string) {
    this.mesh = mesh;
    this.name = name;
    this.scene = mesh.getScene();
    mesh.metadata = {
      type: 'square',
      square: this
    };
    this.defaultMaterial = mesh.material as BABYLON.StandardMaterial;
    this.initializeMaterials();
  }

  private initializeMaterials(): void {
    const position = this.getPosition();
    const isLightSquare = (position.x + position.y) % 2 === 0;
    const baseColor = isLightSquare ? COLORS.LIGHT_SQUARE : COLORS.DARK_SQUARE;
    
    // Default material (already created in Board class)
    this.materials.set(SquareHighlightState.DEFAULT, this.defaultMaterial as BABYLON.StandardMaterial);
    
    // Hover material (already created in Board class, but we'll recreate for consistency)
    const hoverMaterial = new BABYLON.StandardMaterial(`hover_${this.name}`, this.scene);
    hoverMaterial.diffuseColor = baseColor.scale(1.3);
    hoverMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
    this.materials.set(SquareHighlightState.HOVER, hoverMaterial);
    
    // Selected material
    const selectedMaterial = new BABYLON.StandardMaterial(`selected_${this.name}`, this.scene);
    selectedMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.2); // Gold/yellow color
    selectedMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
    this.materials.set(SquareHighlightState.SELECTED, selectedMaterial);
    
    // Valid move material
    const validMoveMaterial = new BABYLON.StandardMaterial(`valid_move_${this.name}`, this.scene);
    validMoveMaterial.diffuseColor = COLORS.VALID_MOVE_HIGHLIGHT;
    validMoveMaterial.alpha = 0.8; // Semi-transparent
    this.materials.set(SquareHighlightState.VALID_MOVE, validMoveMaterial);
    
    // Last move material
    const lastMoveMaterial = new BABYLON.StandardMaterial(`last_move_${this.name}`, this.scene);
    lastMoveMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.9); // Blue
    this.materials.set(SquareHighlightState.LAST_MOVE, lastMoveMaterial);
    
    // Check material
    const checkMaterial = new BABYLON.StandardMaterial(`check_${this.name}`, this.scene);
    checkMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1); // Red
    checkMaterial.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
    this.materials.set(SquareHighlightState.CHECK, checkMaterial);
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

  public setHighlightState(state: SquareHighlightState): void {
    this.currentState = state;
    const material = this.materials.get(state);
    if (material) {
      this.mesh.material = material;
    }
  }
  
  public resetHighlight(): void {
    this.currentState = SquareHighlightState.DEFAULT;
    if (this.defaultMaterial) {
      this.mesh.material = this.defaultMaterial;
    }
    this.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
  }
  
  public getHighlightState(): SquareHighlightState {
    return this.currentState;
  }
  
  public highlightAsValidMove(): void {
    this.setHighlightState(SquareHighlightState.VALID_MOVE);
  }
  
  public getDefaultMaterial(): BABYLON.StandardMaterial | null {
    return this.defaultMaterial;
  }
}
