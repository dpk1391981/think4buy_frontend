'use client';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
export default function BuyerSiteVisits() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-violet-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Site Visits</h2>
      <p className="text-gray-500 text-sm mb-4">Schedule and track your property site visits here — coming soon.</p>
      <Link href="/properties" className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-colors">
        Browse Properties
      </Link>
    </div>
  );
}
