'use client';
import Link from 'next/link';
import { Zap } from 'lucide-react';
export default function OwnerBoost() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Boost Listing</h2>
      <p className="text-gray-500 text-sm mb-4">Coming soon — promote your properties to reach more buyers instantly.</p>
      <Link href="/owner/properties" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
        View My Properties
      </Link>
    </div>
  );
}
