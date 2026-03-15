'use client';
import { TrendingUp } from 'lucide-react';
export default function OwnerAnalytics() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
        <TrendingUp className="w-8 h-8 text-teal-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Property Analytics</h2>
      <p className="text-gray-500 text-sm">Detailed analytics for your listings — views, inquiries, and price trends — coming soon.</p>
    </div>
  );
}
