export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'plot'
  | 'house'
  | 'penthouse'
  | 'studio'
  | 'commercial_office'
  | 'commercial_shop'
  | 'commercial_warehouse'
  | 'pg'
  | 'co_living';

export type PropertyCategory = 'buy' | 'rent' | 'pg' | 'commercial';

export type PropertyStatus = 'active' | 'sold' | 'rented' | 'inactive' | 'pending';

export type FurnishingStatus = 'furnished' | 'semi_furnished' | 'unfurnished';

export type PossessionStatus = 'ready_to_move' | 'under_construction';

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface PropertyOwner {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  company?: string;
  isVerified: boolean;
  role?: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: PropertyType;
  category: PropertyCategory;
  price: number;
  priceUnit?: string;
  area?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  totalFloors?: number;
  floorNumber?: number;
  parkingSpots?: number;
  furnishingStatus?: FurnishingStatus;
  possessionStatus?: PossessionStatus;
  city: string;
  state?: string;
  locality: string;
  society?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status: PropertyStatus;
  isFeatured: boolean;
  isBoosted?: boolean;
  boostExpiry?: string | null;
  boostExpiresAt?: string | null;
  isPremium: boolean;
  isVerified: boolean;
  listingPlan?: string;
  viewCount: number;
  reraNumber?: string;
  builderName?: string;
  propertyAge?: number;
  metaTitle?: string;
  metaDescription?: string;
  images: PropertyImage[];
  amenities: Amenity[];
  owner: PropertyOwner;
  listedBy?: 'owner' | 'agent';
  agentId?: string;
  agencyId?: string;
  brokerage?: string;
  possessionDate?: string;
  isNewProject?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProperties {
  data: Property[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PropertyFilters {
  category?: PropertyCategory;
  type?: PropertyType | PropertyType[];
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: string;
  furnishingStatus?: FurnishingStatus;
  possessionStatus?: PossessionStatus;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ServiceCatalog {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  type: string;
  ctaText: string;
  ctaUrl?: string;
}
