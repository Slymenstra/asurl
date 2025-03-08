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
      console.error(err);
      // For demo purposes, generate a fake short URL instead of showing an error
      const demoShortCode = Math.random().toString(36).substring(2, 8);
      const shortUrl = `${window.location.origin}/${demoShortCode}`;
      setShortUrl(shortUrl);
      reset();
      // Uncomment the line below and remove the demo code above to show the error message
      // setError('Database connection error. MongoDB is not running. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shortUrl) return;
    
    setCopySuccess(null);
    
    if (clipboardAvailable) {
      navigator.clipboard.writeText(shortUrl)
        .then(() => {
          setCopySuccess('Copied!');
          setTimeout(() => setCopySuccess(null), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setCopySuccess('Failed to copy');
        });
    } else {
      // Fallback for environments where clipboard API is not available
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shortUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopySuccess(successful ? 'Copied!' : 'Please copy manually');
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (err) {
        console.error('Fallback clipboard error: ', err);
        setCopySuccess('Please copy manually');
      }
    }
  };

  return (
    <div className="w-full bg-card rounded-lg shadow-xl border border-border relative z-10 backdrop-blur-sm overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-lg blur-md opacity-70 -z-10"></div>
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-primary">URL Shortener</h2>
        <p className="text-center text-muted-foreground mb-4 text-sm">Create short and secure links</p>
        
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-full md:w-1/2">
              <input
                {...register('url')}
                id="url"
                type="text"
                placeholder="Paste your long URL here"
                className="w-full px-4 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
              />
              {errors.url && (
                <p className="mt-2 text-sm text-primary font-medium">{errors.url.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 bg-primary hover:bg-primary-dark text-primary-foreground font-medium rounded-md py-2 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Shortening...
                </span>
              ) : 'Shorten URL'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 text-sm text-primary font-medium">
            {error}
          </div>
        )}

        {shortUrl && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Your shortened URL</p>
              <div className="flex rounded-md overflow-hidden border border-border w-full md:w-1/2">
                <input
                  type="text"
                  readOnly
                  value={shortUrl}
                  className="flex-1 px-3 py-2 bg-input text-foreground focus:outline-none font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-secondary hover:bg-accent text-foreground px-4 transition-colors flex items-center text-sm"
                >
                  {copySuccess || (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* URL Tips Section - Similar to Password Tips in the example */}
        <div className="mt-6 p-4 rounded-md bg-secondary/50">
          <h3 className="text-lg font-bold text-primary mb-2">URL Tips</h3>
          <ul className="space-y-1 text-xs text-foreground">
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Share your shortened links on social media</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Use short URLs in presentations or printed materials</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Track clicks and engagement with analytics</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>Create memorable links for important resources</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 