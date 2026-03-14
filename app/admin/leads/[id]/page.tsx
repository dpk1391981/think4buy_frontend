'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Target, Activity,
  RefreshCw, FileText, UserCheck, PhoneCall, MessageSquare,
  Mail as MailIcon, Calendar, CheckCircle2, Handshake,
  AlertCircle, RotateCcw, Bell, Upload, Pencil, Check,
} from 'lucide-react';
import { leadsApi } from '@/lib/api';

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-indigo-100 text-indigo-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  site_visit_scheduled: 'bg-purple-100 text-purple-700',
  site_visit_completed: 'bg-cyan-100 text-cyan-700',
  negotiation: 'bg-orange-100 text-orange-700',
  deal_in_progress: 'bg-pink-100 text-pink-700',
  deal_won: 'bg-green-100 text-green-700',
  deal_lost: 'bg-red-100 text-red-600',
  duplicate: 'bg-gray-100 text-gray-500',
  junk: 'bg-gray-100 text-gray-400',
};

const TEMP_BADGE: Record<string, string> = {
  hot: 'bg-red-100 text-red-600',
  warm: 'bg-orange-100 text-orange-600',
  cold: 'bg-blue-100 text-blue-600',
};

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  status_change: RefreshCw,
  note_added: FileText,
  call_logged: PhoneCall,
  whatsapp_sent: MessageSquare,
  email_sent: MailIcon,
  visit_scheduled: Calendar,
  visit_completed: CheckCircle2,
  deal_created: Handshake,
  assignment_changed: UserCheck,
  reminder_set: Bell,
  document_uploaded: Upload,
};

const ACTOR_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  agent: 'bg-blue-100 text-blue-700',
  system: 'bg-gray-100 text-gray-500',
  client: 'bg-green-100 text-green-700',
};

const ALL_STATUSES = [
  'new', 'contacted', 'follow_up', 'site_visit_scheduled',
  'site_visit_completed', 'negotiation', 'deal_in_progress',
  'deal_won', 'deal_lost',
];

// ── Main page ──────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    try {
      const [leadRes, actRes] = await Promise.all([
        leadsApi.getOne(id),
        leadsApi.getActivities(id),
      ]);
      setLead(leadRes.data);
      setActivities(actRes.data);
    } catch {
      router.replace('/admin/leads');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await leadsApi.addNote(id, noteText.trim());
      setNoteText('');
      load();
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true);
    try {
      await leadsApi.updateStatus(id, { status });
      load();
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: lead info + status ─────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Contact card */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {lead.contactName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-sm">{lead.contactName}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                    {lead.status?.replace(/_/g, ' ')}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TEMP_BADGE[lead.temperature] || ''}`}>
                    {lead.temperature}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{lead.contactPhone}</span>
              </div>
              {lead.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{lead.contactEmail}</span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{lead.city}{lead.state ? `, ${lead.state}` : ''}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-400 mb-0.5">Source</div>
                <div className="font-medium capitalize text-gray-700">{lead.source?.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-0.5">Score</div>
                <div className="font-bold text-gray-900">{lead.leadScore}</div>
              </div>
              {lead.budgetMin && (
                <div>
                  <div className="text-gray-400 mb-0.5">Budget</div>
                  <div className="font-medium text-gray-700">
                    ₹{Number(lead.budgetMin).toLocaleString('en-IN')}
                    {lead.budgetMax ? ` – ₹${Number(lead.budgetMax).toLocaleString('en-IN')}` : '+'}
                  </div>
                </div>
              )}
              <div>
                <div className="text-gray-400 mb-0.5">Created</div>
                <div className="font-medium text-gray-700">
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {lead.requirement && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">Requirement</div>
                <p className="text-xs text-gray-700 leading-relaxed">{lead.requirement}</p>
              </div>
            )}

            {lead.assignedAgentId && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">Assigned Agent</div>
                <div className="font-mono text-xs text-gray-600 break-all">{lead.assignedAgentId}</div>
              </div>
            )}
          </div>

          {/* Status update */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Update Status</h3>
              {updatingStatus && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
            </div>
            <div className="space-y-1">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={lead.status === s || updatingStatus}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    lead.status === s
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'text-gray-600 hover:bg-gray-50 disabled:opacity-40'
                  }`}
                >
                  <span className="capitalize">{s.replace(/_/g, ' ')}</span>
                  {lead.status === s && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: activity log ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Add note */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-gray-400" /> Add Note
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a note, call summary, follow-up reminder..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {addingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Activity Log
              <span className="ml-auto text-xs font-normal text-gray-400">{activities.length} events</span>
            </h3>

            {activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No activity yet
              </div>
            ) : (
              <ol className="relative border-l border-gray-100 ml-2 space-y-5">
                {activities.map((a) => {
                  const Icon = ACTIVITY_ICON[a.activityType] || AlertCircle;
                  return (
                    <li key={a.id} className="ml-5">
                      {/* dot */}
                      <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-white border border-gray-200 mt-0.5">
                        <Icon className="w-2.5 h-2.5 text-blue-500" />
                      </span>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {/* type + actor */}
                          <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 capitalize">
                              {a.activityType.replace(/_/g, ' ')}
                            </span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${ACTOR_BADGE[a.actorType] || 'bg-gray-100 text-gray-500'}`}>
                              {a.actorType}
                            </span>
                          </div>

                          {/* notes */}
                          {a.notes && (
                            <p className="text-xs text-gray-600 leading-relaxed">{a.notes}</p>
                          )}

                          {/* old → new value */}
                          {a.oldValue && a.newValue && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                              <span className="line-through">{JSON.stringify(a.oldValue).replace(/[{}"]/g, '')}</span>
                              <span>→</span>
                              <span className="text-gray-700 font-medium">{JSON.stringify(a.newValue).replace(/[{}"]/g, '')}</span>
                            </div>
                          )}

                          {/* actor id */}
                          {a.actorId && (
                            <div className="text-[10px] font-mono text-gray-300 mt-0.5">{a.actorId.slice(0, 8)}…</div>
                          )}
                        </div>

                        <time className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                          {new Date(a.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
