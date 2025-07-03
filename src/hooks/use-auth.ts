"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { getAllUsers } from '@/lib/users';
import { generateId } from '@/lib/utils';

const USER_STORAGE_KEY = 'bibliophile-user';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, username: string) => Promise<{ success: boolean; message?: string; field?: 'email' | 'username' }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not read auth state from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrUsername: string): Promise<boolean> => {
    const users = await getAllUsers();
    // In a real app, you'd also verify the password.
    const foundUser = users.find(u => 
        u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
        u.username.toLowerCase() === emailOrUsername.toLowerCase()
    );

    if (foundUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      if (foundUser.role === 'ADMIN' || foundUser.role === 'MANAGER') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      return true;
    }
    return false;
  }, [router]);

  const signup = useCallback(async (name: string, email: string, username: string): Promise<{ success: boolean; message?: string; field?: 'email' | 'username' }> => {
    const users = await getAllUsers();
    
    const existingUserByEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUserByEmail) {
        return { success: false, message: "An account with this email already exists.", field: 'email' };
    }

    const existingUserByUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUserByUsername) {
        return { success: false, message: "This username is already taken.", field: 'username' };
    }


    const newUser: User = {
        id: generateId(),
        username,
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: 'MEMBER',
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    // New users are always members, so redirect to home
    router.push('/');
    return { success: true };
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('bibliophile-auth'); // Clean up old key if exists
    localStorage.removeItem('bibliophile-library');
    localStorage.removeItem('bibliophile-search-history');
    setUser(null);
    router.push('/');
  }, [router]);

  const value = {
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      signup
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
