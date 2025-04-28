import { Scene, Vector3, MeshBuilder, Mesh } from '@babylonjs/core';

export function createPawnMesh(scene: Scene): Mesh {
    // Create the base
    const base = MeshBuilder.CreateCylinder('pawnBase', {
        height: 0.1,
        diameter: 0.3,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('pawnBody', {
        height: 0.25,
        diameterTop: 0.15,
        diameterBottom: 0.2,
        tessellation: 32
    }, scene);
    body.position.y = 0.175;

    // Create the head
    const head = MeshBuilder.CreateSphere('pawnHead', {
        diameter: 0.2,
        segments: 32
    }, scene);
    head.position.y = 0.4;
    head.scaling = new Vector3(1, 0.8, 1); // Slightly squash the sphere

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, head],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'pawn';
        // Apply material/color here when needed
    }

    return merged || base; // Fallback to base if merge fails
} 