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

    // Create chess board squares
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

            // Click effect
            // square.actionManager.registerAction(
            //     new BABYLON.ExecuteCodeAction(
            //         BABYLON.ActionManager.OnPickTrigger,
            //         () => {
            //             square.material = 
            //                 square.material === defaultMaterial ? 
            //                 highlightMaterial : 
            //                 defaultMaterial;
            //         }
            //     )
            // );



        }
    }
};