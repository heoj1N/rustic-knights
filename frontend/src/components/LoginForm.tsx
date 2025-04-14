import React, { useState } from 'react';
import { useAuth } from '../util/AuthContext.tsx';

interface LoginFormProps {
  onClose: () => void;
  onShowRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onShowRegister }) => {
  const { login, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }
    
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    
    try {
      await login({ username, password });
      onClose(); // Close the form after successful login
    } catch (err) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="auth-form login-form">
      <h2>Login</h2>
      
      {(error || localError) && (
        <div className="error-message">
          {error || localError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      
      <div className="form-footer">
        <p>
          Don't have an account?{' '}
          <button type="button" className="link-button" onClick={onShowRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 