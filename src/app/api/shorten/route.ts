import { NextRequest, NextResponse } from 'next/server';
import { urlSchema } from '@/lib/validations';
import { createShortUrl } from '@/lib/url-service';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = urlSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid URL', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    // Get the URL from the validated data
    const { url } = validationResult.data;
    
    // Create a short URL
    const shortCode = await createShortUrl(url);
    
    // Return the short code
    return NextResponse.json({ shortCode }, { status: 201 });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return NextResponse.json(
      { error: 'Failed to shorten URL' },
      { status: 500 }
    );
  }
} 