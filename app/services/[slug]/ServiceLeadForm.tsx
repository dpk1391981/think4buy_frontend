'use client';

import { ArrowRight } from 'lucide-react';

export default function ServiceLeadForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-3"
    >
      <input
        type="text"
        placeholder="Your Name"
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
      />
      <div className="flex gap-2">
        <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm flex-shrink-0">
          +91
        </span>
        <input
          type="tel"
          placeholder="Mobile Number"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>
      <input
        type="text"
        placeholder="City"
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
      />
      <button
        type="submit"
        className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
      >
        Request Free Callback <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
