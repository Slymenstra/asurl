import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Url } from '@/models/Url';
import { findMockUrl } from '@/app/api/urls/route';

// Helper to get device info from user agent
function getDeviceInfo(userAgent: string) {
  // Basic detection for demo purposes
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

// Helper to get browser info from user agent
function getBrowserInfo(userAgent: string) {
  // Basic detection for demo purposes
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/msie|trident/i.test(userAgent)) return 'IE';
  return 'Unknown';
}

// Redirect GET handler
export async function GET(
  req: NextRequest,
  { params }: { params: { shortId: string } }
) {
  // Extract shortId from URL to be safe
  const pathParts = req.nextUrl.pathname.split('/');
  const shortId = pathParts[pathParts.length - 1];
  
  console.log(`Redirection request for: ${shortId}`);

  if (!shortId) {
    console.error('Missing shortId parameter');
    return new NextResponse('Not found', { status: 404 });
  }

  // Get request headers for analytics
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || 'direct';
  const country = req.headers.get('x-country') || 'Unknown';

  try {
    // Connect to database
    await connectToDatabase();

    // Find URL by shortId or customPath
    let url = await Url.findOne({
      $or: [{ shortId }, { customPath: shortId }],
    });

    // If not found in database, check mock store for development
    if (!url && process.env.NODE_ENV !== 'production') {
      console.log('URL not found in database, checking mock store');
      const mockUrl = findMockUrl(shortId);
      
      if (mockUrl) {
        console.log('Found URL in mock store:', mockUrl);
        // If the URL has expired, return 404
        if (mockUrl.expiresAt && new Date(mockUrl.expiresAt) < new Date()) {
          console.log('URL has expired');
          return new NextResponse('URL has expired', { status: 404 });
        }

        // For mock URLs, just redirect to the original URL
        console.log(`Redirecting to: ${mockUrl.originalUrl}`);
        return NextResponse.redirect(mockUrl.originalUrl);
      }
    }

    if (!url) {
      console.log('URL not found');
      return new NextResponse('Not found', { status: 404 });
    }

    // Check if URL has expired
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      console.log('URL has expired');
      return new NextResponse('URL has expired', { status: 404 });
    }

    // Initialize analytics if missing
    if (!url.analytics) {
      url.analytics = {
        referrers: new Map<string, number>(),
        browsers: new Map<string, number>(),
        devices: new Map<string, number>(),
        countries: new Map<string, number>(),
      };
    }

    // Update analytics
    const browser = getBrowserInfo(userAgent);
    const device = getDeviceInfo(userAgent);
    
    // Safely update referrer counts
    try {
      // Handle referrers
      let referrers: Map<string, number>;
      if (url.analytics.referrers instanceof Map) {
        referrers = url.analytics.referrers;
      } else if (typeof url.analytics.referrers === 'object') {
        // Convert object to Map
        referrers = new Map<string, number>();
        Object.entries(url.analytics.referrers || {}).forEach(([key, value]) => {
          referrers.set(key, typeof value === 'number' ? value : 0);
        });
      } else {
        referrers = new Map<string, number>();
      }
      referrers.set(referer, (referrers.get(referer) || 0) + 1);
      
      // Handle browsers
      let browsers: Map<string, number>;
      if (url.analytics.browsers instanceof Map) {
        browsers = url.analytics.browsers;
      } else if (typeof url.analytics.browsers === 'object') {
        browsers = new Map<string, number>();
        Object.entries(url.analytics.browsers || {}).forEach(([key, value]) => {
          browsers.set(key, typeof value === 'number' ? value : 0);
        });
      } else {
        browsers = new Map<string, number>();
      }
      browsers.set(browser, (browsers.get(browser) || 0) + 1);
      
      // Handle devices
      let devices: Map<string, number>;
      if (url.analytics.devices instanceof Map) {
        devices = url.analytics.devices;
      } else if (typeof url.analytics.devices === 'object') {
        devices = new Map<string, number>();
        Object.entries(url.analytics.devices || {}).forEach(([key, value]) => {
          devices.set(key, typeof value === 'number' ? value : 0);
        });
      } else {
        devices = new Map<string, number>();
      }
      devices.set(device, (devices.get(device) || 0) + 1);
      
      // Handle countries
      let countries: Map<string, number>;
      if (url.analytics.countries instanceof Map) {
        countries = url.analytics.countries;
      } else if (typeof url.analytics.countries === 'object') {
        countries = new Map<string, number>();
        Object.entries(url.analytics.countries || {}).forEach(([key, value]) => {
          countries.set(key, typeof value === 'number' ? value : 0);
        });
      } else {
        countries = new Map<string, number>();
      }
      countries.set(country, (countries.get(country) || 0) + 1);
      
      // Update URL with new analytics
      url.analytics = {
        referrers,
        browsers,
        devices,
        countries,
      };
    } catch (analyticsError) {
      console.error('Error updating analytics:', analyticsError);
      // Continue even if analytics update fails
    }

    // Update click count and last clicked date
    url.clicks = (typeof url.clicks === 'number' ? url.clicks : 0) + 1;
    url.lastClickedAt = new Date();

    // Save the updated URL
    await url.save();

    console.log(`Redirecting to: ${url.originalUrl}`);
    return NextResponse.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error in redirect:', error);
    return new NextResponse('Server error', { status: 500 });
  }
} 