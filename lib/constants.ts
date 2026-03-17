// ─── Property Categories ──────────────────────────────────────────────────────
export const PROPERTY_CATEGORIES = [
  { value: 'buy', label: 'Buy', icon: '🏠', description: 'Apartments, Villas, Plots' },
  { value: 'rent', label: 'Rent', icon: '🔑', description: 'Flats, Houses, PG' },
  { value: 'pg', label: 'PG / Co-Living', icon: '🛏️', description: 'Single, Double, Triple' },
  { value: 'commercial', label: 'Commercial', icon: '🏢', description: 'Office, Shop, Warehouse' },
  { value: 'industrial', label: 'Industrial', icon: '🏭', description: 'Factory, Warehouse, Shed' },
  { value: 'builder_project', label: 'New Project', icon: '🏗️', description: 'Builder Floors, Societies' },
  { value: 'investment', label: 'Investment', icon: '📈', description: 'Plots, REITs, Land' },
] as const;

export type PropertyCategoryValue = typeof PROPERTY_CATEGORIES[number]['value'];

// ─── Property Types ───────────────────────────────────────────────────────────
export const PROPERTY_TYPES_ALL = [
  // Residential
  { value: 'apartment', label: 'Apartment', category: ['buy', 'rent'], icon: '🏢' },
  { value: 'villa', label: 'Villa', category: ['buy', 'rent'], icon: '🏡' },
  { value: 'house', label: 'Independent House', category: ['buy', 'rent'], icon: '🏠' },
  { value: 'builder_floor', label: 'Builder Floor', category: ['buy', 'rent'], icon: '🏗️' },
  { value: 'penthouse', label: 'Penthouse', category: ['buy', 'rent'], icon: '🌆' },
  { value: 'studio', label: 'Studio Apartment', category: ['buy', 'rent'], icon: '🛋️' },
  { value: 'farm_house', label: 'Farm House', category: ['buy', 'rent'], icon: '🌾' },
  // Plots/Land
  { value: 'plot', label: 'Residential Plot', category: ['buy', 'investment'], icon: '📐' },
  { value: 'land', label: 'Agricultural Land', category: ['buy', 'investment'], icon: '🌱' },
  // PG
  { value: 'pg', label: 'PG / Hostel', category: ['pg'], icon: '🛏️' },
  { value: 'co_living', label: 'Co-Living Space', category: ['pg'], icon: '🏘️' },
  // Commercial
  { value: 'commercial_office', label: 'Office Space', category: ['commercial', 'buy', 'rent'], icon: '💼' },
  { value: 'commercial_shop', label: 'Shop / Showroom', category: ['commercial', 'buy', 'rent'], icon: '🏪' },
  { value: 'showroom', label: 'Showroom', category: ['commercial'], icon: '🏪' },
  // Industrial
  { value: 'commercial_warehouse', label: 'Warehouse', category: ['industrial', 'commercial'], icon: '🏭' },
  { value: 'factory', label: 'Factory / Manufacturing', category: ['industrial'], icon: '⚙️' },
  { value: 'industrial_shed', label: 'Industrial Shed', category: ['industrial'], icon: '🏗️' },
] as const;

export type PropertyTypeValue = typeof PROPERTY_TYPES_ALL[number]['value'];

// Helper to get types for a category
export const getTypesForCategory = (category: string) =>
  PROPERTY_TYPES_ALL.filter(t => (t.category as readonly string[]).includes(category));

// ─── Listing Types (Rent vs Sale) ─────────────────────────────────────────────
export const LISTING_TYPES = [
  { value: 'rent', label: 'Rent / Lease', icon: '🔑', desc: 'Monthly rent basis' },
  { value: 'buy', label: 'Sale', icon: '🏷️', desc: 'One-time purchase' },
] as const;

// ─── BHK Options ─────────────────────────────────────────────────────────────
export const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5 BHK' },
  { value: '6', label: '6+ BHK' },
] as const;

// ─── Furnishing Options ───────────────────────────────────────────────────────
export const FURNISHING_OPTIONS = [
  { value: 'furnished', label: 'Fully Furnished', icon: '🛋️' },
  { value: 'semi_furnished', label: 'Semi Furnished', icon: '🪑' },
  { value: 'unfurnished', label: 'Unfurnished', icon: '📦' },
] as const;

// ─── Possession Options ───────────────────────────────────────────────────────
export const POSSESSION_OPTIONS = [
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'under_construction', label: 'Under Construction' },
] as const;

