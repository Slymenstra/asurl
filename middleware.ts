import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log the request for debugging
  console.log(`[Middleware] Processing request for: ${pathname}`);
  
  // Skip processing for excluded paths and the root path
  if (pathname === '/' || EXCLUDED_PATHS.some(prefix => pathname.startsWith(prefix))) {
    console.log(`[Middleware] Skipping excluded path: ${pathname}`);
    return NextResponse.next();
  }
  
  // Extract the shortId from the path
  const shortId = pathname.substring(1);
  console.log(`[Middleware] Extracted shortId: "${shortId}"`);
  
  // Skip empty shortIds
  if (!shortId || shortId.trim() === '') {
    console.log('[Middleware] Empty shortId - skipping');
    return NextResponse.next();
  }
  
  // Use our direct-lookup API which is functioning correctly
  const apiUrl = new URL('/api/direct-lookup', request.url);
  apiUrl.searchParams.set('id', shortId);
  console.log(`[Middleware] Redirecting to: ${apiUrl.toString()}`);
  
  return NextResponse.redirect(apiUrl);
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