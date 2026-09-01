import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  userRoles: {
    role: {
      name: string;
      rolePermissions: {
        permission: {
          resource: string;
          action: string;
        };
      }[];
    };
  }[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role?: string, specialization?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from stored session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = sessionStorage.getItem('tzit_access_token');
        if (accessToken) {
          try {
            const response = await apiClient.get('/auth/me');
            if (response.data?.data?.user) {
              setUser(response.data.data.user);
            }
          } catch (err) {
            console.warn('Session expired or invalid, clearing:', err);
            sessionStorage.removeItem('tzit_access_token');
            sessionStorage.removeItem('tzit_refresh_token');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data?.data?.session) {
        const { accessToken, refreshToken } = response.data.data.session;
        sessionStorage.setItem('tzit_access_token', accessToken);
        if (refreshToken) sessionStorage.setItem('tzit_refresh_token', refreshToken);
      }
      
      if (response.data?.data?.user) {
        setUser(response.data.data.user);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, role: string = 'Student', specialization?: string) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role,
        ...(specialization ? { specialization } : {})
      });
      
      if (response.data?.data?.session) {
        const { accessToken, refreshToken } = response.data.data.session;
        sessionStorage.setItem('tzit_access_token', accessToken);
        if (refreshToken) sessionStorage.setItem('tzit_refresh_token', refreshToken);
      }
      
      if (response.data?.data?.user) {
        setUser(response.data.data.user);
      } else {
        // Fallback login if session not returned
        await login(email, password);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await apiClient.post('/auth/logout').catch(() => undefined);
    } finally {
      sessionStorage.removeItem('tzit_access_token');
      sessionStorage.removeItem('tzit_refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
