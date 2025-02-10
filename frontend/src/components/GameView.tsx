import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createGameScene } from '../scenes/GameScene';

interface GameViewProps {
  onPause: () => void;
}

function GameView({ onPause }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = createGameScene(engine, canvasRef.current);

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  return (
    <div className="game-view">
      <canvas ref={canvasRef} id="renderCanvas" />
      <button className="pause-button" onClick={onPause}>
        Pause
      </button>
    </div>
  );
}

export default GameView;
