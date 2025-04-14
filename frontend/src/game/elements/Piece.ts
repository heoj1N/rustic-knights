import * as BABYLON from '@babylonjs/core';
import { AbstractMesh } from '@babylonjs/core';
import { BOARD_OFFSET, COLORS, SQUARE_SIZE } from '../../util/constants';
import { ChessPieceType, Position } from '../../types/chess';
import { Board } from './Board';
import { Move } from '../rules/Move';

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
    
    mesh.metadata = {
      type: 'piece',
      piece: this
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
  
  // Variables for crown features - declared outside case blocks
  let crossMesh: BABYLON.Mesh;
  let crossbarMesh: BABYLON.Mesh;
  let crown: BABYLON.Mesh;
  
  // Create material for the piece
  const pieceMaterial = material || new BABYLON.StandardMaterial(`${type}_material`, scene);
  if (!material) {
    pieceMaterial.diffuseColor = color;
  }
  
  switch (type) {
    case 'pawn':
    case 'rook':
      mesh = BABYLON.MeshBuilder.CreateCylinder(
        `${type}_${x}_${z}`,
        options,
        scene
      );
      mesh.material = pieceMaterial;
      break;
    case 'king':
    case 'queen':
      // Create the base cylinder for king/queen
      mesh = BABYLON.MeshBuilder.CreateCylinder(
        `${type}_${x}_${z}`,
        options,
        scene
      );
      
      // Apply material to main piece
      mesh.material = pieceMaterial;
      
      // Add crown features based on piece type
      if (type === 'king') {
        // King has a cross-shaped crown
        crossMesh = BABYLON.MeshBuilder.CreateBox(
          `${type}_cross_${x}_${z}`,
          { width: 0.15, height: 0.3, depth: 0.15 },
          scene
        );
        
        // Position the cross on top of the cylinder
        crossMesh.position.y = options.height / 2 + 0.15;
        crossMesh.parent = mesh;
        crossMesh.material = pieceMaterial;
        
        // Add a horizontal bar for the cross
        crossbarMesh = BABYLON.MeshBuilder.CreateBox(
          `${type}_crossbar_${x}_${z}`,
          { width: 0.3, height: 0.1, depth: 0.15 },
          scene
        );
        crossbarMesh.position.y = options.height / 2 + 0.1;
        crossbarMesh.parent = mesh;
        crossbarMesh.material = pieceMaterial;
        
      } else {
        // Queen has a crown with points
        for (let i = 0; i < 5; i++) {
          crown = BABYLON.MeshBuilder.CreateCylinder(
            `${type}_crown_point_${i}_${x}_${z}`,
            { height: 0.25, diameterTop: 0.05, diameterBottom: 0.12 },
            scene
          );
          
          // Position the points in a circle on top of the queen
          const angle = (i / 5) * Math.PI * 2;
          const radius = 0.15;
          crown.position.x = Math.cos(angle) * radius;
          crown.position.z = Math.sin(angle) * radius;
          crown.position.y = options.height / 2 + 0.1;
          crown.parent = mesh;
          
          // Apply the same material as the main piece
          crown.material = pieceMaterial;
        }
      }
      break;
    case 'knight':
      mesh = BABYLON.MeshBuilder.CreateBox(
        `${type}_${x}_${z}`,
        { height: options.height, width: 0.5, depth: 0.5 },
        scene
      );
      mesh.material = pieceMaterial;
      break;
    case 'bishop':
      // Use correct cylinder with zero top diameter instead of cone
      mesh = BABYLON.MeshBuilder.CreateCylinder(
        `${type}_${x}_${z}`,
        { 
          height: options.height, 
          diameterTop: 0.1, 
          diameterBottom: options.diameterBottom as number 
        },
        scene
      );
      mesh.material = pieceMaterial;
      break;
    default:
      mesh = BABYLON.MeshBuilder.CreateCylinder(
        `${type}_${x}_${z}`,
        { height: 1, diameter: 0.5 },
        scene
      );
      mesh.material = pieceMaterial;
  }
  
  mesh.position.y = options.height / 2;
  mesh.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
  mesh.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
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
  
  mesh.metadata = {
    type: 'piece',
    pieceType: type,
    isWhite: isWhite,
    initialPosition: { x, z },
    defaultMaterial: material || new BABYLON.StandardMaterial(`${type}_material`, scene),
    friendlyHighlightMaterial: friendlyHighlightMaterial,
    opponentHighlightMaterial: opponentHighlightMaterial
  };
  
  // Setup piece interactions with the new highlight system
  setupPieceInteractions(mesh, material || new BABYLON.StandardMaterial(`${type}_material`, scene), friendlyHighlightMaterial, opponentHighlightMaterial, scene);
  
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
      return { height: 1, diameterTop: 0.35, diameterBottom: 0.5 };
    case 'king':
      return { height: 1.2, diameterTop: 0.4, diameterBottom: 0.6 };
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

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
      if (mesh !== selectedPiece) {
        mesh.scaling = new BABYLON.Vector3(1, 1.1, 1);
        const isOpponentPiece = checkIsOpponent(mesh);
        mesh.material = isOpponentPiece ? 
          opponentHighlightMaterial : friendlyHighlightMaterial;
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
      if (mesh !== selectedPiece) {
        mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        mesh.material = defaultMaterial;
      }
    })
  );

  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      // Deselect current piece if exists
      if (selectedPiece) {
        selectedPiece.scaling = new BABYLON.Vector3(1, 1, 1);
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
      mesh.scaling = new BABYLON.Vector3(1, 1.2, 1);
      mesh.material = friendlyHighlightMaterial;
    })
  );
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
