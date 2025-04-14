import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as authService from './authService.ts';
import { User, LoginRequest, RegisterRequest } from '../types/user.ts';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isGuest: boolean;
}

const defaultAuthContext: AuthContextType = {
  currentUser: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  guestLogin: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isGuest: false
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(credentials);
      setCurrentUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.register(userData);
      setCurrentUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.guestLogin();
      setCurrentUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const isAuthenticated = !!currentUser;
  const isGuest = currentUser?.is_guest || false;

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    guestLogin,
    logout,
    isAuthenticated,
    isGuest
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 