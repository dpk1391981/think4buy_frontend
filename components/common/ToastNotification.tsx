'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { removeToast } from '@/lib/store/slices/uiSlice';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-red-500 flex-shrink-0" />,
  info:    <Info       className="w-4 h-4 text-blue-500 flex-shrink-0" />,
};

const BAR_CLS = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
};

function Toast({ id, message, type }: { id: string; message: string; type: 'success' | 'error' | 'info' }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(id)), 3200);
    return () => clearTimeout(t);
  }, [id, dispatch]);

  return (
    <div className={cn(
      'toast-slide-in',
      'relative flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 min-w-[220px] max-w-[340px]',
    )}>
      {/* Left colour bar */}
      <div className={cn('absolute left-0 top-2 bottom-2 w-[3px] rounded-full', BAR_CLS[type])} />
      {ICONS[type]}
      <span className="text-sm font-medium text-gray-800 flex-1">{message}</span>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastNotification() {
  const toasts = useAppSelector(s => s.ui.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 lg:bottom-6 lg:right-6 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
