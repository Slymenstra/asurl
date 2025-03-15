import mongoose, { Schema, Model } from 'mongoose';

// Only import bcrypt on the server side
let bcrypt: any = null;
if (typeof window === 'undefined') {
  // We're on the server
  bcrypt = require('bcrypt');
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  image?: string;
  customDomains?: string[];
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword?: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    image: {
      type: String,
    },
    customDomains: {
      type: [String],
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Only add these methods on the server side
if (typeof window === 'undefined' && bcrypt) {
  // Hash password before saving
  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Method to compare password - only on server
  UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      return false;
    }
  };
}

// Use a function to create the model to avoid issues with NextJS hot reloading
const getUserModel = (): Model<IUser> => {
  // Delete the User model if it exists to prevent overwrite error in development
  return (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser>;
};

export const User = getUserModel(); 