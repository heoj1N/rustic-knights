import React, { useState, useRef } from 'react';
import GameView from './components/GameView.tsx';
import MainMenu from './components/MainMenu.tsx';
import './App.css';
import { ChessGame } from './game/rules/ChessGame';

type GameState = 'menu' | 'playing' | 'paused';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const gameInstanceRef = useRef<{ chessGame: ChessGame | null }>({ chessGame: null });

  const handlePause = (chessGame: ChessGame) => {
    // Save the game state before pausing
    if (chessGame) {
      gameInstanceRef.current.chessGame = chessGame;
      chessGame.saveGameState();
      console.log('Game state saved before pausing');
    }
    setGameState('paused');
  };

  const handleResume = () => {
    // When resuming, we'll restore the state in the GameView component
    setGameState('playing');
  };

  const handleMainMenu = () => {
    // When going back to main menu, we discard the saved state
    gameInstanceRef.current.chessGame = null;
    setGameState('menu');
  };

  return (
    <div className="app">
      {gameState === 'menu' && <MainMenu onStartGame={() => setGameState('playing')} />}
      {gameState === 'playing' && (
        <GameView 
          onPause={handlePause} 
          savedGameInstance={gameInstanceRef.current.chessGame}
          onGameInstanceCreated={(game) => {
            gameInstanceRef.current.chessGame = game;
          }}
        />
      )}
      {gameState === 'paused' && (
        <div className="pause-menu">
          <h1>Game Paused</h1>
          <button onClick={handleResume}>Resume</button>
          <button onClick={handleMainMenu}>Main Menu</button>
        </div>
      )}
    </div>
  );
}

export default App;
