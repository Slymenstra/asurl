"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function DirectRedirect() {
  const params = useParams();
  const [message, setMessage] = useState('Looking up URL...');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Safely handle potentially null params
    if (!params) {
      setError('No params available');
      return;
    }
    
    const shortId = params.shortId as string;
    
    if (!shortId) {
      setError('No shortId provided');
      return;
    }
    
    // Function to fetch the URL
    const fetchUrl = async () => {
      try {
        // Important: specify the accept header to get JSON response
        const response = await fetch(`/api/direct-lookup?id=${shortId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Try to parse as JSON first
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
          } catch (jsonError) {
            // If not JSON, get as text
            const text = await response.text();
            throw new Error(text || `Error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        if (data.url) {
          setMessage(`Redirecting to: ${data.url}`);
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = data.url;
          }, 1000);
        } else {
          setError('URL not found or no redirect URL returned');
        }
      } catch (err) {
        console.error('Redirect error:', err);
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    fetchUrl();
  }, [params]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Direct Redirect Test</h1>
        
        {error ? (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : (
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            {message}
          </div>
        )}
        
        <p className="mt-4 text-sm text-gray-500">
          ShortId: {params?.shortId || 'Not available'}
        </p>
        
        <div className="mt-6">
          <a 
            href="/debug-urls" 
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Go to Debug Tool
          </a>
        </div>
      </div>
    </div>
  );
} 