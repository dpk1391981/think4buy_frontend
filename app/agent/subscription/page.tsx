'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionApi, walletApi, paymentApi } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  durationDays: number;
  tokensIncluded: number;
  maxListings: number;
  features: string[] | Record<string, any> | null;
  isActive: boolean;
  sortOrder: number;
}

interface ActiveSubscription {
  id: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  tokensDeducted: number;
  plan: Plan;
  planSnapshot: Record<string, any>;
}

interface SubscriptionHistory {
  id: string;
  status: string;
  createdAt: string;
  plan: { name: string };
  tokensDeducted: number;
}

const PLAN_STYLES: Record<string, { border: string; badge: string; highlight: boolean }> = {
  basic:      { border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-700',     highlight: false },
  premium:    { border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-700',     highlight: false },
  featured:   { border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-700', highlight: true  },
  enterprise: { border: 'border-purple-400', badge: 'bg-purple-100 text-purple-700', highlight: false },
};

const PLAN_ICONS: Record<string, string> = {
  basic: '🥉', premium: '🥈', featured: '🥇', enterprise: '🚀',
};

function FeatureList({ features }: { features: string[] | Record<string, any> | null }) {
  if (!features) return null;
  const items: string[] = Array.isArray(features)
    ? features
    : Object.entries(features)
        .filter(([, v]) => v && v !== false && v !== 0 && v !== null)
        .map(([k, v]) => {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
          if (typeof v === 'boolean') return label;
          if (typeof v === 'number') return `${label}: ${v}`;
          return `${label}: ${v}`;
        });

  return (
    <ul className="space-y-1.5 mt-4">
      {items.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-green-500 text-xs">✓</span>
          <span className="capitalize">{f}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AgentSubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<ActiveSubscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaTotal, setQuotaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function reload() {
    try {
      const [plansRes, subRes, walletRes, modeRes] = await Promise.allSettled([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrent(),
        walletApi.getWallet(),
        paymentApi.getMode(),
      ]);
      if (plansRes.status === 'fulfilled') {
        const data = plansRes.value.data;
        setPlans(Array.isArray(data) ? data : data?.items || []);
      }
      if (subRes.status === 'fulfilled' && subRes.value.data) {
        setCurrent(subRes.value.data.current || null);
        setHistory(subRes.value.data.history || []);
      }
      if (walletRes.status === 'fulfilled') {
        const wd = walletRes.value.data;
        setWalletBalance(wd?.balance ?? 0);
        setQuotaUsed(wd?.quotaUsed ?? 0);
        setQuotaTotal(wd?.quotaTotal ?? 0);
      }
      if (modeRes.status === 'fulfilled') {
        setPaymentEnabled(modeRes.value.data?.paymentEnabled ?? false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handlePurchase(planId: string, planPrice: number, planName: string) {
    setPurchasing(planId);
    setError('');
    setSuccess('');
    try {
      const res = await subscriptionApi.purchase(planId);
      const data = res.data;

      if (data?.requiresPayment) {
        // Real-money mode: redirect to checkout with plan details
        const plan = data.plan;
        sessionStorage.setItem('payment_type', 'subscription');
        sessionStorage.setItem('payment_amount', String(plan.price));
        sessionStorage.setItem('payment_referenceId', planId);
        sessionStorage.setItem('payment_referenceType', 'subscription_plan');
        sessionStorage.setItem('payment_description', `${plan.name} — ${plan.durationDays} days`);
        sessionStorage.setItem('payment_metadata', JSON.stringify({
          tokensIncluded: plan.tokensIncluded,
          maxListings: plan.maxListings,
          planName: plan.name,
        }));
        router.push(
          `/payment/checkout?type=subscription&amount=${plan.price}&referenceId=${planId}&description=${encodeURIComponent(`${plan.name} — ${plan.durationDays} days`)}`
        );
        return;
      }

      // Token mode: instant activation (same as before)
      setSuccess('Subscription activated successfully!');
      await reload();
    } catch (e: any) {
      if (e?.response?.data?.message?.includes('Insufficient tokens')) {
        setError(`Insufficient tokens. You have ${walletBalance} tokens but need ${planPrice}.`);
      } else {
        setError(e?.response?.data?.message || 'Failed to purchase subscription. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Upgrade your plan to post more properties and unlock premium features</p>
      </div>

      {/* Current plan status */}
      {current && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-blue-200 mb-1">Current Plan</div>
              <div className="text-xl font-bold">{current.plan.name}</div>
              <div className="text-sm text-blue-200 mt-1">
                Active until {new Date(current.expiresAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-200">Max Listings</div>
                <div className="text-2xl font-bold">{current.planSnapshot?.maxListings ?? current.plan.maxListings}</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center min-w-[80px]">
                <div className="text-xs text-blue-200">Quota Used</div>
                <div className="text-2xl font-bold">{quotaUsed}</div>
                <div className="text-xs text-blue-300 mt-0.5">of {quotaTotal}</div>
              </div>
            </div>
          </div>
          {/* Quota progress bar */}
          {quotaTotal > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>Listing quota used</span>
                <span>{quotaUsed}/{quotaTotal} ({Math.round((quotaUsed/quotaTotal)*100)}%)</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-green-400 transition-all"
                  style={{ width: `${Math.min(100, (quotaUsed / quotaTotal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet balance + quota (no active subscription) */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {paymentEnabled ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <div className="text-sm text-gray-500">Payment Mode</div>
              <div className="text-base font-semibold text-blue-600">Real Money (Secure Checkout)</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-sm text-gray-500">Available Tokens</div>
              <div className="text-xl font-bold text-gray-900">{walletBalance.toLocaleString()} tokens</div>
            </div>
          </div>
        )}
        {!current && quotaTotal > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <div className="text-sm text-gray-500">Listing Quota</div>
              <div className="text-xl font-bold text-gray-900">{quotaUsed} / {quotaTotal} used</div>
            </div>
          </div>
        )}
        {!paymentEnabled && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 text-center">
            <div>Plan prices are in</div>
            <div className="font-medium text-gray-700">tokens (1 token ≈ ₹1)</div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-5 text-sm">
          ✓ {success}
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          <div className="text-4xl mb-3">📋</div>
          <div>No subscription plans available yet.</div>
          <div className="text-sm mt-1">Please contact admin to set up plans.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {plans.map((plan) => {
            const style = PLAN_STYLES[plan.type] || PLAN_STYLES.basic;
            const isCurrentPlan = current?.planSnapshot
              ? (current.planSnapshot as any)?.name === plan.name
              : current?.plan?.id === plan.id;
            const canAfford = walletBalance >= plan.price;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 ${style.border} p-5 flex flex-col relative shadow-sm ${
                  style.highlight ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                }`}
              >
                {style.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{PLAN_ICONS[plan.type] || '📦'}</span>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{plan.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${style.badge}`}>
                      {plan.type}
                    </span>
                  </div>
                </div>

                <div className="mb-1">
                  {paymentEnabled ? (
                    <>
                      <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">{plan.price.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-1">tokens</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mb-3">{plan.durationDays} days</div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 text-xs">✓</span>
                    <span>{plan.maxListings} property listings</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 text-xs">✓</span>
                    <span>{plan.tokensIncluded} tokens included</span>
                  </div>
                  <FeatureList features={plan.features} />
                </div>

                {isCurrentPlan ? (
                  <div className="w-full py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center">
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(plan.id, plan.price, plan.name)}
                    disabled={purchasing === plan.id || (!paymentEnabled && !canAfford)}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      paymentEnabled || canAfford
                        ? style.highlight
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {purchasing === plan.id
                      ? (paymentEnabled ? 'Redirecting...' : 'Activating...')
                      : paymentEnabled
                      ? `Pay ₹${plan.price.toLocaleString()}`
                      : !canAfford
                      ? `Need ${(plan.price - walletBalance).toLocaleString()} more tokens`
                      : `Activate — ${plan.price.toLocaleString()} 🪙`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Subscription History</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Plan', 'Status', 'Tokens Used', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.plan?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      h.status === 'active' ? 'bg-green-100 text-green-700' :
                      h.status === 'expired' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{Number(h.tokensDeducted).toLocaleString()} 🪙</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
