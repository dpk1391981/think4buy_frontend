'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { systemConfigApi } from '@/lib/api';

interface ContactInfo {
  address: string[];
  phone:   string[];
  email:   string[];
  hours:   string[];
}

const DEFAULTS: ContactInfo = {
  address: ['Think4BuySale Pvt. Ltd.', 'New Delhi, India — 110001'],
  phone:   ['+91 98765 43210', 'Mon – Sat, 9am – 6pm'],
  email:   ['support@think4buysale.com', 'Response within 24 hours'],
  hours:   ['Mon – Sat: 9:00 AM – 6:00 PM', 'Sunday: Closed'],
};

const FIELDS: { key: keyof ContactInfo; label: string; icon: React.ReactNode }[] = [
  { key: 'address', label: 'Office Address',   icon: <MapPin className="w-4 h-4 text-primary-600" /> },
  { key: 'phone',   label: 'Phone / Hours',     icon: <Phone  className="w-4 h-4 text-primary-600" /> },
  { key: 'email',   label: 'Email / Response',  icon: <Mail   className="w-4 h-4 text-primary-600" /> },
  { key: 'hours',   label: 'Business Hours',    icon: <Clock  className="w-4 h-4 text-primary-600" /> },
];

export default function ContactContentPage() {
  const [info,   setInfo]   = useState<ContactInfo>(DEFAULTS);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    systemConfigApi.adminGetAll('general')
      .then(res => {
        const cfg = (res.data as any[]).find((c: any) => c.key === 'CONTACT_PAGE_INFO');
        if (cfg) {
          try {
            const parsed = typeof cfg.value === 'string' ? JSON.parse(cfg.value) : cfg.value;
            setInfo({ ...DEFAULTS, ...parsed });
          } catch { /* use defaults */ }
        }
        setStatus('idle');
      })
      .catch(() => { setStatus('idle'); });
  }, []);

  const save = async () => {
    setStatus('saving');
    setErrMsg('');
    try {
      await systemConfigApi.adminUpsert('CONTACT_PAGE_INFO', {
        value:       JSON.stringify(info),
        valueType:   'json',
        description: 'Contact page details shown to visitors: address, phone, email, business hours.',
        group:       'general',
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e: any) {
      setErrMsg(e?.response?.data?.message || 'Save failed. Please try again.');
      setStatus('error');
    }
  };

  const updateLine = (field: keyof ContactInfo, idx: number, value: string) => {
    setInfo(prev => {
      const lines = [...prev[field]];
      lines[idx] = value;
      return { ...prev, [field]: lines };
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Contact Page Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit the contact details shown on the public <strong>/contact</strong> page.
          Changes take effect immediately after saving.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-6">
        {FIELDS.map(({ key, label, icon }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              {icon}
              <h2 className="text-sm font-semibold text-gray-800">{label}</h2>
            </div>
            <div className="space-y-2">
              {info[key].map((line, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={line}
                  onChange={e => updateLine(key, idx, e.target.value)}
                  placeholder={DEFAULTS[key][idx] ?? ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === 'saving'}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {status === 'saving'
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </button>

        {status === 'saved' && (
          <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
            <CheckCircle className="w-4 h-4" /> Saved successfully
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <AlertCircle className="w-4 h-4" /> {errMsg}
          </span>
        )}
      </div>

      {/* Preview */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Live Preview</p>
        <div className="space-y-3">
          {FIELDS.map(({ key, label, icon }) => (
            <div key={key} className="flex gap-3">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                {info[key].map((line, i) => (
                  <p key={i} className="text-sm text-gray-700">{line || <span className="text-gray-300 italic">empty</span>}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
