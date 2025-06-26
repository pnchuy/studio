"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('bibliophile-auth');
      if (storedAuth) {
        setIsLoggedIn(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error("Could not read auth state from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    localStorage.setItem('bibliophile-auth', JSON.stringify(true));
    setIsLoggedIn(true);
    router.push('/library');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('bibliophile-auth');
    localStorage.removeItem('bibliophile-library');
    localStorage.removeItem('bibliophile-search-history');
    setIsLoggedIn(false);
    router.push('/');
  }, [router]);

  return { isLoggedIn, isLoading, login, logout };
}
