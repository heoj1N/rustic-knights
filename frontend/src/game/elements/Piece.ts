import * as BABYLON from '@babylonjs/core';
import { AbstractMesh } from '@babylonjs/core';
import { BOARD_OFFSET, COLORS, SQUARE_SIZE } from '../../util/constants';
import { ChessPieceType, Position } from '../../types/chess';
import { Board } from './Board';
import { Move } from '../rules/Move';
import { createCustomMesh } from '../meshes';

export let selectedPiece: BABYLON.Mesh | null = null;

interface PieceMeshOptions {
  height: number;
  diameter?: number;
  diameterTop?: number;
  diameterBottom?: number;
  width?: number;
  depth?: number;
}

export class Piece {
  
  protected mesh: AbstractMesh;
  protected position: Position;
  protected isWhite: boolean;
  protected type: ChessPieceType;
  protected color: 'white' | 'black';

  constructor(mesh: AbstractMesh, position: Position, isWhite: boolean, type: ChessPieceType) {
    this.mesh = mesh;
    this.position = position;
    this.isWhite = isWhite;
    this.type = type;
    this.color = isWhite ? 'white' : 'black';
    
    // Update mesh metadata to include piece reference and preserve existing metadata
    mesh.metadata = {
      ...mesh.metadata,
      type: 'piece',
      piece: this,
      pieceType: type,
      isWhite: isWhite,
      position: position
    };
  }

  public getMesh(): AbstractMesh {
    return this.mesh;
  }

  public getName(): string {
    return this.mesh.name;
  }

  public isWhitePiece(): boolean {
    return this.isWhite;
  }

  public getValidMoves(board: Board): Position[] {
    const validMoves: Position[] = [];
    for (const [_, square] of board.getSquares()) {
      const toPosition = square.getPosition();
      const move = new Move(this, square, board);
      if (move.isValid()) {
        validMoves.push(toPosition);
      }
    }
    return validMoves;
  }

  protected canMoveTo(targetPos: Position, board: Board): boolean {
    const targetSquare = board.getSquare(targetPos);
    if (!targetSquare) return false;
    
    return targetSquare.canBeOccupiedBy(this);
  }

  public getPosition(): Position {
    return this.position;
  }

  public getType(): ChessPieceType {
    return this.type;
  }

  public setPosition(position: Position): void {
    this.position = position;
  }

  public getColor(): 'white' | 'black' {
    return this.color;
  }
}

export const createPiece = (
  type: ChessPieceType,
  isWhite: boolean,
  x: number,
  z: number,
  scene: BABYLON.Scene,
  material?: BABYLON.StandardMaterial
): BABYLON.Mesh => {
  
  let mesh: BABYLON.Mesh;
  const color = isWhite ? COLORS.WHITE : COLORS.BLACK;
  const options = getPieceMeshOptions(type);
  
  // Create material for the piece if not provided
  const pieceMaterial = material || new BABYLON.StandardMaterial(`${type}_material`, scene);
  if (!material) {
    pieceMaterial.diffuseColor = color;
  }
  
  // Try to create custom mesh first
  const customMesh = createCustomMesh(type, scene, isWhite ? 'white' : 'black', { x, y: z });
  if (customMesh) {
    mesh = customMesh;
  } else {
    // Fallback to basic shapes for other pieces
    switch (type) {
      case 'pawn':
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          `${type}_${x}_${z}`,
          { height: options.height, diameter: 0.3 },
          scene
        );
        break;
      case 'queen': {
        // Create the base cylinder for queen
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          `${type}_${x}_${z}`,
          options,
          scene
        );
        
        // Add crown features
        for (let i = 0; i < 5; i++) {
          const crown = BABYLON.MeshBuilder.CreateCylinder(
            `${type}_crown_point_${i}_${x}_${z}`,
            { height: 0.25, diameterTop: 0.05, diameterBottom: 0.12 },
            scene
          );
          
          const angle = (i / 5) * Math.PI * 2;
          const radius = 0.15;
          crown.position.x = Math.cos(angle) * radius;
          crown.position.z = Math.sin(angle) * radius;
          crown.position.y = options.height / 2 + 0.1;
          crown.parent = mesh;
          crown.material = pieceMaterial;
        }
        break;
      }
      case 'king': {
        // Create the base cylinder for king
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          `${type}_${x}_${z}`,
          options,
          scene
        );
        
        // Add cross
        const crossVertical = BABYLON.MeshBuilder.CreateBox(
          `${type}_cross_${x}_${z}`,
          { width: 0.15, height: 0.3, depth: 0.15 },
          scene
        );
        crossVertical.position.y = options.height / 2 + 0.15;
        crossVertical.parent = mesh;
        
        const crossHorizontal = BABYLON.MeshBuilder.CreateBox(
          `${type}_crossbar_${x}_${z}`,
          { width: 0.3, height: 0.1, depth: 0.15 },
          scene
        );
        crossHorizontal.position.y = options.height / 2 + 0.1;
        crossHorizontal.parent = mesh;
        
        crossVertical.material = pieceMaterial;
        crossHorizontal.material = pieceMaterial;
        break;
      }
      default:
        mesh = BABYLON.MeshBuilder.CreateCylinder(
          `${type}_${x}_${z}`,
          { height: 1, diameter: 0.5 },
          scene
        );
    }
  }

  mesh.material = pieceMaterial;
  
  // Position the piece - ensure it's grounded by setting Y to height of square
  mesh.position.y = 0.3;  // Place on top of square (square height is 0.3)
  mesh.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
  mesh.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

  // Setup highlight materials
  const friendlyHighlightMaterial = new BABYLON.StandardMaterial(
    `${type}_friendly_highlight_${x}_${z}`,
    scene
  );
  friendlyHighlightMaterial.diffuseColor = new BABYLON.Color3(0, 0.502, 0.502);
  friendlyHighlightMaterial.specularColor = new BABYLON.Color3(0.7, 1, 1);
  
  const opponentHighlightMaterial = new BABYLON.StandardMaterial(
    `${type}_opponent_highlight_${x}_${z}`,
    scene
  );
  opponentHighlightMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
  opponentHighlightMaterial.specularColor = new BABYLON.Color3(1, 0.6, 0.6);
  
  // Setup metadata
  mesh.metadata = {
    type: 'piece',
    pieceType: type,
    isWhite: isWhite,
    initialPosition: { x, z },
    defaultMaterial: pieceMaterial,
    friendlyHighlightMaterial: friendlyHighlightMaterial,
    opponentHighlightMaterial: opponentHighlightMaterial
  };
  
  // Setup piece interactions
  setupPieceInteractions(mesh, pieceMaterial, friendlyHighlightMaterial, opponentHighlightMaterial, scene);
  
  return mesh;
};

