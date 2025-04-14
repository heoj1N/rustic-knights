import { Scene, Vector3, MeshBuilder, Mesh } from '@babylonjs/core';

export function createRookMesh(scene: Scene, color: string): Mesh {
    // Create the base cylinder
    const base = MeshBuilder.CreateCylinder('rookBase', {
        height: 0.3,
        diameter: 0.8,
        tessellation: 32
    }, scene);

    // Create the body
    const body = MeshBuilder.CreateCylinder('rookBody', {
        height: 1.2,
        diameterTop: 0.5,
        diameterBottom: 0.6,
        tessellation: 32
    }, scene);
    body.position.y = 0.75;

    // Create the crown base
    const crownBase = MeshBuilder.CreateCylinder('rookCrownBase', {
        height: 0.2,
        diameter: 0.7,
        tessellation: 32
    }, scene);
    crownBase.position.y = 1.45;

    // Create the battlements (4 corners)
    const battlements: Mesh[] = [];
    const battlement = MeshBuilder.CreateBox('rookBattlement', {
        height: 0.4,
        width: 0.15,
        depth: 0.15
    }, scene);
    
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const clone = battlement.clone(`rookBattlement${i}`);
        clone.position = new Vector3(
            Math.cos(angle) * 0.25,
            1.75,
            Math.sin(angle) * 0.25
        );
        battlements.push(clone);
    }

    // Merge all meshes
    const merged = Mesh.MergeMeshes(
        [base, body, crownBase, ...battlements, battlement],
        true,
        true,
        undefined,
        false,
        true
    );

    if (merged) {
        merged.name = 'rook';
        // Apply material/color here when needed
    }

    return merged || base; // Fallback to base if merge fails
} 