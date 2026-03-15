import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

/**
 * Handles /agents/amit-verma (no city segment).
 *
 * Two cases:
 * 1. Agent found by name — render profile (reuses [city]/page logic via redirect)
 * 2. Nothing found — 404
 *
 * If the agent has a city, we redirect to the canonical URL /agents/name-in-city
 * so the two-segment route handles it (avoids duplicate content).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchAgentByName(nameSlug: string) {
  try {
    const search = nameSlug.replace(/-/g, ' ');
    const res = await fetch(
      `${BASE}/users/agents?search=${encodeURIComponent(search)}&limit=5`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const agents: any[] = json?.agents ?? json?.data?.agents ?? json?.data ?? [];
    if (!Array.isArray(agents) || agents.length === 0) return null;

    const normalize = (s: string) =>
      (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return agents.find(a => normalize(a.name) === nameSlug) ?? agents[0];
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const agent = await fetchAgentByName(params.name);
  if (!agent) return { title: 'Agent Not Found | Think4BuySale' };
  return {
    title: `${agent.name} – Real Estate Agent | Think4BuySale`,
    description: agent.agentBio || `${agent.name} is a verified real estate agent on Think4BuySale.`,
    alternates: { canonical: `https://think4buysale.com/agents/${params.name}` },
  };
}

export default async function AgentNameOnlyPage({ params }: { params: { name: string } }) {
  const agent = await fetchAgentByName(params.name);
  if (!agent) notFound();

  // If agent has a city, redirect to canonical two-segment URL
  if (agent.city) {
    const citySlug = agent.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const nameSlug = params.name;
    redirect(`/agents/${nameSlug}-in-${citySlug}`);
  }

  // Agent has no city — render inline using the same page component from [city]
  // Import the page component dynamically to avoid circular deps
  const { default: AgentProfilePage } = await import('../[name]/[city]/page');
  // Pass empty city — fetchAgentBySlug handles empty city gracefully
  return AgentProfilePage({ params: { name: params.name, city: '' } });
}
