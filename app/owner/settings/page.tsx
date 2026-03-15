'use client';
import { Settings } from 'lucide-react';
export default function OwnerSettings() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Settings className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Settings</h2>
      <p className="text-gray-500 text-sm">Account settings and preferences — coming soon.</p>
    </div>
  );
}