// ─── Price Ranges ─────────────────────────────────────────────────────────────
export const PRICE_RANGES_BUY = [
  { label: 'Under ₹25 Lac', min: 0, max: 2500000 },
  { label: '₹25 - 50 Lac', min: 2500000, max: 5000000 },
  { label: '₹50 Lac - 1 Cr', min: 5000000, max: 10000000 },
  { label: '₹1 - 2 Cr', min: 10000000, max: 20000000 },
  { label: '₹2 - 5 Cr', min: 20000000, max: 50000000 },
  { label: 'Above ₹5 Cr', min: 50000000, max: 0 },
] as const;

export const PRICE_RANGES_RENT = [
  { label: 'Under ₹10K/mo', min: 0, max: 10000 },
  { label: '₹10K - 20K/mo', min: 10000, max: 20000 },
  { label: '₹20K - 40K/mo', min: 20000, max: 40000 },
  { label: '₹40K - 75K/mo', min: 40000, max: 75000 },
  { label: '₹75K - 1.5L/mo', min: 75000, max: 150000 },
  { label: 'Above ₹1.5L/mo', min: 150000, max: 0 },
] as const;

// ─── Brokerage Options ────────────────────────────────────────────────────────
export const BROKERAGE_RENT_OPTIONS = [
  { value: '10_days', label: '10 Days Rent' },
  { value: '15_days', label: '15 Days Rent' },
  { value: '1_month', label: '1 Month Rent' },
  { value: '2_months', label: '2 Months Rent' },
  { value: 'no_brokerage', label: 'No Brokerage' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'custom', label: 'Other (specify)' },
] as const;

export const BROKERAGE_SALE_OPTIONS = [
  { value: '0.5_percent', label: '0.5%' },
  { value: '1_percent', label: '1%' },
  { value: '2_percent', label: '2%' },
  { value: 'no_brokerage', label: 'No Brokerage' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'custom', label: 'Other (specify)' },
] as const;

// ─── Agent Tick Types ─────────────────────────────────────────────────────────
export const AGENT_TICK_TYPES = {
  none:     { label: 'Standard',     color: '',                 icon: '',  bg: '',                extraCredits: 0,   description: 'Standard agent account' },
  verified: { label: 'Verified',     color: 'text-blue-500',   icon: '✓', bg: 'bg-blue-100',     extraCredits: 20,  description: 'Verified Agent Badge + 20 Extra Daily Credits' },
  bronze:   { label: 'Bronze Badge', color: 'text-orange-600', icon: '◉', bg: 'bg-orange-100',   extraCredits: 50,  description: 'Bronze Badge + Priority Listing + 50 Extra Daily Credits' },
  silver:   { label: 'Silver Badge', color: 'text-slate-500',  icon: '◈', bg: 'bg-slate-100',    extraCredits: 100, description: 'Silver Badge + Top Search Priority + 100 Extra Daily Credits' },
  gold:     { label: 'Gold Badge',   color: 'text-amber-500',  icon: '★', bg: 'bg-amber-100',    extraCredits: 999, description: 'Gold Badge + Top 3 Position + Direct Call Highlight + Unlimited Credits' },
} as const;

// Daily credit limits per tick type
export const AGENT_DAILY_CREDITS = {
  none:     100,
  verified: 120,   // 100 + 20 extra
  bronze:   150,   // 100 + 50 extra
  silver:   200,   // 100 + 100 extra
  gold:     99999, // unlimited
} as const;

// ─── India States (Primary) ───────────────────────────────────────────────────
export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
] as const;

// ─── Featured Cities ──────────────────────────────────────────────────────────
export const TOP_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', gradient: 'from-blue-400 to-blue-600', count: '12,000+' },
  { name: 'Delhi', state: 'Delhi', gradient: 'from-red-400 to-red-600', count: '15,000+' },
  { name: 'Bangalore', state: 'Karnataka', gradient: 'from-green-400 to-green-600', count: '10,000+' },
  { name: 'Hyderabad', state: 'Telangana', gradient: 'from-orange-400 to-orange-600', count: '8,000+' },
  { name: 'Chennai', state: 'Tamil Nadu', gradient: 'from-teal-400 to-teal-600', count: '6,000+' },
  { name: 'Pune', state: 'Maharashtra', gradient: 'from-purple-400 to-purple-600', count: '9,000+' },
  { name: 'Kolkata', state: 'West Bengal', gradient: 'from-yellow-400 to-yellow-600', count: '5,000+' },
  { name: 'Ahmedabad', state: 'Gujarat', gradient: 'from-pink-400 to-pink-600', count: '4,000+' },
  { name: 'Noida', state: 'Uttar Pradesh', gradient: 'from-indigo-400 to-indigo-600', count: '7,000+' },
  { name: 'Gurgaon', state: 'Haryana', gradient: 'from-cyan-400 to-cyan-600', count: '6,500+' },
  { name: 'Jaipur', state: 'Rajasthan', gradient: 'from-amber-400 to-amber-600', count: '3,500+' },
  { name: 'Lucknow', state: 'Uttar Pradesh', gradient: 'from-lime-400 to-lime-600', count: '3,000+' },
] as const;

