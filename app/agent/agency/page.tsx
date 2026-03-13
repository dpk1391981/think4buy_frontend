'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agencyApi, agentApi } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';
import {
  Building2, Phone, Mail, Globe, MapPin, CheckCircle, Users,
  Home, Award, Star, ExternalLink,
} from 'lucide-react';

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type PropertiesTab = 'my' | 'assigned';

export default function AgentAgencyPage() {
  const [agency, setAgency] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [coAgents, setCoAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Properties
  const [propsTab, setPropsTab] = useState<PropertiesTab>('my');
  const [myListings, setMyListings] = useState<any[]>([]);
  const [assignedProps, setAssignedProps] = useState<any[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [myListingsTotal, setMyListingsTotal] = useState(0);
  const [assignedTotal, setAssignedTotal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        // Fix: backend returns { profile, agency, ... } not { agentProfile, agency, ... }
        const dashRes = await agencyApi.getAgentDashboard();
        const data = dashRes.data;
        setAgentProfile(data.profile ?? null);
        setAgency(data.agency ?? null);

        if (data.agency?.id) {
          const agentsRes = await agencyApi.getAgencyAgents(data.agency.id, { limit: 20 });
          const items = agentsRes.data?.items ?? agentsRes.data ?? [];
          setCoAgents(Array.isArray(items) ? items : []);
        }
      } catch {
        setError('Failed to load agency information');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load properties when tab changes
  useEffect(() => {
    async function loadProps() {
      setPropsLoading(true);
      try {
        if (propsTab === 'my') {
          const r = await agentApi.getMyListings({ page: 1, limit: 10 });
          const data = r.data;
          const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          setMyListings(arr);
          setMyListingsTotal(data?.total ?? arr.length);
        } else {
          const r = await agencyApi.getMyProperties({ page: 1, limit: 10 });
          const data = r.data;
          const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          setAssignedProps(arr);
          setAssignedTotal(data?.total ?? arr.length);
        }
      } catch {
        // silent
      } finally {
        setPropsLoading(false);
      }
    }
    loadProps();
  }, [propsTab]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Agency</h1>
          <p className="text-gray-500 mt-1 text-sm">Agency membership details</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">Not Assigned to an Agency</h3>
          <p className="text-sm text-gray-400">
            You haven't been assigned to an agency yet. Contact an admin to get assigned.
          </p>
        </div>
        {/* Still show My Listings even without agency */}
        <PropertiesSection
          propsTab={propsTab}
          setPropsTab={setPropsTab}
          myListings={myListings}
          assignedProps={assignedProps}
          myListingsTotal={myListingsTotal}
          assignedTotal={assignedTotal}
          propsLoading={propsLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Agency</h1>
        <p className="text-gray-500 mt-1 text-sm">Your agency membership and team details</p>
      </div>

      {/* Agency Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center gap-4">
            {agency.logo ? (
              <img
                src={agency.logo}
                alt={agency.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {agency.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{agency.name}</h2>
                {agency.isVerified && (
                  <CheckCircle className="w-5 h-5 text-blue-200 flex-shrink-0" />
                )}
              </div>
              {agency.licenseNumber && (
                <p className="text-blue-200 text-xs mt-0.5 font-mono">{agency.licenseNumber}</p>
              )}
              <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                agency.isActive ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
              }`}>
                {agency.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-gray-100">
          <div className="px-5 py-3 text-center border-r border-gray-100">
            <div className="text-lg font-bold text-gray-800">{agency.totalAgents ?? 0}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
              <Users className="w-3 h-3" /> Agents
            </div>
          </div>
          <div className="px-5 py-3 text-center sm:border-r border-gray-100">
            <div className="text-lg font-bold text-gray-800">{agency.totalListings ?? 0}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
              <Home className="w-3 h-3" /> Listings
            </div>
          </div>
          <div className="px-5 py-3 text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-gray-800">
              {agentProfile?.totalDeals ?? 0}
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5">
              <Award className="w-3 h-3" /> My Deals
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {agency.description && (
            <p className="text-sm text-gray-600">{agency.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agency.contactEmail && (
              <a href={`mailto:${agency.contactEmail}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{agency.contactEmail}</span>
              </a>
            )}
            {agency.contactPhone && (
              <a href={`tel:${agency.contactPhone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{agency.contactPhone}</span>
              </a>
            )}
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{agency.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {agency.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{agency.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Agent Profile */}
      {agentProfile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-500" />
            My Agent Profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{agentProfile.totalListings ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Listings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{agentProfile.totalDeals ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Deals</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1">
                {agentProfile.rating > 0 ? (
                  <>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {Number(agentProfile.rating).toFixed(1)}
                  </>
                ) : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{agentProfile.experienceYears ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Years Exp.</div>
            </div>
          </div>
          {agentProfile.bio && (
            <p className="mt-4 text-sm text-gray-500 border-t border-gray-50 pt-4">{agentProfile.bio}</p>
          )}
        </div>
      )}

      {/* Properties */}
      <PropertiesSection
        propsTab={propsTab}
        setPropsTab={setPropsTab}
        myListings={myListings}
        assignedProps={assignedProps}
        myListingsTotal={myListingsTotal}
        assignedTotal={assignedTotal}
        propsLoading={propsLoading}
      />

      {/* Co-agents */}
      {coAgents.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-5">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Team Members ({coAgents.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {coAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {agent.user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AG'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{agent.user?.name ?? '—'}</div>
                  <div className="text-xs text-gray-400 truncate">{agent.user?.email ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                  {agent.totalListings > 0 && <span>{agent.totalListings} listings</span>}
                  {agent.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Star className="w-3 h-3 fill-current" />
                      {Number(agent.rating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesSection({
  propsTab, setPropsTab, myListings, assignedProps,
  myListingsTotal, assignedTotal, propsLoading,
}: {
  propsTab: PropertiesTab;
  setPropsTab: (t: PropertiesTab) => void;
  myListings: any[];
  assignedProps: any[];
  myListingsTotal: number;
  assignedTotal: number;
  propsLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-5">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Home className="w-4 h-4 text-blue-500" />
          Properties
        </h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setPropsTab('my')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              propsTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Listings ({myListingsTotal})
          </button>
          <button
            onClick={() => setPropsTab('assigned')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              propsTab === 'assigned' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assigned ({assignedTotal})
          </button>
        </div>
      </div>

      {propsLoading ? (
        <div className="p-6 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : propsTab === 'my' ? (
        myListings.length === 0 ? (
          <div className="p-10 text-center">
            <Home className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No listings yet</p>
            <Link href="/post-property" className="mt-3 inline-block px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
              Post Property
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myListings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{l.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatPrice(l.price)} · {(l.type || l.propertyType)?.replace(/_/g, ' ')} · {timeAgo(l.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    (APPROVAL_BADGE as any)[l.approvalStatus] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {l.approvalStatus}
                  </span>
                  {l.slug && (
                    <Link href={`/properties/${l.slug}`} target="_blank" className="text-gray-400 hover:text-blue-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {myListingsTotal > 10 && (
              <div className="px-5 py-3 text-center">
                <Link href="/agent/listings" className="text-xs text-blue-600 hover:underline">
                  View all {myListingsTotal} listings →
                </Link>
              </div>
            )}
          </div>
        )
      ) : (
        assignedProps.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No properties assigned by agency yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignedProps.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-gray-500 truncate">Property ID: {p.propertyId}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.assignedByAdmin ? 'Admin assigned' : 'Agency assigned'} · {timeAgo(p.createdAt)}</div>
                </div>
              </div>
            ))}
            {assignedTotal > 10 && (
              <div className="px-5 py-3 text-center text-xs text-gray-400">
                +{assignedTotal - 10} more assigned properties
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
