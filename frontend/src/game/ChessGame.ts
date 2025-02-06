import { Scene, Vector3, PickingInfo, AbstractMesh } from '@babylonjs/core';
import { ChessPiece, Position, MoveResult, ChessPieceType } from '../types/chess';
import { isValidMove } from './rules/validation';

export class ChessGame {
    private selectedPiece: AbstractMesh | null = null; // where
    private board: Map<string, ChessPiece> = new Map();
    private scene: Scene;
    private currentTurn: 'white' | 'black' = 'white';

    constructor(scene: Scene) {
        this.scene = scene;
        this.initializeBoard();
    }

    public handlePointerDown(pickInfo: PickingInfo): void {
        if (!pickInfo.hit || !pickInfo.pickedMesh) return;
        
        const pickedMesh = pickInfo.pickedMesh;
        console.log('Picked mesh:', pickedMesh.name);
        
        if (this.isPiece(pickedMesh)) {
            console.log('Is piece, color:', this.getPieceColor(pickedMesh), 'current turn:', this.currentTurn);
            const pieceColor = this.getPieceColor(pickedMesh);
            if (pieceColor === this.currentTurn) {
                this.selectedPiece = pickedMesh;
                console.log('Selected piece:', this.selectedPiece.name);
            }
            return;
        }

        console.log('Is valid square:', this.isValidSquare(pickedMesh), 'Selected piece:', this.selectedPiece?.name);
        if (this.isValidSquare(pickedMesh) && this.selectedPiece) {
            console.log('Attempting to move piece');
            this.movePiece(this.selectedPiece, pickedMesh);
        }
    }

    private movePiece(piece: AbstractMesh, targetSquare: AbstractMesh): MoveResult {
        const targetPos = this.getSquarePosition(targetSquare);
        if (this.isValidMove(piece, targetPos)) {
            const worldPos = targetSquare.getAbsolutePosition();
            
            // Check if there's a piece to capture
            const targetKey = this.getBoardKey(targetPos);
            const capturedPiece = this.board.get(targetKey);
            if (capturedPiece) {
                const capturedMesh = this.scene.getMeshByName(
                    `piece_${capturedPiece.type}_${capturedPiece.color}_${targetKey}`
                );
                if (capturedMesh) {
                    capturedMesh.dispose();
                }
            }

            // Update piece position
            piece.position = new Vector3(worldPos.x, piece.position.y, worldPos.z);
            
            // Update board state
            const [_, type, color] = piece.name.match(/piece_(\w+)_(\w+)/)!;
            const fromPos = this.getSquarePosition(piece);
            this.board.delete(this.getBoardKey(fromPos));
            this.board.set(targetKey, {
                type: type as ChessPieceType,
                color: color as 'white' | 'black',
                position: targetPos
            });

            // Switch turns
            this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
            this.selectedPiece = null;
            
            return { valid: true };
        }
        return { valid: false, message: 'Invalid move' };
    }

    private initializeBoard(): void {
        // Initialize the board state based on the created pieces
        const pieces = this.scene.meshes.filter(mesh => this.isPiece(mesh));
        pieces.forEach(piece => {
            const [_, type, color] = piece.name.match(/piece_(\w+)_(\w+)/)!;
            const position = this.getSquarePosition(piece);
            this.board.set(this.getBoardKey(position), {
                type: type as ChessPieceType,
                color: color as 'white' | 'black',
                position
            });
        });
    }

    private isPiece(mesh: AbstractMesh): boolean {
        return mesh.name.startsWith('piece_');
    }

    private getPieceColor(piece: AbstractMesh): 'white' | 'black' {
        const match = piece.name.match(/piece_\w+_(\w+)/);
        return match ? match[1] as 'white' | 'black' : 'white';
    }

    private isValidSquare(mesh: AbstractMesh | null): boolean {
        return mesh?.name.includes('square_') ?? false;
    }

    private getSquarePosition(mesh: AbstractMesh): Position {
        const [_, x, y] = mesh.name.split('_').map(Number);
        return { x, y };
    }

    private getBoardKey(pos: Position): string {
        return `${pos.x},${pos.y}`;
    }

    private isValidMove(piece: AbstractMesh, targetPos: Position): boolean {    
        const pieceMatch = piece.name.match(/piece_(\w+)_(\w+)/);
        if (!pieceMatch) return false;

        const [_, type, color] = pieceMatch;
        const currentPos = this.getSquarePosition(piece);

        return isValidMove({
            pieceType: type as ChessPieceType,
            isWhite: color === 'white',
            from: currentPos,
            to: targetPos,
            board: new Map([...this.board].map(([key, piece]) => [key, {
                type: piece.type,
                isWhite: piece.color === 'white'
            }]))
        });
    }
}