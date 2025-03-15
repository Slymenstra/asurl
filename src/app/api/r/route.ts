import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Url } from '@/models/Url';
import { findMockUrl } from '@/app/api/urls/route';

// This is a simple handler to receive the request from middleware and redirect it to the proper handler
export async function GET(req: NextRequest) {
  console.log('Top-level redirect handler called with URL:', req.url);
  
  // Extract shortId from URL path
  const pathParts = req.nextUrl.pathname.split('/');
  const shortId = pathParts[pathParts.length - 1];
  
  console.log(`Extracted shortId from path: '${shortId}'`);

  if (!shortId || shortId.trim() === '') {
    console.error('Missing or empty shortId parameter');
    return new NextResponse('Not found - missing shortId', { status: 404 });
  }

  try {
    // Connect to database - log connection process
    console.log('Connecting to database for redirect...');
    const db = await connectToDatabase();
    console.log('Database connection successful:', !!db);

    console.log(`Looking for URL with shortId or customPath: '${shortId}'`);
    
    // Find URL by shortId or customPath - using a direct console.log of the query
    const query = { $or: [{ shortId }, { customPath: shortId }] };
    console.log('Database query:', JSON.stringify(query));
    
    let url = await Url.findOne(query);
    console.log('Database search result:', url ? 'URL found' : 'URL not found');

    // If not found in database, check mock store for development
    if (!url && process.env.NODE_ENV !== 'production') {
      console.log('URL not found in database, checking mock store');
      const mockUrl = findMockUrl(shortId);
      
      if (mockUrl) {
        console.log('Found URL in mock store');
        // If the URL has expired, return 404
        if (mockUrl.expiresAt && new Date(mockUrl.expiresAt) < new Date()) {
          console.log('URL has expired');
          return new NextResponse('URL has expired', { status: 404 });
        }

        // For mock URLs, just redirect to the original URL
        const redirectUrl = mockUrl.originalUrl;
        console.log(`Redirecting to: ${redirectUrl}`);
        
        // Make sure the URL has a protocol
        const finalUrl = redirectUrl.startsWith('http') 
          ? redirectUrl 
          : `https://${redirectUrl}`;
          
        console.log(`Final redirect URL: ${finalUrl}`);
        return NextResponse.redirect(finalUrl);
      }
    }

    if (!url) {
      console.log(`URL not found for shortId: '${shortId}'`);
      return new NextResponse(`Not found - no URL for: ${shortId}`, { status: 404 });
    }

    // Check if URL has expired
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      console.log('URL has expired');
      return new NextResponse('URL has expired', { status: 404 });
    }

    // Prepare the redirect URL - make sure it has a protocol
    const redirectUrl = url.originalUrl;
    const finalUrl = redirectUrl.startsWith('http') 
      ? redirectUrl 
      : `https://${redirectUrl}`;
    
    console.log(`Redirecting to: ${finalUrl}`);
    
    // Use 302 Found for temporary redirect
    return NextResponse.redirect(finalUrl, { status: 302 });
  } catch (error) {
    console.error('Error processing redirect:', error);
    return new NextResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
} 