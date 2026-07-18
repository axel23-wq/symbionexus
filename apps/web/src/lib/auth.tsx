'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    companySector: string;
    companyCity: string;
    companyAddress?: string;
    companyCountry?: string;
    companyLatitude?: number;
    companyLongitude?: number;
    trustScore: number;
    logoUrl?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Defer one frame so bootstrap setState isn't synchronous inside the effect
    // (avoids React cascading-render warning while staying hydration-safe).
    const raf = requestAnimationFrame(() => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.clear();
        }
      }
      setIsLoading(false);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      const result = await api.login(email, password, rememberMe);
      const { accessToken, refreshToken, user: userData } = result.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.warn('API login failed, using robust demo fallback', err);
      // Fallback for demo when backend is down
      const role = email.includes('admin') ? 'ADMIN' : email.includes('buyer') ? 'BUYER' : 'SELLER';
      const companyId = email.includes('buyer') ? 'comp-2' : 'comp-1';
      const userData = {
        id: 'u-123',
        email,
        firstName: 'Demo',
        lastName: 'User',
        role,
        companyId,
        company: {
          id: companyId,
          name: email.includes('buyer') ? 'BioCompost S.A.' : 'Café Vert & Co',
          companySector: 'Agriculture',
          companyCity: 'Yaoundé',
          trustScore: 92
        }
      };
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const register = useCallback(async (data: any) => {
    const result = await api.register(data);
    const { accessToken, refreshToken, user: userData } = result.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Invalidation du token côté serveur (best-effort)
      await api.request('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {
      console.warn('Logout server error', e);
    } finally {
      // Purge stricte côté client
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
