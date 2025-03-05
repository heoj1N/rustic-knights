import * as BABYLON from '@babylonjs/core';
import { BOARD_SIZE, SQUARE_SIZE, BOARD_OFFSET, COLORS } from '../../utils/constants';
import { Scene } from '@babylonjs/core';
import { Square } from './Pieces';
import { Position } from '../../types/chess';

export class Board {
  private squares: Map<string, Square> = new Map();
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeBoard();
  }

  public getSquare(position: Position): Square | undefined {
    return this.squares.get(this.getSquareKey(position));
  }

  private getSquareKey(position: Position): string {
    return `${position.x},${position.y}`;
  }

  private initializeBoard(): void {
    // Initialize squares and pieces
  }
}

export const createChessBoard = (scene: BABYLON.Scene): void => {
  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 },
    scene
  );
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  ground.material = groundMaterial;
  ground.position.y = -0.1;

  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let z = 0; z < BOARD_SIZE; z++) {
      const square = BABYLON.MeshBuilder.CreateBox(
        `square_${x}_${z}`,
        { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
        scene
      );

      square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
      square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

      // Create default material
      const defaultMaterial = new BABYLON.StandardMaterial(`square_material_${x}_${z}`, scene);
      defaultMaterial.diffuseColor = (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE : COLORS.DARK_SQUARE;

      // Create highlight material
      const highlightMaterial = new BABYLON.StandardMaterial(`square_highlight_${x}_${z}`, scene);
      highlightMaterial.diffuseColor =
        (x + z) % 2 === 0 ? COLORS.LIGHT_SQUARE.scale(1.3) : COLORS.DARK_SQUARE.scale(1.3);
      highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
      square.material = defaultMaterial;
      square.actionManager = new BABYLON.ActionManager(scene);

      // Hover effects
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          square.scaling = new BABYLON.Vector3(1, 1.1, 1);
          square.material =
            square.material === defaultMaterial ? highlightMaterial : defaultMaterial;
        })
      );
      square.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          square.scaling = new BABYLON.Vector3(1, 1, 1);
          square.material =
            square.material === defaultMaterial ? highlightMaterial : defaultMaterial;
        })
      );
    }
  }

  const createLabelTile = (text: string, x: number, z: number, isFile: boolean) => {
    // Create tile
    const tile = BABYLON.MeshBuilder.CreateBox(
      `label_${x}_${z}`,
      { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
      scene
    );

    // Position tile
    tile.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
    tile.position.y = 0;

    // Create material
    const material = new BABYLON.StandardMaterial(`label_material_${x}_${z}`, scene);
    // material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gray color
    material.diffuseColor = new BABYLON.Color3(183/255, 65/255, 14/255); // Gray color
    tile.material = material;

    // Create dynamic texture for text
    const texture = new BABYLON.DynamicTexture(
      `label_texture_${x}_${z}`,
      { width: 256, height: 256 },
      scene
    );

    // Cast the context to CanvasRenderingContext2D
    const textContext = texture.getContext() as CanvasRenderingContext2D;
    textContext.font = 'bold 128px Arial';
    textContext.fillStyle = 'white';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.fillText(text, 128, 128);
    texture.update();

    // Apply texture
    material.diffuseTexture = texture;

    // Rotate text for rank labels (numbers)
    if (!isFile) {
      // Rank labels on left side face outward, right side face inward
      tile.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      // File labels (letters) rotation
      if (z < 0) {
        // Bottom row - rotate to face the bottom player
        tile.rotation.y = Math.PI / 2;
      } else {
        // Top row - rotate to face the top player
        tile.rotation.y = -Math.PI / 2;
      }
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  files.forEach((file, index) => {
    createLabelTile(file, index, -1, true);
    createLabelTile(file, index, 8, true);
  });

  for (let rank = 0; rank < 8; rank++) {
    createLabelTile((rank + 1).toString(), -1, rank, false);
    createLabelTile((rank + 1).toString(), 8, rank, false);
  }
};

export const createExtendedGrid = (scene: BABYLON.Scene): void => {
    // Create infinite ground plane first
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: 1000, height: 1000 },
        scene
    );
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;
    ground.position.y = -0.1;

    // Calculate the extent based on the chess board size
    const boardStart = -1; // First label tile position
    const boardEnd = 8;    // Last label tile position
    const extendedSize = 20; // How far we want to extend from the board edges

    // Create extended grid
    for (let x = boardStart - extendedSize; x < boardEnd + extendedSize; x++) {
        for (let z = boardStart - extendedSize; z < boardEnd + extendedSize; z++) {
            const isCornerTile = (x === -1 || x === 8) && (z === -1 || z === 8);
            const isInBoardArea = x >= boardStart && x <= boardEnd && z >= boardStart && z <= boardEnd;
            
            if (isInBoardArea && !isCornerTile) {
                continue;
            }

            const square = BABYLON.MeshBuilder.CreateBox(
                `extended_square_${x}_${z}`,
                { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
                scene
            );

            square.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
            square.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;

            const material = new BABYLON.StandardMaterial(`extended_square_material_${x}_${z}`, scene);
            material.diffuseColor = (x + z) % 2 === 0 ? COLORS.EXTENDED_LIGHT : COLORS.EXTENDED_DARK;
            square.material = material;
        }
    }
};


