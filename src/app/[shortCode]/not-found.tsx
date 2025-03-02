import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">URL Not Found</h2>
        <p className="text-gray-600 mb-6">
          The shortened URL you are looking for does not exist or has expired.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
        >
          Create a new short URL
        </Link>
      </div>
    </div>
  );
} 