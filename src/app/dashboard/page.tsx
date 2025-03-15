"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ExternalLink, Copy, PencilLine, ActivitySquare, Settings, Users, Wrench, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DBStatus } from '@/components/db-status';

interface Url {
  _id: string;
  shortId: string;
  originalUrl: string;
  customPath?: string;
  userId?: string;
  userIdString?: string;
  clicks: number;
  createdAt: string;
  expiresAt?: string;
}

// Define a constant for testing instead of importing from auth options
const TEST_USER_ID = 'test-user-id-123';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State for the URL creation form
  const [originalUrl, setOriginalUrl] = useState("");
  const [customPath, setCustomPath] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [activeTab, setActiveTab] = useState("urls");
  const [suggestedPath, setSuggestedPath] = useState(""); // For suggesting alternative paths
  
  // State for URL management
  const [urls, setUrls] = useState<Url[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<Url | null>(null);
  const [hostName, setHostName] = useState(""); // For storing the host name
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if the user is an admin
  const isAdmin = !!session?.user?.isAdmin;
  
  // Helper function to validate the URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Function to fetch user's URLs
  const fetchUrls = async () => {
    try {
      setIsLoadingUrls(true);
      
      const response = await fetch("/api/urls");
      
      if (!response.ok) {
        throw new Error("Failed to fetch URLs");
      }
      
      const data = await response.json();
      console.log("Fetched URLs:", data);
      
      // If admin, show all URLs, otherwise filter by user ID
      const filteredUrls = isAdmin 
        ? data.urls || []
        : data.urls?.filter((url: Url) => {
            // Only show URLs that have user information matching the current session
            return url.userId === session?.user?.id || 
                  url.userIdString === session?.user?.id;
          }) || [];
      
      setUrls(filteredUrls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      toast.error("Failed to load your URLs");
    } finally {
      setIsLoadingUrls(false);
      setRefreshing(false);
    }
  };
  
  // Function to delete a URL
  const deleteUrl = async (id: string) => {
    try {
      const confirmed = confirm("Are you sure you want to delete this URL?");
      if (!confirmed) return;
      
      console.log(`Attempting to delete URL with ID: ${id}`);
      
      // Add admin override flag if user is admin
      const apiUrl = isAdmin 
        ? `/api/urls?id=${id}&adminOverride=true` 
        : `/api/urls?id=${id}`;
        
      console.log(`Delete request URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });
      
      console.log(`Delete response status: ${response.status}`);
      
      // Log the full response for debugging
      const responseText = await response.text();
      console.log(`Delete response text: ${responseText}`);
      
      // Parse the response as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Delete response data:', responseData);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        console.log('Raw response was:', responseText);
      }
      
      if (!response.ok) {
        // Special handling for authorization errors
        if (response.status === 403) {
          const errorMsg = "You don't have permission to delete this URL.";
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        throw new Error(responseData?.error || `Failed to delete URL (status ${response.status})`);
      }
      
      toast.success("URL deleted successfully");
      fetchUrls(); // Refresh the list
    } catch (error) {
      console.error("Error deleting URL:", error);
      toast.error(`Failed to delete URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };
  
  // Generate a suggested alternative path
  const generateAlternativePath = (originalPath: string) => {
    // Add a random suffix to make it unique
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${originalPath}-${randomSuffix}`;
  };
  
  // Function to handle URL shortening
  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalUrl) {
      setError("Please enter a URL to shorten");
      toast.error("Please enter a URL to shorten");
      return;
    }
    
    // Ensure URL has a protocol (http or https)
    let formattedUrl = originalUrl;
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      formattedUrl = 'https://' + originalUrl;
    }
    
    // Validate URL format
    if (!isValidUrl(formattedUrl)) {
      setError("Please enter a valid URL");
      toast.error("Please enter a valid URL");
      return;
    }
    
    try {
      setError("");
      setIsLoading(true);
      setSuggestedPath(""); // Clear any previous suggestions
      
      // Prepare the request payload
      const payload = {
        originalUrl: formattedUrl,
        ...(customPath && { customPath }),
        ...(expiresAt && { expiresAt })
      };
      
      console.log("Creating short URL with payload:", payload);
      
      // Make the API request
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      // Parse the response
      const data = await response.json();
      
      console.log("API response:", data);
      
      if (!response.ok) {
        // Special handling for conflict (custom path already in use)
        if (response.status === 409 && customPath) {
          const suggestion = generateAlternativePath(customPath);
          setSuggestedPath(suggestion);
          const errorMessage = "This custom path is already in use. Please try a different one.";
          setError(errorMessage);
          toast.error(errorMessage);
          // Keep the form open so user can try a different path
          return;
        }
        
        throw new Error(data.error || "Failed to create short URL");
      }
      
      // Create a fallback URL if the backend doesn't return one
      // This is useful when running in development mode with mock data
      let shortUrl = data.shortUrl;
      if (!shortUrl && data.url) {
        // If we have the URL object but not the short URL, construct it
        const baseUrl = hostName ? `http://${hostName}` : "";
        const urlId = data.url.customPath || data.url.shortId;
        shortUrl = `${baseUrl}/${urlId}`;
      }
      
      // Success - show the created URL
      console.log("URL created successfully:", data);
      setCreatedUrl(shortUrl || `http://${hostName}/mock-shortid`);
      toast.success("URL shortened successfully!");
      
      // Reset form fields
      setOriginalUrl("");
      setCustomPath("");
      setExpiresAt("");
      
      // Switch to the URLs tab to show the newly created URL
      setActiveTab("urls");
      
      // Refresh the page data to show the new URL in the list
      fetchUrls();
      
    } catch (error: any) {
      console.error("Error creating URL:", error);
      setError(error.message || "Failed to create short URL");
      toast.error(error.message || "Failed to create short URL");
      
      // In development mode, let's create a mock successful response
      if (process.env.NODE_ENV !== "production") {
        console.warn("Using mock successful response in development mode");
        const mockShortUrl = `http://${hostName}/mock-${Math.random().toString(36).substring(2, 8)}`;
        setCreatedUrl(mockShortUrl);
        setActiveTab("urls");
        toast.success("Created mock shortened URL for development");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to copy a URL to clipboard
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };
  
  // Load URLs when the component mounts and set hostname
  useEffect(() => {
    // Set the hostname
    setHostName(window.location.host);
    
    if (session?.user) {
      fetchUrls();
    }
  }, [session]);
  
  // Admin Quick Actions section
  const AdminActions = ({ session }: { session: Session }) => {
    const isAdmin = session?.user?.isAdmin;
    
    if (!isAdmin) return null;
    
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Admin Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Admin Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center"
                    onClick={() => window.location.href = '/admin/logs'}
                  >
                    <ActivitySquare className="h-5 w-5" />
                    <span>View System Logs</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center"
                  >
                    <Settings className="h-5 w-5" />
                    <span>System Settings</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-5 w-5" />
                    <span>Manage Users</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 items-center justify-center"
                  >
                    <Wrench className="h-5 w-5" />
                    <span>System Tools</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Administrator Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/api/test-logs?count=10'}
                  >
                    <Terminal className="mr-2 h-4 w-4" />
                    Generate Test Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Database Status Card */}
          <DBStatus />
        </div>
      </div>
    );
  };
  
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="dark:text-gray-300">
              Welcome, {session?.user?.name}
              {isAdmin && (
                <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300">
                  Admin
                </Badge>
              )}
            </span>
            <ThemeToggle />
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign Out
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="urls" 
          value={activeTab}
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="urls">
              {isAdmin ? "All URLs" : "My URLs"}
            </TabsTrigger>
            <TabsTrigger value="create">Create URL</TabsTrigger>
            <TabsTrigger value="domains">Custom Domains</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="urls">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{isAdmin ? "All URLs" : "My URLs"}</CardTitle>
                    <CardDescription>
                      {isAdmin 
                        ? "View and manage all URLs in the system" 
                        : "Manage your shortened URLs"}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setRefreshing(true);
                      fetchUrls();
                    }}
                    disabled={refreshing || isLoadingUrls}
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {createdUrl ? (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm font-medium mb-2">Your new shortened URL:</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={createdUrl}
                        readOnly
                        className="font-medium"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button size="sm" onClick={() => copyToClipboard(createdUrl)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : null}
                
                {isLoadingUrls ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : urls.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Short URL</TableHead>
                          <TableHead>Original URL</TableHead>
                          {isAdmin && <TableHead>Created By</TableHead>}
                          <TableHead>Clicks</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {urls.map((url) => {
                          const shortUrl = `http://${hostName}/${url.customPath || url.shortId}`;
                          const truncatedOriginal = url.originalUrl.length > 40 
                            ? url.originalUrl.substring(0, 40) + '...' 
                            : url.originalUrl;
                            
                          return (
                            <TableRow key={url._id}>
                              <TableCell className="font-medium">{url.customPath || url.shortId}</TableCell>
                              <TableCell title={url.originalUrl}>{truncatedOriginal}</TableCell>
                              {isAdmin && (
                                <TableCell>
                                  {url.userIdString === TEST_USER_ID 
                                    ? 'Test User' 
                                    : (url.userIdString || 'Unknown')}
                                </TableCell>
                              )}
                              <TableCell>{url.clicks}</TableCell>
                              <TableCell>{formatDate(url.createdAt)}</TableCell>
                              <TableCell>{url.expiresAt ? formatDate(url.expiresAt) : 'Never'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(shortUrl);
                                      toast.success("URL copied to clipboard");
                                    }}
                                    title="Copy URL"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => window.open(shortUrl, "_blank")}
                                    title="Open URL"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteUrl(url._id)}
                                    title="Delete URL"
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  
                                  {isAdmin && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => router.push(`/debug-urls?shortId=${url.customPath || url.shortId}`)}
                                      title="Debug URL"
                                      className="text-blue-500"
                                    >
                                      <span className="text-xs font-bold">🛠️</span>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {isAdmin ? "No URLs found in the system." : "You haven't created any URLs yet."}
                  </p>
                )}
                
                <div className="mt-4">
                  <Button onClick={() => setActiveTab("create")}>Create New URL</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New URL</CardTitle>
                <CardDescription>Shorten a URL with custom options</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleCreateUrl} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="originalUrl" className="text-sm font-medium">Original URL</label>
                    <Input
                      id="originalUrl"
                      type="text"
                      placeholder="example.com or https://example.com/path"
                      className="w-full"
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL with or without http/https - we'll add it if needed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="customPath" className="text-sm font-medium">Custom Path (Optional)</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                        {hostName}/
                      </span>
                      <Input
                        id="customPath"
                        type="text"
                        placeholder="my-custom-path"
                        className="rounded-l-none"
                        value={customPath}
                        onChange={(e) => setCustomPath(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to generate a random short code, or enter your preferred path.
                    </p>
                    
                    {suggestedPath && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Try this alternative instead: <strong>{suggestedPath}</strong> 
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs ml-2" 
                            onClick={() => setCustomPath(suggestedPath)}
                          >
                            Use this
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="expiresAt" className="text-sm font-medium">Expiration (Optional)</label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set a date when this link will expire, or leave empty for a permanent link.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Short URL"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domains</CardTitle>
                <CardDescription>Manage your custom domains for shortened URLs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You haven't added any custom domains yet.</p>
                <Button>Add Custom Domain</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View performance metrics for your URLs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create and share URLs to see analytics here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>System management and user administration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">System Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Total URLs:</dt>
                            <dd className="font-semibold">{urls.length}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Total Clicks:</dt>
                            <dd className="font-semibold">
                              {urls.reduce((total, url) => total + (url.clicks || 0), 0)}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" 
                          onClick={() => router.push('/admin/users')}>
                          <span className="mr-2">👥</span> Manage Users
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => router.push('/admin/logs')}
                        >
                          <span className="mr-2">🔍</span> View System Logs
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => router.push('/debug-urls')}
                        >
                          <span className="mr-2">🛠️</span> Debug URL Tool
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        {/* Add Admin Actions section for admin users */}
        {session?.user?.isAdmin && <AdminActions session={session} />}
        
        <Toaster />
      </main>
    </ProtectedRoute>
  );
} 