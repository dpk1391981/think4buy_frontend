'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CONSENT_CONTENT, CategoryId } from '@/lib/cookieConsent';

const { modal, trust_message, toggle_microcopy } = CONSENT_CONTENT;

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  enabled,
  locked,
  onChange,
  id,
}: {
  enabled: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      id={id}
      disabled={locked}
      onClick={() => !locked && onChange?.(!enabled)}
      className={[
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        locked
          ? 'cursor-not-allowed bg-primary-400 opacity-80'
          : enabled
          ? 'cursor-pointer bg-primary-600'
          : 'cursor-pointer bg-gray-300',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

// ── Microcopy helper ──────────────────────────────────────────────────────────

function getMicrocopy(id: CategoryId, enabled: boolean): string {
  if (id === 'analytics') {
    return enabled ? toggle_microcopy.analytics_on : toggle_microcopy.analytics_off;
  }
  if (id === 'marketing') {
    return enabled ? toggle_microcopy.marketing_on : toggle_microcopy.marketing_off;
  }
  return '';
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  enabled,
  onToggle,
}: {
  category: (typeof modal.categories)[number];
  enabled: boolean;
  onToggle: (id: CategoryId, v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const microcopy = getMicrocopy(category.id as CategoryId, enabled);

  return (
    <div className={[
      'rounded-xl border transition-colors',
      category.required
        ? 'border-gray-200 bg-gray-50'
        : enabled
        ? 'border-primary-200 bg-primary-50/30'
        : 'border-gray-200 bg-white',
    ].join(' ')}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{category.name}</span>
            {category.required && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Always on
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{category.description}</p>
          {microcopy && (
            <p className={[
              'text-xs mt-1 font-medium',
              enabled ? 'text-primary-600' : 'text-gray-400',
            ].join(' ')}>
              {microcopy}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <Toggle
            id={`toggle-${category.id}`}
            enabled={enabled}
            locked={category.required}
            onChange={(v) => onToggle(category.id as CategoryId, v)}
          />
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
            aria-expanded={expanded}
          >
            Example
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable example + data stored */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-xs text-gray-500 italic leading-relaxed">
            <span className="font-medium not-italic text-gray-700">Example: </span>
            {category.example}
          </p>
          {'dataStored' in category && Array.isArray(category.dataStored) && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Data stored:</p>
              <ul className="space-y-1">
                {(category.dataStored as readonly string[]).map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-gray-500">
                    <span className="text-primary-400 mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function CookiePreferencesModal() {
  const { modalOpen, preferences, closeModal, acceptAll, rejectAll, savePreferences } =
    useCookieConsent();

  const [draft, setDraft] = useState({
    personalization: preferences.personalization,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  // Sync draft when modal opens
  useEffect(() => {
    if (modalOpen) {
      setDraft({
        personalization: preferences.personalization,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });
    }
  }, [modalOpen, preferences]);

  // Lock scroll when open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  if (!modalOpen) return null;

  function handleToggle(id: CategoryId, value: boolean) {
    if (id === 'essential') return;
    setDraft((prev) => ({ ...prev, [id]: value }));
  }

  function handleSave() {
    savePreferences(draft, 'modal');
  }

  function handleAcceptAll() {
    acceptAll('modal');
    closeModal();
  }

  function handleRejectAll() {
    rejectAll('modal');
    closeModal();
  }

  const enabledMap: Record<CategoryId, boolean> = {
    essential: true,
    personalization: draft.personalization,
    analytics: draft.analytics,
    marketing: draft.marketing,
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 id="consent-modal-title" className="text-base font-bold text-gray-900">
                {modal.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Change anytime from the footer</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 space-y-4">
            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">{modal.description}</p>

            {/* Trust message */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed">{trust_message}</p>
            </div>

            {/* Category cards */}
            <div className="space-y-3">
              {modal.categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  enabled={enabledMap[cat.id as CategoryId]}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRejectAll}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 bg-white hover:bg-primary-50 border border-primary-200 rounded-lg transition-colors"
            >
              Save My Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 rounded-lg transition-all shadow-sm"
            >
              Accept All
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            Compliant with India DPDP Act &amp; GDPR principles
          </p>
        </div>
      </div>
    </div>
  );
}
