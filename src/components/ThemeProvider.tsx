'use client';

import { ThemeProvider as NextThemeProvider } from '@/context/ThemeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemeProvider>{children}</NextThemeProvider>;
} 