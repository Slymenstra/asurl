import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateAuthOptions } from '../../auth/[...nextauth]/auth-options';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import { getLogModel, hasAttemptedLogging } from '@/lib/logger';

// Pre-generate auth options for server session
const authOptionsPromise = generateAuthOptions();

// Define response type
interface DbStatusResponse {
  connected: boolean;
  logsWorking: boolean;
  stats: {
    urls: number;
    logs: number;
    collections: string[];
  };
  error?: string;
  lastChecked: Date;
}

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
    
    // Only admins can access DB status
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Check database connection
    const db = await connectToDatabase();
    
    // Prepare response
    const response: DbStatusResponse = {
      connected: !!db,
      logsWorking: false,
      stats: {
        urls: 0,
        logs: 0,
        collections: []
      },
      lastChecked: new Date()
    };
    
    if (db) {
      try {
        // Get collection names
        let collections: string[] = [];
        
        // Check if we're using a mock database
        if (typeof db.db === 'function') {
          // Get all collections
          const collectionsArray = await db.db().collections();
          collections = collectionsArray.map((c: any) => c.collectionName);
          
          // Count URLs
          if (collections.includes('urls')) {
            response.stats.urls = await db.models.Url?.countDocuments() || 0;
          }
          
          // Check logs
          const Log = getLogModel();
          
          // Count logs
          if (collections.includes('logs')) {
            response.stats.logs = await Log.countDocuments() || 0;
          }
          
          // Check if the logging system is working by attempting a test log
          // or checking if we've successfully logged before
          response.logsWorking = response.stats.logs > 0 || !!hasAttemptedLogging;
        } else {
          // Using mock database
          response.stats.collections = ['mock_collections'];
          response.logsWorking = false;
        }
        
        response.stats.collections = collections;
      } catch (dbError) {
        console.error('Error getting database stats:', dbError);
        response.error = 'Connected but failed to query database statistics';
      }
    } else {
      response.error = 'Failed to connect to database';
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking database status:', error);
    
    const errorResponse: DbStatusResponse = {
      connected: false,
      logsWorking: false,
      stats: { urls: 0, logs: 0, collections: [] },
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 