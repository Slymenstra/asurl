'use client';

import dynamic from 'next/dynamic';

// Import the component with no SSR to avoid hydration errors
const DarkModeToggle = dynamic(() => import('./DarkModeToggle'), {
  ssr: false,
});

interface ClientDarkModeToggleProps {
  className?: string;
}

export default function ClientDarkModeToggle({ className }: ClientDarkModeToggleProps) {
  return <DarkModeToggle className={className} />;
} 