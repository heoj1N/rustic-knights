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
    
    // Valid move material - blend original color with teal highlight color
    const validMoveMaterial = new BABYLON.StandardMaterial(`valid_move_${this.name}`, this.scene);
    if (isLightSquare) {
      // For light squares, blend with teal but keep checkerboard pattern visible
      validMoveMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.5 + COLORS.VALID_MOVE_HIGHLIGHT.r * 0.5,
        baseColor.g * 0.3 + COLORS.VALID_MOVE_HIGHLIGHT.g * 0.7,
        baseColor.b * 0.3 + COLORS.VALID_MOVE_HIGHLIGHT.b * 0.7
      );
    } else {
      // For dark squares, brighten them and add teal
      validMoveMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.3 + COLORS.VALID_MOVE_HIGHLIGHT.r * 0.3, 
        baseColor.g * 0.3 + COLORS.VALID_MOVE_HIGHLIGHT.g * 0.7,
        baseColor.b * 0.3 + COLORS.VALID_MOVE_HIGHLIGHT.b * 0.7
      );
    }
    // Add slight emissive to make it "glow" subtly
    validMoveMaterial.emissiveColor = COLORS.VALID_MOVE_HIGHLIGHT.scale(0.3);
    this.materials.set(SquareHighlightState.VALID_MOVE, validMoveMaterial);
    
    // Last move material
    const lastMoveMaterial = new BABYLON.StandardMaterial(`last_move_${this.name}`, this.scene);
    lastMoveMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.9); // Blue
    this.materials.set(SquareHighlightState.LAST_MOVE, lastMoveMaterial);
    
    // Check material (purple for king in check)
    const checkMaterial = new BABYLON.StandardMaterial(`check_${this.name}`, this.scene);
    if (isLightSquare) {
      checkMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.3 + COLORS.CHECK_HIGHLIGHT.r * 0.7,
        baseColor.g * 0.3 + COLORS.CHECK_HIGHLIGHT.g * 0.7,
        baseColor.b * 0.3 + COLORS.CHECK_HIGHLIGHT.b * 0.7
      );
    } else {
      checkMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.2 + COLORS.CHECK_HIGHLIGHT.r * 0.6,
        baseColor.g * 0.2 + COLORS.CHECK_HIGHLIGHT.g * 0.6,
        baseColor.b * 0.2 + COLORS.CHECK_HIGHLIGHT.b * 0.6
      );
    }
    checkMaterial.emissiveColor = COLORS.CHECK_HIGHLIGHT.scale(0.3);
    this.materials.set(SquareHighlightState.CHECK, checkMaterial);
    
    // Endangered material (red for pieces that can be captured)
    const endangeredMaterial = new BABYLON.StandardMaterial(`endangered_${this.name}`, this.scene);
    if (isLightSquare) {
      endangeredMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.3 + COLORS.ENDANGERED_HIGHLIGHT.r * 0.7,
        baseColor.g * 0.5 + COLORS.ENDANGERED_HIGHLIGHT.g * 0.5,
        baseColor.b * 0.5 + COLORS.ENDANGERED_HIGHLIGHT.b * 0.5
      );
    } else {
      endangeredMaterial.diffuseColor = new BABYLON.Color3(
        baseColor.r * 0.2 + COLORS.ENDANGERED_HIGHLIGHT.r * 0.6,
        baseColor.g * 0.3 + COLORS.ENDANGERED_HIGHLIGHT.g * 0.3,
        baseColor.b * 0.3 + COLORS.ENDANGERED_HIGHLIGHT.b * 0.3
      );
    }
    endangeredMaterial.emissiveColor = COLORS.ENDANGERED_HIGHLIGHT.scale(0.3);
    this.materials.set(SquareHighlightState.ENDANGERED, endangeredMaterial);
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
    if (this.mesh && material) {
      this.mesh.material = material;
    } else if (this.mesh && this.defaultMaterial && state === SquareHighlightState.DEFAULT) {
      this.mesh.material = this.defaultMaterial;
    }
  }
  
  public resetHighlight(): void {
    this.currentState = SquareHighlightState.DEFAULT;
    if (this.mesh && this.defaultMaterial) {
      // Ensure we use a clone of the default material to avoid reference issues
      const defaultMaterial = this.defaultMaterial.clone(`default_${this.name}_clone`);
      this.mesh.material = defaultMaterial;
      // Extra safety to ensure proper material reset
      this.mesh.material.alpha = 1.0;
      
      // Only set emissiveColor on StandardMaterial
      if (this.mesh.material instanceof BABYLON.StandardMaterial) {
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
      }
    }
    // Reset scaling
    if (this.mesh) {
      this.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
    }
    
    // Log the reset for debugging
    console.log(`Reset highlight for square ${this.name}`);
  }
  
  public getHighlightState(): SquareHighlightState {
    return this.currentState;
  }
  
  public highlightAsValidMove(): void {
    this.setHighlightState(SquareHighlightState.VALID_MOVE);
    console.log(`Highlighting square ${this.name} as valid move`);
  }
  
  public highlightAsCheck(): void {
    this.setHighlightState(SquareHighlightState.CHECK);
    console.log(`Highlighting square ${this.name} as check (purple)`);
  }
  
  public highlightAsEndangered(): void {
    this.setHighlightState(SquareHighlightState.ENDANGERED);
    console.log(`Highlighting square ${this.name} as endangered (red)`);
  }
  
  public getDefaultMaterial(): BABYLON.StandardMaterial | null {
    return this.defaultMaterial;
  }
}
