'use client';
import { MessageCircle } from 'lucide-react';
export default function OwnerMessages() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-blue-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Messages</h2>
      <p className="text-gray-500 text-sm">Direct messaging with buyers — coming soon.</p>
    </div>
  );
}
