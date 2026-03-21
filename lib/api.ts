import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 auto-refresh: try /auth/refresh (uses HTTP-only `rt` cookie) once, then give up
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      typeof window !== 'undefined' &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/otp')
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        const newToken = data.token || data.accessToken;
        if (newToken) {
          localStorage.setItem('token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          refreshQueue.forEach((cb) => cb(newToken));
          refreshQueue = [];
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        // Refresh failed — clear auth and let the page handle redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// Properties
export const propertiesApi = {
  getAll: (params?: Record<string, any>) => api.get('/properties', { params }),
  getForMap: (params?: Record<string, any>) => api.get('/properties/map', { params }),
  getSearchSuggestions: (q: string) =>
    api.get('/properties/search/suggestions', { params: { q } }),
  getFeatured: (limit = 8) => api.get('/properties/featured', { params: { limit } }),
  getStats: () => api.get('/properties/stats'),
  getCities: () => api.get('/properties/cities'),
  getAmenities: () => api.get('/properties/amenities'),
  getById: (id: string) => api.get(`/properties/id/${id}`),
  getBySlug: (slug: string) => api.get(`/properties/${slug}`),
  getSimilar: (id: string) => api.get(`/properties/${id}/similar`),
  getMyListings: (params?: Record<string, any>) => api.get('/properties/my-listings', { params }),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),
  publishDraft: (id: string) => api.patch(`/properties/${id}/publish`),
  delete: (id: string) => api.delete(`/properties/${id}`),
  uploadImages: (id: string, formData: FormData) =>
    api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (propertyId: string, imageId: string) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
  trackView: (id: string, body: { sessionId?: string; source?: string; referrer?: string; deviceType?: string }) =>
    api.post(`/properties/${id}/view`, body).catch(() => {}), // fire-and-forget, never throws
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/properties/${id}/status`, { status, note }),
  getStatusHistory: (id: string) => api.get(`/properties/${id}/status-history`),
};

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; email?: string; city?: string; company?: string }) =>
    api.patch('/auth/profile', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/auth/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string, name?: string) =>
    api.post('/auth/otp/verify', { phone, otp, name }),
  completeOnboarding: (data: { role: string; name?: string; agentLicense?: string; agentExperience?: number }) =>
    api.patch('/auth/onboarding', data),
  upgradeRole: (role: 'owner' | 'agent') => api.patch('/auth/upgrade-role', { role }),
};

// Menus
export const menusApi = {
  getMyMenus: () => api.get('/menus/me'),
  getMenusByRole: (role: string) => api.get(`/menus/by-role/${role}`),
  adminGetMatrix: () => api.get('/menus/admin/matrix'),
  adminTogglePermission: (role: string, menuId: number, isVisible: boolean) =>
    api.patch('/menus/admin/permission', { role, menuId, isVisible }),
  adminUpdateOrder: (menuId: number, sortOrder: number) =>
    api.patch(`/menus/admin/${menuId}/order`, { sortOrder }),
  adminSeed: () => api.get('/menus/admin/seed'),
};

// Locations
export const locationsApi = {
  search: (q: string) => api.get('/locations/search', { params: { q } }),
  getCities: (search?: string, limit?: number) =>
    api.get('/locations/cities', { params: { search: search || undefined, limit } }),
  getLocalities: (city: string, state?: string, search?: string) =>
    api.get('/locations/localities', { params: { city, state, search: search || undefined } }),
  /** Alias used by FindPropertyClient */
  getLocalitiesByCity: (city: string, state?: string, search?: string) =>
    api.get('/locations/localities', { params: { city, state, search: search || undefined } }),
  getStates: () => api.get('/locations/states'),
  getCitiesByState: (stateId: string) => api.get(`/locations/states/${stateId}/cities`),
  getSeoContent: (params: { city?: string; state?: string }) =>
    api.get('/locations/seo', { params }),
  getTopCities: () => api.get('/locations/top-cities'),
  getStateBySlug: (slug: string) => api.get(`/locations/states/by-slug/${slug}`),
  getStatesWithStats: () => api.get('/locations/states-with-stats'),
};

// Inquiries
export const inquiriesApi = {
  create: (propertyId: string, data: any) =>
    api.post(`/inquiries/property/${propertyId}`, data),
  contactAgent: (agentId: string, data: any) =>
    api.post(`/inquiries/agent/${agentId}`, data),
  getMyInquiries: () => api.get('/inquiries/my-inquiries'),
};

// Services
export const servicesApi = {
  getAll: () => api.get('/services'),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Market Intelligence
  listMarketSnapshots: () => api.get('/admin/market-snapshots'),
  updateMarketSnapshot: (id: string, data: { isFeatured?: boolean; sortOrder?: number }) =>
    api.patch(`/admin/market-snapshots/${id}`, data),
  refreshMarketSnapshot: (city?: string, all?: boolean) =>
    api.post('/home/market-snapshot/refresh', { city, all }),
  // Scoring Config
  getScoringConfig: () => api.get('/admin/scoring-config'),
  setScoringConfig: (key: string, data: { value: number; description?: string }) =>
    api.patch(`/admin/scoring-config/${key}`, data),
  resetScoringConfig: (key: string) => api.delete(`/admin/scoring-config/${key}`),
  // Properties
  getProperties: (params?: Record<string, any>) => api.get('/admin/properties', { params }),
  approveProperty: (id: string) => api.patch(`/admin/properties/${id}/approve`),
  rejectProperty: (id: string, reason?: string) =>
    api.patch(`/admin/properties/${id}/reject`, { reason }),
  updateProperty: (id: string, data: any) => api.patch(`/admin/properties/${id}`, data),
  deleteProperty: (id: string) => api.delete(`/admin/properties/${id}`),
  togglePropertyStatus: (id: string) => api.patch(`/admin/properties/${id}/toggle-status`),
  togglePropertyFeatured: (id: string) => api.patch(`/admin/properties/${id}/toggle-featured`),
  // Agents
  getAgents: (params?: Record<string, any>) => api.get('/admin/agents', { params }),
  getAgent: (id: string) => api.get(`/admin/agents/${id}`),
  createAgent: (data: any) => api.post('/admin/agents', data),
  updateAgent: (id: string, data: any) => api.patch(`/admin/agents/${id}`, data),
  updateQuota: (id: string, agentFreeQuota: number) =>
    api.patch(`/admin/agents/${id}/quota`, { agentFreeQuota }),
  toggleAgentStatus: (id: string) => api.patch(`/admin/agents/${id}/toggle-status`),
  // Agent avatar approval
  getPendingAvatarAgents: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/agents/pending-images', { params }),
  approveAgentAvatar: (id: string) => api.patch(`/admin/agents/${id}/approve-avatar`),
  rejectAgentAvatar: (id: string) => api.patch(`/admin/agents/${id}/reject-avatar`),
  // Countries
  getCountries: () => api.get('/admin/countries'),
  createCountry: (data: any) => api.post('/admin/countries', data),
  updateCountry: (id: string, data: any) => api.patch(`/admin/countries/${id}`, data),
  deleteCountry: (id: string) => api.delete(`/admin/countries/${id}`),
};

// Wallet APIs
export const walletApi = {
  getWallet: () => api.get('/wallet'),
  getTransactions: (params?: { page?: number; limit?: number }) => api.get('/wallet/transactions', { params }),
  getBoostPlans: () => api.get('/wallet/boost-plans'),
  getSubscriptionPlans: () => api.get('/wallet/subscription-plans'),
};

// Boost property
export const boostPropertyApi = (propertyId: string, boostPlanId: string) =>
  api.post(`/properties/${propertyId}/boost`, { boostPlanId });

// Locations - States/Cities
export const statesApi = {
  getAll: () => api.get('/locations/states'),
  getCities: (stateId: string) => api.get(`/locations/states/${stateId}/cities`),
};

// Admin Wallet
export const adminWalletApi = {
  getAllWallets: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/wallets', { params }),
  topUp: (userId: string, amount: number, description?: string) =>
    api.post(`/admin/wallets/${userId}/top-up`, { amount, description }),
  deduct: (userId: string, amount: number, description?: string) =>
    api.post(`/admin/wallets/${userId}/deduct`, { amount, description }),
  getAllTransactions: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/transactions', { params }),
};

// Admin Locations
export const adminLocationsApi = {
  getStates: () => api.get('/admin/states'),
  createState: (data: { name: string; code: string }) => api.post('/admin/states', data),
  updateState: (id: string, data: any) => api.patch(`/admin/states/${id}`, data),
  deleteState: (id: string) => api.delete(`/admin/states/${id}`),
  getCities: (params?: { page?: number; limit?: number; search?: string; stateId?: string }) =>
    api.get('/admin/cities', { params }),
  createCity: (data: { name: string; stateId: string; isFeatured?: boolean }) =>
    api.post('/admin/cities', data),
  updateCity: (id: string, data: any) => api.patch(`/admin/cities/${id}`, data),
  deleteCity: (id: string) => api.delete(`/admin/cities/${id}`),
  // Localities
  getLocalities: (params?: { page?: number; limit?: number; state?: string; city?: string; search?: string }) =>
    api.get('/admin/localities', { params }),
  createLocality: (data: { city: string; state: string; locality?: string; pincode?: string; latitude?: number; longitude?: number }) =>
    api.post('/admin/localities', data),
  updateLocality: (id: string, data: any) => api.patch(`/admin/localities/${id}`, data),
  deleteLocality: (id: string) => api.delete(`/admin/localities/${id}`),
  bulkImportLocalities: (rows: { city: string; state: string; locality?: string; pincode?: string }[]) =>
    api.post('/admin/localities/bulk-import', { rows }),
};

// Admin Subscription/Boost Plans
export const adminPlansApi = {
  getSubscriptionPlans: () => api.get('/admin/subscription-plans'),
  createSubscriptionPlan: (data: any) => api.post('/admin/subscription-plans', data),
  updateSubscriptionPlan: (id: string, data: any) => api.patch(`/admin/subscription-plans/${id}`, data),
  deleteSubscriptionPlan: (id: string) => api.delete(`/admin/subscription-plans/${id}`),
  getBoostPlans: () => api.get('/admin/boost-plans'),
  createBoostPlan: (data: any) => api.post('/admin/boost-plans', data),
  updateBoostPlan: (id: string, data: any) => api.patch(`/admin/boost-plans/${id}`, data),
  deleteBoostPlan: (id: string) => api.delete(`/admin/boost-plans/${id}`),
};

// Users / Agents (public)
export const usersApi = {
  getStats: () => api.get<{ totalAgents: number }>('/users/stats'),
  getAgents: (params?: {
    page?: number;
    limit?: number;
    city?: string;
    cityId?: string;
    state?: string;
    stateId?: string;
    locality?: string;
    search?: string;
  }) => api.get('/users/agents', { params }),
  getAgentById: (id: string) => api.get(`/users/${id}`),
};

// Categories (admin + public)
export const categoriesApi = {
  getAll: () => api.get('/admin/categories'),
  create: (data: { name: string; slug: string; icon?: string; description?: string; sortOrder?: number }) =>
    api.post('/admin/categories', data),
  update: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
  toggleActive: (id: string) => api.patch(`/admin/categories/${id}/toggle`),
};

// Agent APIs
export const agentApi = {
  getMyListings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/properties/my-listings', { params }),
  getMyInquiries: (params?: { page?: number; limit?: number }) =>
    api.get('/inquiries/agent-inbox', { params }),
  getDashboardStats: () => api.get('/agent/dashboard'),
};

// Saved Properties (Buyer)
export const savedApi = {
  getSaved: (params?: { page?: number; limit?: number }) =>
    api.get('/saved/properties', { params }),
  getSavedIds: () => api.get('/saved/properties/ids'),
  save: (propertyId: string) => api.post(`/saved/properties/${propertyId}`),
  unsave: (propertyId: string) => api.delete(`/saved/properties/${propertyId}`),
};

// Property Alerts (Buyer)
export const alertsApi = {
  getAll: () => api.get('/alerts'),
  create: (data: {
    alertName: string;
    category?: string;
    city?: string;
    locality?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    frequency?: string;
  }) => api.post('/alerts', data),
  update: (id: string, data: any) => api.patch(`/alerts/${id}`, data),
  toggle: (id: string) => api.patch(`/alerts/${id}/toggle`),
  delete: (id: string) => api.delete(`/alerts/${id}`),
};

// ── Property Config (public) ──────────────────────────────────────────────────
export const propertyConfigApi = {
  getCategories: () => api.get('/property-config/categories'),
  getTypes: (categoryId: string) => api.get('/property-config/types', { params: { categoryId } }),
  getTypesBySlug: (categorySlug: string) => api.get('/property-config/types', { params: { categorySlug } }),
  getAmenities: (typeId: string) => api.get('/property-config/amenities', { params: { typeId } }),
  getFields: (typeId: string) => api.get('/property-config/fields', { params: { typeId } }),
  getListingFilters: (category?: string) =>
    api.get('/property-config/listing-filters', { params: category ? { category } : {} }),
};

// ── Property Config Admin ─────────────────────────────────────────────────────
export const propConfigAdminApi = {
  // Categories
  getCategories: () => api.get('/property-config/admin/categories'),
  createCategory: (d: any) => api.post('/property-config/admin/categories', d),
  updateCategory: (id: string, d: any) => api.patch(`/property-config/admin/categories/${id}`, d),
  deleteCategory: (id: string) => api.delete(`/property-config/admin/categories/${id}`),
  // Types
  getTypes: (categoryId?: string) => api.get('/property-config/admin/types', { params: categoryId ? { categoryId } : {} }),
  createType: (d: any) => api.post('/property-config/admin/types', d),
  updateType: (id: string, d: any) => api.patch(`/property-config/admin/types/${id}`, d),
  deleteType: (id: string) => api.delete(`/property-config/admin/types/${id}`),
  // Amenities
  getAmenities: () => api.get('/property-config/admin/amenities'),
  createAmenity: (d: any) => api.post('/property-config/admin/amenities', d),
  updateAmenity: (id: string, d: any) => api.patch(`/property-config/admin/amenities/${id}`, d),
  deleteAmenity: (id: string) => api.delete(`/property-config/admin/amenities/${id}`),
  // Type-Amenity mapping
  getTypeAmenities: (typeId: string) => api.get(`/property-config/admin/types/${typeId}/amenities`),
  setTypeAmenities: (typeId: string, amenityIds: string[]) =>
    api.post(`/property-config/admin/types/${typeId}/amenities`, { amenityIds }),
  // Fields
  getFields: (typeId: string) => api.get(`/property-config/admin/types/${typeId}/fields`),
  createField: (typeId: string, d: any) => api.post(`/property-config/admin/types/${typeId}/fields`, d),
  updateField: (id: string, d: any) => api.patch(`/property-config/admin/fields/${id}`, d),
  deleteField: (id: string) => api.delete(`/property-config/admin/fields/${id}`),
  reorderFields: (typeId: string, orderedIds: string[]) =>
    api.post(`/property-config/admin/types/${typeId}/fields/reorder`, { orderedIds }),
  // Listing Filter Configs
  getListingFilters: () => api.get('/property-config/admin/listing-filters'),
  createListingFilter: (d: any) => api.post('/property-config/admin/listing-filters', d),
  updateListingFilter: (id: string, d: any) => api.patch(`/property-config/admin/listing-filters/${id}`, d),
  deleteListingFilter: (id: string) => api.delete(`/property-config/admin/listing-filters/${id}`),
  reorderListingFilters: (orderedIds: string[]) =>
    api.post('/property-config/admin/listing-filters/reorder', { orderedIds }),
};

// ── Agency & Agent Profile APIs ───────────────────────────────────────────────
export const agencyApi = {
  // Public
  getAgencies: (params?: { page?: number; limit?: number; search?: string; cityId?: string }) =>
    api.get('/agency', { params }),
  getAgency: (id: string) => api.get(`/agency/${id}`),
  getAgencyAgents: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/agency/${id}/agents`, { params }),
  getAgentsByCity: (cityId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/agency/agents/by-city/${cityId}`, { params }),
  getPropertiesByAgent: (agentId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/agency/agent/${agentId}/properties`, { params }),

  // Agent (my)
  getMyDashboard: () => api.get('/agency/me/dashboard'),
  getAgentDashboard: () => api.get('/agency/me/dashboard'),
  getMyAgency: () => api.get('/agency/me/agency'),
  getMyProperties: (params?: { page?: number; limit?: number }) =>
    api.get('/agency/me/properties', { params }),
  getMyLocations: () => api.get('/agency/me/locations'),
  addMyLocation: (dto: {
    coverageType?: 'state' | 'city' | 'locality';
    stateId?: string; stateName?: string;
    cityId?: string; cityName?: string;
    localityId?: string; localityName?: string;
  }) => api.post('/agency/me/locations', dto),
  removeMyLocation: (id: string) => api.delete(`/agency/me/locations/${id}`),

  // Agent self-registration
  selfRegisterOrJoin: (data: { agencyName: string; contactPhone?: string; address?: string; city?: string; cityId?: string }) =>
    api.post('/agency/self/register-or-join', data),

  // Admin — Agencies
  adminCreateAgency: (data: any) => api.post('/agency/admin/agencies', data),
  adminUpdateAgency: (id: string, data: any) => api.patch(`/agency/admin/agencies/${id}`, data),
  adminDeleteAgency: (id: string) => api.delete(`/agency/admin/agencies/${id}`),
  adminGetPendingAgencies: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/agencies', { params: { ...params, status: 'pending' } }),
  adminApproveAgency: (id: string) => api.patch(`/admin/agencies/${id}/approve`),
  adminRejectAgency: (id: string, reason?: string) =>
    api.patch(`/admin/agencies/${id}/reject`, { reason }),

  // Admin — Agent Profiles
  adminGetAgentProfiles: (params?: { search?: string; limit?: number; unassigned?: boolean }) =>
    api.get('/agency/admin/agent-profiles', { params }),
  adminCreateAgentProfile: (data: any) => api.post('/agency/admin/agent-profiles', data),
  adminUpdateAgentProfile: (id: string, data: any) =>
    api.patch(`/agency/admin/agent-profiles/${id}`, data),
  adminAssignAgentToAgency: (profileId: string, agencyId: string | null) =>
    api.patch(`/agency/admin/agent-profiles/${profileId}/assign-agency`, { agencyId }),
  adminGetAgentProfile: (id: string) => api.get(`/agency/admin/agent-profiles/${id}`),
  adminGetAgentProfileByUser: (userId: string) => api.get(`/agency/admin/agent-profile-by-user/${userId}`),

  // Admin — Property Assignment
  adminAssignProperty: (data: { propertyId: string; agentId: string; assignedByAdmin?: boolean }) =>
    api.post('/agency/admin/property-assignments', data),
  adminReassignProperty: (propertyId: string, newAgentId: string) =>
    api.patch(`/agency/admin/property-assignments/${propertyId}/reassign`, { newAgentId }),
  adminGetPropertyAgent: (propertyId: string) =>
    api.get(`/agency/admin/property-assignments/${propertyId}`),

  // Admin — Agent Locations
  adminAddAgentLocation: (agentProfileId: string, data: { countryId?: string; stateId?: string; cityId?: string }) =>
    api.post(`/agency/admin/agent-profiles/${agentProfileId}/locations`, data),
  adminRemoveAgentLocation: (locationMapId: string) =>
    api.delete(`/agency/admin/agent-locations/${locationMapId}`),

  // Premium Slots (public + admin)
  getPremiumAgents: (city: string) =>
    api.get('/agency/premium-agents', { params: { city } }),
  getTopAgents: (city?: string, limit = 12) =>
    api.get('/agency/top-agents', { params: { city, limit } }),
  adminListPremiumSlots: (params?: { city?: string; page?: number; limit?: number }) =>
    api.get('/agency/admin/premium-slots', { params }),
  adminCreatePremiumSlot: (data: any) => api.post('/agency/admin/premium-slots', data),
  adminDeactivatePremiumSlot: (id: string) => api.delete(`/agency/admin/premium-slots/${id}`),

  // Diamond coverage
  getDiamondAgents: (params: { locality?: string; city?: string; state?: string; limit?: number }) =>
    api.get('/agency/diamond-agents', { params }),
  adminListCoverage: (params?: { agentProfileId?: string; tick?: string; city?: string; page?: number; limit?: number }) =>
    api.get('/agency/admin/coverage', { params }),
  adminAddCoverage: (data: { agentProfileId: string; coverageType: string; cityName?: string; localityName?: string; stateName?: string; cityId?: string; stateId?: string; localityId?: string }) =>
    api.post('/agency/admin/coverage', data),
  adminApproveCoverage: (id: string) => api.patch(`/agency/admin/coverage/${id}/approve`),
  adminDeactivateCoverage: (id: string) => api.patch(`/agency/admin/coverage/${id}/deactivate`),
  adminRemoveCoverage: (id: string) => api.delete(`/agency/admin/coverage/${id}`),
};

