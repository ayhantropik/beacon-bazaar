/**
 * Son aramalar yönetimi — localStorage tabanlı.
 * Hem ana sayfa hem harita arama çubuğu tarafından kullanılır.
 */
export const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_ITEMS = 10;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  const q = query.trim();
  if (!q) return;
  const searches = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
  searches.unshift(q);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_ITEMS)));
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}
