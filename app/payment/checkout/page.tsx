'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentApi } from '@/lib/api';

/**
 * Checkout Page — handles the full real-money payment flow:
 *
 * 1. Reads plan/type/amount from query params (or sessionStorage set by caller)
 * 2. Calls POST /payment/initiate to get gateway order + clientPayload
 * 3. Renders Razorpay or Stripe checkout UI
 * 4. On success/failure, redirects to /payment/status?id=<transactionId>
 *
 * Session keys set by the calling page (e.g. /dashboard/subscriptions):
 *   - payment_type:        'subscription' | 'boost' | 'token_purchase'
 *   - payment_amount:      '999'
 *   - payment_referenceId: '<planId>'
 *   - payment_description: 'Premium Plan – 3 months'
 */

type PaymentState = 'idle' | 'initiating' | 'gateway' | 'verifying' | 'success' | 'failed';

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
  }
}

/**
 * Loads an external script and waits until the given global variable is
 * available on window. Re-uses an existing <script> tag if found but still
 * waits for the global — fixes "Razorpay is not a constructor" when the tag
 * exists but the script hasn't finished executing yet.
 */
function loadScript(src: string, globalKey: string): Promise<boolean> {
  return new Promise(resolve => {
    // If the global is already ready, nothing to do
    if (typeof window[globalKey as keyof Window] === 'function') {
      return resolve(true);
    }

    // Re-use existing tag if present, otherwise inject a new one
    let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = src;
      document.head.appendChild(script);
    }

    const onReady = () => resolve(typeof window[globalKey as keyof Window] === 'function');
    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });

    // Fallback poll — some browsers fire load before globals are set
    const poll = setInterval(() => {
      if (typeof window[globalKey as keyof Window] === 'function') {
        clearInterval(poll);
        resolve(true);
      }
    }, 50);
    setTimeout(() => { clearInterval(poll); resolve(false); }, 10000);
  });
}

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<PaymentState>('idle');
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Read payment params from query or sessionStorage
  const type        = searchParams.get('type')        ?? sessionStorage.getItem('payment_type')        ?? 'token_purchase';
  const amount      = Number(searchParams.get('amount') ?? sessionStorage.getItem('payment_amount')    ?? '0');
  const referenceId = searchParams.get('referenceId') ?? sessionStorage.getItem('payment_referenceId') ?? undefined;
  const description = searchParams.get('description') ?? sessionStorage.getItem('payment_description') ?? 'Payment';

  const startPayment = useCallback(async () => {
    if (!amount || amount <= 0) {
      setError('Invalid payment amount. Please go back and try again.');
      return;
    }

    setState('initiating');
    setError('');

    const idempotencyKey = generateIdempotencyKey();

    try {
      const res = await paymentApi.initiatePayment({
        idempotencyKey,
        type: type as any,
        amount,
        currency: 'INR',
        referenceId: referenceId ?? undefined,
        referenceType: type,
        metadata: { description },
      });

      const { transaction, clientPayload } = res.data;
      setTransactionId(transaction.id);
      setState('gateway');

      // Launch gateway-specific checkout
      if (clientPayload.orderId || clientPayload.key) {
        await launchRazorpay(transaction, clientPayload);
      } else if (clientPayload.clientSecret) {
        await launchStripe(transaction, clientPayload);
      } else {
        throw new Error('Unknown gateway response format');
      }
    } catch (err: any) {
      setState('failed');
      setError(err?.response?.data?.message ?? err.message ?? 'Payment initiation failed');
    }
  }, [amount, type, referenceId, description]);

  const launchRazorpay = async (transaction: any, payload: any) => {
    const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js', 'Razorpay');
    if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection and try again.');

    return new Promise<void>((resolve, reject) => {
      // Guard against ondismiss overriding a payment.failed or handler outcome.
      // Razorpay fires ondismiss AFTER payment.failed when the modal auto-closes,
      // which would otherwise reset state back to 'idle'.
      let settled = false;

      const rzp = new window.Razorpay({
        key:         payload.key,
        amount:      payload.amount,
        currency:    payload.currency ?? 'INR',
        order_id:    payload.orderId,
        name:        payload.name ?? 'Think4BuySale',
        description: description,
        theme:       { color: '#2563EB' },

        handler: async (response: any) => {
          settled = true;
          setState('verifying');
          try {
            await paymentApi.verifyPayment({
              transactionId:    transaction.id,
              gatewayOrderId:   response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
            });
            setState('success');
            setTimeout(() => {
              router.replace(`/payment/status?id=${transaction.id}&status=success`);
            }, 1500);
            resolve();
          } catch (e: any) {
            setState('failed');
            setError(e?.response?.data?.message ?? 'Payment verification failed. Please contact support.');
            reject(e);
          }
        },

        modal: {
          ondismiss: () => {
            // Only reset to idle if no payment outcome has been determined yet.
            // If payment.failed or the handler already ran, keep the current state.
            if (!settled) {
              setState('idle');
              resolve();
            }
          },
        },
      });

      rzp.on('payment.failed', (response: any) => {
        settled = true;
        setState('failed');
        const reason = response?.error?.description
          ?? response?.error?.reason
          ?? response?.error?.code
          ?? 'Payment was declined. Please try a different payment method.';
        setError(`Payment failed: ${reason}`);
        resolve();
      });

      rzp.open();
    });
  };

  const launchStripe = async (transaction: any, payload: any) => {
    const loaded = await loadScript('https://js.stripe.com/v3/', 'Stripe');
    if (!loaded) throw new Error('Failed to load Stripe. Check your internet connection and try again.');

    // For Stripe, redirect to a dedicated Elements-based checkout
    // Store transaction details and redirect
    sessionStorage.setItem('stripe_tx_id', transaction.id);
    sessionStorage.setItem('stripe_client_secret', payload.clientSecret);
    sessionStorage.setItem('stripe_publishable_key', payload.publishableKey);

    router.push(`/payment/stripe-checkout?id=${transaction.id}`);
  };

  useEffect(() => {
    startPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Logo/Brand */}
        <div className="text-2xl font-bold text-blue-600 mb-6">Think4BuySale</div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Order Summary</p>
          <p className="font-medium text-gray-900">{description}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₹{amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* State Messages */}
        {state === 'idle' && (
          <div className="space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Preparing payment…</p>
          </div>
        )}

        {state === 'initiating' && (
          <div className="space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600 font-medium">Creating secure payment order…</p>
            <p className="text-xs text-gray-400">Please wait, do not refresh this page</p>
          </div>
        )}

        {state === 'gateway' && (
          <div className="space-y-4">
            <div className="animate-pulse w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
              <span className="text-blue-600 text-xl">💳</span>
            </div>
            <p className="text-gray-600 font-medium">Payment gateway is opening…</p>
            <p className="text-xs text-gray-400">Complete payment in the gateway window</p>
          </div>
        )}

        {state === 'verifying' && (
          <div className="space-y-4">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600 font-medium">Verifying payment…</p>
            <p className="text-xs text-gray-400">Confirming your payment with our system</p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg">Payment Successful!</p>
            <p className="text-gray-500 text-sm">Redirecting you in a moment…</p>
          </div>
        )}

        {state === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg">Payment Failed</p>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
            <div className="flex gap-3 justify-center mt-2">
              <button
                onClick={() => { setState('idle'); startPayment(); }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Payment
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Security badge */}
        <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secured by 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
