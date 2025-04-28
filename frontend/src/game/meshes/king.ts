import { Scene, MeshBuilder, Mesh } from '@babylonjs/core';

export function createKingMesh(scene: Scene): Mesh {
    // Create the base
    const base = MeshBuilder.CreateCylinder('kingBase', {
        height: 0.1,
        diameter: 0.4,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('kingBody', {
        height: 0.45,
        diameterTop: 0.25,
        diameterBottom: 0.35,
        tessellation: 32
    }, scene);
    body.position.y = 0.275;

    // Create the neck
    const neck = MeshBuilder.CreateCylinder('kingNeck', {
        height: 0.15,
        diameter: 0.18,
        tessellation: 32
    }, scene);
    neck.position.y = 0.575;

    // Create the crown base
    const crownBase = MeshBuilder.CreateCylinder('kingCrownBase', {
        height: 0.1,
        diameter: 0.3,
        tessellation: 32
    }, scene);
    crownBase.position.y = 0.7;

    // Create the cross
    const crossVertical = MeshBuilder.CreateBox('kingCrossVertical', {
        height: 0.25,
        width: 0.06,
        depth: 0.06
    }, scene);
    crossVertical.position.y = 0.925;

    const crossHorizontal = MeshBuilder.CreateBox('kingCrossHorizontal', {
        height: 0.06,
        width: 0.15,
        depth: 0.06
    }, scene);
    crossHorizontal.position.y = 0.85;

    // Create crown points
    const crownPoints: Mesh[] = [];
    for (let i = 0; i < 4; i++) {
        const point = MeshBuilder.CreateCylinder(`kingCrownPoint${i}`, {
            height: 0.15,
            diameterTop: 0.02,
            diameterBottom: 0.06,
            tessellation: 16
        }, scene);

        const angle = (i / 4) * Math.PI * 2;
        const radius = 0.12;
        point.position.x = Math.cos(angle) * radius;
        point.position.z = Math.sin(angle) * radius;
        point.position.y = 0.8;

        crownPoints.push(point);
    }

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, neck, crownBase, crossVertical, crossHorizontal, ...crownPoints],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'king';
        // Apply material/color here when needed
    }

    return merged || base; // Fallback to base if merge fails
} 