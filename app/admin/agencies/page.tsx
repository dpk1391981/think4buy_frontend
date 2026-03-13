'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { agencyApi } from '@/lib/api';
import { Building2, MapPin, Phone, Mail, Globe, Pencil, Trash2, Users, CheckCircle, Plus } from 'lucide-react';

export default function AdminAgenciesPage() {
  const [agencies, setAgencies]     = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await agencyApi.getAgencies({ page, limit: 15, search: search || undefined });
      setAgencies(r.data.items ?? r.data);
      setTotal(r.data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      await agencyApi.adminDeleteAgency(id);
      setDeleteModal(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agencies</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registered agencies</p>
        </div>
        <Link
          href="/admin/agencies/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Agency
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No agencies found</p>
          <Link href="/admin/agencies/create" className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">
            Create the first agency →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agencies.map((agency) => (
            <div key={agency.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {agency.logo ? (
                      <img src={agency.logo} alt={agency.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {agency.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{agency.name}</h3>
                        {agency.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {agency.licenseNumber && (
                        <div className="text-xs text-gray-400 truncate">{agency.licenseNumber}</div>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                    agency.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {agency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2">
                {agency.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{agency.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{agency.totalAgents ?? 0} agents</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{agency.totalListings ?? 0} listings</span>
                  </div>
                  {agency.contactPhone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{agency.contactPhone}</span>
                    </div>
                  )}
                  {agency.contactEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{agency.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 pb-4 flex items-center gap-2">
                <Link
                  href={`/admin/agencies/${agency.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <Link
                  href={`/admin/agencies/${agency.id}/agents`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> Agents
                </Link>
                <button
                  onClick={() => setDeleteModal({ id: agency.id, name: agency.name })}
                  className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete agency"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Delete Agency</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteModal.id)}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