// Subscription (Agent)
export const subscriptionApi = {
  getPlans: () => api.get('/wallet/subscription-plans'),
  getCurrent: () => api.get('/wallet/subscription'),
  purchase: (planId: string) => api.post('/wallet/subscription/purchase', { planId }),
};

// SEO Admin API
export const seoApi = {
  // Public
  getCityPageBySlug: (slug: string) => api.get(`/seo/city-pages/${slug}`),
  getFooterLinks: () => api.get('/seo/footer-links'),
  getSeoConfig: () => api.get('/seo/config'),
  // Public - Categories
  getCategoryBySlug: (slug: string) => api.get(`/seo/categories/${slug}`),
  getCategories: () => api.get('/seo/categories'),

  // Admin - City Pages
  adminGetCityPages: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/seo/admin/city-pages', { params }),
  adminCreateCityPage: (data: any) => api.post('/seo/admin/city-pages', data),
  adminUpdateCityPage: (id: string, data: any) => api.patch(`/seo/admin/city-pages/${id}`, data),
  adminDeleteCityPage: (id: string) => api.delete(`/seo/admin/city-pages/${id}`),

  // Admin - SEO Config
  adminGetConfigs: () => api.get('/seo/admin/configs'),
  adminBulkUpsertConfigs: (configs: { key: string; value: string; label?: string; description?: string }[]) =>
    api.post('/seo/admin/configs/bulk', { configs }),
  adminUpsertConfig: (key: string, value: string) => api.patch(`/seo/admin/configs/${key}`, { value }),
  adminDeleteConfig: (id: string) => api.delete(`/seo/admin/configs/${id}`),

  // Admin - Footer Links
  adminGetFooterGroups: () => api.get('/seo/admin/footer-groups'),
  adminCreateFooterGroup: (data: any) => api.post('/seo/admin/footer-groups', data),
  adminUpdateFooterGroup: (id: string, data: any) => api.patch(`/seo/admin/footer-groups/${id}`, data),
  adminDeleteFooterGroup: (id: string) => api.delete(`/seo/admin/footer-groups/${id}`),
  adminCreateFooterLink: (data: any) => api.post('/seo/admin/footer-links', data),
  adminUpdateFooterLink: (id: string, data: any) => api.patch(`/seo/admin/footer-links/${id}`, data),
  adminDeleteFooterLink: (id: string) => api.delete(`/seo/admin/footer-links/${id}`),
};

