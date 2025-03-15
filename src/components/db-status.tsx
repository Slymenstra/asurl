"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DBStatusProps {
  className?: string;
}

interface DbStatus {
  connected: boolean;
  logsWorking: boolean;
  stats: {
    urls: number;
    logs: number;
    collections: string[];
  };
  error?: string;
  lastChecked: Date;
}

export function DBStatus({ className }: DBStatusProps) {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to check database status
  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/db-status');
      
      if (!response.ok) {
        throw new Error(`Error fetching database status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch database status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check database status');
      
      // Set a minimal status object on error
      setStatus({
        connected: false,
        logsWorking: false,
        stats: { urls: 0, logs: 0, collections: [] },
        error: err instanceof Error ? err.message : 'Unknown error',
        lastChecked: new Date()
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check status on mount
  useEffect(() => {
    checkStatus();
    
    // Set up an interval to check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);
  
  if (!status) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Status
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkStatus}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Connection:</span>
            <Badge 
              variant={status.connected ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {status.connected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  <span>Disconnected</span>
                </>
              )}
            </Badge>
          </div>
          
          {/* Logging Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Logging System:</span>
            {status.connected ? (
              <Badge 
                variant={status.logsWorking ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {status.logsWorking ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>Working</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    <span>Not Working</span>
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="outline">Unavailable</Badge>
            )}
          </div>
          
          {/* Database Stats */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="text-gray-500 text-xs">URLs</div>
                <div className="font-mono">{status.stats.urls}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <div className="text-gray-500 text-xs">Logs</div>
                <div className="font-mono">{status.stats.logs}</div>
              </div>
            </div>
          </div>
          
          {/* Last Checked */}
          <div className="text-xs text-gray-500 pt-2">
            Last checked: {new Date(status.lastChecked).toLocaleString()}
          </div>
          
          {/* Error Display */}
          {(error || status.error) && (
            <div className="mt-2 text-xs text-red-500 border border-red-200 p-2 rounded bg-red-50 dark:bg-red-900/20">
              {error || status.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 