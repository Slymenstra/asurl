'use client';

import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAnimating, setIsAnimating] = useState(false);

  // When component mounts, initialize theme
  useEffect(() => {
    setMounted(true);
    
    // Check local storage
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Check if dark class already exists
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Set the initial theme based on the checks above
    const initialTheme = storedTheme || (prefersDark || isDarkMode ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Apply theme to document
    applyTheme(initialTheme);
  }, []);

  // Function to apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsAnimating(true);
    
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      return newTheme;
    });
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Avoid hydration mismatch
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 ${
        isAnimating ? 'scale-90' : 'scale-100'
      }`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
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