export const getPieceMeshOptions = (type: ChessPieceType): PieceMeshOptions => {
  switch (type) {
    case 'pawn':
      return { height: 0.8, diameter: 0.3 };
    case 'rook':
      return { height: 0.8, width: 0.3, depth: 0.3 };
    case 'knight':
      return { height: 0.8, width: 0.3, depth: 0.3 };
    case 'bishop':
      return { height: 0.8, diameter: 0.3 };
    case 'queen':
      return { height: 0.9, diameterTop: 0.3, diameterBottom: 0.4 };
    case 'king':
      return { height: 1.0, diameterTop: 0.35, diameterBottom: 0.45 };
  }
};

const setupPieceInteractions = (
  mesh: BABYLON.Mesh,
  defaultMaterial: BABYLON.StandardMaterial,
  friendlyHighlightMaterial: BABYLON.StandardMaterial,
  opponentHighlightMaterial: BABYLON.StandardMaterial,
  scene: BABYLON.Scene
) => {
  mesh.actionManager = new BABYLON.ActionManager(scene);
  
  // Store the original scale when the mesh is created
  const originalScale = mesh.scaling.clone();

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (mesh !== selectedPiece) {
        // Apply hover effect while preserving original scale ratios
        mesh.scaling = originalScale.scale(1.1);
        const isOpponentPiece = checkIsOpponent(mesh);
        mesh.material = isOpponentPiece ? 
          opponentHighlightMaterial : friendlyHighlightMaterial;
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      if (mesh !== selectedPiece) {
        // Restore original scale
        mesh.scaling = originalScale.clone();
        mesh.material = defaultMaterial;
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      // Deselect current piece if exists
      if (selectedPiece) {
        // Restore original scale of previously selected piece
        const prevSelectedOriginalScale = selectedPiece.metadata?.originalScale || new BABYLON.Vector3(1, 1, 1);
        selectedPiece.scaling = prevSelectedOriginalScale.clone();
        selectedPiece.material = defaultMaterial;
      }

      // If clicking the same piece, deselect it
      if (selectedPiece === mesh) {
        selectedPiece = null;
        // Clear highlights when deselecting a piece
        const scene = mesh.getScene();
        const board = scene.metadata?.board;
        if (board && typeof board.clearAllHighlights === 'function') {
          board.clearAllHighlights();
        }
        return;
      }

      // Select new piece
      selectedPiece = mesh;
      mesh.scaling = originalScale.scale(1.2);
      mesh.material = friendlyHighlightMaterial;
    })
  );

  // Store the original scale in the mesh's metadata for future reference
  mesh.metadata = {
    ...mesh.metadata,
    originalScale: originalScale.clone()
  };
};

let currentTurn: 'white' | 'black' = 'white'; // TODO: class ?

export const setCurrentTurn = (turn: 'white' | 'black'): void => {
  currentTurn = turn;
};

const checkIsOpponent = (mesh: BABYLON.AbstractMesh): boolean => {
  if (mesh.metadata && mesh.metadata.isWhite !== undefined) {
    return (currentTurn === 'white' && !mesh.metadata.isWhite) || 
           (currentTurn === 'black' && mesh.metadata.isWhite);
  }
  return false;
};
