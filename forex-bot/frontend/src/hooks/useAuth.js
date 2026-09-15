/**
 * Hook d'authentification JWT
 */
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configure axios defaults whenever token changes
  const applyToken = useCallback((t) => {
    if (t) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Apply token on mount
  applyToken(token);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { access_token } = response.data;
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      applyToken(access_token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || 'Identifiants invalides';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [applyToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    applyToken(null);
    setError(null);
  }, [applyToken]);

  const isAuthenticated = !!token;

  return { token, login, logout, isAuthenticated, loading, error };
}
