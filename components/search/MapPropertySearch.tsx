'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface MapProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  latitude: number;
  longitude: number;
  type: string;
  category: string;
  city: string;
  bedrooms?: number;
}

interface MapPropertySearchProps {
  searchParams: Record<string, string>;
  className?: string;
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Load Leaflet CSS + JS via CDN at runtime (avoids any bundler resolution)
function loadLeafletCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));

    // Already loaded
    if ((window as any).L && (window as any).L.map) {
      return resolve((window as any).L);
    }

    // Inject CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return reject(new Error('Leaflet failed to load'));
      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      resolve(L);
    };
    script.onerror = () => reject(new Error('Failed to load Leaflet CDN'));
    document.head.appendChild(script);
  });
}

export default function MapPropertySearch({ searchParams, className = '' }: MapPropertySearchProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [leafletError, setLeafletError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Fetch properties for map
  const fetchMapProperties = useCallback(
    async (bounds?: MapBounds) => {
      setLoading(true);
      try {
        const params: Record<string, any> = { ...searchParams };
        if (bounds) Object.assign(params, bounds);
        const { data } = await propertiesApi.getForMap(params);
        setProperties(data);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [searchParams],
  );

  // Init map once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    loadLeafletCDN()
      .then((L) => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          center: [20.5937, 78.9629], // India center
          zoom: 5,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Re-fetch on map move
        map.on('moveend', () => {
          const b = map.getBounds();
          fetchMapProperties({
            minLat: b.getSouth(),
            maxLat: b.getNorth(),
            minLng: b.getWest(),
            maxLng: b.getEast(),
          });
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      })
      .catch(() => setLeafletError(true));

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchMapProperties();
  }, [fetchMapProperties]);

  // Update markers whenever properties change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validProps = properties.filter((p) => p.latitude && p.longitude);
    if (validProps.length === 0) return;

    validProps.forEach((prop) => {
      const label =
        prop.price >= 10000000
          ? `₹${(prop.price / 10000000).toFixed(1)}Cr`
          : `₹${(prop.price / 100000).toFixed(0)}L`;

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:white;border:2px solid #4f46e5;border-radius:20px;padding:3px 8px;font-size:11px;font-weight:700;color:#4f46e5;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;">${label}</div>`,
        iconAnchor: [0, 0],
      });

      const marker = L.marker([prop.latitude, prop.longitude], { icon });
      marker.addTo(mapInstanceRef.current);
      marker.on('click', () => setSelectedProperty(prop));
      markersRef.current.push(marker);
    });

    // Fit bounds on first load
    const bounds = L.latLngBounds(validProps.map((p) => [p.latitude, p.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [properties, mapReady]);

  // ── Fallback: Leaflet failed to load ────────────────────────────────────────
  if (leafletError) {
    return (
      <div className={`relative bg-gray-100 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <div className="text-5xl">🗺️</div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">Map could not load</p>
            <p className="text-sm text-gray-500 mt-1">Check your internet connection and try again.</p>
          </div>
          <div className="w-full max-w-sm grid grid-cols-2 gap-2">
            {properties.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-400 transition-colors"
              >
                <p className="text-xs font-bold text-primary-600">{formatPrice(p.price)}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{p.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{p.city}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Leaflet map container */}
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: 400 }} />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[1000]">
          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          <span className="text-sm font-medium text-gray-700">Loading properties…</span>
        </div>
      )}

      {/* Count badge */}
      {!loading && properties.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-semibold text-gray-700">
            {properties.length} properties in this area
          </span>
        </div>
      )}

      {/* Zoom controls */}
      {mapReady && (
        <div className="absolute bottom-8 right-3 flex flex-col gap-1 z-[1000]">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Selected property popup */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-16 bg-white rounded-xl shadow-2xl p-4 z-[1001] border border-gray-100">
          <button
            onClick={() => setSelectedProperty(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs text-gray-500"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{selectedProperty.title}</p>
              <p className="text-xs text-gray-500 truncate">{selectedProperty.city}</p>
              <p className="text-base font-bold text-primary-600 mt-1">
                {formatPrice(selectedProperty.price)}
              </p>
            </div>
          </div>
          <Link
            href={`/properties/${selectedProperty.slug}`}
            className="mt-3 block w-full text-center bg-primary-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Details →
          </Link>
        </div>
      )}
    </div>
  );
}
