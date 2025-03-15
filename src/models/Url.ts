import mongoose, { Schema, Document, Model } from 'mongoose';
import { nanoid } from 'nanoid';

interface IAnalytics {
  referrers: Map<string, number>;
  browsers: Map<string, number>;
  devices: Map<string, number>;
  countries: Map<string, number>;
}

export interface IUrl extends Document {
  originalUrl: string;
  shortId: string;
  customPath?: string;
  domain?: string;
  userId?: mongoose.Types.ObjectId | string; // Allow string for development mode
  userIdString?: string; // Store user ID as string for development
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastClickedAt?: Date;
  analytics: IAnalytics;
}

const analyticsSchema = new Schema({
  referrers: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  browsers: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  devices: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  countries: {
    type: Map,
    of: Number,
    default: new Map(),
  },
});

const UrlSchema = new Schema<IUrl>(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(8), // Generate a unique 8-character ID by default
    },
    customPath: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values but enforces uniqueness on non-null values
    },
    domain: {
      type: String,
      default: 'asvurl.com', // Default domain
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: false, // Make it optional
    },
    userIdString: {
      type: String,
      index: true,
      required: false, // For development mode
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastClickedAt: {
      type: Date,
      default: null,
    },
    analytics: {
      type: analyticsSchema,
      default: () => ({
        referrers: new Map(),
        browsers: new Map(),
        devices: new Map(),
        countries: new Map(),
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure uniqueness of customPath + domain
UrlSchema.index({ customPath: 1, domain: 1 }, { unique: true, sparse: true });

// Add URL validation
UrlSchema.path('originalUrl').validate(function (value: string) {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}, 'Please enter a valid URL');

// Export the Url model
export const Url = (mongoose.models.Url || 
  mongoose.model<IUrl>('Url', UrlSchema)) as Model<IUrl>; 