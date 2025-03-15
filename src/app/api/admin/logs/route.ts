import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateAuthOptions } from '../../auth/[...nextauth]/auth-options';
import { getLogs, LogLevel, LogSource } from '@/lib/logger';
import type { LogEntry as DatabaseLogEntry } from '@/lib/logger';

// Pre-generate auth options for server session
const authOptionsPromise = generateAuthOptions();

// Define the structure of log entries for the API
interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  source?: string;
  details?: any;
}

// This function is a placeholder - in a real implementation, this would read from log files
// or a logging service like Winston, Pino, or a database
function generateMockLogs(logType = 'all', timeRange: { from?: string; to?: string } = {}): LogEntry[] {
  const mockLogs: LogEntry[] = [];
  const now = new Date();
  
  // Authentication logs
  if (logType === 'all' || logType === 'auth') {
    mockLogs.push({
      timestamp: new Date(now.getTime() - 5000).toISOString(),
      level: 'info',
      message: 'User logged in successfully',
      source: 'auth',
      details: { userId: 'user123', method: 'credentials' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'error',
      message: 'Login attempt failed',
      source: 'auth',
      details: { reason: 'Invalid credentials', ipAddress: '192.168.1.1' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      level: 'warn',
      message: 'Multiple failed login attempts',
      source: 'auth',
      details: { attempts: 5, ipAddress: '192.168.1.2', action: 'temporary lockout' }
    });
  }
  
  // Database logs
  if (logType === 'all' || logType === 'system') {
    mockLogs.push({
      timestamp: new Date(now.getTime() - 15000).toISOString(),
      level: 'error',
      message: 'Failed to connect to database',
      source: 'database',
      details: { error: 'Connection timeout', retries: 3 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 7200000).toISOString(),
      level: 'info',
      message: 'Database connection established',
      source: 'database',
      details: { connectionId: 'conn_123', poolSize: 5 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      level: 'info',
      message: 'Database backup completed',
      source: 'database',
      details: { backupSize: '250MB', duration: '45s' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
      level: 'warn',
      message: 'High CPU usage detected',
      source: 'system',
      details: { cpuUsage: '92%', duration: '5m' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      level: 'info',
      message: 'System restart scheduled',
      source: 'system',
      details: { scheduledTime: new Date(now.getTime() + 3600000).toISOString(), reason: 'Maintenance' }
    });
  }
  
  // URL operation logs
  if (logType === 'all' || logType === 'url') {
    mockLogs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: 'URL shortened successfully',
      source: 'url',
      details: { originalUrl: 'https://example.com/very/long/path?with=parameters', shortId: 'abc123' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'info',
      message: 'Redirect processed',
      source: 'url',
      details: { shortId: 'xyz789', destination: 'https://example.org', clicks: 42 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
      level: 'warn',
      message: 'Invalid URL format detected',
      source: 'url',
      details: { attemptedUrl: 'not-a-valid-url', userId: 'user456' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 86400000 * 1.5).toISOString(), // 1.5 days ago
      level: 'error',
      message: 'Failed to delete URL',
      source: 'url',
      details: { shortId: 'def456', error: 'Database error' }
    });
  }
  
  // Error logs
  if (logType === 'all' || logType === 'error') {
    mockLogs.push({
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      level: 'error',
      message: 'Unhandled exception in API route',
      source: 'api',
      details: { 
        route: '/api/urls', 
        method: 'POST', 
        error: 'TypeError: Cannot read property of undefined', 
        stack: 'Error: at /app/api/urls/route.ts:42:10' 
      }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 3600000 * 5).toISOString(),
      level: 'error',
      message: 'Redis cache failure',
      source: 'cache',
      details: { operation: 'set', key: 'user:123:profile', error: 'Connection refused' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      level: 'error',
      message: 'Failed to process payment',
      source: 'billing',
      details: { userId: 'user456', amount: '$19.99', error: 'Card declined' }
    });
  }
  
  // Rate limiting logs
  if (logType === 'all' || logType === 'system') {
    mockLogs.push({
      timestamp: new Date(now.getTime() - 10000).toISOString(),
      level: 'warn',
      message: 'Rate limit approaching for IP: 192.168.1.1',
      source: 'middleware',
      details: { ip: '192.168.1.1', requestCount: 95, limit: 100 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 15000).toISOString(),
      level: 'warn',
      message: 'Rate limit exceeded',
      source: 'middleware',
      details: { ip: '192.168.1.5', requestCount: 102, limit: 100, action: 'block' }
    });
  }
  
  // Filter logs by time range if provided
  if (timeRange.from || timeRange.to) {
    return mockLogs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      
      if (timeRange.from && timeRange.to) {
        const fromTime = new Date(timeRange.from).getTime();
        const toTime = new Date(timeRange.to).getTime();
        return logTime >= fromTime && logTime <= toTime;
      } else if (timeRange.from) {
        const fromTime = new Date(timeRange.from).getTime();
        return logTime >= fromTime;
      } else if (timeRange.to) {
        const toTime = new Date(timeRange.to).getTime();
        return logTime <= toTime;
      }
      
      return true;
    });
  }
  
  return mockLogs;
}

// This function retrieves logs from the database
async function getServerLogs(logType = 'all', timeRange: { from?: string; to?: string } = {}): Promise<LogEntry[]> {
  try {
    // Parse time range
    const from = timeRange.from ? new Date(timeRange.from) : undefined;
    const to = timeRange.to ? new Date(timeRange.to) : undefined;
    
    // Map the logType to a source if needed
    let source: LogSource | 'all' = 'all';
    let level: LogLevel | 'all' = 'all';
    
    // Handle different log type filters
    if (logType === 'error') {
      level = 'error';
    } else if (['auth', 'url', 'system'].includes(logType)) {
      source = logType as LogSource;
    }
    
    // Get logs from database
    const logs = await getLogs({
      level,
      source,
      from,
      to,
      limit: 100
    });
    
    // If no logs found and we're in development, return mock logs
    if (logs.length === 0 && process.env.NODE_ENV !== 'production') {
      console.log('No logs found in database, returning mock logs');
      return generateMockLogs(logType, timeRange);
    }
    
    // Format the log entries to match the expected format
    return logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      source: log.source,
      details: log.details
    }));
  } catch (error) {
    console.error('Error retrieving logs:', error);
    
    // In development mode, fall back to mock logs
    if (process.env.NODE_ENV !== 'production') {
      console.log('Error retrieving logs, falling back to mock logs');
      return generateMockLogs(logType, timeRange);
    }
    
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get auth options
    const authOptions = await authOptionsPromise;
    
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const logType = searchParams.get('type') || 'all';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    
    // Create time range object
    const timeRange = {
      from,
      to
    };
    
    // Get logs
    const logs = await getServerLogs(logType, timeRange);
    
    // Return logs
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
} 