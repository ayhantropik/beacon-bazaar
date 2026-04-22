import { useState, useCallback } from 'react';

// Ana sayfa "Son aramalar" ile paylaşılan ortak anahtar
const STORAGE_KEY = 'recentSearches';
const MAX_ITEMS = 10;

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const history = getSearchHistory().filter((h) => h !== trimmed);
  history.unshift(trimmed);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
}

export function removeSearchHistoryItem(query: string) {
  const history = getSearchHistory().filter((h) => h !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(getSearchHistory);

  const add = useCallback((query: string) => {
    addSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  const remove = useCallback((query: string) => {
    removeSearchHistoryItem(query);
    setHistory(getSearchHistory());
  }, []);

  const clear = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  return { history, add, remove, clear };
}
