import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, unit?: string): string {
  if (!price && price !== 0) return 'Price on request';

  const formatIndian = (num: number): string => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatted = formatIndian(price);
  if (unit === 'per month') return `${formatted}/mo`;
  if (unit === 'per sqft') return `${formatted}/sqft`;
  return formatted;
}

export function formatArea(area?: number, unit = 'sqft'): string {
  if (!area) return '';
  return `${area.toLocaleString('en-IN')} ${unit}`;
}

/** Resolve area and unit from carpet_area dynamic field (extraDetails) with fallback to area/areaUnit columns.
 *  Handles both DEPENDENT field format [{label, value, unit}] and plain NUMBER format "2000". */
export function getPropertyArea(property: {
  area?: number;
  areaUnit?: string;
  extraDetails?: Record<string, any> | string | null;
}): { area: number | undefined; areaUnit: string } {
  // extraDetails may be a raw JSON string (from raw SQL queries) — parse it first
  let details: Record<string, any> | null = null;
  if (property.extraDetails && typeof property.extraDetails === 'string') {
    try { details = JSON.parse(property.extraDetails); } catch {}
  } else if (property.extraDetails && typeof property.extraDetails === 'object') {
    details = property.extraDetails as Record<string, any>;
  }

  const raw = details?.carpet_area;
  if (raw !== undefined && raw !== null && raw !== '') {
    // Case 1: DEPENDENT field — array of [{label, value, unit}]
    if (Array.isArray(raw) && raw.length > 0 && raw[0].value) {
      return { area: Number(raw[0].value), areaUnit: raw[0].unit || property.areaUnit || 'Sq.ft.' };
    }
    // Case 2: JSON string that parses to array or number
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].value) {
          return { area: Number(parsed[0].value), areaUnit: parsed[0].unit || property.areaUnit || 'Sq.ft.' };
        }
        // JSON.parse of "2000" gives number 2000
        if (typeof parsed === 'number' && parsed > 0) {
          return { area: parsed, areaUnit: property.areaUnit || 'Sq.ft.' };
        }
      } catch {}
      // Plain number string "2000"
      const num = Number(raw);
      if (!isNaN(num) && num > 0) return { area: num, areaUnit: property.areaUnit || 'Sq.ft.' };
    }
    // Case 3: already a number (TypeORM parsed JSON number)
    if (typeof raw === 'number' && raw > 0) {
      return { area: raw, areaUnit: property.areaUnit || 'Sq.ft.' };
    }
  }
  return { area: property.area, areaUnit: property.areaUnit || 'Sq.ft.' };
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Apartment',
    villa: 'Villa',
    plot: 'Plot',
    house: 'Independent House',
    penthouse: 'Penthouse',
    studio: 'Studio',
    commercial_office: 'Office Space',
    commercial_shop: 'Shop',
    commercial_warehouse: 'Warehouse',
    pg: 'PG',
    co_living: 'Co-Living',
  };
  return labels[type] || type;
}

export function getCategoryBadgeColor(category: string): string {
  const colors: Record<string, string> = {
    buy: 'badge-buy',
    rent: 'badge-rent',
    pg: 'badge-pg',
    commercial: 'badge-commercial',
  };
  return colors[category] || 'badge-buy';
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    buy: 'For Sale',
    rent: 'For Rent',
    pg: 'PG',
    commercial: 'Commercial',
  };
  return labels[category] || category;
}

export function getFurnishingLabel(status?: string): string {
  const labels: Record<string, string> = {
    furnished: 'Furnished',
    semi_furnished: 'Semi-Furnished',
    unfurnished: 'Unfurnished',
  };
  return status ? labels[status] || status : '';
}

export function getBedroomLabel(count?: number): string {
  if (!count) return '';
  if (count === 1) return '1 BHK';
  return `${count} BHK`;
}

export function getPrimaryImage(images: any[]): string {
  if (!images?.length) return '/placeholder-property.svg';
  const primary = images.find((img) => img.isPrimary);
  const img = primary || images[0];
  if (img.url.startsWith('http')) return img.url;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}${img.url}`;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'house', label: 'Independent House' },
  { value: 'plot', label: 'Plot' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'commercial_office', label: 'Office Space' },
  { value: 'commercial_shop', label: 'Shop' },
  { value: 'pg', label: 'PG / Co-Living' },
];

export const PRICE_RANGES_BUY = [
  { label: 'Under ₹30L', min: 0, max: 3000000 },
  { label: '₹30L - ₹60L', min: 3000000, max: 6000000 },
  { label: '₹60L - ₹1Cr', min: 6000000, max: 10000000 },
  { label: '₹1Cr - ₹1.5Cr', min: 10000000, max: 15000000 },
  { label: '₹1.5Cr - ₹3Cr', min: 15000000, max: 30000000 },
  { label: 'Above ₹3Cr', min: 30000000, max: undefined },
];

export const PRICE_RANGES_RENT = [
  { label: 'Under ₹10K', min: 0, max: 10000 },
  { label: '₹10K - ₹20K', min: 10000, max: 20000 },
  { label: '₹20K - ₹35K', min: 20000, max: 35000 },
  { label: '₹35K - ₹50K', min: 35000, max: 50000 },
  { label: 'Above ₹50K', min: 50000, max: undefined },
];

export const TOP_CITIES = [
  { name: 'Mumbai', gradient: 'from-blue-500 to-cyan-400', count: '45,200+' },
  { name: 'Delhi', gradient: 'from-orange-500 to-red-400', count: '38,900+' },
  { name: 'Bangalore', gradient: 'from-green-500 to-teal-400', count: '52,100+' },
  { name: 'Pune', gradient: 'from-purple-500 to-pink-400', count: '28,400+' },
  { name: 'Hyderabad', gradient: 'from-yellow-500 to-orange-400', count: '31,700+' },
  { name: 'Chennai', gradient: 'from-indigo-500 to-blue-400', count: '22,800+' },
];