// ─── Leads API ───────────────────────────────────────────────────────────────
export const leadsApi = {
  /** Public — no auth required */
  capturePublic: (data: Record<string, any>) => api.post('/leads/public', data),
  create: (data: any) => api.post('/leads', data),
  getAll: (params?: Record<string, any>) => api.get('/leads', { params }),
  getMy: (params?: Record<string, any>) => api.get('/leads/my', { params }),
  getStats: (agentId?: string) => api.get('/leads/stats', { params: agentId ? { agentId } : {} }),
  getAnalytics: (params?: Record<string, any>) => api.get('/leads/analytics', { params }),
  exportCsv: (params?: Record<string, any>) =>
    api.get('/leads/export', { params, responseType: 'blob' }),
  getOne: (id: string) => api.get(`/leads/${id}`),
  updateStatus: (id: string, data: { status: string; notes?: string; lostReason?: string }) =>
    api.patch(`/leads/${id}/status`, data),
  assign: (id: string, data: { agentId: string; reason?: string }) =>
    api.patch(`/leads/${id}/assign`, data),
  bulkAssign: (data: { leadIds: string[]; agentId: string; reason?: string }) =>
    api.patch('/leads/bulk/assign', data),
  bulkStatus: (data: { leadIds: string[]; status: string; notes?: string }) =>
    api.patch('/leads/bulk/status', data),
  addNote: (id: string, notes: string) => api.post(`/leads/${id}/notes`, { notes }),
  getActivities: (id: string) => api.get(`/leads/${id}/activities`),
  getAssignments: (id: string) => api.get(`/leads/${id}/assignments`),
  mergeLead: (keepId: string, mergeId: string) => api.post(`/leads/${keepId}/merge/${mergeId}`),
};

