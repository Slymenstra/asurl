'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  // Add mounted state to prevent hydration errors
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true when component mounts on the client
    setMounted(true);

    // Check if user has a saved preference (only run on client)
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    // Check if user has system preference for dark mode
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemPreference = isSystemDark ? 'dark' : 'light';
    
    // Set theme based on saved preference or system preference
    const initialTheme = savedTheme || systemPreference;
    setTheme(initialTheme);
    
    // Apply the theme to the document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Save theme preference to localStorage
      localStorage.setItem('theme', newTheme);
      
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newTheme;
    });
  };

  // Prevent hydration issues by rendering children only after component is mounted
  // This ensures any browser API access happens only on the client
  if (!mounted) {
    // Return a placeholder with the same structure but without theme-specific classes
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 