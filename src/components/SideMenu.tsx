'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ClientDarkModeToggle from './ClientDarkModeToggle';

export default function SideMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close the menu when pressing escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="md:hidden flex items-center justify-center" 
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Side Menu */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transform transition-transform ease-in-out duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-medium">Menu</h2>
            <button 
              className="p-1 rounded-md hover:bg-secondary"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Logo */}
          <div className="py-4 px-4">
            <Link 
              href="/" 
              className="text-2xl font-bold text-primary hover:text-primary-light transition-colors flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>ASURL</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-2">
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/" 
                  className="block py-2 px-4 rounded-md hover:bg-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="block py-2 px-4 rounded-md text-muted hover:bg-secondary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Footer */}
          <div className="py-6 px-4 border-t border-border mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Theme</span>
              <ClientDarkModeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
} 