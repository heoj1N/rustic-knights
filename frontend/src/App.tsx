import React, { useState, useRef } from 'react';
import GameView from './components/GameView.tsx';
import MainMenu from './components/MainMenu.tsx';
import PauseMenu from './components/PauseMenu.tsx';
import { AuthProvider } from './util/AuthContext.tsx';
import './App.css';
import { ChessGame } from './game/rules/ChessGame';

type GameState = 'menu' | 'playing' | 'paused';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const gameInstanceRef = useRef<{ chessGame: ChessGame | null }>({ chessGame: null });

  const handlePause = () => {
    if (gameInstanceRef.current.chessGame) {
      gameInstanceRef.current.chessGame.saveGameState();
      console.log('Game state saved before pausing');
    }
    setGameState('paused');
  };

  const handleResume = () => {
    setGameState('playing');
  };

  const handleMainMenu = () => {
    gameInstanceRef.current.chessGame = null;
    setGameState('menu');
  };

  return (
    <AuthProvider>
      <div className="app">
        {gameState === 'menu' && <MainMenu onStartGame={() => setGameState('playing')} />}
        {gameState === 'playing' && (
          <GameView 
            onPause={handlePause}
          />
        )}
        {gameState === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onMainMenu={handleMainMenu}
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
