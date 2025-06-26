"use client";

import { useState, useEffect, useCallback } from 'react';

interface SearchHistory {
  previousSearches: string[];
  viewedBooks: string[];
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistory>({ previousSearches: [], viewedBooks: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('bibliophile-search-history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not read search history from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocalStorage = (updatedHistory: SearchHistory) => {
     try {
      localStorage.setItem('bibliophile-search-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Could not save search history to localStorage", error);
    }
  };

  const addSearchTerm = useCallback((term: string) => {
    if(!term) return;
    setHistory(prevHistory => {
      const newSearches = [...new Set([term, ...prevHistory.previousSearches])].slice(0, 10);
      const updatedHistory = { ...prevHistory, previousSearches: newSearches };
      updateLocalStorage(updatedHistory);
      return updatedHistory;
    });
  }, []);

  const addViewedBook = useCallback((bookTitle: string) => {
    setHistory(prevHistory => {
       const newViewed = [...new Set([bookTitle, ...prevHistory.viewedBooks])].slice(0, 10);
      const updatedHistory = { ...prevHistory, viewedBooks: newViewed };
      updateLocalStorage(updatedHistory);
      return updatedHistory;
    });
  }, []);

  return { history, addSearchTerm, addViewedBook, isLoading };
}
