import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateAuthOptions } from '../../auth/[...nextauth]/auth-options';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

// Pre-generate auth options for server session
const authOptionsPromise = generateAuthOptions();

// Function to check if a user is an admin
async function isAdmin(req: NextRequest) {
  try {
    const authOptions = await authOptionsPromise;
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated and is an admin
    if (!session?.user || !session.user.isAdmin) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Handle GET requests to fetch users
export async function GET(request: NextRequest) {
  try {
    // Check if the user is an admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    const db = await connectToDatabase();
    
    if (!db) {
      console.warn('Database connection failed, using mock data');
      return NextResponse.json({ users: generateMockUsers() });
    }
    
    // Get User model
    const User = db.models.User;
    
    if (!User) {
      console.warn('User model not found, using mock data');
      return NextResponse.json({ users: generateMockUsers() });
    }
    
    try {
      // Fetch all users from the database
      const users = await User.find({})
        .select('name email image isAdmin createdAt urlsCreated lastLogin')
        .lean();
      
      // Count URLs for each user if that data is not already in the user object
      const Url = db.models.Url;
      
      if (Url && users.length > 0 && !users[0]?.urlsCreated) {
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          const urlCount = await Url.countDocuments({ 
            $or: [
              { userId: user._id },
              { userIdString: user._id.toString() }
            ]
          });
          
          users[i].urlsCreated = urlCount;
        }
      }
      
      // Transform the MongoDB documents to a clean format
      const transformedUsers = users.map((user: any) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        urlsCreated: user.urlsCreated || 0
      }));
      
      // If no users are found and we're in development, return mock data
      if (transformedUsers.length === 0 && process.env.NODE_ENV !== 'production') {
        console.log('No users found in database, using mock data');
        return NextResponse.json({ users: generateMockUsers() });
      }
      
      return NextResponse.json({ users: transformedUsers });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // In development, use mock data as fallback
      if (process.env.NODE_ENV !== 'production') {
        console.log('Falling back to mock data due to database error');
        return NextResponse.json({ users: generateMockUsers() });
      }
      
      throw dbError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    await logger.error('Failed to fetch users', 'system', { error });
    
    // Final fallback to mock data in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock data as final fallback');
      return NextResponse.json({ users: generateMockUsers() });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Function to generate mock users for development
function generateMockUsers() {
  console.log('Generating mock users for development');
  return [
    {
      id: 'test-user-id-123',
      name: 'Admin User',
      email: 'admin@example.com',
      image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      urlsCreated: 5
    },
    {
      id: 'user-2',
      name: 'Regular User',
      email: 'user@example.com',
      isAdmin: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      urlsCreated: 12
    },
    {
      id: 'user-3',
      name: 'New User',
      email: 'new@example.com',
      isAdmin: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      urlsCreated: 0
    }
  ];
}

// Handle POST requests to create a new user
export async function POST(request: NextRequest) {
  let requestBody;
  
  try {
    // Check if the user is an admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    requestBody = await request.json();
    
    // Validate required fields
    if (!requestBody.name || !requestBody.email || !requestBody.password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const db = await connectToDatabase();
    
    if (!db) {
      console.warn('Database connection failed for user creation');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Simulating successful user creation in development mode');
        return simulateSuccessfulUserCreation(requestBody);
      }
      
      throw new Error('Failed to connect to database');
    }
    
    // Get User model
    const User = db.models.User;
    
    if (!User) {
      console.warn('User model not found for user creation');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Simulating successful user creation in development mode');
        return simulateSuccessfulUserCreation(requestBody);
      }
      
      return NextResponse.json(
        { error: 'User model not found' },
        { status: 500 }
      );
    }
    
    try {
      // Check if a user with the same email already exists
      const existingUser = await User.findOne({ email: requestBody.email });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(requestBody.password, salt);
      
      // Create the new user
      const newUser = await User.create({
        name: requestBody.name,
        email: requestBody.email,
        password: hashedPassword,
        isAdmin: requestBody.isAdmin || false,
        createdAt: new Date()
      });
      
      // Log the action
      await logger.info('User created', 'auth', { 
        userId: newUser._id.toString(),
        email: requestBody.email,
        isAdmin: requestBody.isAdmin || false
      });
      
      return NextResponse.json({
        success: true,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          isAdmin: newUser.isAdmin || false,
          createdAt: newUser.createdAt
        }
      }, { status: 201 });
    } catch (dbError) {
      console.error('Database operation failed during user creation:', dbError);
      
      // In development, simulate successful creation
      if (process.env.NODE_ENV !== 'production') {
        console.log('Falling back to simulated user creation due to database error');
        return simulateSuccessfulUserCreation(requestBody);
      }
      
      throw dbError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('Error creating user:', error);
    await logger.error('Failed to create user', 'auth', { error });
    
    // Final fallback in development mode
    if (process.env.NODE_ENV !== 'production' && requestBody) {
      console.log('Using simulated creation as final fallback');
      return simulateSuccessfulUserCreation(requestBody);
    }
    
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Function to simulate successful user creation in development mode
function simulateSuccessfulUserCreation(userData: any) {
  console.log('Simulating successful user creation for:', userData.email);
  
  // Add this user to our session storage if possible, or you could use localStorage
  // This would allow the simulated user to be used for login in development mode
  
  return NextResponse.json({
    success: true,
    user: {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date().toISOString()
    },
    note: 'This is a simulated user creation in development mode. The user will not be saved to the database.'
  }, { status: 201 });
} 