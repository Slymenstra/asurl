import { nanoid } from 'nanoid';
import UrlModel from '../models/url';
import connectDB from './db';

// Generate a short code for a URL
export async function generateShortCode(length: number = 6): Promise<string> {
  const shortCode = nanoid(length);
  
  await connectDB();
  const existingUrl = await UrlModel.findOne({ shortCode });
  
  if (existingUrl) {
    // If code already exists, recursively generate a new one
    return generateShortCode(length);
  }
  
  return shortCode;
}

// Create a new shortened URL
export async function createShortUrl(originalUrl: string): Promise<string> {
  await connectDB();
  
  // Check if URL already exists in the database
  const existingUrl = await UrlModel.findOne({ originalUrl });
  
  if (existingUrl) {
    return existingUrl.shortCode;
  }
  
  const shortCode = await generateShortCode();
  
  const newUrl = new UrlModel({
    originalUrl,
    shortCode,
  });
  
  await newUrl.save();
  return shortCode;
}

// Get the original URL from a short code
export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  await connectDB();
  
  const url = await UrlModel.findOne({ shortCode });
  
  if (!url) {
    return null;
  }
  
  // Increment the click count
  url.clicks += 1;
  await url.save();
  
  return url.originalUrl;
}

// Get URL statistics
export async function getUrlStats(shortCode: string) {
  await connectDB();
  
  const url = await UrlModel.findOne({ shortCode });
  
  if (!url) {
    return null;
  }
  
  return {
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    createdAt: url.createdAt,
    clicks: url.clicks,
  };
} 