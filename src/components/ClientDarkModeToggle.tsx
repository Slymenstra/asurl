'use client';

import dynamic from 'next/dynamic';

// Import DarkModeToggle with no SSR to avoid hydration errors
const DarkModeToggle = dynamic(() => import('./DarkModeToggle'), { ssr: false });

export default function ClientDarkModeToggle() {
  return <DarkModeToggle />;
} 