import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hagah_theme';
const VALID_THEMES: AppTheme[] = ['blue', 'green', 'purple', 'dark'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
    if (saved && VALID_THEMES.includes(saved)) {
      return saved;
    }
    // Suporte a migração caso o usuário tenha 'navy' ou 'emerald' salvos anteriormente
    if (saved === ('navy' as any)) return 'blue';
    if (saved === ('emerald' as any)) return 'green';
    return 'blue';
  });

  const applyTheme = (newTheme: AppTheme) => {
    const root = document.documentElement;

    // 1. Atualizar atributo data-theme
    root.setAttribute('data-theme', newTheme);

    // 2. Limpar classes de tema anteriores
    VALID_THEMES.forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });
    root.classList.remove('theme-navy', 'theme-emerald'); // classes legadas
    root.classList.add(`theme-${newTheme}`);

    // 3. Gerenciar classe 'dark' para Tailwind Dark Mode
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
