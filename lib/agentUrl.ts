/**
 * Centralized agent URL helpers.
 *
 * URL structure: /agents/[agent-name-slug]/[agent-coverage-city-slug]
 *
 * Rules:
 *  - Slug = lowercase, spaces → hyphens, non-alphanumeric stripped
 *  - City segment always comes from agent's COVERAGE city, never property city
 */

/** Convert any string to an SEO-friendly slug */
export function toSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface AgentLike {
  name?: string;
  city?: string; // agent's COVERAGE city
}

/**
 * Build the canonical agent profile URL.
 * Always uses agent.city (coverage city), never the property's city.
 *
 * @example
 * getAgentUrl({ name: 'Vikram Singh', city: 'Delhi' })
 * // → '/agents/vikram-singh/delhi'
 */
export function getAgentUrl(agent: AgentLike): string {
  const nameSlug = toSlug(agent.name || 'agent');
  if (!agent.city) return `/agents/${nameSlug}`;
  const citySlug = toSlug(agent.city);
  return `/agents/${nameSlug}/${citySlug}`;
}
