'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, RotateCcw, Save, Info } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type ConfigRow = {
  key: string;
  value: number;
  defaultValue: number;
  description: string;
  group: string;
  isOverridden: boolean;
};

const GROUP_META: Record<string, { label: string; color: string; desc: string }> = {
  listing:  { label: 'Listing Feed',    color: 'blue',   desc: 'Controls ranking of properties in the main search feed (home + /properties page).' },
  featured: { label: 'Featured Score',  color: 'purple', desc: 'Controls which listings appear in the Featured tab.' },
  hot:      { label: 'Hot Deal / Trending', color: 'red', desc: 'Controls when a listing earns the Hot Deal or Trending badge.' },
  agent:    { label: 'Agent Ranking',   color: 'green',  desc: 'Controls the Top Agents section and agent score calculation.' },
  misc:     { label: 'Other / Legacy',  color: 'gray',   desc: 'Location and category analytics weights.' },
};

const KEY_DESCRIPTIONS: Record<string, string> = {
  LISTING_VIEWS_7D:      '7-day view count weight (0–1)',
  LISTING_INQUIRIES_7D:  '7-day inquiry count weight (0–1)',
  LISTING_SAVES_7D:      '7-day save/favourite count weight (0–1)',
  LISTING_RECENCY:       'Freshness bonus weight — decays over 60 days (0–1)',
  LISTING_AGENT_BOOST:   'Agent authority / subscription bonus weight (0–1)',
  LISTING_PLAN_BOOST:    'Listing plan tier (featured/premium/basic) bonus weight (0–1)',
  LISTING_VIEWS_CAP:     'Views count cap for normalisation (raw views ÷ this = 0..1)',
  FEATURED_PLAN:         'Listing plan weight in featured score (0–1)',
  FEATURED_BOOST_ACTIVE: 'Active boost weight in featured score (0–1)',
  FEATURED_PERFORMANCE:  'Performance (views+inquiries) weight in featured score (0–1)',
  HOT_VIEWS_24H:         'Weight of 24h views in hot-deal score (0–1)',
  HOT_INQUIRIES_24H:     'Weight of 24h inquiries in hot-deal score (0–1)',
  HOT_SAVES_24H:         'Weight of 24h saves in hot-deal score (0–1)',
  HOT_BOOST_ACTIVE:      'Boost-active bonus in hot-deal score (0–1)',
  HOT_THRESHOLD:         'Minimum raw hot score to earn the Hot Deal badge',
  TRENDING_VELOCITY:     'Min ratio of this-week vs last-week inquiries to earn Trending badge (e.g. 1.5 = 50% more)',
  AGENT_LISTINGS:        'Active listings count weight in agent score (0–1)',
  AGENT_INQUIRIES_7D:    '7-day inquiry count weight in agent score (0–1)',
  AGENT_CONVERSION:      'Deal conversion rate weight in agent score (0–1)',
  AGENT_RATING:          'Agent star rating weight in agent score (0–1)',
  AGENT_PREMIUM:         'Premium subscription / tick bonus weight in agent score (0–1)',
  AGENT_RECENCY:         'Recent activity (listed in 30d) weight in agent score (0–1)',
  AGENT_LISTINGS_CAP:    'Listings count cap for normalisation',
  AGENT_INQ_CAP:         'Inquiries count cap for normalisation',
};

export default function ScoringConfigPage() {
  const queryClient = useQueryClient();
  const [activeGroup, setActiveGroup] = useState('listing');
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-scoring-config'],
    queryFn: () => adminApi.getScoringConfig().then(r => r.data),
  });

  const rows: ConfigRow[] = res?.data ?? [];
  const grouped = rows.reduce((acc: Record<string, ConfigRow[]>, row) => {
    const g = row.group || 'misc';
    if (!acc[g]) acc[g] = [];
    acc[g].push(row);
    return acc;
  }, {});

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      adminApi.setScoringConfig(key, { value, description: KEY_DESCRIPTIONS[key] || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scoring-config'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => adminApi.resetScoringConfig(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scoring-config'] });
    },
  });

  function handleSave(key: string) {
    const raw = pendingEdits[key];
    if (raw === undefined) return;
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    updateMutation.mutate({ key, value: num });
    setPendingEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleReset(key: string) {
    resetMutation.mutate(key);
    setPendingEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  const groups = Object.keys(GROUP_META);
  const currentRows = grouped[activeGroup] ?? [];
  const meta = GROUP_META[activeGroup] || GROUP_META.misc;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-5 h-5 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Scoring Config</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Adjust ranking weights for the feed, featured section, hot deals, and agent scores.
          Changes take effect on the next cron run (every 30 min).
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const gm = GROUP_META[g];
          const overrideCount = (grouped[g] || []).filter(r => r.isOverridden).length;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                activeGroup === g
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700',
              )}
            >
              {gm.label}
              {overrideCount > 0 && (
                <span className={cn(
                  'text-xs rounded-full px-1.5 py-0.5 font-semibold',
                  activeGroup === g ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600',
                )}>
                  {overrideCount} custom
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Group description */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{meta.desc}</span>
      </div>

      {/* Config table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : currentRows.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No config keys in this group.</p>
      ) : (
        <div className="space-y-2">
          {currentRows.map((row) => {
            const pendingVal = pendingEdits[row.key];
            const displayVal = pendingVal !== undefined ? pendingVal : String(row.value);
            const isDirty = pendingVal !== undefined && parseFloat(pendingVal) !== row.value;

            return (
              <div
                key={row.key}
                className={cn(
                  'bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3',
                  row.isOverridden ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {row.key}
                    </code>
                    {row.isOverridden && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                        custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {KEY_DESCRIPTIONS[row.key] || row.description || '—'}
                  </p>
                  {row.isOverridden && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Default: <span className="font-mono">{row.defaultValue}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    value={displayVal}
                    onChange={(e) => setPendingEdits(prev => ({ ...prev, [row.key]: e.target.value }))}
                    className={cn(
                      'w-24 text-sm px-3 py-1.5 border rounded-lg font-mono text-center',
                      isDirty ? 'border-primary-400 bg-primary-50' : 'border-gray-200',
                    )}
                  />
                  <button
                    onClick={() => handleSave(row.key)}
                    disabled={!isDirty || updateMutation.isPending}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      isDirty
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                    )}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  {row.isOverridden && (
                    <button
                      onClick={() => handleReset(row.key)}
                      disabled={resetMutation.isPending}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        <strong>Note:</strong> Weights within each group should sum to 1.0 for normalised scoring.
        Cap values (e.g. LISTING_VIEWS_CAP) are raw numeric limits, not percentages.
        Changes are picked up automatically on the next 30-minute cron cycle — no restart needed.
      </div>
    </div>
  );
}
