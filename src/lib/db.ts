'use server';

import path from 'path';
import fs from 'fs';

// Connection settings
const isProduction = process.env.NODE_ENV === 'production';
const isAtlasConnection = process.env.MONGODB_URI?.includes('mongodb+srv');
const isDevelopment = process.env.NODE_ENV !== 'production';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asvurl';

// Initialize references to dynamically imported modules
let mongoose: any = null;
let ServerApiVersion: any = null;

// Global mongoose connection variable
let cached: {
  mongoose: {
    conn: any;
    promise: Promise<any> | null;
    mockConn?: any;
  };
} = {
  mongoose: { conn: null, promise: null }
};

// Check if we're in a global context (Node.js) and set up the cache
if (typeof global !== 'undefined') {
  const globalAny = global as any;
  if (!globalAny.mongooseCache) {
    globalAny.mongooseCache = { conn: null, promise: null };
  }
  cached.mongoose = globalAny.mongooseCache;
}

/**
 * Connect to MongoDB
 * This utility function creates a cached connection to prevent new connections on every request
 */
export async function connectToDatabase() {
  console.log('Connecting to database...');
  
  // Only run on the server side
  if (typeof window !== 'undefined') {
    console.error('Database connection should not be called on the client side');
    return null;
  }

  // Dynamically import mongoose and mongodb
  if (!mongoose) {
    try {
      console.log('Importing mongoose and mongodb...');
      mongoose = (await import('mongoose')).default;
      const mongodb = await import('mongodb');
      ServerApiVersion = mongodb.ServerApiVersion;
      console.log('Modules imported successfully');
    } catch (importError) {
      console.error('Error importing database modules:', importError);
      throw new Error('Failed to import database modules');
    }
  }

  // In development, if no valid MongoDB URI is provided, return a mock connection
  if (isDevelopment && (!MONGODB_URI || MONGODB_URI.includes('testuser:testpassword'))) {
    console.warn('⚠️ Using development mode without a valid MongoDB connection');
    console.warn('⚠️ Database operations will not work, but the app will run for UI development');
    
    if (!cached.mongoose.mockConn) {
      cached.mongoose.mockConn = {
        models: {},
        model: () => ({
          findOne: async () => null,
          find: async () => [],
          create: async () => ({}),
        }),
      };
    }
    
    return cached.mongoose.mockConn;
  }

  if (cached.mongoose.conn) {
    console.log('Using cached database connection');
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    console.log('Creating new database connection');
    // Set connection options based on environment and connection type
    let options: any = {
      bufferCommands: true,
    };

    // If using MongoDB Atlas with X.509 authentication
    if (isAtlasConnection) {
      const CERT_PATH = process.env.MONGODB_CERT_PATH || 
        path.resolve(process.cwd(), 'certs', 'X509-cert-MongoDBAtlas-Dev.pem');
      
      // Check if certificate file exists
      if (fs.existsSync(CERT_PATH)) {
        options = {
          ...options,
          tlsCertificateKeyFile: CERT_PATH,
          serverApi: ServerApiVersion.v1,
        };
        console.log('Using X.509 certificate authentication for MongoDB Atlas');
      } else {
        console.warn(`Certificate file not found at ${CERT_PATH}. Falling back to standard connection.`);
      }
    }

    cached.mongoose.promise = mongoose.connect(MONGODB_URI, options)
      .then((mongooseInstance: any) => {
        console.log(`Connected to MongoDB${isAtlasConnection ? ' Atlas' : ''}`);
        return mongooseInstance;
      })
      .catch((error: any) => {
        console.error('Error connecting to MongoDB:', error);
        
        // In development, provide a mock connection on failure
        if (isDevelopment) {
          console.warn('⚠️ Falling back to mock database for development');
          if (!cached.mongoose.mockConn) {
            cached.mongoose.mockConn = {
              models: {},
              model: () => ({
                findOne: async () => null,
                find: async () => [],
                create: async () => ({}),
                findByIdAndDelete: async () => ({}),
                save: async () => ({}),
              }),
            };
          }
          return cached.mongoose.mockConn;
        }
        
        throw error;
      });
  }

  try {
    console.log('Awaiting database connection...');
    cached.mongoose.conn = await cached.mongoose.promise;
    console.log('Database connection established');
  } catch (e) {
    console.error('Error finalizing database connection:', e);
    cached.mongoose.promise = null;
    throw e;
  }

  return cached.mongoose.conn;
} 