'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Phone, Mail, MapPin, TrendingUp, Eye, EyeOff,
  Flame, Thermometer, Snowflake, MessageCircle, PhoneCall,
  RefreshCw, Filter, ChevronDown, X, IndianRupee,
  Target, Calendar, FileText, ArrowRight, Zap, Clock, AlertCircle,
  CheckCircle2, Star,
} from 'lucide-react';
import { leadsApi } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'All',             value: '' },
  { label: 'New',             value: 'new' },
  { label: 'Contacted',       value: 'contacted' },
  { label: 'Follow Up',       value: 'follow_up' },
  { label: 'Visit Scheduled', value: 'site_visit_scheduled' },
  { label: 'Visit Done',      value: 'site_visit_completed' },
  { label: 'Negotiation',     value: 'negotiation' },
  { label: 'Deal Won',        value: 'deal_won' },
  { label: 'Deal Lost',       value: 'deal_lost' },
];

const STATUS_BADGE: Record<string, string> = {
  new:                  'bg-blue-100 text-blue-700',
  contacted:            'bg-indigo-100 text-indigo-700',
  follow_up:            'bg-yellow-100 text-yellow-700',
  site_visit_scheduled: 'bg-purple-100 text-purple-700',
  site_visit_completed: 'bg-teal-100 text-teal-700',
  negotiation:          'bg-orange-100 text-orange-700',
  deal_in_progress:     'bg-cyan-100 text-cyan-700',
  deal_won:             'bg-green-100 text-green-700',
  deal_lost:            'bg-red-100 text-red-600',
  duplicate:            'bg-gray-100 text-gray-500',
  junk:                 'bg-gray-100 text-gray-400',
};

const TEMP_CONFIG: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  hot:  { cls: 'bg-red-100 text-red-700',      icon: <Flame className="w-3 h-3" />,       label: 'Hot'  },
  warm: { cls: 'bg-orange-100 text-orange-700', icon: <Thermometer className="w-3 h-3" />, label: 'Warm' },
  cold: { cls: 'bg-blue-100 text-blue-700',     icon: <Snowflake className="w-3 h-3" />,   label: 'Cold' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  status_change:      <RefreshCw className="w-3 h-3" />,
  note_added:         <FileText className="w-3 h-3" />,
  call_logged:        <PhoneCall className="w-3 h-3" />,
  whatsapp_sent:      <MessageCircle className="w-3 h-3" />,
  assignment_changed: <ArrowRight className="w-3 h-3" />,
};

function fmt(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(0)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function maskPhone(phone: string) {
  if (!phone) return '—';
  return phone.slice(0, 2) + '•••••' + phone.slice(-3);
}

function leadAgeLabel(createdAt: string): { label: string; cls: string } {
  const hrs = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hrs < 1)   return { label: 'Just now',   cls: 'text-green-600 font-bold' };
  if (hrs < 24)  return { label: `${Math.floor(hrs)}h ago`,   cls: 'text-green-600' };
  if (hrs < 72)  return { label: `${Math.floor(hrs / 24)}d ago`,  cls: 'text-amber-600' };
  return           { label: `${Math.floor(hrs / 24)}d ago`,   cls: 'text-red-500' };
}

