'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentApi } from '@/lib/api';

interface TxStatus {
  id: string;
  status: 'initiated' | 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  type: string;
  mode: string;
  createdAt: string;
  processedAt?: string;
}

const STATUS_CONFIG = {
  success: {
    icon: (
      <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    title: 'Payment Successful!',
    subtitle: 'Your payment has been processed and your account has been updated.',
    titleColor: 'text-green-700',
  },
  failed: {
    icon: (
      <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    title: 'Payment Failed',
    subtitle: 'Your payment could not be processed. No amount was charged.',
    titleColor: 'text-red-700',
  },
  pending: {
    icon: (
      <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    title: 'Payment Processing',
    subtitle: 'Your payment is being processed. This may take a moment.',
    titleColor: 'text-yellow-700',
  },
  initiated: {
    icon: (
      <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    ),
    title: 'Payment Initiated',
    subtitle: 'Your payment has been initiated and is awaiting completion.',
    titleColor: 'text-gray-700',
  },
  refunded: {
    icon: (
      <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      </div>
    ),
    title: 'Payment Refunded',
    subtitle: 'Your refund has been processed. It will reflect in your account within 3-5 business days.',
    titleColor: 'text-purple-700',
  },
  cancelled: {
    icon: (
      <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
    ),
    title: 'Payment Cancelled',
    subtitle: 'This payment was cancelled.',
    titleColor: 'text-gray-700',
  },
};

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get('id') ?? '';
  const queryStatus = searchParams.get('status') as TxStatus['status'] | null;

  const [tx, setTx] = useState<TxStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const r = await paymentApi.getStatusPublic(id);
        if (!cancelled) {
          setTx(r.data);
          setLoading(false);
          // Poll if still pending/initiated
          if (['pending', 'initiated'].includes(r.data.status) && pollCount < 12) {
            timer = setTimeout(() => {
              if (!cancelled) setPollCount(c => c + 1);
            }, 3000);
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStatus();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, pollCount]);

  const status = tx?.status ?? queryStatus ?? 'pending';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <p className="text-red-600 font-medium">Invalid payment reference</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-blue-600 underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="text-2xl font-bold text-blue-600 mb-8">Think4BuySale</div>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Loading payment status…</p>
          </div>
        ) : (
          <>
            {config.icon}
            <h2 className={`text-xl font-bold mt-5 mb-2 ${config.titleColor}`}>{config.title}</h2>
            <p className="text-gray-600 text-sm">{config.subtitle}</p>

            {/* Transaction Details */}
            {tx && (
              <div className="bg-gray-50 rounded-xl p-4 mt-5 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900">
                    {tx.currency} {Number(tx.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-700 capitalize">{tx.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-700 text-xs">
                    {new Date(tx.processedAt ?? tx.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ref ID</span>
                  <span className="text-gray-600 font-mono text-xs">{tx.id.slice(0, 16)}…</span>
                </div>
              </div>
            )}

            {/* Pending polling indicator */}
            {['pending', 'initiated'].includes(status) && pollCount < 12 && (
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <div className="animate-spin w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                Checking status…
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-6">
              {status === 'success' && (
                <Link
                  href="/dashboard"
                  className="w-full px-4 py-3 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-center"
                >
                  Go to Dashboard
                </Link>
              )}
              {status === 'failed' && (
                <button
                  onClick={() => router.back()}
                  className="w-full px-4 py-3 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  Retry Payment
                </button>
              )}
              <Link
                href="/dashboard"
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 text-center text-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact <a href="mailto:support@think4buysale.com" className="underline">support@think4buysale.com</a>
        </p>
      </div>
    </div>
  );
}
