import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Url } from '@/models/Url';
import { getServerSession } from 'next-auth/next';
import { TEST_USER_ID, generateAuthOptions } from '../auth/[...nextauth]/auth-options';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

// Pre-generate auth options for server session
const authOptionsPromise = generateAuthOptions();

// Rate limiting configuration - more lenient in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const RATE_LIMIT_WINDOW = isDevelopment ? 5 * 1000 : 60 * 1000; // 5 seconds in dev, 1 minute in prod
const MAX_REQUESTS_PER_WINDOW = isDevelopment ? 50 : 10; // Higher limit in development

// Rate limiting storage - in production, this should use Redis or similar
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Mock storage for development mode - store URLs by user ID
const mockUrlStore = new Map<string, any[]>();

// URL validation schema
const urlSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL'),
  customPath: z.string().min(1).max(100).optional(),
  domain: z.string().optional(),
  expiresAt: z.string().optional(),
});

// Helper function to check rate limits
function checkRateLimit(ip: string): { limited: boolean; reset: number } {
  // Skip rate limiting in development mode for testing
  if (isDevelopment && (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1')) {
    return { limited: false, reset: Date.now() + RATE_LIMIT_WINDOW };
  }
  
  const now = Date.now();
  const rateLimit = rateLimitMap.get(ip);
  
  // If no previous requests or window expired, reset counter
  if (!rateLimit || now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { limited: false, reset: now + RATE_LIMIT_WINDOW };
  }
  
  // If under limit, increment counter
  if (rateLimit.count < MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, { count: rateLimit.count + 1, timestamp: rateLimit.timestamp });
    return { limited: false, reset: rateLimit.timestamp + RATE_LIMIT_WINDOW };
  }
  
  // Rate limited
  return { 
    limited: true, 
    reset: rateLimit.timestamp + RATE_LIMIT_WINDOW 
  };
}

// Helper to validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// New function to add a URL to the mock store for a specific user
function addMockUrlToUserStore(userId: string, url: any) {
  // Get existing URLs for this user or create new array
  const userUrls = mockUrlStore.get(userId) || [];
  
  // Add the URL to the user's array
  userUrls.push(url);
  
  // Update the store
  mockUrlStore.set(userId, userUrls);
  
  // Also store by shortId for redirect lookup
  if (url.shortId) {
    const lookupKey = 'shortid:' + String(url.shortId);
    mockUrlStore.set(lookupKey, [url]);
  }
  
  if (url.customPath) {
    const customPathKey = 'custompath:' + String(url.customPath);
    mockUrlStore.set(customPathKey, [url]);
  }
  
  console.log(`Stored mock URL with shortId: ${url.shortId ? String(url.shortId) : 'unknown'} for user ${userId}`);
  console.log(`User now has ${userUrls.length} URLs`);
}

// Helper to create mock URL data for development
function createMockUrl(data: any) {
  const shortId = data.customPath || nanoid(8);
  const mockUrl = {
    _id: `mock-${Date.now()}`,
    originalUrl: data.originalUrl,
    shortId,
    customPath: data.customPath || null,
    domain: data.domain || 'asvurl.com',
    userId: data.userId || TEST_USER_ID,
    userIdString: data.userIdString || data.userId || TEST_USER_ID,
    clicks: 0,
    createdAt: new Date(),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    analytics: {
      referrers: new Map(),
      browsers: new Map(),
      devices: new Map(),
      countries: new Map(),
    }
  };
  
  // Store the mock URL for lookup by user and shortId
  const userId = mockUrl.userIdString || mockUrl.userId;
  addMockUrlToUserStore(userId, mockUrl);
  
  return mockUrl;
}

