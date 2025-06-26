"use client";

import { useState, useEffect, useCallback } from 'react';

export function useLibrary() {
  const [library, setLibrary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLibrary = localStorage.getItem('bibliophile-library');
      if (storedLibrary) {
        setLibrary(JSON.parse(storedLibrary));
      }
    } catch (error) {
      console.error("Could not read library from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocalStorage = (updatedLibrary: string[]) => {
    try {
      localStorage.setItem('bibliophile-library', JSON.stringify(updatedLibrary));
    } catch (error) {
      console.error("Could not save library to localStorage", error);
    }
  };

  const addToLibrary = useCallback((bookId: string) => {
    setLibrary(prevLibrary => {
      if (prevLibrary.includes(bookId)) {
        return prevLibrary;
      }
      const updatedLibrary = [...prevLibrary, bookId];
      updateLocalStorage(updatedLibrary);
      return updatedLibrary;
    });
  }, []);

  const removeFromLibrary = useCallback((bookId: string) => {
    setLibrary(prevLibrary => {
      const updatedLibrary = prevLibrary.filter(id => id !== bookId);
      updateLocalStorage(updatedLibrary);
      return updatedLibrary;
    });
  }, []);

  const isInLibrary = useCallback((bookId: string) => {
    return library.includes(bookId);
  }, [library]);

  return { library, addToLibrary, removeFromLibrary, isInLibrary, isLoading };
}
