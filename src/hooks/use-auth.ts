"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { getAllUsers } from '@/lib/users';
import { generateId } from '@/lib/utils';

const USER_STORAGE_KEY = 'bibliophile-user';

export function useAuth() {
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

  const login = useCallback(async (email: string): Promise<boolean> => {
    const users = await getAllUsers();
    // In a real app, you'd also verify the password.
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      router.push('/library');
      return true;
    }
    return false;
  }, [router]);

  const signup = useCallback(async (name: string, email: string): Promise<boolean> => {
    const users = await getAllUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return false;
    }

    const newUser: User = {
        id: generateId(),
        name,
        email,
        joinDate: new Date().toISOString().split('T')[0],
        role: 'MEMBER',
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    router.push('/library');
    return true;
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('bibliophile-auth'); // Clean up old key if exists
    localStorage.removeItem('bibliophile-library');
    localStorage.removeItem('bibliophile-search-history');
    setUser(null);
    router.push('/');
  }, [router]);

  return { user, isLoggedIn: !!user, isLoading, login, logout, signup };
}
