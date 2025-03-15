"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRedirect() {
  const [shortId, setShortId] = useState('');
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    // Get hostname when component mounts
    setHostname(window.location.origin);
  }, []);

  const handleTest = () => {
    if (!shortId) return;
    
    // Open the short URL in a new tab
    window.open(`${hostname}/${shortId}`, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test URL Redirect</CardTitle>
          <CardDescription>
            Enter a short ID to test the URL redirection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter short ID to test"
                value={shortId}
                onChange={(e) => setShortId(e.target.value)}
              />
              <Button onClick={handleTest}>Test</Button>
            </div>
            <p className="text-sm text-gray-500">
              This will open {hostname}/{shortId} in a new tab
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 