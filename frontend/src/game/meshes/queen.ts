import { Scene, Vector3, MeshBuilder, Mesh } from '@babylonjs/core';

export function createQueenMesh(scene: Scene, color: string): Mesh {
    // Create the base
    const base = MeshBuilder.CreateCylinder('queenBase', {
        height: 0.1,
        diameter: 0.35,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('queenBody', {
        height: 0.4,
        diameterTop: 0.2,
        diameterBottom: 0.3,
        tessellation: 32
    }, scene);
    body.position.y = 0.25;

    // Create the neck
    const neck = MeshBuilder.CreateCylinder('queenNeck', {
        height: 0.15,
        diameter: 0.15,
        tessellation: 32
    }, scene);
    neck.position.y = 0.525;

    // Create the crown base
    const crownBase = MeshBuilder.CreateCylinder('queenCrownBase', {
        height: 0.08,
        diameter: 0.25,
        tessellation: 32
    }, scene);
    crownBase.position.y = 0.64;

    // Create crown points
    const crownPoints: Mesh[] = [];
    for (let i = 0; i < 8; i++) {
        const point = MeshBuilder.CreateCylinder(`queenCrownPoint${i}`, {
            height: 0.15,
            diameterTop: 0.02,
            diameterBottom: 0.06,
            tessellation: 16
        }, scene);

        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.1;
        point.position.x = Math.cos(angle) * radius;
        point.position.z = Math.sin(angle) * radius;
        point.position.y = 0.75;

        // Add small sphere on top of each point
        const sphere = MeshBuilder.CreateSphere(`queenCrownSphere${i}`, {
            diameter: 0.04,
            segments: 16
        }, scene);
        sphere.position.x = point.position.x;
        sphere.position.z = point.position.z;
        sphere.position.y = 0.85;

        crownPoints.push(point, sphere);
    }

    // Create central crown ornament
    const centralPoint = MeshBuilder.CreateCylinder('queenCentralPoint', {
        height: 0.2,
        diameterTop: 0.02,
        diameterBottom: 0.06,
        tessellation: 16
    }, scene);
    centralPoint.position.y = 0.78;

    const centralSphere = MeshBuilder.CreateSphere('queenCentralSphere', {
        diameter: 0.06,
        segments: 16
    }, scene);
    centralSphere.position.y = 0.9;

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, neck, crownBase, centralPoint, centralSphere, ...crownPoints],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'queen';
        // Apply material/color here when needed
    }

    return merged || base; // Fallback to base if merge fails
} 