// Mock function to find a URL by shortId or customPath
export function findMockUrl(id: string) {
  console.log(`Looking for mock URL with id: ${id}`);
  
  // Check if we have an entry for this shortId
  const shortIdKey = 'shortid:' + id;
  if (mockUrlStore.has(shortIdKey)) {
    const urls = mockUrlStore.get(shortIdKey);
    if (urls && urls.length > 0) {
      return urls[0];
    }
  }
  
  // Check if we have an entry for this customPath
  const customPathKey = 'custompath:' + id;
  if (mockUrlStore.has(customPathKey)) {
    const urls = mockUrlStore.get(customPathKey);
    if (urls && urls.length > 0) {
      return urls[0];
    }
  }
  
  // Look through all user entries
  for (const [key, urls] of mockUrlStore.entries()) {
    // Skip special keys
    if (key.startsWith('shortid:') || key.startsWith('custompath:')) {
      continue;
    }
    
    // Check each URL for matching shortId or customPath
    for (const url of urls) {
      if (url.shortId === id || url.customPath === id) {
        return url;
      }
    }
  }
  
  return null;
}

// Helper to handle user ID regardless of format
function handleUserId(userId: string | undefined | null): { userId: mongoose.Types.ObjectId | null, userIdString: string | null } {
  if (!userId) return { userId: null, userIdString: null };
  
  // If testing with the standard test user ID, just use it directly
  if (userId === TEST_USER_ID) {
    return {
      userId: null, // Don't try to convert test ID to ObjectId
      userIdString: TEST_USER_ID
    };
  }
  
  // If it looks like an ObjectId, convert it
  if (/^[0-9a-fA-F]{24}$/.test(userId)) {
    try {
      return { 
        userId: new mongoose.Types.ObjectId(userId),
        userIdString: userId
      };
    } catch (error) {
      console.error('Failed to convert userId to ObjectId:', error);
    }
  }
  
  // Otherwise, store as string only
  return { 
    userId: null,
    userIdString: userId
  };
}

