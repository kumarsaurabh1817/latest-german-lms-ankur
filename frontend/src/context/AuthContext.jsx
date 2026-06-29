import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../features/auth/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await AuthService.getMe();
        if (res.success) {
          // Safety net: if a stale cookie exists for a pending teacher
          // (e.g. from an account created before the backend fix was deployed),
          // clear it immediately so the teacher is not silently logged in.
          if (res.user?.role === 'teacher' && !res.user?.is_teacher_approved) {
            await AuthService.logout();
          } else {
            setUser(res.user);
          }
        }
      } catch (error) {
        void error;
      }
      setLoading(false);
    };
    initAuth();

    // Listen for 401 responses dispatched by the API interceptor
    const PUBLIC_PATHS = ['/login', '/register', '/'];
    // Checkout pages: don't redirect — the payment itself may get a 401
    const CHECKOUT_PATHS = ['/checkout/'];
    let redirectTimeout = null;
    const handleUnauthorized = () => {
      setUser(null);
      const path = window.location.pathname;
      const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith('/courses'));
      const isCheckout = CHECKOUT_PATHS.some(p => path.startsWith(p));
      if (!isPublic && !isCheckout) {
        // Debounce: avoid firing multiple redirects from parallel 401 responses
        if (!redirectTimeout) {
          redirectTimeout = setTimeout(() => {
            window.location.replace('/login');
            redirectTimeout = null;
          }, 200);
        }
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
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
    if (res.success) {
      // Teachers require admin approval before they can sign in.
      // Don't auto-log them in — return a pending flag so the
      // Register page can redirect to /login with an info message.
      if (res.user?.role === 'teacher' && !res.user?.is_teacher_approved) {
        return { ...res.user, pendingApproval: true };
      }
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