const WA_QUICK_REPLY = (name: string) =>
  `Hi ${name?.split(' ')[0] || 'there'}, I noticed your property inquiry on Think4BuySale. I'd love to help you find the right property — when's a good time to chat?`;

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentLeadsPage() {
  const [leads,       setLeads]       = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState<any>(null);

  const [status,       setStatus]       = useState('');
  const [temperature,  setTemperature]  = useState('');
  const [search,       setSearch]       = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [showFilters,  setShowFilters]  = useState(false);

  const [selected,    setSelected]    = useState<any>(null);
  const [activities,  setActivities]  = useState<any[]>([]);
  const [newStatus,   setNewStatus]   = useState('');
  const [noteText,    setNoteText]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [revealPhone, setRevealPhone] = useState<Record<string, boolean>>({});

  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [form, setForm] = useState({
    contactName: '', contactPhone: '', contactEmail: '',
    city: '', locality: '', propertyType: '',
    budgetMin: '', budgetMax: '', propertyFor: 'buy',
    requirement: '', source: 'manual',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        leadsApi.getMy({
          page, limit: 15,
          status:       status       || undefined,
          temperature:  temperature  || undefined,
          propertyType: propertyType || undefined,
          search:       search       || undefined,
        }),
        leadsApi.getStats(),
      ]);
      setLeads(leadsRes.data.items || []);
      setTotal(leadsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, temperature, propertyType, search]);

  useEffect(() => { load(); }, [load]);

  const openLead = useCallback(async (lead: any) => {
    setSelected(lead);
    setNewStatus(lead.status);
    setNoteText('');
    try {
      const r = await leadsApi.getActivities(lead.id);
      setActivities(r.data || []);
    } catch {
      setActivities([]);
    }
  }, []);

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await leadsApi.updateStatus(selected.id, {
        status: newStatus,
        notes: noteText.trim() || undefined,
      });
      setSelected((s: any) => ({ ...s, status: newStatus }));
      setNoteText('');
      const r = await leadsApi.getActivities(selected.id);
      setActivities(r.data || []);
      load();
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSaving(true);
    try {
      await leadsApi.addNote(selected.id, noteText);
      setNoteText('');
      const r = await leadsApi.getActivities(selected.id);
      setActivities(r.data || []);
    } finally {
      setSaving(false);
    }
  };

  const createLead = async () => {
    if (!form.contactName.trim() || !form.contactPhone.trim()) return;
    setCreating(true);
    try {
      await leadsApi.create({
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      });
      setShowCreate(false);
      setForm({ contactName:'', contactPhone:'', contactEmail:'', city:'', locality:'',
        propertyType:'', budgetMin:'', budgetMax:'', propertyFor:'buy', requirement:'', source:'manual' });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} leads assigned to you</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />Add Lead
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total',     value: stats.total || 0,              color: 'bg-blue-50 text-blue-700',    icon: <Target className="w-4 h-4" /> },
            { label: 'Hot',       value: stats.byTemperature?.hot || 0, color: 'bg-red-50 text-red-700',      icon: <Flame className="w-4 h-4" /> },
            { label: 'Deal Won',  value: stats.byStatus?.deal_won || 0, color: 'bg-green-50 text-green-700',  icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Follow Up', value: stats.byStatus?.follow_up || 0,color: 'bg-yellow-50 text-yellow-700',icon: <Calendar className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color} flex items-center gap-3`}>
              <div className="opacity-60">{s.icon}</div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs font-medium mt-0.5 opacity-80">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Urgency banner — only show when there are new hot leads */}
      {stats && (stats.byTemperature?.hot > 0 || (stats.byStatus?.new > 0)) && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-md">
          <Zap className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-bold">
              {stats.byTemperature?.hot > 0
                ? `${stats.byTemperature.hot} hot lead${stats.byTemperature.hot > 1 ? 's' : ''} need immediate follow-up!`
                : `${stats.byStatus.new} new lead${stats.byStatus.new > 1 ? 's' : ''} assigned to you`
              }
            </p>
            <p className="text-xs text-red-100">Fast response = higher conversion. Aim to call within 30 min.</p>
          </div>
          <button onClick={() => { setStatus('new'); setTemperature('hot'); setPage(1); }}
            className="flex-shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors">
            View Now →
          </button>
        </div>
      )}

      {/* Hot Leads Quick-Action Strip */}
      {!loading && leads.filter(l => l.temperature === 'hot' && l.status === 'new').length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-gray-800">Hot Leads — Act Now</span>
            <span className="ml-auto text-xs text-gray-400">Respond fast to close more deals</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {leads.filter(l => l.temperature === 'hot' && l.status === 'new').slice(0, 3).map(lead => (
              <div key={lead.id} className="bg-white border-2 border-red-100 rounded-2xl p-4 hover:border-red-300 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{lead.contactName}</p>
                    {lead.city && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}{lead.locality ? `, ${lead.locality}` : ''}</p>}
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                    <Flame className="w-3 h-3" />HOT
                  </span>
                </div>
                {(lead.budgetMin || lead.budgetMax) && (
                  <p className="text-xs text-emerald-700 font-semibold mb-3 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {lead.budgetMin ? fmt(Number(lead.budgetMin)) : '—'}
                    {lead.budgetMax ? ` – ${fmt(Number(lead.budgetMax))}` : ''}
                  </p>
                )}
                <div className="flex gap-2">
                  <a href={`tel:${lead.contactPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition-all">
                    <PhoneCall className="w-3.5 h-3.5" />Call
                  </a>
                  <a href={`https://wa.me/91${(lead.contactPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.contactName?.split(' ')[0] || ''}, I'm reaching out regarding your property inquiry. When is a good time to connect?`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#1ebe5d] active:scale-95 transition-all">
                    <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                  </a>
                  <button onClick={() => openLead(lead)}
                    className="px-3 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto flex-shrink-0">
            {STATUS_OPTIONS.slice(0, 6).map(t => (
              <button key={t.value} onClick={() => { setStatus(t.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  status === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <select value={temperature} onChange={e => { setTemperature(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs outline-none appearance-none text-gray-700">
              <option value="">All Temps</option>
              <option value="hot">🔥 Hot</option>
              <option value="warm">🌡 Warm</option>
              <option value="cold">❄️ Cold</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
              showFilters || propertyType ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter className="w-3 h-3" />More
          </button>
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search name, phone…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            <div className="relative">
              <select value={propertyType} onChange={e => { setPropertyType(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs outline-none appearance-none text-gray-700">
                <option value="">All Property Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="plot">Plot / Land</option>
                <option value="rental">Rental / PG</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            {(status || temperature || propertyType || search) && (
              <button onClick={() => { setStatus(''); setTemperature(''); setPropertyType(''); setSearch(''); setPage(1); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                <X className="w-3 h-3" />Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Contact', 'Phone', 'Location', 'Need', 'Budget', 'Temp', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => (
                  <tr key={lead.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === lead.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => openLead(lead)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-sm">{lead.contactName}</div>
                      {lead.contactEmail && <div className="text-xs text-gray-400 truncate max-w-[120px]">{lead.contactEmail}</div>}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-gray-700">
                          {revealPhone[lead.id] ? lead.contactPhone : maskPhone(lead.contactPhone)}
                        </span>
                        <button onClick={() => setRevealPhone(p => ({ ...p, [lead.id]: !p[lead.id] }))}
                          className="text-gray-400 hover:text-blue-600 transition-colors">
                          {revealPhone[lead.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {revealPhone[lead.id] && (
                          <a href={`tel:${lead.contactPhone}`} onClick={e => e.stopPropagation()}
                            className="text-green-600 hover:text-green-700">
                            <PhoneCall className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.city ? (
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <MapPin className="w-3 h-3 text-gray-400" />{lead.city}
                          {lead.locality && <span className="text-gray-400">, {lead.locality}</span>}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.propertyType && <div className="text-xs font-semibold text-gray-700 capitalize">{lead.propertyType}</div>}
                      {lead.propertyFor && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">{lead.propertyFor}</span>}
                      {!lead.propertyType && !lead.propertyFor && <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                      {(lead.budgetMin || lead.budgetMax) ? (
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3 text-emerald-500" />
                          {lead.budgetMin ? fmt(Number(lead.budgetMin)) : '—'}
                          {lead.budgetMax && ` – ${fmt(Number(lead.budgetMax))}`}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {TEMP_CONFIG[lead.temperature] ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TEMP_CONFIG[lead.temperature].cls}`}>
                          {TEMP_CONFIG[lead.temperature].icon}{TEMP_CONFIG[lead.temperature].label}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[lead.status] || ''}`}>
                        {lead.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {(() => { const a = leadAgeLabel(lead.createdAt); return <span className={a.cls}>{a.label}</span>; })()}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openLead(lead)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                          Manage
                        </button>
                        {lead.contactPhone && (
                          <a href={`https://wa.me/91${(lead.contactPhone).replace(/\D/g,'')}?text=${encodeURIComponent(WA_QUICK_REPLY(lead.contactName))}`}
                            target="_blank" rel="noreferrer" title="WhatsApp quick reply"
                            className="w-7 h-7 flex items-center justify-center bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366]/20 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Side Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-3 z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-lg">{selected.contactName}</h3>
                  {TEMP_CONFIG[selected.temperature] && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${TEMP_CONFIG[selected.temperature].cls}`}>
                      {TEMP_CONFIG[selected.temperature].icon}{TEMP_CONFIG[selected.temperature].label}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[selected.status] || ''}`}>
                    {selected.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">Score: {selected.leadScore}/100</span>
                  {selected.status === 'new' && (
                    <button onClick={async () => { setNewStatus('contacted'); await saveStatus(); }}
                      disabled={saving}
                      className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />Mark Contacted
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">

              {/* Response nudge for new leads */}
              {selected.status === 'new' && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">New lead — respond within 30 min</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">Agents who respond fast close <strong>3× more deals</strong>.</p>
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Info</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-mono font-semibold text-gray-800 flex-1">
                    {revealPhone[selected.id] ? selected.contactPhone : maskPhone(selected.contactPhone)}
                  </span>
                  <button onClick={() => setRevealPhone(p => ({ ...p, [selected.id]: !p[selected.id] }))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                    {revealPhone[selected.id] ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                {revealPhone[selected.id] && (
                  <div className="flex gap-2">
                    <a href={`tel:${selected.contactPhone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors">
                      <PhoneCall className="w-3.5 h-3.5" />Call
                    </a>
                    <a href={`https://wa.me/91${selected.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                    </a>
                    {selected.contactEmail && (
                      <a href={`mailto:${selected.contactEmail}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-500 text-white rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors">
                        <Mail className="w-3.5 h-3.5" />Email
                      </a>
                    )}
                  </div>
                )}
                {selected.city && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {selected.city}{selected.locality ? `, ${selected.locality}` : ''}{selected.state ? `, ${selected.state}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Requirement */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Property Requirement</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Type',      value: selected.propertyType, cap: true },
                    { label: 'Looking To',value: selected.propertyFor,  cap: true },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="bg-white rounded-xl p-3">
                      <div className="text-[10px] text-gray-400 mb-1">{f.label}</div>
                      <div className={`text-sm font-semibold text-gray-800 ${f.cap ? 'capitalize' : ''}`}>{f.value}</div>
                    </div>
                  ))}
                  {(selected.budgetMin || selected.budgetMax) && (
                    <div className="col-span-2 bg-white rounded-xl p-3">
                      <div className="text-[10px] text-gray-400 mb-1">Budget</div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                        {selected.budgetMin ? fmt(Number(selected.budgetMin)) : 'Any'}
                        {selected.budgetMax ? ` – ${fmt(Number(selected.budgetMax))}` : '+'}
                      </div>
                    </div>
                  )}
                  {(selected.areaMin || selected.areaMax) && (
                    <div className="col-span-2 bg-white rounded-xl p-3">
                      <div className="text-[10px] text-gray-400 mb-1">Built-up Area</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {selected.areaMin || '?'} – {selected.areaMax || '?'} {selected.areaUnit || 'sqft'}
                      </div>
                    </div>
                  )}
                </div>
                {selected.requirement && (
                  <div className="mt-2.5 bg-white rounded-xl p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Notes</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{selected.requirement}</p>
                  </div>
                )}
                {selected.preferredLocalities && (() => {
                  try {
                    const locs: string[] = JSON.parse(selected.preferredLocalities);
                    if (locs.length > 0) return (
                      <div className="mt-2.5">
                        <div className="text-[10px] text-gray-400 mb-1.5">Preferred Localities</div>
                        <div className="flex flex-wrap gap-1.5">
                          {locs.map((l, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">{l}</span>
                          ))}
                        </div>
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>

              {/* Update status */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Update Status</h4>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none">
                      {STATUS_OPTIONS.slice(1).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <button onClick={saveStatus} disabled={saving || newStatus === selected.status}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? '…' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Add note */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Log Note / Call</h4>
                <div className="flex gap-2">
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Call outcome, follow-up note, site visit feedback…"
                    rows={3}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                  <button onClick={saveNote} disabled={saving || !noteText.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors self-end">
                    Save
                  </button>
                </div>
              </div>

              {/* Activity log */}
              {activities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Activity Log</h4>
                  <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                    {activities.map(a => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-5 top-2 w-2.5 h-2.5 bg-white border-2 border-blue-400 rounded-full" />
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-700 capitalize flex items-center gap-1">
                              {ACTIVITY_ICONS[a.activityType] || <Target className="w-3 h-3" />}
                              {a.activityType?.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              a.actorType === 'agent' ? 'bg-blue-100 text-blue-700' :
                              a.actorType === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                              {a.actorType}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {a.notes && <p className="text-xs text-gray-600 mt-1">{a.notes}</p>}
                          {a.newValue?.status && a.oldValue?.status && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[a.oldValue.status] || ''}`}>{a.oldValue.status?.replace(/_/g, ' ')}</span>
                              <ArrowRight className="w-3 h-3 text-gray-300" />
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[a.newValue.status] || ''}`}>{a.newValue.status?.replace(/_/g, ' ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
                    placeholder="Client name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label>
                  <input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="+91 9876543210" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="email@example.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                  <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Locality</label>
                  <input value={form.locality} onChange={e => setForm(p => ({ ...p, locality: e.target.value }))}
                    placeholder="Andheri West" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Looking To</label>
                  <div className="relative">
                    <select value={form.propertyFor} onChange={e => setForm(p => ({ ...p, propertyFor: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none appearance-none">
                      <option value="buy">Buy</option>
                      <option value="rent">Rent</option>
                      <option value="pg">PG</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Property Type</label>
                  <div className="relative">
                    <select value={form.propertyType} onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none appearance-none">
                      <option value="">Select type…</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="plot">Plot / Land</option>
                      <option value="rental">Rental / PG</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Budget Min (₹)</label>
                  <input type="number" value={form.budgetMin} onChange={e => setForm(p => ({ ...p, budgetMin: e.target.value }))}
                    placeholder="e.g. 5000000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Budget Max (₹)</label>
                  <input type="number" value={form.budgetMax} onChange={e => setForm(p => ({ ...p, budgetMax: e.target.value }))}
                    placeholder="e.g. 10000000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Requirement Notes</label>
                <textarea value={form.requirement} onChange={e => setForm(p => ({ ...p, requirement: e.target.value }))}
                  rows={2} placeholder="3BHK in Andheri under 1.5Cr…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={createLead} disabled={creating || !form.contactName.trim() || !form.contactPhone.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {creating ? 'Creating…' : 'Create Lead'}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