// GET - Fetch URLs (with optional filtering)
export async function GET(req: NextRequest) {
  try {
    // Get auth options
    const authOptions = await authOptionsPromise;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { limited, reset } = checkRateLimit(ip);
    if (limited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
        }
      );
    }

    // Get user ID
    const userId = session.user.id;
    const isAdmin = !!session.user.isAdmin;
    console.log(`Fetching URLs for user: ${userId}${isAdmin ? ' (admin)' : ''}`);

    // Connect to database
    try {
      await connectToDatabase();

      let urls;

      // If user is admin, they can see all URLs
      if (isAdmin) {
        console.log("Admin user - fetching all URLs");
        urls = await Url.find({})
          .sort({ createdAt: -1 })
          .limit(500); // Higher limit for admins
        
        console.log(`Found ${urls.length} URLs (admin view)`);
      } else {
        // Regular user - build the query to find only their URLs
        const query: any = { $or: [] };
        
        // Check for ObjectId format
        if (/^[0-9a-fA-F]{24}$/.test(userId) && userId !== TEST_USER_ID) {
          query.$or.push({ userId: new mongoose.Types.ObjectId(userId) });
        }
        
        // Always check the string version
        query.$or.push({ userIdString: userId });
        
        console.log("URL query:", JSON.stringify(query));

        // Get URLs for the user - trying both userId and userIdString fields
        urls = await Url.find(query)
          .sort({ createdAt: -1 })
          .limit(100); // Limit results for performance

        console.log(`Found ${urls.length} URLs for user ${userId}`);
      }

      return NextResponse.json({ urls });
    } catch (dbError) {
      console.error('Database error fetching URLs:', dbError);
      
      // In development, return mock data
      if (isDevelopment) {
        console.log('Using mock data for development');
        
        // For admin users, return all mock URLs
        if (isAdmin) {
          console.log('Admin user - fetching all mock URLs');
          const allUrls: any[] = [];
          for (const [key, urls] of mockUrlStore.entries()) {
            // Skip special keys
            if (!key.startsWith('shortid:') && !key.startsWith('custompath:')) {
              allUrls.push(...urls);
            }
          }
          console.log(`Found ${allUrls.length} mock URLs (admin view)`);
          return NextResponse.json({ urls: allUrls });
        }
        
        // Regular user - get only this user's URLs from the mock store
        const userUrls = mockUrlStore.get(userId) || [];
        console.log(`Found ${userUrls.length} mock URLs for user ${userId}`);
        
        return NextResponse.json({ urls: userUrls });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}

// POST - Create a new short URL
export async function POST(req: NextRequest) {
  try {
    // Get auth options
    const authOptions = await authOptionsPromise;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logger.warn('Authentication required for URL creation', 'auth', { 
        ip: req.headers.get('x-forwarded-for') || 'unknown' 
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    logger.info('URL creation request', 'url', { userId: session.user.id });
    
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const result = urlSchema.safeParse(body);
    if (!result.success) {
      logger.warn('Invalid URL submission', 'url', { 
        userId: session.user.id,
        errors: result.error.format() 
      });
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { originalUrl, customPath, domain, expiresAt } = result.data;

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { limited, reset } = checkRateLimit(ip);
    if (limited) {
      logger.warn('Rate limit exceeded', 'middleware', {
        ip,
        endpoint: '/api/urls',
        method: 'POST'
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
        }
      );
    }

    // Get user session
    const userId = session?.user?.id;

    // Process user ID for database storage
    const { userId: processedUserId, userIdString } = handleUserId(userId);

    // Check if user is logged in for custom paths
    if (customPath && !userId && !isDevelopment) {
      logger.warn('Unauthenticated custom path request', 'url', { 
        ip,
        customPath
      });
      return NextResponse.json(
        { error: 'Authentication required for custom paths' },
        { status: 401 }
      );
    }

    try {
      // Connect to database
      await connectToDatabase();
      
      // Check if custom path already exists for this domain
      if (customPath) {
        const existingUrl = await Url.findOne({ 
          customPath, 
          domain: domain || 'asvurl.com' 
        });
        
        if (existingUrl) {
          logger.warn('Custom path already in use', 'url', {
            userId: session.user.id,
            customPath,
            domain: domain || 'asvurl.com'
          });
          return NextResponse.json(
            { error: 'Custom path already in use' },
            { status: 409 }
          );
        }
      }

      // Create new URL document
      const newUrl = new Url({
        originalUrl,
        customPath,
        domain: domain || 'asvurl.com',
        userId: processedUserId,
        userIdString,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        analytics: {
          referrers: new Map(),
          browsers: new Map(),
          devices: new Map(),
          countries: new Map(),
        }
      });

      await newUrl.save();
      logger.info('URL created successfully', 'url', {
        userId: session.user.id,
        urlId: newUrl._id ? newUrl._id.toString() : 'unknown',
        originalUrl,
        shortId: newUrl.shortId,
        customPath
      });

      // Construct the short URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
      const shortUrl = `${baseUrl}/${customPath || newUrl.shortId}`;

      return NextResponse.json({ 
        url: newUrl,
        shortUrl
      }, { status: 201 });
    } catch (dbError) {
      logger.error('Database error creating URL', 'database', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        userId: session.user.id,
        originalUrl
      });
      
      // In development, create a mock URL
      if (isDevelopment) {
        console.log('Using mock data for development');
        const mockUrl = createMockUrl({ 
          originalUrl, 
          customPath, 
          domain, 
          expiresAt,
          userId,
          userIdString: userId 
        });
        
        // Construct mock short URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
        const shortUrl = `${baseUrl}/${customPath || mockUrl.shortId}`;

        logger.info('Created mock URL for development', 'url', {
          userId: session.user.id,
          originalUrl,
          shortId: mockUrl.shortId,
          customPath
        });
        
        return NextResponse.json({ 
          url: mockUrl,
          shortUrl
        }, { status: 201 });
      }
      
      throw dbError;
    }
  } catch (error) {
    logger.error('Unhandled exception in URL creation', 'api', {
      route: '/api/urls',
      method: 'POST',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to create short URL' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a URL
export async function DELETE(req: NextRequest) {
  try {
    console.log('Processing DELETE request for URL');
    
    // Get auth options
    try {
      const authOptions = await authOptionsPromise;
      console.log('Auth options loaded successfully');
      
      // Check authentication
      const session = await getServerSession(authOptions);
      console.log('Session:', session ? 'Authenticated' : 'Not authenticated');
      
      if (!session?.user) {
        console.log('Authentication required - no session');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Parse URL to get ID and check for admin override
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const adminOverride = searchParams.get('adminOverride') === 'true';
      console.log(`Deleting URL with ID: ${id}, Admin Override: ${adminOverride}`);

      if (!id) {
        console.log('URL ID is required but not provided');
        return NextResponse.json(
          { error: 'URL ID is required' },
          { status: 400 }
        );
      }

      // Get user ID and check if admin
      const userId = session.user.id;
      const isAdmin = !!session.user.isAdmin;
      console.log(`User ID: ${userId}, Is Admin: ${isAdmin}`);

      // Check if attempting to use admin override without being an admin
      if (adminOverride && !isAdmin) {
        console.log('Unauthorized attempt to use admin override');
        return NextResponse.json(
          { error: 'Unauthorized admin override attempt' },
          { status: 403 }
        );
      }

      try {
        // Connect to database
        await connectToDatabase();
        console.log('Connected to database');

        // Find URL and check ownership - first try to find in database
        const url = await Url.findOne({
          $or: [
            { _id: /^[0-9a-fA-F]{24}$/.test(id) ? new mongoose.Types.ObjectId(id) : null },
            { shortId: id }
          ]
        });
        
        if (!url) {
          // Check in-memory store for development
          if (isDevelopment) {
            // Find in mock store
            const userUrls = mockUrlStore.get(userId) || [];
            const mockUrlIndex = userUrls.findIndex(url => 
              url._id === id || url.shortId === id
            );
            
            if (mockUrlIndex >= 0) {
              // Remove the URL from the user's array
              const mockUrl = userUrls[mockUrlIndex];
              userUrls.splice(mockUrlIndex, 1);
              mockUrlStore.set(userId, userUrls);
              
              // Remove from shortId and customPath lookups
              if (mockUrl.shortId) {
                mockUrlStore.delete('shortid:' + mockUrl.shortId);
              }
              if (mockUrl.customPath) {
                mockUrlStore.delete('custompath:' + mockUrl.customPath);
              }
              
              console.log(`Deleted mock URL with ID: ${id} for user ${userId}`);
              return NextResponse.json({ success: true });
            }
            
            return NextResponse.json(
              { error: 'URL not found or you do not have permission to delete it' },
              { status: 404 }
            );
          }
          
          return NextResponse.json(
            { error: 'URL not found' },
            { status: 404 }
          );
        }

        // Verify ownership - skip this check if admin override is used
        if (!adminOverride) {
          const isOwner = 
            (url.userId && url.userId.toString() === userId) || 
            (url.userIdString === userId);
            
          if (!isOwner) {
            console.log(`User ${userId} is not authorized to delete URL ${id}`);
            console.log(`URL belongs to: ${url.userIdString || url.userId}`);
            return NextResponse.json(
              { error: 'Not authorized to delete this URL' },
              { status: 403 }
            );
          }
        } else {
          console.log(`Admin override used for deleting URL ${id}`);
        }

        // Delete the URL
        await Url.findByIdAndDelete(url._id);
        console.log(`URL with ID ${id} successfully deleted`);

        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error('Database error deleting URL:', dbError);
        
        // In development, return success if it's a mock URL
        if (isDevelopment) {
          console.log('Using mock success for development');
          
          // Try to delete from user's URLs in mock store
          const userUrls = mockUrlStore.get(userId) || [];
          const mockUrlIndex = userUrls.findIndex(url => 
            url._id === id || url.shortId === id
          );
          
          if (mockUrlIndex >= 0) {
            // Remove the URL from the user's array
            const mockUrl = userUrls[mockUrlIndex];
            userUrls.splice(mockUrlIndex, 1);
            mockUrlStore.set(userId, userUrls);
            
            // Remove from shortId and customPath lookups
            if (mockUrl.shortId) {
              mockUrlStore.delete('shortid:' + mockUrl.shortId);
            }
            if (mockUrl.customPath) {
              mockUrlStore.delete('custompath:' + mockUrl.customPath);
            }
            
            console.log(`Deleted mock URL with ID: ${id} for user ${userId}`);
            return NextResponse.json({ success: true });
          }
          
          return NextResponse.json(
            { error: 'URL not found or you do not have permission to delete it' },
            { status: 404 }
          );
        }
        
        throw dbError;
      }
    } catch (authError) {
      console.error('Error loading auth options:', authError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete URL' },
      { status: 500 }
    );
  }
} 