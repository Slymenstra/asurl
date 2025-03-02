'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { urlSchema, type UrlInput } from '@/lib/validations';

interface UrlFormProps {
  onSubmit: (data: { url: string }) => Promise<string>;
}

export default function UrlForm({ onSubmit }: UrlFormProps) {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [clipboardAvailable, setClipboardAvailable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UrlInput>({
    resolver: zodResolver(urlSchema),
  });

  useEffect(() => {
    // Check if clipboard API is available
    setClipboardAvailable(
      typeof navigator !== 'undefined' && 
      navigator.clipboard !== undefined &&
      typeof navigator.clipboard.writeText === 'function'
    );
  }, []);

  const processSubmit = async (data: UrlInput) => {
    try {
      setLoading(true);
      setError(null);
      const shortCode = await onSubmit(data);
      const shortUrl = `${window.location.origin}/${shortCode}`;
      setShortUrl(shortUrl);
      reset();
    } catch (err) {
      setError('Failed to shorten URL. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shortUrl) return;
    
    setCopySuccess(null);
    
    if (clipboardAvailable) {
      try {
        navigator.clipboard.writeText(shortUrl)
          .then(() => {
            setCopySuccess('URL copied to clipboard!');
            setTimeout(() => setCopySuccess(null), 2000);
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
            setCopySuccess('Failed to copy. Please select and copy manually.');
          });
      } catch (err) {
        console.error('Clipboard error: ', err);
        setCopySuccess('Failed to copy. Please select and copy manually.');
      }
    } else {
      // Fallback for environments where clipboard API is not available
      try {
        // Create a temporary input element
        const textArea = document.createElement('textarea');
        textArea.value = shortUrl;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Select and copy
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopySuccess('URL copied to clipboard!');
        } else {
          setCopySuccess('Please select and copy manually');
        }
        
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error('Fallback clipboard error: ', err);
        setCopySuccess('Please select and copy manually');
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Shorten Your URL</h2>
      
      <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Enter a long URL
          </label>
          <input
            {...register('url')}
            id="url"
            type="text"
            placeholder="https://example.com/very/long/url"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light dark:bg-gray-700 dark:text-white"
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition disabled:opacity-50"
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      {shortUrl && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your shortened URL:</p>
          <div className="flex items-center">
            <input
              type="text"
              readOnly
              value={shortUrl}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-600 text-sm focus:outline-none dark:text-white"
            />
            <button
              onClick={copyToClipboard}
              className="bg-gray-200 text-gray-700 dark:bg-gray-500 dark:text-white px-3 py-2 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-400 focus:outline-none text-sm"
            >
              Copy
            </button>
          </div>
          {copySuccess && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">{copySuccess}</p>
          )}
        </div>
      )}
    </div>
  );
} 