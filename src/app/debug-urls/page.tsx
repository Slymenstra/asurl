"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';

export default function DebugUrls() {
  const [shortId, setShortId] = useState('');
  const [hostname, setHostname] = useState('');
  const [directResult, setDirectResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFoundAlert, setNotFoundAlert] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setHostname(window.location.origin);
    
    // Check for parameters from different sources
    // 1. Check if we were redirected here because of a not-found URL
    const notFound = searchParams?.get('notFound');
    // 2. Check if we came from the admin panel with a shortId
    const shortIdParam = searchParams?.get('shortId');
    
    if (notFound) {
      setNotFoundAlert(notFound);
      setShortId(notFound);
      // Automatically check the API for this shortId
      checkApi(notFound);
    } else if (shortIdParam) {
      // If we came from the admin panel
      setShortId(shortIdParam);
      // Automatically check the API for this shortId
      checkApi(shortIdParam);
    }
  }, [searchParams]);

  const checkApi = async (id: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      setDirectResult(null);
      
      const response = await fetch(`/api/direct-lookup?id=${id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      setDirectResult({
        status: response.status,
        data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDirectCheck = () => checkApi(shortId);
  
  const handleTestStandard = () => {
    if (!shortId) return;
    window.open(`${hostname}/${shortId}`, '_blank');
  };
  
  const handleTestDirect = () => {
    if (!shortId) return;
    window.open(`${hostname}/direct/${shortId}`, '_blank');
  };

  // Helper function to go back to dashboard (for admin users)
  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Debug URL Redirects</CardTitle>
              <CardDescription>
                Troubleshoot URL redirection with detailed diagnostics
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {notFoundAlert && (
            <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
              <AlertTitle className="text-amber-800 dark:text-amber-300">URL Not Found</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                The short URL <strong>/{notFoundAlert}</strong> was not found in our database. 
                You can use the tools below to troubleshoot or check if the URL exists.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Short ID to Test</label>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter short ID or custom path"
                  value={shortId}
                  onChange={(e) => setShortId(e.target.value)}
                />
                <Button onClick={handleDirectCheck} disabled={loading || !shortId}>
                  {loading ? 'Checking...' : 'Check API'}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="test">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="test">Test Options</TabsTrigger>
                <TabsTrigger value="results">API Results</TabsTrigger>
                <TabsTrigger value="info">Debug Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="test" className="p-4 border rounded-md mt-2">
                <h3 className="text-lg font-semibold mb-4">Test Methods</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md">
                    <h4 className="text-md font-medium mb-2">Standard Redirect</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Uses the middleware to handle redirection
                    </p>
                    <Button onClick={handleTestStandard} disabled={!shortId}>
                      Test Standard Redirect
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      Opens: {hostname}/{shortId || '[shortId]'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="text-md font-medium mb-2">Direct Route</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Uses a direct route component to handle redirection
                    </p>
                    <Button onClick={handleTestDirect} disabled={!shortId}>
                      Test Direct Component
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      Opens: {hostname}/direct/{shortId || '[shortId]'}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="results" className="p-4 border rounded-md mt-2">
                <h3 className="text-lg font-semibold mb-4">API Response</h3>
                {error && (
                  <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                
                {directResult && (
                  <div className={`p-4 border rounded-md ${directResult.status === 200 ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'}`}>
                    <p className="text-sm font-medium mb-2">Status: {directResult.status}</p>
                    
                    {directResult.data?.url ? (
                      <div className="mt-2">
                        <p className="font-medium">Target URL:</p>
                        <p className="break-all text-green-700 dark:text-green-400">
                          {directResult.data.url}
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-2" 
                          onClick={() => window.open(directResult.data.url, '_blank')}
                        >
                          Go to URL
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="font-medium">Error:</p>
                        <p className="text-red-600 dark:text-red-400">
                          {directResult.data?.error || 'Unknown error'}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Raw Response:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(directResult.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {!directResult && !error && !loading && (
                  <p className="text-gray-500 text-center p-4">
                    Enter a short ID and click "Check API" to see results
                  </p>
                )}
                
                {loading && (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="info" className="p-4 border rounded-md mt-2">
                <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-sm font-medium mb-1">Current Origin:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{hostname}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <p className="text-sm font-medium mb-1">How it works:</p>
                    <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
                      <li>Middleware intercepts requests to /{'{shortId}'}</li>
                      <li>Middleware checks the database for a matching URL</li>
                      <li>If found, user is redirected to the original URL</li>
                      <li>If not found, user is redirected to this debug page</li>
                    </ol>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 