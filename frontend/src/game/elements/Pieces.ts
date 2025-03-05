import * as BABYLON from '@babylonjs/core';
import { AbstractMesh, Scene } from '@babylonjs/core';

import { BOARD_OFFSET, COLORS, SQUARE_SIZE } from '../../utils/constants';
import { ChessPieceType, Position } from '../../types/chess';

import { Board } from './Board';

export let selectedPiece: BABYLON.Mesh | null = null;

interface PieceMeshOptions {
  height: number;
  diameter?: number;
  diameterTop?: number;
  diameterBottom?: number;
  width?: number;
  depth?: number;
}

export abstract class Piece {
  
  protected mesh: AbstractMesh;
  protected position: Position;
  protected isWhite: boolean;

  constructor(mesh: AbstractMesh, position: Position, isWhite: boolean) {
    this.mesh = mesh;
    this.position = position;
    this.isWhite = isWhite;
  }

  public abstract getValidMoves(board: Board): Position[];

  protected canMoveTo(targetPos: Position, board: Board): boolean {
    const targetSquare = board.getSquare(targetPos);
    if (!targetSquare) return false;

    const targetPiece = targetSquare.getPiece();
    return !targetPiece || targetPiece.isWhite !== this.isWhite;
  }

  public getMesh(): AbstractMesh {
    return this.mesh;
  }

  public getPosition(): Position {
    return this.position;
  }

  public setPosition(position: Position): void {
    this.position = position;
  }
}

export class Square {
  private piece: Piece | null = null;
  private mesh: AbstractMesh;
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
}

export const createPiece = (
  type: ChessPieceType,
  isWhite: boolean,
  x: number,
  z: number,
  scene: BABYLON.Scene
): BABYLON.Mesh => {
  let mesh: BABYLON.Mesh;
  const color = isWhite ? COLORS.WHITE : COLORS.BLACK;
  const material = new BABYLON.StandardMaterial(`${type}_material`, scene);
  material.diffuseColor = color;
  const options = getPieceMeshOptions(type);

  // Create highlight material
  const highlightMaterial = new BABYLON.StandardMaterial(`square_highlight_${x}_${z}`, scene);
  highlightMaterial.diffuseColor =
    (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE.scale(1.3) : COLORS.DARK_SQUARE.scale(1.3);
  highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);

  switch (type) {
    case 'pawn':
    case 'knight':
    case 'queen':
    case 'king':
      mesh = BABYLON.MeshBuilder.CreateCylinder(`${type}_${x}_${z}`, options, scene);
      setupPieceInteractions(mesh, material, highlightMaterial, scene);
      break;
    case 'rook':
      mesh = BABYLON.MeshBuilder.CreateBox(`${type}_${x}_${z}`, options, scene);
      setupPieceInteractions(mesh, material, highlightMaterial, scene);
      break;
    case 'bishop':
      mesh = BABYLON.MeshBuilder.CreateCylinder(
        `${type}_${x}_${z}`,
        {
          height: options.height,
          diameterTop: 0,
          diameterBottom: options.diameter || 0.3,
        },
        scene
      );
      setupPieceInteractions(mesh, material, highlightMaterial, scene);
      break;
    default:
      throw new Error(`Unknown piece type: ${type}`);
  }

  mesh.material = material;
  mesh.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
  mesh.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
  mesh.position.y = mesh.scaling.y / 2;

  return mesh;
};

export const getPieceMeshOptions = (type: ChessPieceType): PieceMeshOptions => {
  switch (type) {
    case 'pawn':
      return { height: 0.75, diameter: 0.3 };
    case 'rook':
      return { height: 0.8, width: 0.3, depth: 0.3 };
    case 'knight':
      return { height: 0.8, diameterTop: 0.2, diameterBottom: 0.3 };
    case 'bishop':
      return { height: 0.9, diameter: 0.3 };
    case 'queen':
      return { height: 1, diameterTop: 0.1, diameterBottom: 0.4 };
    case 'king':
      return { height: 1.2, diameterTop: 0.2, diameterBottom: 0.4 };
  }
};

export const createInitialPieces = (scene: BABYLON.Scene): void => {
  // Create pawns
  for (let i = 0; i < 8; i++) {
    createPiece('pawn', true, i, 1, scene); // White pawns
    createPiece('pawn', false, i, 6, scene); // Black pawns
  }
  // Create other pieces
  const pieceOrder: ChessPieceType[] = [
    'rook',
    'knight',
    'bishop',
    'queen',
    'king',
    'bishop',
    'knight',
    'rook',
  ];
  pieceOrder.forEach((piece, i) => {
    createPiece(piece, true, i, 0, scene); // White pieces
    createPiece(piece, false, i, 7, scene); // Black pieces
  });
};

const setupPieceInteractions = (
  mesh: BABYLON.Mesh,
  material: BABYLON.StandardMaterial,
  highlightMaterial: BABYLON.StandardMaterial,
  scene: BABYLON.Scene
) => {
  mesh.actionManager = new BABYLON.ActionManager(scene);

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (mesh !== selectedPiece) {
        mesh.scaling = new BABYLON.Vector3(1, 1.1, 1);
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      if (mesh !== selectedPiece) {
        mesh.scaling = new BABYLON.Vector3(1, 1, 1);
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      // Deselect current piece if exists
      if (selectedPiece) {
        selectedPiece.scaling = new BABYLON.Vector3(1, 1, 1);
        selectedPiece.material = material;
      }

      // If clicking the same piece, deselect it
      if (selectedPiece === mesh) {
        selectedPiece = null;
        return;
      }

      // Select new piece
      selectedPiece = mesh;
      mesh.scaling = new BABYLON.Vector3(1, 1.2, 1);
      mesh.material = highlightMaterial;
    })
  );
};
