import React, { createContext, useContext, useMemo } from 'react';
import { paletteFor } from '../theme';

const ThemeContext = createContext({
  mode: 'light',
  colors: paletteFor('light'),
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ mode = 'light', onChange, children }) {
  const value = useMemo(() => {
    const colors = paletteFor(mode);
    return {
      mode,
      colors,
      setTheme: (m) => onChange?.(m === 'dark' ? 'dark' : 'light'),
      toggleTheme: () => onChange?.(mode === 'dark' ? 'light' : 'dark'),
    };
  }, [mode, onChange]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
