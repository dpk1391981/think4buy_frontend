import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
      <div className="text-center px-4">
        <p className="text-8xl font-black text-primary-100 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The property or page you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/properties" className="btn-outline">
            <Search className="w-4 h-4" /> Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
}