// ─── Site Visits API ──────────────────────────────────────────────────────────
export const siteVisitsApi = {
  create: (data: any) => api.post('/site-visits', data),
  getMy: (params?: Record<string, any>) => api.get('/site-visits/my', { params }),
  getAll: (params?: Record<string, any>) => api.get('/site-visits', { params }),
  getToday: () => api.get('/site-visits/today'),
  getByLead: (leadId: string) => api.get(`/site-visits/lead/${leadId}`),
  getOne: (id: string) => api.get(`/site-visits/${id}`),
  update: (id: string, data: any) => api.patch(`/site-visits/${id}`, data),
  complete: (id: string, data: any) => api.patch(`/site-visits/${id}/complete`, data),
  cancel: (id: string, reason: string) => api.patch(`/site-visits/${id}/cancel`, { reason }),
};

// ─── Deals API ────────────────────────────────────────────────────────────────
export const dealsApi = {
  create: (data: any) => api.post('/deals', data),
  getMy: (params?: Record<string, any>) => api.get('/deals/my', { params }),
  getAll: (params?: Record<string, any>) => api.get('/deals', { params }),
  getStats: (agentId?: string) => api.get('/deals/stats', { params: agentId ? { agentId } : {} }),
  getOne: (id: string) => api.get(`/deals/${id}`),
  updateStage: (id: string, data: any) => api.patch(`/deals/${id}/stage`, data),
};

