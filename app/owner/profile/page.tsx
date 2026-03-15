'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, MapPin } from 'lucide-react';

export default function OwnerProfile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
            {user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'OW'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg capitalize">
              {user.role}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { icon: Mail,  label: 'Email',  value: user.email },
            { icon: Phone, label: 'Phone',  value: user.phone || '–' },
            { icon: MapPin, label: 'City',  value: user.city  || '–' },
            { icon: User,  label: 'Account', value: user.isVerified ? 'Verified' : 'Not verified' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
