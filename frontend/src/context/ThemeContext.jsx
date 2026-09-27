import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'cyber-dark',
    name: 'Cyber Midnight',
    hint: 'Electric Cyan & Indigo',
    icon: '⚡',
    colors: ['#06080f', '#06b6d4', '#6366f1']
  },
  {
    id: 'emerald-slate',
    name: 'Emerald Matrix',
    hint: 'Luminous Emerald & Mint',
    icon: '💎',
    colors: ['#06100e', '#10b981', '#34d399']
  },
  {
    id: 'sunset-rose',
    name: 'Velvet Royale',
    hint: 'Sunset Rose & Amber',
    icon: '🔥',
    colors: ['#0d0716', '#f43f5e', '#a855f7']
  },
  {
    id: 'modern-light',
    name: 'Crisp Neo-Light',
    hint: 'Clean Arctic & Frost',
    icon: '☀️',
    colors: ['#f4f6fa', '#4f46e5', '#0284c7']
  }
];

const ThemeContext = createContext({
  theme: 'cyber-dark',
  setTheme: () => {},
  themes: THEMES,
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('careerpulse_theme');
      if (stored && THEMES.some(t => t.id === stored)) {
        return stored;
      }
    }
    return 'cyber-dark';
  });

  const setTheme = (newTheme) => {
    if (!THEMES.some(t => t.id === newTheme)) return;
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerpulse_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].id);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
