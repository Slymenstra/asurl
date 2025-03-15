import { NextRequest, NextResponse } from 'next/server';
import { logger, LogLevel, LogSource } from '@/lib/logger';

// Paths that should be excluded from URL shortening middleware
const EXCLUDED_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/auth',
  '/dashboard',
  '/admin',
  '/test-redirect',
  '/direct',
  '/debug-urls'
];

// Helper function to log without awaiting
function fireAndForgetLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  source: LogSource,
  details: any
) {
  // Don't await the promise, just let it run in the background
  logger[level](message, source, details)
    .catch((err: Error) => console.error('Background logging error:', err));
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Log the request for debugging - fire and forget (don't await)
    fireAndForgetLog('debug', `Processing request: ${pathname}`, 'middleware', {
      url: request.url,
      method: request.method
    });
    
    // Skip processing for excluded paths and the root path
    if (pathname === '/' || EXCLUDED_PATHS.some(prefix => pathname.startsWith(prefix))) {
      fireAndForgetLog('debug', `Skipping excluded path: ${pathname}`, 'middleware', null);
      return NextResponse.next();
    }
    
    // Extract the shortId from the path
    const shortId = pathname.substring(1);
    fireAndForgetLog('debug', `Extracted shortId: "${shortId}"`, 'middleware', { shortId });
    
    // Skip empty shortIds
    if (!shortId || shortId.trim() === '') {
      fireAndForgetLog('debug', 'Empty shortId - skipping', 'middleware', null);
      return NextResponse.next();
    }
    
    // Use our direct-lookup API which is functioning correctly
    const apiUrl = new URL('/api/direct-lookup', request.url);
    apiUrl.searchParams.set('id', shortId);
    fireAndForgetLog('info', `Redirecting shortId: ${shortId}`, 'redirect', { shortId });
    
    return NextResponse.redirect(apiUrl);
  } catch (error) {
    // Log the error - fire and forget
    fireAndForgetLog('error', 'Middleware error', 'middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    });
    
    // Return next response to avoid breaking the application
    return NextResponse.next();
  }
}

// Match all paths except static assets and API routes
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /examples (static files)
     * 4. /favicon.ico, /assets, /public (static files)
     * 5. All files in the /public folder
     */
    '/((?!api|_next|examples|favicon.ico|assets|auth|dashboard|admin|direct|debug-urls).*)',
  ],
}; 