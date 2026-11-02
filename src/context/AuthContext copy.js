import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import TokenService from '../services/tokenService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const login = useCallback(async (loginId, password, remember) => {
    setAuthError('');
    const loggedInUser = await authService.login(loginId, password, remember);    
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const bootstrap = useCallback(async () => {
    if (!TokenService.hasAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const currentUser = await authService.me();          
      setUser(currentUser);
    } catch (error) {
      TokenService.clearTokens();
      setUser(null);
      setAuthError(error.message || 'Your session has expired. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const value = useMemo(() => ({
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    login,
    logout,
  }), [user, loading, authError, login, logout]);  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);    
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
