import React, { useState } from 'react';
import { useAuth } from '../util/AuthContext.tsx';

interface RegisterFormProps {
  onClose: () => void;
  onShowLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onShowLogin }) => {
  const { register, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLocalError(null);
    
    // Validate form
    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }
    
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Valid email is required');
      return;
    }
    
    try {
      await register({ username, password, email });
      onClose(); // Close the form after successful registration
    } catch (err) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="auth-form register-form">
      <h2>Create Account</h2>
      
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
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </div>
      </form>
      
      <div className="form-footer">
        <p>
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onShowLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 