'use client';

import { useEffect, useState } from 'react';
import { locationsApi } from '@/lib/api';
import CityPageContent from '@/components/seo/CityPageContent';
import type { ContentVariant } from '@/lib/seo/cityData';

interface Props {
  citySlug: string;
  cityName: string;
  variant: ContentVariant;
}

/**
 * Shows CityPageContent (rich static fallback) ONLY when the admin has NOT
 * added dynamic SEO content for this city in the admin panel.
 * When dynamic content exists, PropertyListingPage already renders it — this
 * component renders nothing to prevent duplication.
 */
export default function ConditionalCityContent({ citySlug, cityName, variant }: Props) {
  const [hasDynamic, setHasDynamic] = useState<boolean | null>(null);

  useEffect(() => {
    locationsApi.getSeoContent({ city: cityName })
      .then(({ data }) => {
        setHasDynamic(!!(data?.introContent || data?.seoContent || (data?.faqs?.length ?? 0) > 0));
      })
      .catch(() => setHasDynamic(false));
  }, [cityName]);

  // Still loading — render nothing to avoid layout shift
  if (hasDynamic === null) return null;

  // Admin has dynamic content — PropertyListingPage shows it; skip static
  if (hasDynamic) return null;

  // No admin content — show rich static fallback
  return <CityPageContent citySlug={citySlug} cityName={cityName} variant={variant} />;
}
