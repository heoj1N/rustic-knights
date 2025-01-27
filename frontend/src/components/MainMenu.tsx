import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
}

function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div className="main-menu">
      <h1>Rustic Knights</h1>
      <button onClick={onStartGame}>Start Game</button>
      <button>Settings</button>
      <button>How to Play</button>
    </div>
  );
}

export default MainMenu;