// ─── Commissions API ──────────────────────────────────────────────────────────
export const commissionsApi = {
  create: (data: any) => api.post('/commissions', data),
  getMy: (params?: Record<string, any>) => api.get('/commissions/my', { params }),
  getAll: (params?: Record<string, any>) => api.get('/commissions', { params }),
  getStats: (agentId?: string) =>
    api.get('/commissions/stats', { params: agentId ? { agentId } : {} }),
  getOne: (id: string) => api.get(`/commissions/${id}`),
  approve: (id: string, notes?: string) => api.patch(`/commissions/${id}/approve`, { notes }),
  markPaid: (id: string, data: { paymentReference: string; paymentDate?: string }) =>
    api.patch(`/commissions/${id}/pay`, data),
  dispute: (id: string, reason: string) => api.patch(`/commissions/${id}/dispute`, { reason }),
};

// ─── Home Analytics APIs ──────────────────────────────────────────────────────
export const homeApi = {
  getTopCategories: (params?: { country?: string; state?: string; city?: string; limit?: number }) =>
    api.get('/home/top-categories', { params }),

  getTopStates: (params?: { country?: string; limit?: number }) =>
    api.get('/home/top-states', { params }),

  getTopCities: (params?: { state?: string; country?: string; limit?: number }) =>
    api.get('/home/top-cities', { params }),

  getTopProperties: (params?: { tab?: string; country?: string; state?: string; city?: string; limit?: number; period?: string }) =>
    api.get('/home/top-properties', { params }),

  getTopAgents: (params?: { country?: string; state?: string; city?: string; limit?: number }) =>
    api.get('/home/top-agents', { params }),

  getTopProjects: (params?: { country?: string; state?: string; city?: string; limit?: number }) =>
    api.get('/home/top-projects', { params }),

  getTrending: (params?: { city?: string; state?: string; category?: string; limit?: number }) =>
    api.get('/home/trending', { params }),

  compare: (ids: string[]) =>
    api.get('/home/compare', { params: { ids: ids.join(',') } }),

  getMarketCities: (limit = 12) =>
    api.get('/home/market-cities', { params: { limit } }),

  getPriceSnapshot: (params?: { city?: string; state?: string }) =>
    api.get('/home/price-snapshot', { params }),

  getInsights: (params?: { city?: string; state?: string }) =>
    api.get('/home/insights', { params }),

  trackEvent: (dto: {
    eventType: string;
    entityType?: string;
    entityId?: string;
    sessionId?: string;
    country?: string;
    state?: string;
    city?: string;
    deviceType?: string;
    source?: string;
    metadata?: Record<string, any>;
  }) => api.post('/analytics/track', dto).catch(() => {}), // silent fail
};