// ─── Sort Options ─────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Newest First' },
  { value: 'price:ASC', label: 'Price: Low to High' },
  { value: 'price:DESC', label: 'Price: High to Low' },
  { value: 'area:DESC', label: 'Area: Largest First' },
  { value: 'viewCount:DESC', label: 'Most Popular' },
] as const;

// ─── Description Hints by Category ────────────────────────────────────────────
export const DESCRIPTION_HINTS: Record<string, string[]> = {
  residential: [
    'Mention nearby metro station, schools, hospitals',
    'Describe road connectivity (highway, main road)',
    'Highlight amenities like pool, gym, parking',
    'Mention floor number and view (sea/garden/city)',
    'Note any recent renovation or upgrades',
  ],
  commercial: [
    'Mention footfall and visibility from main road',
    'Describe nearby businesses and target customers',
    'Note power supply capacity and backup',
    'Mention parking availability and loading access',
    'Highlight public transport connectivity',
  ],
  industrial: [
    'Specify ceiling/height clearance in feet',
    'Mention power load (KW/KVA) and phases available',
    'Describe dock/ramp availability for trucks',
    'Note distance from NH, railway siding',
    'Mention pollution clearance / zone type',
  ],
  pg: [
    'Mention meals (included or not)',
    'Describe nearby offices, colleges, metros',
    'List what is included (WiFi, laundry, AC)',
    'Mention warden/caretaker availability',
    'Highlight security features and timings',
  ],
};

// ─── Auto Title Generator ─────────────────────────────────────────────────────
export function generatePropertyTitle(params: {
  category: string;
  listingType: string;  // 'rent' | 'buy'
  propertyType: string;
  bedrooms?: string;
  city?: string;
  locality?: string;
}): string {
  const { listingType, propertyType, bedrooms, city, locality } = params;

  const typeLabels: Record<string, string> = {
    apartment: 'Apartment', villa: 'Villa', house: 'Independent House',
    builder_floor: 'Builder Floor', penthouse: 'Penthouse', studio: 'Studio',
    farm_house: 'Farm House', plot: 'Residential Plot', land: 'Land',
    pg: 'PG Accommodation', co_living: 'Co-Living Space',
    commercial_office: 'Office Space', commercial_shop: 'Shop',
    commercial_warehouse: 'Warehouse', factory: 'Factory',
    industrial_shed: 'Industrial Shed', showroom: 'Showroom',
  };

  const parts: string[] = [];
  if (bedrooms && ['apartment', 'villa', 'house', 'builder_floor', 'penthouse'].includes(propertyType)) {
    parts.push(`${bedrooms} BHK`);
  }
  parts.push(typeLabels[propertyType] || propertyType);
  parts.push(listingType === 'rent' ? 'for Rent' : listingType === 'buy' ? 'for Sale' : `for ${listingType}`);
  parts.push('in');
  parts.push(locality || city || 'India');

  return parts.join(' ');
}

export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── User Type Options ────────────────────────────────────────────────────────
export const USER_TYPE_OPTIONS = [
  { value: 'owner', label: 'I am Owner', icon: '🏠', desc: 'Unlimited free listings, no brokerage required' },
  { value: 'agent', label: 'I am Agent / Dealer', icon: '🏢', desc: '100 daily credits, professional tools' },
] as const;

// ─── Property Status Labels ───────────────────────────────────────────────────
export const PROPERTY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  sold: { label: 'Sold', color: 'bg-gray-100 text-gray-600' },
  rented: { label: 'Rented', color: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-600' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
};

export const APPROVAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
};

// ─── Amenity Categories ───────────────────────────────────────────────────────
export const COMMON_AMENITIES = [
  'Swimming Pool', 'Gym / Fitness Center', 'Clubhouse', 'Children Play Area',
  'Security / CCTV', 'Power Backup', 'Lift / Elevator', 'Car Parking',
  'Garden / Park', 'Jogging Track', 'Indoor Games', 'Intercom',
  'Water Supply 24/7', 'Gas Pipeline', 'WiFi / Internet',
  'Rooftop Terrace', 'Basketball Court', 'Tennis Court',
] as const;

export const INDUSTRIAL_AMENITIES = [
  'Loading Dock', 'Truck Ramp', 'Overhead Crane', 'Power Backup Generator',
  '3-Phase Power', 'Fire Suppression System', 'CCTV Security',
  'Security Guards', 'Admin Office', 'Worker Restrooms',
  'Canteen / Cafeteria', 'Weighbridge', 'Railhead Connectivity',
] as const;
