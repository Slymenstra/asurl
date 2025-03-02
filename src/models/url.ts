import mongoose, { Document, Schema } from 'mongoose';

// Define the URL document interface
export interface IUrl extends Document {
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
}

// Define the URL schema
const urlSchema = new Schema<IUrl>({
  originalUrl: {
    type: String,
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  clicks: {
    type: Number,
    default: 0,
  },
});

// Create and export the URL model
export default mongoose.models.Url || mongoose.model<IUrl>('Url', urlSchema); 