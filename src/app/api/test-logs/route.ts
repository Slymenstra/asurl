import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { generateAuthOptions } from '../auth/[...nextauth]/auth-options';

// Pre-generate auth options for server session
const authOptionsPromise = generateAuthOptions();

// GET endpoint to generate test logs
export async function GET(request: NextRequest) {
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
    
    // Only admins can generate test logs
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get number of logs to generate
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5', 10);
    const limitedCount = Math.min(Math.max(count, 1), 20); // Between 1 and 20
    
    console.log(`Generating ${limitedCount} test logs`);
    
    // Generate test logs
    const logPromises = [];
    
    // Info logs
    logPromises.push(
      logger.info('Test log entry - info level', 'system', {
        test: true,
        timestamp: new Date().toISOString(),
        user: session.user.id
      })
    );
    
    // Warn logs
    logPromises.push(
      logger.warn('Test log entry - warning level', 'system', {
        test: true,
        timestamp: new Date().toISOString(),
        user: session.user.id
      })
    );
    
    // Error logs
    logPromises.push(
      logger.error('Test log entry - error level', 'system', {
        test: true,
        timestamp: new Date().toISOString(),
        user: session.user.id
      })
    );
    
    // Debug logs
    logPromises.push(
      logger.debug('Test log entry - debug level', 'system', {
        test: true,
        timestamp: new Date().toISOString(),
        user: session.user.id
      })
    );
    
    // Various sources
    const sources: ('auth' | 'url' | 'api' | 'database' | 'middleware' | 'redirect')[] = 
      ['auth', 'url', 'api', 'database', 'middleware', 'redirect'];
    
    // Generate additional logs based on count
    for (let i = 0; i < limitedCount - 4; i++) {
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      logPromises.push(
        logger.info(`Test log entry ${i + 1}`, randomSource, {
          test: true,
          randomValue: Math.random(),
          timestamp: new Date().toISOString(),
          user: session.user.id
        })
      );
    }
    
    // Wait for all logs to be created
    await Promise.all(logPromises);
    
    return NextResponse.json({
      success: true,
      message: `Generated ${limitedCount} test log entries`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating test logs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate test logs',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 