'use client';

import UrlForm from '@/components/url-form';

export default function Home() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg md:max-w-md lg:max-w-md">
        <UrlForm
          onSubmit={async (data) => {
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
    </div>
  );
}
