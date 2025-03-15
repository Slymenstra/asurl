import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { connectToDatabase } from '@/lib/db';

// Define a consistent test user ID for development
export const TEST_USER_ID = 'test-user-id-123';

// Connection settings
const isDevelopment = process.env.NODE_ENV !== 'production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asvurl';

// Check if we should use the mock adapter based on environment variables only (no fs checks)
const useDevMock = isDevelopment && (
  !MONGODB_URI || 
  MONGODB_URI.includes('testuser:testpassword') || 
  process.env.USE_MOCK_DB === 'true'
);

console.log(`Auth config - Development mode: ${isDevelopment}, Using mock: ${useDevMock}`);

// Development test user credentials
const TEST_USER = {
  id: TEST_USER_ID,
  name: 'Test User',
  email: 'admin@example.com',
  image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
  isAdmin: true, // Make the test user an admin
};
export const TEST_PASSWORD = 'password';

// For development without MongoDB, create a simple adapter
const mockAdapter = {
  createUser: async (userData: any) => ({ id: TEST_USER_ID, ...userData }),
  getUser: async (id: string) => (id === TEST_USER_ID ? TEST_USER : null),
  getUserByEmail: async (email: string) => (email === TEST_USER.email ? TEST_USER : null),
  getUserByAccount: async () => TEST_USER,
  updateUser: async (userData: any) => ({ id: TEST_USER_ID, ...userData }),
  deleteUser: async () => ({ id: TEST_USER_ID }),
  linkAccount: async () => ({ id: 'mock-account-id' }),
  unlinkAccount: async () => {},
  createSession: async () => ({ sessionToken: 'mock-session-token', userId: TEST_USER_ID, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
  getSessionAndUser: async () => ({
    session: { sessionToken: 'mock-session-token', userId: TEST_USER_ID, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    user: TEST_USER,
  }),
  updateSession: async () => ({ sessionToken: 'mock-session-token', userId: TEST_USER_ID, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
  deleteSession: async () => {},
  createVerificationToken: async () => ({ token: 'mock-verification-token', expires: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
  useVerificationToken: async () => ({ token: 'mock-verification-token', expires: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
};

// Helper function to verify password - only used on the server side
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    // Import bcrypt dynamically
    const bcrypt = await import('bcrypt').then(mod => mod.default);
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Generate the auth options
export const generateAuthOptions = async (): Promise<NextAuthOptions> => {
  // Import modules dynamically
  const { MongoDBAdapter } = await import('@auth/mongodb-adapter');
  const { MongoClient, ServerApiVersion } = await import('mongodb');
  const fs = await import('fs');
  const path = await import('path');
  
  // Create the MongoDB client promise for the adapter
  let clientPromise: Promise<any>;
  
  if (useDevMock) {
    console.warn('⚠️ NextAuth using mock adapter for development');
    const mockClient = {
      db: () => ({
        collection: () => ({
          findOne: async () => null,
          find: () => ({ toArray: async () => [] }),
          insertOne: async () => ({ insertedId: 'mock-id' }),
          updateOne: async () => ({ modifiedCount: 1 }),
        }),
      }),
      close: async () => {},
    };
    clientPromise = Promise.resolve(mockClient);
  } else {
    // Set up MongoDB connection
    const isAtlasConnection = MONGODB_URI?.includes('mongodb+srv');
    const options: any = {};

    // If using MongoDB Atlas with X.509 authentication
    if (isAtlasConnection) {
      const CERT_PATH = process.env.MONGODB_CERT_PATH || 
        path.resolve(process.cwd(), 'certs', 'X509-cert-MongoDBAtlas-Dev.pem');
      
      // Check if certificate file exists - now safely on server
      if (fs.existsSync(CERT_PATH)) {
        options.tlsCertificateKeyFile = CERT_PATH;
        options.serverApi = ServerApiVersion.v1;
        console.log('NextAuth MongoDBAdapter using X.509 certificate authentication');
      } else {
        console.warn(`Certificate file not found for NextAuth at ${CERT_PATH}. Falling back to standard connection.`);
      }
    }

    try {
      const client = new MongoClient(MONGODB_URI, options);
      await client.connect();
      clientPromise = Promise.resolve(client);
    } catch (error) {
      console.error('Error connecting to MongoDB for NextAuth:', error);
      
      if (isDevelopment) {
        // Return a mock client for development
        console.warn('⚠️ Falling back to mock client for NextAuth in development');
        const mockClient = {
          db: () => ({
            collection: () => ({
              findOne: async () => null,
              find: () => ({ toArray: async () => [] }),
              insertOne: async () => ({ insertedId: 'mock-id' }),
              updateOne: async () => ({ modifiedCount: 1 }),
            }),
          }),
          close: async () => {},
        };
        clientPromise = Promise.resolve(mockClient);
      } else {
        throw error;
      }
    }
  }
  
  return {
    adapter: useDevMock ? (mockAdapter as any) : MongoDBAdapter(clientPromise),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      }),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          try {
            // For development without MongoDB, allow a test user
            if (isDevelopment && credentials.email === TEST_USER.email && credentials.password === TEST_PASSWORD) {
              console.log('✅ Using test user for development:', TEST_USER.email);
              return TEST_USER;
            }

            // Import User model dynamically to avoid client-side imports
            const { User } = await import('@/models/User');

            await connectToDatabase();
            const user = await User.findOne({ email: credentials.email });

            if (!user) {
              console.log('❌ User not found:', credentials.email);
              return null;
            }

            // Use our server-side only verification function
            const isPasswordValid = await verifyPassword(credentials.password, user.password);

            if (!isPasswordValid) {
              console.log('❌ Invalid password for user:', credentials.email);
              return null;
            }

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              image: user.image,
              isAdmin: user.isAdmin,
            };
          } catch (error) {
            console.error('Authentication error:', error);
            return null;
          }
        },
      }),
    ],
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          // Add isAdmin flag to token if present on user
          if (typeof user.isAdmin !== 'undefined') {
            token.isAdmin = user.isAdmin;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id as string;
          // Pass isAdmin flag to session if present on token
          if (typeof token.isAdmin !== 'undefined') {
            session.user.isAdmin = token.isAdmin as boolean;
          }
        }
        return session;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-default-secret-do-not-use-in-production',
    debug: isDevelopment,
  };
}; 