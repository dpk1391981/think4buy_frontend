'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Lock, Send, ChevronDown } from 'lucide-react';
import { agentFeedbackApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface FeedbackData {
  items: Review[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number | null;
  distribution: { star: number; count: string }[];
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              s <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${
            s <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-gray-600">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-gray-500">{count}</span>
    </div>
  );
}

export default function AgentFeedbackSection({ agentId }: { agentId: string }) {
  const { user } = useAuth();

  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadReviews = useCallback(async (page = 1) => {
    try {
      const res = await agentFeedbackApi.list(agentId, { page, limit: 5 });
      setData(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  useEffect(() => {
    if (!user) return;
    agentFeedbackApi.hasReviewed(agentId).then((res) => {
      setHasReviewed(res.data.hasReviewed);
    }).catch(() => {});
  }, [agentId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setSubmitError('Please select a star rating.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await agentFeedbackApi.submit(agentId, { rating, comment: comment.trim() || undefined });
      setSubmitSuccess(true);
      setHasReviewed(true);
      setShowForm(false);
      setRating(0);
      setComment('');
      // Reload reviews
      await loadReviews(1);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg[0] : msg || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSelf = user?.id === agentId;

  const distribution = data?.distribution ?? [];
  const totalReviews = data?.total ?? 0;

  // Build a complete 5→1 distribution map
  const distMap = Object.fromEntries(distribution.map((d) => [Number(d.star), Number(d.count)]));

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Reviews & Ratings
          {totalReviews > 0 && (
            <span className="text-sm font-normal text-gray-500">({totalReviews})</span>
          )}
        </h2>

        {/* Write review CTA */}
        {!isSelf && !hasReviewed && !submitSuccess && (
          user ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Star className="w-4 h-4" />
              Write a Review
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Login to Review
            </Link>
          )
        )}

        {(hasReviewed || submitSuccess) && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            ✓ You've reviewed this agent
          </span>
        )}
      </div>

      {/* Rating summary */}
      {data?.averageRating != null && totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-5 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="flex flex-col items-center justify-center text-center min-w-[90px]">
            <div className="text-5xl font-black text-amber-500">{data.averageRating.toFixed(1)}</div>
            <StarDisplay rating={data.averageRating} size="md" />
            <div className="text-xs text-gray-500 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar key={s} star={s} count={distMap[s] ?? 0} total={totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && user && !isSelf && !hasReviewed && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Review (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this agent..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/1000</div>
          </div>
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{submitError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setSubmitError(''); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((review) => (
            <div key={review.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{review.reviewerName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs font-bold text-amber-600">{review.rating}.0</span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}

          {/* Load more */}
          {data && data.page < data.totalPages && (
            <button
              onClick={() => loadReviews(data.page + 1)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Load more reviews
            </button>
          )}
        </div>
      )}
    </section>
  );
}
