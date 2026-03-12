'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Props {
  agentId: string;
  city?: string;
  state?: string;
}

/**
 * Invisible client component dropped into the server-rendered agent profile page.
 * Fires trackAgentView once on mount.
 */
export default function AgentAnalyticsTracker({ agentId, city, state }: Props) {
  const { trackAgentView } = useAnalytics();

  useEffect(() => {
    trackAgentView(agentId, { city, state, source: 'direct' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return null;
}
