import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientDarkModeToggle from "@/components/ClientDarkModeToggle";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ASURL - Simple URL Shortener",
  description: "A modern, fast URL shortening service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="py-4 px-6 border-b border-border">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="flex justify-between items-center">
                  <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:text-primary-light transition-colors">
                    <span className="sr-only">ASURL Home</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>ASURL</span>
                  </Link>
                </div>
                
                <div className="flex items-center justify-end mt-3 sm:mt-0">
                  <ClientDarkModeToggle className="ml-4" />
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
          <footer className="py-6 px-6 border-t border-border">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} ASURL. All rights reserved.
                </p>
                <div className="mt-4 sm:mt-0">
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors mr-4">
                    Privacy
                  </Link>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
