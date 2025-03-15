"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  // State for form input and loading state
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalUrl) {
      setError("Please enter a URL");
      toast.error("Please enter a URL");
      return;
    }

    // Simple URL validation
    if (!isValidUrl(originalUrl)) {
      setError("Please enter a valid URL");
      toast.error("Please enter a valid URL");
      return;
    }

    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to shorten URL");
      }

      const data = await response.json();
      setShortUrl(data.shortUrl);
      toast.success("URL shortened successfully!");
    } catch (error: any) {
      console.error("Error shortening URL:", error);
      setError(error.message || "Failed to shorten URL");
      toast.error(error.message || "Failed to shorten URL");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy shortened URL to clipboard
  const copyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      setIsCopied(true);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Simple URL validation function
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          ASvURL - Vanity URL Service
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Shorten Your URL</CardTitle>
            <CardDescription>
              Create short, memorable links for any URL. Sign in to unlock custom paths and domains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="Enter your long URL"
                  className="w-full"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Shortening..." : "Shorten URL"}
              </Button>
            </form>

            {shortUrl && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your shortened URL:</p>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shortUrl}
                    readOnly
                    className="font-medium"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button size="sm" onClick={copyToClipboard}>
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              By using our service, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-3 lg:text-left mt-16 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Custom Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Create memorable, branded links with custom paths that reflect your content.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Use your own domain for shortened URLs to maintain brand consistency.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Track clicks, referrers, browsers, and more with our detailed analytics.</p>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </main>
  );
}
