import React, { useState } from 'react';
import { useAuth } from '../util/AuthContext.tsx';
import LoginForm from './LoginForm.tsx';
import RegisterForm from './RegisterForm.tsx';
import * as Dialog from '@radix-ui/react-dialog';

interface MainMenuProps {
  onStartGame: () => void;
}

type AuthModalState = 'closed' | 'login' | 'register';

function MainMenu({ onStartGame }: MainMenuProps) {
  const { currentUser, logout, guestLogin, loading, isAuthenticated, isGuest } = useAuth();
  const [authModalState, setAuthModalState] = useState<AuthModalState>('closed');
  
  const handleStartGame = () => {
    if (!isAuthenticated && !loading) {
      guestLogin().then(() => {
        onStartGame();
      });
    } else {
      onStartGame();
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const renderAuthButtons = () => {
    if (isAuthenticated) {
      return (
        <div className="user-info">
          <span className="username">Hello, {currentUser?.username}</span>
          {isGuest && <span className="guest-badge">Guest</span>}
          <button 
            onClick={handleLogout} 
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      );
    }
    
    return (
      <div className="auth-buttons">
        <button 
          onClick={() => setAuthModalState('login')}
          className="auth-btn login-btn"
        >
          Login
        </button>
        <button 
          onClick={() => setAuthModalState('register')}
          className="auth-btn register-btn"
        >
          Register
        </button>
      </div>
    );
  };
  
  const AuthModal = () => (
    <Dialog.Root 
      open={authModalState !== 'closed'} 
      onOpenChange={(open) => !open && setAuthModalState('closed')}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          {authModalState === 'login' ? (
            <LoginForm 
              onClose={() => setAuthModalState('closed')} 
              onShowRegister={() => setAuthModalState('register')} 
            />
          ) : (
            <RegisterForm 
              onClose={() => setAuthModalState('closed')} 
              onShowLogin={() => setAuthModalState('login')} 
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1 className="game-title">Rustic Knights</h1>
        {renderAuthButtons()}
      </div>
      
      <div className="menu-buttons">
        <button 
          onClick={handleStartGame} 
          disabled={loading}
          className="primary-btn"
        >
          {loading ? 'Loading...' : 'Start Game'}
        </button>
        <button className="secondary-btn">Settings</button>
        <button className="secondary-btn">How to Play</button>
      </div>
      
      <AuthModal />
    </div>
  );
}

export default MainMenu;
