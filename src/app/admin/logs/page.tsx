"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  source?: string;
  details?: any;
}

// Time range interface
interface TimeRange {
  from?: string;
  to?: string;
}

export default function SystemLogs() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logType, setLogType] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>({});
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  
  // Check if user is admin
  const isAdmin = !!session?.user?.isAdmin;
  
  // Fetch logs function
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', logType);
      
      if (timeRange.from) {
        params.append('from', timeRange.from);
      }
      
      if (timeRange.to) {
        params.append('to', timeRange.to);
      }
      
      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      
      // In development mode, provide mock logs if real logs aren't available
      if (process.env.NODE_ENV !== 'production') {
        setLogs(generateMockLogs());
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock logs for development purposes
  const generateMockLogs = (): LogEntry[] => {
    const mockLogs: LogEntry[] = [];
    const now = new Date();
    
    // Add some mock logs with different levels and timestamps
    mockLogs.push({
      timestamp: new Date(now.getTime() - 5000).toISOString(),
      level: 'info',
      message: 'User logged in successfully',
      source: 'auth',
      details: { userId: 'user123', method: 'credentials' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 15000).toISOString(),
      level: 'error',
      message: 'Failed to connect to database',
      source: 'database',
      details: { error: 'Connection timeout', retries: 3 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'warn',
      message: 'Rate limit approaching for IP: 192.168.1.1',
      source: 'middleware',
      details: { ip: '192.168.1.1', requestCount: 95, limit: 100 }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'debug',
      message: 'URL shortening request processed',
      source: 'api',
      details: { originalUrl: 'https://example.com', shortId: 'abc123' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'info',
      message: 'Redirect processed for shortId: xyz789',
      source: 'redirect',
      details: { shortId: 'xyz789', destination: 'https://google.com', clicks: 42 }
    });
    
    // Add some logs from different days for testing time range filter
    mockLogs.push({
      timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      level: 'info',
      message: 'Daily backup completed successfully',
      source: 'system',
      details: { backupSize: '42MB', duration: '15s' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
      level: 'warn',
      message: 'High CPU usage detected',
      source: 'system',
      details: { cpuUsage: '92%', duration: '5m' }
    });
    
    mockLogs.push({
      timestamp: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      level: 'error',
      message: 'Failed to process payment',
      source: 'billing',
      details: { userId: 'user456', amount: '$19.99', error: 'Card declined' }
    });
    
    // If time range is set, filter logs by time
    if (timeRange.from || timeRange.to) {
      return mockLogs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        
        if (timeRange.from && timeRange.to) {
          const fromTime = new Date(timeRange.from).getTime();
          const toTime = new Date(timeRange.to).getTime();
          return logTime >= fromTime && logTime <= toTime;
        } else if (timeRange.from) {
          const fromTime = new Date(timeRange.from).getTime();
          return logTime >= fromTime;
        } else if (timeRange.to) {
          const toTime = new Date(timeRange.to).getTime();
          return logTime <= toTime;
        }
        
        return true;
      });
    }
    
    return mockLogs;
  };
  
  // Download logs as JSON
  const downloadLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Refresh logs
  const handleRefresh = () => {
    setRefreshCount(refreshCount + 1);
  };
  
  // Reset time filters
  const handleResetTimeFilters = () => {
    setTimeRange({});
    setShowTimeFilter(false);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (field: 'from' | 'to', value: string) => {
    setTimeRange(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Apply time filter
  const handleApplyTimeFilter = () => {
    setRefreshCount(refreshCount + 1);
  };
  
  // Add preset time ranges
  const applyPresetTimeRange = (days: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - (days * 86400000)); // days in ms
    
    setTimeRange({
      from: from.toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
      to: now.toISOString().slice(0, 16)
    });
    
    // Auto apply the filter after setting
    setTimeout(() => setRefreshCount(refreshCount + 1), 100);
  };
  
  // Load logs on mount and when refresh is triggered
  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, logType, refreshCount]);
  
  // Get color class based on log level
  const getLevelColorClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'debug':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };
  
  // Format date for input field
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };
  
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">System Logs</h1>
            {isAdmin && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300">
                Admin
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="error">Errors Only</SelectItem>
                <SelectItem value="auth">Authentication Logs</SelectItem>
                <SelectItem value="url">URL Operations</SelectItem>
                <SelectItem value="system">System Events</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover open={showTimeFilter} onOpenChange={setShowTimeFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {timeRange.from || timeRange.to ? 'Time Filter Active' : 'Time Range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Filter by Time Range</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From</label>
                    <Input 
                      type="datetime-local" 
                      value={timeRange.from || ''} 
                      onChange={(e) => handleTimeRangeChange('from', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To</label>
                    <Input 
                      type="datetime-local" 
                      value={timeRange.to || ''} 
                      onChange={(e) => handleTimeRangeChange('to', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => applyPresetTimeRange(1)}>
                      Last 24h
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyPresetTimeRange(3)}>
                      Last 3 days
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyPresetTimeRange(7)}>
                      Last week
                    </Button>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={handleResetTimeFilters}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleApplyTimeFilter}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              onClick={downloadLogs}
              disabled={logs.length === 0 || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {(timeRange.from || timeRange.to) && (
          <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {timeRange.from ? `From: ${new Date(timeRange.from).toLocaleString()}` : ''} 
                {timeRange.from && timeRange.to ? ' — ' : ''}
                {timeRange.to ? `To: ${new Date(timeRange.to).toLocaleString()}` : ''}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleResetTimeFilters}>
              Clear Filters
            </Button>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription>
              View and analyze system events, errors, and user activities
              {logs.length > 0 && ` (${logs.length} entries)`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="p-4 border rounded-md overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColorClass(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        {log.source && (
                          <Badge variant="outline">
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    
                    <p className="font-medium mb-2">{log.message}</p>
                    
                    {log.details && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm overflow-x-auto">
                        <pre className="text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No logs available. Try a different filter or refresh the page.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
} 