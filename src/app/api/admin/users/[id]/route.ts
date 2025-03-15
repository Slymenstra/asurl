import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateAuthOptions } from '../../../auth/[...nextauth]/auth-options';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

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

// GET a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const db = await connectToDatabase();
    
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    // Get User model
    const User = db.models.User;
    
    if (!User) {
      return NextResponse.json(
        { error: 'User model not found' },
        { status: 500 }
      );
    }
    
    // Find the user by ID
    const user = await User.findById(userId).select('-password').lean();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Count URLs created by this user
    const Url = db.models.Url;
    let urlsCreated = 0;
    
    if (Url) {
      urlsCreated = await Url.countDocuments({ 
        $or: [
          { userId: user._id },
          { userIdString: user._id.toString() }
        ]
      });
    }
    
    // Transform the MongoDB document to a clean format
    const transformedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin || false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      urlsCreated: user.urlsCreated || urlsCreated || 0
    };
    
    return NextResponse.json({ user: transformedUser });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    await logger.error('Failed to fetch user', 'system', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// UPDATE a user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const db = await connectToDatabase();
    
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    // Get User model
    const User = db.models.User;
    
    if (!User) {
      return NextResponse.json(
        { error: 'User model not found' },
        { status: 500 }
      );
    }
    
    // Find the user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if email is being changed and if it's already in use
    if (body.email !== user.email) {
      const existingUser = await User.findOne({ email: body.email });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 409 }
        );
      }
    }
    
    // Update user fields
    user.name = body.name;
    user.email = body.email;
    user.isAdmin = body.isAdmin || false;
    
    // Update password if provided
    if (body.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(body.password, salt);
    }
    
    await user.save();
    
    // Log the action
    await logger.info('User updated', 'auth', { 
      userId: user._id.toString(),
      email: body.email,
      isAdmin: body.isAdmin || false
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    await logger.error('Failed to update user', 'auth', { error });
    
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE a user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get session information to prevent deleting own account
    const authOptions = await authOptionsPromise;
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const db = await connectToDatabase();
    
    if (!db) {
      throw new Error('Failed to connect to database');
    }
    
    // Get User model
    const User = db.models.User;
    
    if (!User) {
      return NextResponse.json(
        { error: 'User model not found' },
        { status: 500 }
      );
    }
    
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Log the action
    await logger.info('User deleted', 'auth', { 
      userId,
      email: deletedUser.email,
      admin: session?.user?.email
    });
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    await logger.error('Failed to delete user', 'auth', { error });
    
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 