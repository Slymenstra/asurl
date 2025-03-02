import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientDarkModeToggle from "@/components/ClientDarkModeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ASURL - Simple URL Shortener",
  description: "A user-friendly URL shortening service that creates readable short links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <a href="/" className="text-2xl font-bold text-primary dark:text-primary-light">ASURL</a>
                <div className="flex items-center space-x-4">
                  <nav>
                    <ul className="flex space-x-4">
                      <li>
                        <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light">Home</a>
                      </li>
                      <li>
                        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light">About</a>
                      </li>
                    </ul>
                  </nav>
                  <ClientDarkModeToggle />
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-grow">
            {children}
          </main>
          
          <footer className="bg-gray-100 dark:bg-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} ASURL - All rights reserved</p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">Terms</a>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">Privacy</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
