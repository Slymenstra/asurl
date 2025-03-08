'use client';

import { useState, useEffect } from 'react';

interface DarkModeToggleProps {
  className?: string;
}

export default function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
      className={`p-2 rounded-full hover:bg-secondary transition-all duration-300 ${
        isAnimating ? 'scale-90' : 'scale-100'
      } ${className}`}
      aria-label="Settings"
    >
      {/* Gear icon for settings */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
} 