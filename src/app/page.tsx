'use client';

import UrlForm from '@/components/url-form';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-2">ASURL</h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-8">The simple URL shortener for user-readable links</p>
        
        <div className="w-full">
          <UrlForm
            onSubmit={async (data) => {
              // This is a client component, so we need to call the API
              const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });
              
              if (!response.ok) {
                throw new Error('Failed to shorten URL');
              }
              
              const result = await response.json();
              return result.shortCode;
            }}
          />
        </div>
        
        <div className="mt-16 max-w-2xl w-full">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">How It Works</h2>
          <ol className="space-y-4 list-decimal list-inside text-gray-700 dark:text-gray-300">
            <li className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              Enter your long URL in the form above
            </li>
            <li className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              Get a short, user-readable link
            </li>
            <li className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              Share your shortened link with anyone
            </li>
            <li className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              Track your link's performance with simple analytics (coming soon)
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
