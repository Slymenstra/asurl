import { z } from 'zod';

// Validation schema for URL shortening
export const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .url({ message: 'Please enter a valid URL' })
    .min(1, { message: 'URL is required' }),
});

export type UrlInput = z.infer<typeof urlSchema>; 