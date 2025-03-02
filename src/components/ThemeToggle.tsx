'use client';

import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';

// Define the shape of our theme context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  
  // Safe access to theme context
  let themeContext: ThemeContextType | undefined;
  try {
    themeContext = useTheme();
  } catch (e) {
    console.error('Theme context not available, using fallback functionality');
  }
  
  const { theme = currentTheme, toggleTheme } = themeContext || {};
  
  // Fallback toggle function if context is not available
  const fallbackToggle = () => {
    setCurrentTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      
      if (typeof window !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
      }
      
      return newTheme;
    });
  };

  useEffect(() => {
    setMounted(true);
    
    // Set initial theme based on document class if context isn't available
    if (!themeContext && typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    }
  }, [themeContext]);

  const handleToggle = () => {
    // Add animation indicator
    setIsAnimating(true);
    
    // Toggle the theme
    if (toggleTheme) {
      toggleTheme();
    } else {
      fallbackToggle();
    }
    
    // Remove animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;

  const displayTheme = themeContext ? theme : currentTheme;

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 ${
        isAnimating ? 'scale-90' : 'scale-100'
      }`}
      aria-label={`Switch to ${displayTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {displayTheme === 'light' ? (
        // Moon icon for dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
} 