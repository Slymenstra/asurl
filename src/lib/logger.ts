import { connectToDatabase } from './db';
import mongoose from 'mongoose';

// Define log levels
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Define log sources
export type LogSource = 'auth' | 'url' | 'api' | 'database' | 'system' | 'middleware' | 'redirect' | 'cache' | 'billing';

// Define log entry interface
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: LogSource;
  details?: any;
}

// Set up a flag to track if we've tried to create logs
let hasAttemptedLogging = false;
// Track failed log attempts to avoid flooding console
let failedLogAttempts = 0;
const MAX_FAILED_LOG_REPORTS = 5;

// Export for db-status API
export { hasAttemptedLogging };

// Define MongoDB schema for logs
const LogSchema = new mongoose.Schema<LogEntry>({
  timestamp: { type: Date, default: Date.now, index: true },
  level: { type: String, required: true, index: true },
  message: { type: String, required: true },
  source: { type: String, required: true, index: true },
  details: { type: mongoose.Schema.Types.Mixed }
});

// Create or retrieve the Log model
export function getLogModel() {
  try {
    // Check if the model is already defined to prevent overwriting
    return mongoose.models.Log as mongoose.Model<LogEntry> || 
      mongoose.model<LogEntry>('Log', LogSchema);
  } catch (error) {
    console.error('Error creating Log model:', error);
    // Return a dummy model for development
    if (process.env.NODE_ENV !== 'production') {
      return {
        create: async () => ({}),
        find: async () => [],
        findOne: async () => null
      } as any;
    }
    throw error;
  }
}

// In-memory store for logs if DB fails
let memoryLogs: LogEntry[] = [];

// Main logger function
export async function log(
  level: LogLevel,
  message: string,
  source: LogSource,
  details?: any
): Promise<void> {
  // Always console log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[${new Date().toISOString()}] [${level.toUpperCase()}] [${source}]: ${message}`,
      details ? details : ''
    );
  }
  
  try {
    // First, ensure we have a database connection
    const db = await connectToDatabase();
    
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    // Get the Log model
    const Log = getLogModel();
    
    // Create the log entry
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      source,
      details
    };
    
    // Store in memory for backup
    memoryLogs.push(logEntry);
    
    // Keep memory logs limited to 1000 entries
    if (memoryLogs.length > 1000) {
      memoryLogs = memoryLogs.slice(-1000);
    }
    
    // Try to save to DB
    await Log.create(logEntry);
    
    // Mark that we've attempted logging
    hasAttemptedLogging = true;
    
    // Reset failed attempts counter
    failedLogAttempts = 0;
  } catch (error) {
    // Only report the first few failures to avoid console spam
    if (failedLogAttempts < MAX_FAILED_LOG_REPORTS) {
      console.error('Failed to write log to database:', error);
      failedLogAttempts++;
      
      if (failedLogAttempts === MAX_FAILED_LOG_REPORTS) {
        console.warn(`Suppressing further log failure messages after ${MAX_FAILED_LOG_REPORTS} attempts`);
      }
    }
  }
}

// Convenience methods for different log levels
export const logger = {
  info: (message: string, source: LogSource, details?: any) => 
    log('info', message, source, details),
  
  warn: (message: string, source: LogSource, details?: any) => 
    log('warn', message, source, details),
  
  error: (message: string, source: LogSource, details?: any) => 
    log('error', message, source, details),
  
  debug: (message: string, source: LogSource, details?: any) => 
    log('debug', message, source, details),
    
  // Helper to log API errors with more context
  apiError: (error: any, req: Request, source = 'api' as LogSource) => {
    const url = new URL(req.url);
    const details = {
      route: url.pathname,
      method: req.method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    return log('error', `API error in ${url.pathname}`, source, details);
  }
};

// Utility function to retrieve logs from database
export async function getLogs(
  options: {
    level?: LogLevel | 'all';
    source?: LogSource | 'all';
    from?: Date;
    to?: Date;
    limit?: number;
  } = {}
): Promise<LogEntry[]> {
  try {
    await connectToDatabase();
    const Log = getLogModel();
    
    // Build query
    const query: any = {};
    
    // Filter by level if specified
    if (options.level && options.level !== 'all') {
      query.level = options.level;
    }
    
    // Filter by source if specified
    if (options.source && options.source !== 'all') {
      query.source = options.source;
    }
    
    // Filter by date range if specified
    if (options.from || options.to) {
      query.timestamp = {};
      
      if (options.from) {
        query.timestamp.$gte = options.from;
      }
      
      if (options.to) {
        query.timestamp.$lte = options.to;
      }
    }
    
    // Execute query and get results
    const dbLogs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 100)
      .lean();
      
    if (dbLogs && dbLogs.length > 0) {
      return dbLogs;
    }
    
    // If we've attempted to log but have no DB logs, return memory logs
    if (hasAttemptedLogging && memoryLogs.length > 0) {
      console.log('Returning logs from memory cache');
      
      // Filter memory logs same as we would DB logs
      let filteredLogs = [...memoryLogs];
      
      if (options.level && options.level !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === options.level);
      }
      
      if (options.source && options.source !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.source === options.source);
      }
      
      if (options.from || options.to) {
        filteredLogs = filteredLogs.filter(log => {
          const timestamp = log.timestamp.getTime();
          
          if (options.from && options.to) {
            return timestamp >= options.from.getTime() && timestamp <= options.to.getTime();
          } else if (options.from) {
            return timestamp >= options.from.getTime();
          } else if (options.to) {
            return timestamp <= options.to.getTime();
          }
          
          return true;
        });
      }
      
      // Sort by timestamp descending
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Limit results
      return filteredLogs.slice(0, options.limit || 100);
    }
    
    return [];
  } catch (error) {
    console.error('Error retrieving logs:', error);
    
    // Return memory logs on error
    if (memoryLogs.length > 0) {
      console.log('Returning logs from memory cache after error');
      return memoryLogs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, options.limit || 100);
    }
    
    return [];
  }
} 