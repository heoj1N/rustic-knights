import { 
  GameState, 
  GameStateData, 
  MoveResultData, 
  GameOverData,
  ServerMessage,
  Position 
} from '../../types/types';

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
      status: 'waiting',
    };
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage;
      
      switch (message.type) {
        case 'game_state':
          this.handleGameState(message.data as GameStateData);
          break;
        case 'move_result':
          this.handleMoveResult(message.data as MoveResultData);
          break;
        case 'game_over':
          this.handleGameOver(message.data as GameOverData);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Implement reconnection logic here
    };
  }

  public sendMove(from: Position, to: Position, piece: string) {
    this.ws.send(
      JSON.stringify({
        type: 'MOVE',
        payload: { from, to, piece },
      })
    );
  }

  private handleGameState(data: GameStateData): void {
    this.gameState = data.gameState;
    this.onUpdateCallback(this.gameState);
  }

  private handleMoveResult(data: MoveResultData): void {
    if (data.success && data.gameState) {
      this.gameState = data.gameState;
      this.onUpdateCallback(this.gameState);
    }
  }

  private handleGameOver(data: GameOverData): void {
    this.gameState = data.gameState;
    this.onUpdateCallback(this.gameState);
  }
}
