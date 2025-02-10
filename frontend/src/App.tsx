import React, { useState } from 'react';
import GameView from './components/GameView.tsx';
import MainMenu from './components/MainMenu.tsx';
import './App.css';

type GameState = 'menu' | 'playing' | 'paused';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');

  return (
    <div className="app">
      {gameState === 'menu' && <MainMenu onStartGame={() => setGameState('playing')} />}
      {gameState === 'playing' && <GameView onPause={() => setGameState('paused')} />}
      {gameState === 'paused' && (
        <div className="pause-menu">
          <h1>Game Paused ...</h1>
          <button onClick={() => setGameState('playing')}>Resume</button>
          <button onClick={() => setGameState('menu')}>Main Menu</button>
        </div>
      )}
    </div>
  );
}

export default App;
