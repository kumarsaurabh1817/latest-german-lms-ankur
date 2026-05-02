import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../features/auth/services/authService';
import { setAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const res = await AuthService.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
             setAuthToken(null);
          }
        } catch (error) {
          void error;
          // Token invalid
          setAuthToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();

    // Listen for 401 responses dispatched by the API interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setAuthToken(null);
      // Navigate to login without full reload — router will handle this
      window.location.replace('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await AuthService.login({ email, password });
    if(res.success) {
        setUser(res.user);
        return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await AuthService.register(formData);
    if(res.success) {
        setUser(res.user);
        return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
