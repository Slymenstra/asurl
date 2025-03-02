import { NextRequest, NextResponse } from 'next/server';
import { getOriginalUrl } from '@/lib/url-service';

export async function GET(
  request: NextRequest,
  context: { params: { shortCode: string } }
) {
  try {
    // Properly await params before accessing properties
    const { shortCode } = await context.params;
    
    if (!shortCode) {
      return NextResponse.json(
        { error: 'Invalid short code' },
        { status: 400 }
      );
    }
    
    // Get the original URL for this short code
    const originalUrl = await getOriginalUrl(shortCode);
    
    if (!originalUrl) {
      // If the short code doesn't exist, return a 404
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }
    
    // Redirect to the original URL
    return NextResponse.redirect(originalUrl);
  } catch (error) {
    console.error('Error redirecting to URL:', error);
    return NextResponse.json(
      { error: 'Failed to redirect' },
      { status: 500 }
    );
  }
} 