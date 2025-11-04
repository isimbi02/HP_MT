'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isGuest = localStorage.getItem('isGuest');
      if (isGuest === 'true') {
        // Restore guest user from localStorage flag
        const guestUser: User = {
          id: `guest-${Date.now()}`,
          email: 'guest@healthtracker.com',
          firstName: 'Guest',
          lastName: 'User',
          role: UserRole.GUEST,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setUser(guestUser);
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (token) {
        const profile = await api.auth.getProfile();
        setUser(profile);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('isGuest');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    localStorage.setItem('token', response.accessToken);
    setUser(response.user);
    router.push('/dashboard');
  };

  const loginAsGuest = () => {
    // Create a local guest user object immediately without backend call
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      email: 'guest@healthtracker.com',
      firstName: 'Guest',
      lastName: 'User',
      role: UserRole.GUEST,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // Set guest user without token (no authentication needed)
    setUser(guestUser);
    // Store guest flag in localStorage to track guest sessions
    localStorage.setItem('isGuest', 'true');
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isGuest');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsGuest, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}