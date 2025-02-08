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
                console.log('pickedMesh:', this.selectedPiece);
                console.log('Selected piece:', this.selectedPiece.name);
            }
            return;
        }
        else if (this.isValidSquare(pickedMesh)  && this.selectedPiece) {
            console.log(
                'Is valid square:', 
                this.isValidSquare(pickedMesh), 
                'Selected piece:', 
                this.selectedPiece?.name
            );
            if (this.selectedPiece) {
                console.log('Moving piece:', this.selectedPiece.name);
                this.movePiece(this.selectedPiece, pickedMesh);
            }
        }
    }

    private movePiece(piece: AbstractMesh, targetSquare: AbstractMesh): MoveResult {
        const targetPos = this.getSquarePosition(targetSquare);
        console.log('targetPos:', targetPos);
        console.log('piece:', piece);

        if (this.isValidMove(piece, targetPos)) {
            const worldPos = targetSquare.getAbsolutePosition();
            console.log('worldPos:', worldPos);

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
        const pieces = this.scene.meshes.filter(mesh => mesh && this.isPiece(mesh));
        if (!pieces || pieces.length === 0) {
            console.warn('No chess pieces found in the scene');
            return;
        }

        pieces.forEach(piece => {
            const match = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
            if (!match) return;

            const [_, type, x, y] = match;
            const position = { x: parseInt(x), y: parseInt(y) };
            const color = parseInt(y) >= 6 ? 'white' : 'black';
            
            this.board.set(this.getBoardKey(position), {
                type: type as ChessPieceType,
                color: color,
                position
            });
        });
    }

    private isPiece(mesh: AbstractMesh): boolean {
        return mesh.name.match(/^(pawn|rook|knight|bishop|queen|king)_/) !== null;
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
        console.log('Here we are');
        const pieceMatch = piece.name.match(/^(pawn|rook|knight|bishop|queen|king)_(\d+)_(\d+)/);
        console.log('piece.name', piece.name);
        console.log('In isValidMove - pieceMatch:', pieceMatch);
        if (!pieceMatch) return false;

        const [_, type, x, y] = pieceMatch;
        const fromPos = { x: parseInt(x), y: parseInt(y) };
        const isWhite = parseInt(y) <= 1;

        return isValidMove({
            pieceType: type as ChessPieceType,
            isWhite,
            from: fromPos,
            to: targetPos,
            board: new Map([...this.board].map(([key, piece]) => [key, {
                type: piece.type,
                isWhite: piece.color === 'white'
            }]))
        });
    }
}