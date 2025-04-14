import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
}

function PauseMenu({ onResume, onMainMenu }: PauseMenuProps) {
  return (
    <div className="pause-menu">
      <div className="menu-header">
        <h1 className="game-title">Game Paused</h1>
      </div>
      
      <div className="menu-buttons">
        <button 
          onClick={onResume}
          className="primary-btn"
        >
          Resume
        </button>
        <button 
          onClick={onMainMenu}
          className="secondary-btn"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}

export default PauseMenu; 