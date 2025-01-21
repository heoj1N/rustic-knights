import { Scene, Mesh, Vector3, PickingInfo, AbstractMesh } from '@babylonjs/core';
import { ChessPiece, Position, MoveResult } from '../types/chess';

export class ChessGame {
    private selectedPiece: AbstractMesh | null = null;
    private board: Map<string, ChessPiece> = new Map();
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        this.initializeBoard();
    }

    private initializeBoard(): void {
        // Initialize standard chess piece positions
        // We'll expand this later with actual piece creation
    }

    public handlePointerDown(pickInfo: PickingInfo): void {
        if (pickInfo.hit && pickInfo.pickedMesh) {
            const pickedMesh = pickInfo.pickedMesh;
            
            if (this.isPiece(pickedMesh)) {
                this.selectPiece(pickedMesh);
            } else if (this.isValidSquare(pickedMesh) && this.selectedPiece) {
                this.movePiece(this.selectedPiece, pickedMesh);
            }
        }
    }

    private selectPiece(mesh: AbstractMesh): void {
        if (this.selectedPiece) {
            // Reset previous selection visual
            this.selectedPiece.scaling = new Vector3(1, 1, 1);
        }
        
        this.selectedPiece = mesh;
        // Visual feedback for selection
        mesh.scaling = new Vector3(1.2, 1.2, 1.2);
    }

    private movePiece(piece: AbstractMesh, targetSquare: AbstractMesh): MoveResult {
        const targetPos = this.getSquarePosition(targetSquare);
        if (this.isValidMove(piece, targetPos)) {
            const worldPos = targetSquare.getAbsolutePosition();
            piece.position = new Vector3(worldPos.x, piece.position.y, worldPos.z);
            this.selectedPiece = null;
            return { valid: true };
        }
        return { valid: false, message: 'Invalid move' };
    }

    private isPiece(mesh: AbstractMesh | null): boolean {
        return mesh?.name.includes('piece_') ?? false;
    }

    private isValidSquare(mesh: AbstractMesh | null): boolean {
        return mesh?.name.includes('square_') ?? false;
    }

    private getSquarePosition(square: AbstractMesh): Position {
        const [_, x, y] = square.name.split('_').map(Number);
        return { x, y };
    }

    private isValidMove(piece: AbstractMesh, targetPos: Position): boolean {
        // Implement chess rules here
        // For now, return true to allow any move
        return true;
    }
} 