import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createGameScene, GameState } from '../game/elements/GameScene';

interface GameViewProps {
  onPause: () => void;
}

function GameView({ onPause }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>({
    currentTurn: 'white',
    turnCount: 1,
    timeElapsed: 0,
    whiteScore: 0,
    blackScore: 0
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = createGameScene(
      engine, 
      canvasRef.current,
      (newState) => setGameState(prevState => ({ 
        ...prevState, 
        ...newState, 
        // Keep time elapsed from our local timer
        timeElapsed: prevState.timeElapsed 
      }))
    );
    
    // Setup game state update interval for the timer
    const timer = window.setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        timeElapsed: prevState.timeElapsed + 1
      }));
    }, 1000);
    
    // Update FPS counter
    const fpsInterval = window.setInterval(() => {
      setFps(engine.getFps());
    }, 500);

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearInterval(timer);
      window.clearInterval(fpsInterval);
      engine.dispose();
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-view">
      <div className="game-ui">
        <div className="game-info">
          <div className="turn-info">
            <span>Turn: {gameState.turnCount}</span>
            <span className={`current-player ${gameState.currentTurn}`}>
              {gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1)}'s Turn
            </span>
          </div>
          <div className="timer">Time: {formatTime(gameState.timeElapsed)}</div>
          <div className="score">
            <span className="white-score">White: {gameState.whiteScore}</span>
            <span className="black-score">Black: {gameState.blackScore}</span>
          </div>
        </div>
        <div className="controls">
          <div className="fps-counter">FPS: {Math.round(fps)}</div>
          <button className="pause-button" onClick={onPause}>
            Pause
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} id="renderCanvas" />
    </div>
  );
}

export default GameView;
