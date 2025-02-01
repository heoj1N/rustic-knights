import * as BABYLON from '@babylonjs/core';
import { BOARD_SIZE, SQUARE_SIZE, BOARD_OFFSET, COLORS } from '../utils/constants';

export const createChessBoard = (scene: BABYLON.Scene): void => {

    // Create ground plane
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        { width: BOARD_SIZE + 4, height: BOARD_SIZE + 4 },
        scene
    );
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
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
            highlightMaterial.diffuseColor = (x + z) % 2 === 0 ? 
            COLORS.LIGHT_SQUARE.scale(1.3) : 
            COLORS.DARK_SQUARE.scale(1.3);
            highlightMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);

            square.material = defaultMaterial;
            square.actionManager = new BABYLON.ActionManager(scene);

            // Hover effects
            square.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPointerOverTrigger,
                    () => {
                        square.scaling = new BABYLON.Vector3(1, 1.1, 1);
                        square.material = 
                            square.material === defaultMaterial ? 
                            highlightMaterial : 
                            defaultMaterial;
                    }
                )
            );
            square.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPointerOutTrigger,
                    () => {
                        square.scaling = new BABYLON.Vector3(1, 1, 1);
                        square.material = 
                            square.material === defaultMaterial ? 
                            highlightMaterial : 
                            defaultMaterial;
                    }
                )
            );
        }
    }

    // Create label tiles
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
        material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gray color
        tile.material = material;

        // Create dynamic texture for text
        const texture = new BABYLON.DynamicTexture(
            `label_texture_${x}_${z}`,
            { width: 256, height: 256 },
            scene
        );

        // Cast the context to CanvasRenderingContext2D
        const textContext = texture.getContext() as CanvasRenderingContext2D;
        textContext.font = "bold 128px Arial";
        textContext.fillStyle = "white";
        textContext.textAlign = "center";
        textContext.textBaseline = "middle";
        textContext.fillText(text, 128, 128);
        texture.update();

        // Apply texture
        material.diffuseTexture = texture;

        // Rotate text for rank labels (numbers)
        if (!isFile) {
            tile.rotation.y = -Math.PI / 2;
        }
    };

    // Create corner tiles
    const createCornerTile = (x: number, z: number) => {
        const tile = BABYLON.MeshBuilder.CreateBox(
            `corner_${x}_${z}`,
            { width: SQUARE_SIZE, height: 0.1, depth: SQUARE_SIZE },
            scene
        );

        tile.position.x = x - BOARD_OFFSET + SQUARE_SIZE / 2;
        tile.position.z = z - BOARD_OFFSET + SQUARE_SIZE / 2;
        tile.position.y = 0;

        const material = new BABYLON.StandardMaterial(`corner_material_${x}_${z}`, scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Same gray as label tiles
        tile.material = material;
    };

    // Create the four corner tiles
    createCornerTile(-1, -1); // Bottom-left corner
    createCornerTile(-1, 8);  // Top-left corner
    createCornerTile(8, -1);  // Bottom-right corner
    createCornerTile(8, 8);   // Top-right corner

    // Create file labels (a-h)
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    files.forEach((file, index) => {
        // Bottom row
        createLabelTile(file, index, -1, true);
        // Top row
        createLabelTile(file, index, 8, true);
    });

    // Create rank labels (1-8)
    for (let rank = 0; rank < 8; rank++) {
        // Left column
        createLabelTile((8 - rank).toString(), -1, rank, false);
        // Right column
        createLabelTile((8 - rank).toString(), 8, rank, false);
    }


};

