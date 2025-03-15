// This file explicitly declares that these modules should only be used on the server
'use server';

// Re-export server-only dependencies
export * from '@/lib/server/bcrypt-utils';

// This file is a signal to Next.js that these imports should not be included in client bundles
// It doesn't actually need any content, but we can use it to re-export server-only utilities

/**
 * Mark a component or function as server-only to prevent client usage
 */
export function serverOnly(name: string): never {
  throw new Error(`${name} can only be used on the server side and not in client components.`);
} 