// Notifications
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; isRead?: boolean }) =>
    api.get('/notifications', { params }),
  getRecent: () => api.get('/notifications/recent'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

// ─── Agent Feedback API ───────────────────────────────────────────────────────
export const agentFeedbackApi = {
  submit: (agentId: string, data: { rating: number; comment?: string }) =>
    api.post(`/agent-feedback/${agentId}`, data),
  list: (agentId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/agent-feedback/${agentId}`, { params }),
  hasReviewed: (agentId: string) =>
    api.get(`/agent-feedback/${agentId}/has-reviewed`),
};

// ─── Articles API ─────────────────────────────────────────────────────────────
export const articlesApi = {
  // Public
  getPublished: (params?: { page?: number; limit?: number; category?: string; search?: string; featured?: boolean }) =>
    api.get('/articles', { params }),
  getBySlug: (slug: string) => api.get(`/articles/${slug}`),

  // Admin
  adminList: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) =>
    api.get('/articles/admin/list', { params }),
  adminGetOne: (id: string) => api.get(`/articles/admin/${id}`),
  adminCreate: (data: any) => api.post('/articles/admin', data),
  adminUpdate: (id: string, data: any) => api.patch(`/articles/admin/${id}`, data),
  adminDelete: (id: string) => api.delete(`/articles/admin/${id}`),
};
