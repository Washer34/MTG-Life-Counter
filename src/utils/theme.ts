import { ThemeId } from '../types';

const THEME_STORAGE_KEY = 'mtg-life-counter-theme';

export const applyTheme = (themeId: ThemeId) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', themeId);
};

export const loadStoredTheme = (): ThemeId | null => {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as ThemeId) || null;
};

export const storeTheme = (themeId: ThemeId) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
};
