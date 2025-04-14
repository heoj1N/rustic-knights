import { Scene, Vector3, MeshBuilder, Mesh } from '@babylonjs/core';

export function createKnightMesh(scene: Scene, color: string): Mesh {
    // Create the base
    const base = MeshBuilder.CreateCylinder('knightBase', {
        height: 0.1,
        diameter: 0.35,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('knightBody', {
        height: 0.4,
        diameterTop: 0.2,
        diameterBottom: 0.3,
        tessellation: 32
    }, scene);
    body.position.y = 0.25;

    // Create the neck
    const neck = MeshBuilder.CreateCylinder('knightNeck', {
        height: 0.2,
        diameter: 0.18,
        tessellation: 32
    }, scene);
    neck.position.y = 0.55;
    neck.rotation.x = Math.PI * 0.15;

    // Create the horse head using boxes and cylinders
    const headBase = MeshBuilder.CreateBox('knightHeadBase', {
        height: 0.25,
        width: 0.2,
        depth: 0.35
    }, scene);
    headBase.position.y = 0.7;
    headBase.position.z = 0.1;
    headBase.rotation.x = Math.PI * 0.15;

    // Create the snout
    const snout = MeshBuilder.CreateBox('knightSnout', {
        height: 0.15,
        width: 0.15,
        depth: 0.25
    }, scene);
    snout.position.y = 0.7;
    snout.position.z = 0.3;
    snout.rotation.x = Math.PI * 0.1;

    // Create the ears (two triangular prisms)
    const ear1 = MeshBuilder.CreateCylinder('knightEar1', {
        height: 0.2,
        diameterTop: 0.01,
        diameterBottom: 0.08,
        tessellation: 3
    }, scene);
    ear1.position = new Vector3(0.08, 0.85, 0.1);
    ear1.rotation = new Vector3(Math.PI * 0.15, 0, Math.PI * 0.2);

    const ear2 = ear1.clone('knightEar2');
    ear2.position.x = -0.08;
    ear2.rotation.y = -Math.PI * 0.2;

    // Create the mane
    const mane = MeshBuilder.CreateCylinder('knightMane', {
        height: 0.3,
        diameter: 0.1,
        tessellation: 32
    }, scene);
    mane.position = new Vector3(-0.05, 0.7, 0);
    mane.rotation.x = Math.PI * 0.5;
    mane.scaling = new Vector3(1, 0.7, 1);

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, neck, headBase, snout, ear1, ear2, mane],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'knight';
        // Rotate black pieces 180 degrees to face the opposite direction
        if (color.toLowerCase() === 'black') {
            merged.rotation.y = Math.PI;
        }
    }

    return merged || base; // Fallback to base if merge fails
} 