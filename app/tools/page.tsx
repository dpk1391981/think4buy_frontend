'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator, TrendingUp, BarChart2, Zap, ArrowRight,
  ChevronDown, Info, RefreshCw, MapPin, Home, Building2,
  IndianRupee, Percent, Calendar, Search, Loader2,
} from 'lucide-react';
import { toolsApi, insightsApi } from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('en-IN');
}

const TABS = ['Calculators', 'Price Predictor', 'Price Trends', 'Insights'] as const;
type Tab = typeof TABS[number];

// ── Mini SVG Line Chart ───────────────────────────────────────────────────────

function LineChart({ data, labelKey, valueKey, color = '#7c3aed' }: {
  data: Record<string, any>[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  if (!data?.length) return <div className="text-center text-gray-400 py-8 text-sm">No trend data available</div>;
  const values = data.map(d => Number(d[valueKey]) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 600; const H = 150; const pad = 30;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (W - pad * 2);
    const y = H - pad - ((Number(d[valueKey]) - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `${pad},${H - pad} ` + polyline + ` ${W - pad},${H - pad}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#chartGrad)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const [x, y] = (pts[i] ?? '0,0').split(',').map(Number);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
              <text x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">{d[labelKey]}</text>
            </g>
          );
        })}
        <text x={pad - 4} y={pad + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{Math.round(max).toLocaleString('en-IN')}</text>
        <text x={pad - 4} y={H - pad} textAnchor="end" fontSize="9" fill="#9ca3af">{Math.round(min).toLocaleString('en-IN')}</text>
      </svg>
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────

function Input({ label, value, onChange, prefix, suffix, type = 'number', min, max, step, help }: {
  label: string; value: string | number; onChange: (v: string) => void;
  prefix?: string; suffix?: string; type?: string;
  min?: number; max?: number; step?: number; help?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-gray-500 text-sm font-medium">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min} max={max} step={step}
          className={`w-full border border-gray-200 rounded-xl py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-14' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${highlight ? 'text-violet-700 text-base' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATOR 1 — Area Converter
// ══════════════════════════════════════════════════════════════════════════════

const UNITS = [
  { value: 'sqft',    label: 'Sq. Ft' },
  { value: 'sqm',     label: 'Sq. Metre' },
  { value: 'sqyard',  label: 'Sq. Yard' },
  { value: 'acre',    label: 'Acre' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'gaj',     label: 'Gaj' },
  { value: 'marla',   label: 'Marla' },
  { value: 'kanal',   label: 'Kanal' },
  { value: 'bigha',   label: 'Bigha' },
];

const TO_SQFT: Record<string, number> = {
  sqft: 1, sqm: 10.7639, sqyard: 9, acre: 43560, hectare: 107639,
  gaj: 9, marla: 272.25, kanal: 5445, bigha: 27000,
};

function AreaConverter() {
  const [value, setValue] = useState('1000');
  const [from, setFrom]   = useState('sqft');

  const sqft = parseFloat(value) * (TO_SQFT[from] ?? 1);
  const convert = (to: string) => {
    const v = sqft / (TO_SQFT[to] ?? 1);
    return v < 0.01 ? v.toExponential(3) : v.toLocaleString('en-IN', { maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Enter Value" value={value} onChange={setValue} min={0} step={1} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
          <select value={from} onChange={e => setFrom(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-violet-50 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {UNITS.filter(u => u.value !== from).map(u => (
          <div key={u.value} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">{u.label}</div>
            <div className="text-sm font-semibold text-violet-700">{convert(u.value)}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">* Bigha varies by state — using standard 27,000 sq.ft per Bigha.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATOR 2 — Property Price
// ══════════════════════════════════════════════════════════════════════════════

function PriceCalculator() {
  const [area,    setArea]    = useState('1000');
  const [psf,     setPsf]     = useState('5000');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);

  const calculate = useCallback(async () => {
    const a = parseFloat(area);
    const p = parseFloat(psf);
    if (!a || !p || a <= 0 || p <= 0) return;
    setLoading(true);
    try {
      const res = await toolsApi.priceCalc({ area: a, pricePerSqft: p });
      setResult(res.data?.data);
    } catch {
      // Fallback: client-side calc
      const base = a * p;
      setResult({
        basePrice: Math.round(base),
        stampDuty: Math.round(base * 0.05),
        registrationFee: Math.round(base * 0.02),
        registration: Math.round(base * 0.07),
        registrationPct: 7,
        gstApplicable: Math.round(base * 0.05 * (2 / 3)),
        totalWithReg: Math.round(base * 1.07),
        totalWithAll: Math.round(base * 1.07 + base * 0.05 * (2 / 3)),
      });
    } finally {
      setLoading(false);
    }
  }, [area, psf]);

  useEffect(() => { void calculate(); }, [calculate]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Area (Sq. Ft)" value={area} onChange={setArea} suffix="sq.ft" min={1} />
        <Input label="Price per Sq. Ft (₹)" value={psf} onChange={setPsf} prefix="₹" min={1} />
      </div>
      {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-violet-500" size={24} /></div>}
      {result && (
        <div className="bg-violet-50 rounded-2xl p-4">
          <ResultRow label="Base Property Price" value={fmt(result.basePrice)} />
          <ResultRow label={`Stamp Duty (~5%)`} value={fmt(result.stampDuty)} />
          <ResultRow label="Registration Fee (~2%)" value={fmt(result.registrationFee)} />
          <ResultRow label={`Total (Base + Reg ${result.registrationPct}%)`} value={fmt(result.totalWithReg)} highlight />
          <ResultRow label="GST (if under-construction, ~3.33%)" value={fmt(result.gstApplicable)} />
          <ResultRow label="Total (incl. GST, if applicable)" value={fmt(result.totalWithAll)} highlight />
        </div>
      )}
      <p className="text-xs text-gray-400">* Registration & stamp duty are indicative. Actual rates vary by state. GST applicable only on under-construction properties.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATOR 3 — EMI
// ══════════════════════════════════════════════════════════════════════════════

function EMICalculator() {
  const [loan,    setLoan]    = useState('5000000');
  const [rate,    setRate]    = useState('8.5');
  const [tenure,  setTenure]  = useState('240');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);

  const calculate = useCallback(async () => {
    const p = parseFloat(loan);
    const r = parseFloat(rate);
    const t = parseInt(tenure, 10);
    if (!p || !r || !t || p <= 0 || r <= 0 || t <= 0 || t > 360) return;
    setLoading(true);
    try {
      const res = await toolsApi.emi({ principal: p, rate: r, tenure: t });
      setResult(res.data?.data);
    } catch {
      const rMon = r / 12 / 100;
      const emi = rMon === 0 ? p / t : (p * rMon * Math.pow(1 + rMon, t)) / (Math.pow(1 + rMon, t) - 1);
      setResult({ emi: Math.round(emi), totalAmount: Math.round(emi * t), totalInterest: Math.round(emi * t - p), schedule: [] });
    } finally {
      setLoading(false);
    }
  }, [loan, rate, tenure]);

  useEffect(() => { void calculate(); }, [calculate]);

  const principalPct = result ? Math.round((parseFloat(loan) / result.totalAmount) * 100) : 50;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Loan Amount (₹)" value={loan} onChange={setLoan} prefix="₹" min={1} />
        <Input label="Interest Rate" value={rate} onChange={setRate} suffix="% p.a." min={1} max={30} step={0.1} />
        <Input label="Tenure" value={tenure} onChange={setTenure} suffix="months" min={1} max={360} help="Max 360 months (30 yr)" />
      </div>
      {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-violet-500" size={24} /></div>}
      {result && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Monthly EMI', value: fmt(result.emi), color: 'bg-violet-50 text-violet-800' },
              { label: 'Total Interest', value: fmt(result.totalInterest), color: 'bg-amber-50 text-amber-800' },
              { label: 'Total Payable', value: fmt(result.totalAmount), color: 'bg-green-50 text-green-800' },
            ].map(card => (
              <div key={card.label} className={`rounded-2xl p-4 ${card.color}`}>
                <div className="text-xs font-medium mb-1 opacity-70">{card.label}</div>
                <div className="text-lg font-bold">{card.value}</div>
              </div>
            ))}
          </div>
          {/* Visual split bar */}
          <div>
            <div className="flex text-xs text-gray-500 justify-between mb-1">
              <span>Principal {principalPct}%</span>
              <span>Interest {100 - principalPct}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div style={{ width: `${principalPct}%` }} className="bg-violet-500 transition-all" />
              <div style={{ width: `${100 - principalPct}%` }} className="bg-amber-400 transition-all" />
            </div>
          </div>
          {result.schedule?.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-violet-600 font-medium">View Amortisation Schedule</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left font-semibold">Year</th>
                    <th className="py-2 px-3 text-right font-semibold">Principal</th>
                    <th className="py-2 px-3 text-right font-semibold">Interest</th>
                    <th className="py-2 px-3 text-right font-semibold">Balance</th>
                  </tr></thead>
                  <tbody>
                    {result.schedule.map((row: any) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <td className="py-1.5 px-3">Year {row.year}</td>
                        <td className="py-1.5 px-3 text-right">{fmt(row.principal)}</td>
                        <td className="py-1.5 px-3 text-right">{fmt(row.interest)}</td>
                        <td className="py-1.5 px-3 text-right">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATOR 4 — ROI
// ══════════════════════════════════════════════════════════════════════════════

function ROICalculator() {
  const [price,    setPrice]    = useState('5000000');
  const [rent,     setRent]     = useState('25000');
  const [appRate,  setAppRate]  = useState('8');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<any>(null);

  const calculate = useCallback(async () => {
    const p = parseFloat(price);
    const r = parseFloat(rent);
    const a = parseFloat(appRate);
    if (!p || !r || !a || p <= 0 || r <= 0 || a <= 0) return;
    setLoading(true);
    try {
      const res = await toolsApi.roi({ price: p, rent: r, appreciation: a });
      setResult(res.data?.data);
    } catch {
      const yield_ = (r * 12 / p * 100);
      const returns = [3, 5, 10].map(y => ({
        years: y,
        futureValue: Math.round(p * Math.pow(1 + a / 100, y)),
        totalRent: Math.round(r * 12 * y),
        appreciation: Math.round(p * (Math.pow(1 + a / 100, y) - 1)),
        totalReturn: Math.round(p * Math.pow(1 + a / 100, y) + r * 12 * y - p),
        totalReturnPct: Math.round((p * Math.pow(1 + a / 100, y) + r * 12 * y - p) / p * 1000) / 10,
      }));
      setResult({ rentalYield: Math.round(yield_ * 100) / 100, returns });
    } finally {
      setLoading(false);
    }
  }, [price, rent, appRate]);

  useEffect(() => { void calculate(); }, [calculate]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Property Price (₹)" value={price} onChange={setPrice} prefix="₹" min={1} />
        <Input label="Monthly Rent (₹)" value={rent} onChange={setRent} prefix="₹" min={1} />
        <Input label="Annual Appreciation" value={appRate} onChange={setAppRate} suffix="% /yr" min={0} max={50} step={0.5} />
      </div>
      {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-violet-500" size={24} /></div>}
      {result && (
        <>
          <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-4xl font-bold text-green-700">{result.rentalYield}%</div>
            <div>
              <div className="text-sm font-semibold text-green-900">Gross Rental Yield</div>
              <div className="text-xs text-green-700">Annual rental income as % of property price</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.returns?.map((r: any) => (
              <div key={r.years} className="border border-violet-100 rounded-2xl p-4 bg-violet-50">
                <div className="text-xs font-semibold text-violet-600 mb-2">{r.years}-Year Returns</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Future Value</span><span className="font-medium">{fmt(r.futureValue)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rental Income</span><span className="font-medium">{fmt(r.totalRent)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Appreciation</span><span className="font-medium">{fmt(r.appreciation)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-violet-200"><span className="font-semibold">Total Return</span><span className="font-bold text-violet-700">{fmt(r.totalReturn)} ({r.totalReturnPct}%)</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRICE PREDICTOR
// ══════════════════════════════════════════════════════════════════════════════

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
};
const TREND_COLORS: Record<string, string> = {
  up: 'text-green-600', down: 'text-red-500', stable: 'text-gray-500',
};

function PricePredictor() {
  const [city,       setCity]       = useState('');
  const [locality,   setLocality]   = useState('');
  const [type,       setType]       = useState('apartment');
  const [bhk,        setBhk]        = useState('2');
  const [area,       setArea]       = useState('1000');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<any>(null);
  const [error,      setError]      = useState('');
  const [cities,     setCities]     = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  // Load city list on mount
  useEffect(() => {
    insightsApi.cities().then(res => {
      setCities((res.data?.data ?? []).map((c: any) => c.city).filter(Boolean));
    }).catch(() => {});
  }, []);

  // Load localities when city changes
  useEffect(() => {
    if (!city.trim()) { setLocalities([]); setLocality(''); return; }
    setLocLoading(true);
    insightsApi.localities(city.trim()).then(res => {
      setLocalities(res.data?.data ?? []);
    }).catch(() => setLocalities([])).finally(() => setLocLoading(false));
    setLocality('');
    setResult(null);
  }, [city]);

  const predict = async () => {
    if (!city.trim()) { setError('Please select a city'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await toolsApi.predict({
        city: city.trim(),
        locality: locality || undefined,
        propertyType: type,
        bhk: parseInt(bhk, 10),
        area: parseFloat(area),
      });
      setResult(res.data?.data);
      if (!res.data?.data?.hasData) setError(res.data?.data?.error || 'No data for this location yet');
    } catch {
      setError('Could not fetch prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input list="pred-city-list" value={city} onChange={e => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <datalist id="pred-city-list">{cities.map(c => <option key={c} value={c} />)}</datalist>
        </div>

        {/* Locality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Locality
            {locLoading && <Loader2 size={12} className="animate-spin text-violet-400" />}
          </label>
          {localities.length > 0 ? (
            <select value={locality} onChange={e => setLocality(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">All Localities (City Average)</option>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input value={locality} onChange={e => setLocality(e.target.value)}
              placeholder={city ? 'No locality data yet' : 'Select city first'}
              disabled={!city}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50 disabled:text-gray-400" />
          )}
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
            {['apartment', 'villa', 'plot', 'commercial'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* BHK */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BHK</label>
          <select value={bhk} onChange={e => setBhk(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
            {['1', '2', '3', '4', '5'].map(b => <option key={b} value={b}>{b} BHK</option>)}
          </select>
        </div>

        {/* Area */}
        <div className="col-span-2 sm:col-span-2">
          <Input label="Carpet Area (Sq. Ft)" value={area} onChange={setArea} suffix="sq.ft" min={1} />
        </div>
      </div>

      <button onClick={predict} disabled={loading || !city.trim()}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
        Predict Price
      </button>

      {error && <p className="text-sm text-red-600 flex items-center gap-1"><Info size={14} />{error}</p>}

      {result?.hasData && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
            {/* Location badge */}
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={14} className="text-violet-500" />
              <span className="text-sm font-medium text-violet-700">
                {result.localityUsed ? `${result.localityUsed}, ${city}` : city}
              </span>
              {result.localityUsed && (
                <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">Locality-level data</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Estimated Price</div>
                <div className="text-3xl font-bold text-violet-700">{fmt(result.estimatedPrice)}</div>
                <div className="text-sm text-gray-500 mt-1">Range: {fmt(result.minPrice)} – {fmt(result.maxPrice)}</div>
              </div>
              <div className="sm:ml-auto flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Confidence:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CONFIDENCE_COLORS[result.confidence] ?? ''}`}>
                    {result.confidence}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Market Trend:</span>
                  <span className={`font-semibold capitalize ${TREND_COLORS[result.trend] ?? ''}`}>
                    {result.trend === 'up' ? '↑' : result.trend === 'down' ? '↓' : '→'} {result.trend}
                    {result.trendPct > 0 && ` (${result.trendPct}%)`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-white rounded-xl p-3">
                <div className="text-xs text-gray-500">City Avg PSF</div>
                <div className="font-semibold">₹{fmtNum(result.avgPsfCity)}/sqft</div>
              </div>
              {result.avgPsfLocality && (
                <div className="bg-violet-100 rounded-xl p-3">
                  <div className="text-xs text-violet-600">Locality PSF</div>
                  <div className="font-semibold text-violet-800">₹{fmtNum(result.avgPsfLocality)}/sqft</div>
                </div>
              )}
              <div className="bg-white rounded-xl p-3">
                <div className="text-xs text-gray-500">Applied PSF</div>
                <div className="font-semibold">₹{fmtNum(result.psfUsed)}/sqft</div>
              </div>
              <div className="bg-white rounded-xl p-3">
                <div className="text-xs text-gray-500">Active Listings</div>
                <div className="font-semibold">{fmtNum(result.listingCount || 0)}</div>
              </div>
              {result.rentYield != null && (
                <div className="bg-white rounded-xl p-3">
                  <div className="text-xs text-gray-500">Rental Yield</div>
                  <div className="font-semibold text-green-700">{Number(result.rentYield).toFixed(2)}%</div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-start gap-1">
            <Info size={12} className="mt-0.5 shrink-0" />
            {result.dataSource}. Prices vary based on floor, view, amenities & negotiation. Consult a local agent for accurate valuation.
          </p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRICE TRENDS TAB
// ══════════════════════════════════════════════════════════════════════════════

function PriceTrendsTab() {
  const [city,       setCity]       = useState('');
  const [locality,   setLocality]   = useState('');
  const [type,       setType]       = useState('');
  const [listing,    setListing]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [data,       setData]       = useState<any>(null);
  const [cities,     setCities]     = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    insightsApi.cities().then(res => {
      setCities((res.data?.data ?? []).map((c: any) => c.city).filter(Boolean));
    }).catch(() => {});
  }, []);

  // Load localities when city changes
  useEffect(() => {
    if (!city.trim()) { setLocalities([]); setLocality(''); return; }
    setLocLoading(true);
    insightsApi.localities(city.trim()).then(res => {
      setLocalities(res.data?.data ?? []);
    }).catch(() => setLocalities([])).finally(() => setLocLoading(false));
    setLocality('');
    setData(null);
  }, [city]);

  const load = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const res = await insightsApi.priceTrends({
        city: city.trim(),
        locality: locality || undefined,
        propertyType: type || undefined,
        listingType: listing || undefined,
      });
      setData(res.data?.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input list="trend-city-list" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Enter city..."
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <datalist id="trend-city-list">{cities.map(c => <option key={c} value={c} />)}</datalist>
        </div>

        {/* Locality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            Locality
            {locLoading && <Loader2 size={12} className="animate-spin text-violet-400" />}
          </label>
          {localities.length > 0 ? (
            <select value={locality} onChange={e => setLocality(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">All Localities</option>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input value={locality} onChange={e => setLocality(e.target.value)}
              placeholder={city ? 'Type locality...' : 'Select city first'}
              disabled={!city}
              className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50 disabled:text-gray-400" />
          )}
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">All Types</option>
            {['apartment', 'villa', 'plot', 'commercial'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {/* Listing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
          <select value={listing} onChange={e => setListing(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">All</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
          </select>
        </div>

        {/* Button */}
        <div>
          <button onClick={load} disabled={loading || !city}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Show Trends
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-500" size={32} /></div>}

      {data && !loading && (
        data.hasData ? (
          <div className="space-y-6">
            {/* Location indicator */}
            <div className="flex items-center gap-2 flex-wrap">
              <MapPin size={14} className="text-violet-500" />
              <span className="text-sm font-semibold text-gray-800">{data.locality ? `${data.locality}, ` : ''}{data.city}</span>
              {data.locality && <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">Locality data</span>}
              {data.dataQuality && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[data.dataQuality] ?? ''}`}>
                  {data.dataQuality} confidence
                </span>
              )}
              {data.updatedAt && (
                <span className="text-xs text-gray-400 ml-auto">
                  Updated {new Date(data.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Avg PSF', value: `₹${fmtNum(Math.round(Number(data.avgPsf)))}`, sub: 'per sq.ft' },
                { label: 'Market Trend', value: `${data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'} ${Number(data.trendPct || 0).toFixed(1)}%`, sub: data.trend },
                { label: 'Avg Rent', value: data.avgMonthlyRent ? `₹${fmtNum(Math.round(Number(data.avgMonthlyRent)))}` : '—', sub: 'per month' },
                { label: 'Rental Yield', value: data.rentYield ? `${Number(data.rentYield).toFixed(2)}%` : '—', sub: 'gross annual' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
                  <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5 capitalize">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Monthly Trend Chart */}
            {data.monthlyTrend?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-violet-500" />Price Trend (₹/sqft)</h3>
                <LineChart data={data.monthlyTrend} labelKey="month" valueKey="avgSalePsf" color="#7c3aed" />
              </div>
            )}

            {/* Top Localities */}
            {data.topLocalities?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={16} className="text-violet-500" />Top Localities in {city}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="py-2 px-3 text-left">Locality</th>
                      <th className="py-2 px-3 text-right">Median PSF</th>
                      <th className="py-2 px-3 text-right">Avg Rent</th>
                      <th className="py-2 px-3 text-right">Yield</th>
                      <th className="py-2 px-3 text-center">Trend</th>
                    </tr></thead>
                    <tbody>
                      {data.topLocalities.map((loc: any) => (
                        <tr key={loc.name} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{loc.name}</td>
                          <td className="py-2 px-3 text-right">₹{fmtNum(Math.round(Number(loc.medianPsf)))}</td>
                          <td className="py-2 px-3 text-right">₹{fmtNum(Math.round(Number(loc.avgRent)))}</td>
                          <td className="py-2 px-3 text-right">{loc.rentYield != null ? `${Number(loc.rentYield).toFixed(1)}%` : '—'}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-medium ${TREND_COLORS[loc.trend] ?? ''}`}>
                              {loc.trend === 'up' ? '↑' : loc.trend === 'down' ? '↓' : '→'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Smart Insights */}
            {data.smartInsights?.length > 0 && (
              <div className="bg-violet-50 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap size={16} className="text-violet-500" />AI Insights</h3>
                <ul className="space-y-2">
                  {data.smartInsights.map((ins: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                      {ins}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-40" />
            <p>No market data available for <strong>{city}</strong> yet.</p>
            <p className="text-sm mt-1">Try a major city like Mumbai, Delhi, Bangalore, or Hyderabad.</p>
          </div>
        )
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS TAB
// ══════════════════════════════════════════════════════════════════════════════

function InsightsTab() {
  const [city,    setCity]    = useState('');
  const [demand,  setDemand]  = useState<any>(null);
  const [cards,   setCards]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities,  setCities]  = useState<string[]>([]);

  useEffect(() => {
    insightsApi.cities().then(res => {
      setCities((res.data?.data ?? []).map((c: any) => c.city).filter(Boolean));
    }).catch(() => {});
  }, []);

  const fetchInsights = useCallback(async (filterCity?: string) => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        insightsApi.demand(filterCity ? { city: filterCity } : undefined),
        insightsApi.marketCards(filterCity ? { city: filterCity } : undefined),
      ]);
      setDemand(d.data?.data);
      setCards(c.data?.data ?? []);
    } catch {
      // retain previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchInsights(); }, [fetchInsights]);

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    void fetchInsights(newCity || undefined);
  };

  if (loading && !demand && !cards.length) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-violet-500" size={32} /></div>;

  return (
    <div className="space-y-8">
      {/* City filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input list="ins-city-list" value={city} onChange={e => handleCityChange(e.target.value)}
              placeholder="Filter by city (all cities by default)..."
              className="w-full border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <datalist id="ins-city-list">{cities.map(c => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        {city && (
          <button onClick={() => handleCityChange('')}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium px-3 py-2 rounded-lg bg-violet-50">
            Clear filter ×
          </button>
        )}
        {loading && <Loader2 size={16} className="animate-spin text-violet-400" />}
      </div>

      {/* Market Cards */}
      {cards.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-violet-500" />Market Insights{city && ` — ${city}`}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${card.trend === 'up' ? 'bg-green-100' : card.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <TrendingUp size={14} className={card.trend === 'up' ? 'text-green-600' : card.trend === 'down' ? 'text-red-500 rotate-180' : 'text-gray-500'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">{card.city || 'India'}</span>
                      {card.tag && <span className="text-xs text-gray-400">{card.tag}</span>}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{card.insight}</p>
                    {card.avgPsf > 0 && (
                      <p className="text-xs text-gray-400 mt-2">Avg ₹{fmtNum(Math.round(Number(card.avgPsf)))}/sqft</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {demand && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Searches */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Search size={16} className="text-violet-500" />Most Searched</h3>
            {demand.topSearches?.length > 0 ? (
              <ol className="space-y-2">
                {demand.topSearches.map((s: any, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-gray-700 flex-1 truncate">{s.query}</span>
                    <span className="text-xs text-gray-400">{s.count}×</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-gray-400">No recent search data</p>}
          </div>

          {/* Popular BHK */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Home size={16} className="text-violet-500" />Popular BHK</h3>
            {demand.popularBhk?.length > 0 ? (
              <div className="space-y-3">
                {demand.popularBhk.map((b: any, i: number) => {
                  const maxCount = Math.max(...demand.popularBhk.map((x: any) => Number(x.count)));
                  const pct = (Number(b.count) / maxCount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{b.bhk} BHK</span>
                        <span className="text-gray-500">{b.count} listings</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-violet-500 rounded-full transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400">No data yet</p>}
          </div>

          {/* Top Cities */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 size={16} className="text-violet-500" />Top Markets</h3>
            {demand.topCities?.length > 0 ? (
              <div className="space-y-2">
                {demand.topCities.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <span className="font-medium">{c.city}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">₹{fmtNum(Math.round(Number(c.avgPsf)))}/sqft</div>
                      <div className="text-xs text-gray-400">{fmtNum(Number(c.listingCount))} listings</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>
      )}

      {!demand && !cards.length && (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Insights coming soon</p>
          <p className="text-sm mt-1">Market data will appear as properties are listed and searched.</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const CALCULATORS = [
  { id: 'area',  title: 'Area Converter',         icon: '📐', desc: 'Convert sq.ft ↔ sq.m ↔ sq.yard ↔ acre and more' },
  { id: 'price', title: 'Property Price',          icon: '🏷️', desc: 'Calculate total cost incl. stamp duty & registration' },
  { id: 'emi',   title: 'EMI Calculator',          icon: '🏦', desc: 'Monthly instalment, total interest & amortisation' },
  { id: 'roi',   title: 'ROI / Investment',        icon: '📈', desc: 'Rental yield and projected appreciation returns' },
];

export default function ToolsPage() {
  const [activeTab,  setActiveTab]  = useState<Tab>('Calculators');
  const [activeCalc, setActiveCalc] = useState<string>('emi');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-700 via-violet-600 to-purple-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Calculator size={14} />
            Property Tools &amp; Market Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
            Make Smarter Real Estate Decisions
          </h1>
          <p className="text-violet-100 text-base sm:text-lg max-w-xl mx-auto">
            EMI calculators, property price estimates, ROI analysis, price trends, and live market insights — all in one place.
          </p>
        </div>
      </section>

      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab === 'Calculators'   && <Calculator size={15} />}
                {tab === 'Price Predictor' && <Zap size={15} />}
                {tab === 'Price Trends'  && <TrendingUp size={15} />}
                {tab === 'Insights'      && <BarChart2 size={15} />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Calculators ── */}
        {activeTab === 'Calculators' && (
          <div className="space-y-6">
            {/* Calculator Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CALCULATORS.map(c => (
                <button key={c.id} onClick={() => setActiveCalc(c.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${
                    activeCalc === c.id
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-violet-200'
                  }`}>
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{c.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{c.desc}</div>
                </button>
              ))}
            </div>

            {/* Calculator Body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span>{CALCULATORS.find(c => c.id === activeCalc)?.icon}</span>
                {CALCULATORS.find(c => c.id === activeCalc)?.title}
              </h2>
              {activeCalc === 'area'  && <AreaConverter />}
              {activeCalc === 'price' && <PriceCalculator />}
              {activeCalc === 'emi'   && <EMICalculator />}
              {activeCalc === 'roi'   && <ROICalculator />}
            </div>

            {/* Quick links */}
            <div className="bg-violet-50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Looking for a Home Loan?</div>
                <div className="text-sm text-gray-600">Compare rates from 50+ banks and get the lowest EMI.</div>
              </div>
              <Link href="/services/home-loan"
                className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shrink-0">
                Explore Home Loans <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Price Predictor ── */}
        {activeTab === 'Price Predictor' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Property Price Estimator</h2>
                  <p className="text-sm text-gray-500">Get an estimated price range based on real listing data for your city, property type, and configuration.</p>
                </div>
              </div>
              <PricePredictor />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>Price predictions are estimates based on active listing data. Actual market prices depend on floor, view, builder reputation, possession date, and negotiation. Always consult a local real estate expert before making investment decisions.</p>
            </div>
          </div>
        )}

        {/* ── Price Trends ── */}
        {activeTab === 'Price Trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Price Trends</h2>
                  <p className="text-sm text-gray-500">6-month price trend, locality breakdown, rental yield — all from real listing data.</p>
                </div>
              </div>
              <PriceTrendsTab />
            </div>
          </div>
        )}

        {/* ── Insights ── */}
        {activeTab === 'Insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <BarChart2 size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Market Insights &amp; Demand Analysis</h2>
                  <p className="text-sm text-gray-500">Real-time search trends, demand patterns, and market intelligence from our platform.</p>
                </div>
              </div>
              <InsightsTab />
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-violet-700 to-purple-600 text-white py-12 px-4 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Buy, Sell, or Invest?</h2>
          <p className="text-violet-100 mb-6">Browse thousands of verified properties across India and connect with top-rated agents.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/buy" className="bg-white text-violet-700 font-semibold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors">
              Browse Properties
            </Link>
            <Link href="/post-property" className="border border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              List Your Property
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
