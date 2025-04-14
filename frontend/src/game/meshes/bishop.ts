import { Scene, Vector3, MeshBuilder, Mesh, Path3D } from '@babylonjs/core';

export function createBishopMesh(scene: Scene, color: string): Mesh {
    // Create the base cylinder
    const base = MeshBuilder.CreateCylinder('bishopBase', {
        height: 0.3,
        diameter: 0.8,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('bishopBody', {
        height: 1.0,
        diameterTop: 0.4,
        diameterBottom: 0.6,
        tessellation: 32
    }, scene);
    body.position.y = 0.65;

    // Create the neck
    const neck = MeshBuilder.CreateCylinder('bishopNeck', {
        height: 0.3,
        diameter: 0.3,
        tessellation: 32
    }, scene);
    neck.position.y = 1.3;

    // Create the mitre (head)
    const mitrePoints = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        // Create a curved shape for the mitre
        mitrePoints.push(new Vector3(
            0.2 * Math.sin(t * Math.PI), // X coordinate
            t * 0.8,                      // Y coordinate
            0                             // Z coordinate
        ));
    }

    const mitre = MeshBuilder.CreateLathe('bishopMitre', {
        shape: mitrePoints,
        radius: 1,
        tessellation: 32
    }, scene);
    mitre.position.y = 1.4;
    mitre.scaling = new Vector3(1, 1, 1);

    // Create the cross on top
    const crossVertical = MeshBuilder.CreateBox('bishopCrossVertical', {
        height: 0.4,
        width: 0.08,
        depth: 0.08
    }, scene);
    crossVertical.position.y = 2.3;

    const crossHorizontal = MeshBuilder.CreateBox('bishopCrossHorizontal', {
        height: 0.08,
        width: 0.25,
        depth: 0.08
    }, scene);
    crossHorizontal.position.y = 2.25;

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, neck, mitre, crossVertical, crossHorizontal],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'bishop';
        // Apply material/color here when needed
    }

    return merged || base; // Fallback to base if merge fails
} 