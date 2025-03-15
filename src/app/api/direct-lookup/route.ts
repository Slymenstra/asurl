import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Url } from '@/models/Url';
import { findMockUrl } from '@/app/api/urls/route';

// Direct lookup and redirect API endpoint
export async function GET(req: NextRequest) {
  console.log('Direct lookup API called with:', req.url);
  
  // Get shortId from query parameters
  const { searchParams } = new URL(req.url);
  const shortId = searchParams.get('id');
  
  console.log(`Looking up URL for shortId: "${shortId}"`);
  
  if (!shortId) {
    // Return plain text error for browser viewing
    if (req.headers.get('accept')?.includes('text/html')) {
      return new NextResponse('Short URL ID not provided', { status: 400 });
    }
    
    // Return JSON for API calls
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }
  
  try {
    // Connect to database
    const db = await connectToDatabase();
    console.log(`Database connection for shortId ${shortId}: ${!!db ? 'Success' : 'Failed'}`);
    
    // Try to find URL in database
    console.log(`Searching database for: ${shortId}`);
    const url = await Url.findOne({
      $or: [
        { shortId },
        { customPath: shortId }
      ]
    });
    
    // If found in database, redirect to it
    if (url) {
      console.log(`Found URL in database: ${url.originalUrl}`);
      const targetUrl = url.originalUrl.startsWith('http') 
        ? url.originalUrl 
        : `https://${url.originalUrl}`;
      
      // Increment click counter if this is a browser request (not just checking API)
      // Only count clicks for actual redirects, not for API checks
      if (!req.headers.get('accept')?.includes('application/json')) {
        console.log(`Incrementing click count for URL: ${url._id}`);
        try {
          // Use findByIdAndUpdate to atomically increment the clicks counter
          await Url.findByIdAndUpdate(
            url._id,
            { $inc: { clicks: 1 } },
            { new: true }
          );
          console.log('Click count incremented successfully');
        } catch (updateError) {
          console.error('Failed to increment click count:', updateError);
          // Continue with redirect even if click tracking fails
        }
      }
      
      console.log(`Redirecting to: ${targetUrl}`);
      
      // Check if this is a direct browser request or an API call
      if (req.headers.get('accept')?.includes('application/json')) {
        // Return JSON for API calls
        return NextResponse.json({ url: targetUrl });
      }
      
      // Return a redirect for browser requests
      return NextResponse.redirect(targetUrl, { status: 302 });
    }
    
    // If not in database, check mock store for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Checking mock store for: ${shortId}`);
      const mockUrl = findMockUrl(shortId);
      
      if (mockUrl) {
        console.log(`Found URL in mock store: ${mockUrl.originalUrl}`);
        const targetUrl = mockUrl.originalUrl.startsWith('http') 
          ? mockUrl.originalUrl 
          : `https://${mockUrl.originalUrl}`;
        
        // For mock URLs, just log the click but don't update a real DB
        if (!req.headers.get('accept')?.includes('application/json')) {
          console.log(`Mock click increment for: ${shortId}`);
          // In a real app, we would increment the click count here
        }
        
        console.log(`Redirecting to mock URL: ${targetUrl}`);
        
        // Check if this is a direct browser request or an API call
        if (req.headers.get('accept')?.includes('application/json')) {
          // Return JSON for API calls
          return NextResponse.json({ url: targetUrl });
        }
        
        // Return a redirect for browser requests
        return NextResponse.redirect(targetUrl, { status: 302 });
      }
    }
    
    // URL not found
    console.log(`No URL found for shortId: ${shortId}`);
    
    // Return appropriate response based on request type
    if (req.headers.get('accept')?.includes('text/html')) {
      return new NextResponse(`Short URL not found: ${shortId}`, { status: 404 });
    }
    
    return NextResponse.json({ error: 'URL not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in direct lookup:', error);
    
    // Return appropriate error response based on request type
    if (req.headers.get('accept')?.includes('text/html')) {
      return new NextResponse(
        `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 