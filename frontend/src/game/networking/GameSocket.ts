import { GameState, GameStateUpdate, Position } from './types';

export class GameSocket {
    private ws: WebSocket;
    private gameState: GameState;
    private onUpdateCallback: (state: GameState) => void;

    constructor(gameId: string, onUpdate: (state: GameState) => void) {
        this.ws = new WebSocket(`ws://localhost:5173/ws/game/${gameId}`);
        this.onUpdateCallback = onUpdate;
        this.gameState = {
            gameId,
            whitePlayer: '',
            blackPlayer: '',
            currentTurn: 'white',
            moves: [],
            status: 'waiting'
        };
        this.setupWebSocket();
    }

    private setupWebSocket() {
        this.ws.onmessage = (event) => {
            const update: GameStateUpdate = JSON.parse(event.data);
            this.handleGameStateUpdate(update);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            // Implement reconnection logic here
        };
    }

    private handleGameStateUpdate(update: GameStateUpdate) {
        switch (update.type) {
            case 'MOVE':
                this.handleMove(update.payload);
                break;
            case 'JOIN':
                this.handlePlayerJoin(update.payload);
                break;
            case 'GAME_OVER':
                this.handleGameOver(update.payload);
                break;
        }
    }

    public sendMove(from: Position, to: Position, piece: string) {
        this.ws.send(JSON.stringify({
            type: 'MOVE',
            payload: { from, to, piece }
        }));
    }

    private handleMove(moveData: any) {
        this.gameState.moves.push(moveData);
        this.gameState.currentTurn = this.gameState.currentTurn === 'white' ? 'black' : 'white';
        this.onUpdateCallback(this.gameState);
    }

    private handlePlayerJoin(playerData: any) {
        this.gameState.blackPlayer = playerData.playerId;
        this.gameState.status = 'active';
        this.onUpdateCallback(this.gameState);
    }

    private handleGameOver(gameOverData: any) {
        this.gameState.status = 'completed';
        this.onUpdateCallback(this.gameState);
    }
}