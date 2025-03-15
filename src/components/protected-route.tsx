"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is not authenticated and the session is fully loaded
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to sign-in page");
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated, render the protected content
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Return empty div while redirecting
  return null;
} 