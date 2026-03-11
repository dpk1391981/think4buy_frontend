import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Properties
export const propertiesApi = {
  getAll: (params?: Record<string, any>) => api.get('/properties', { params }),
  getFeatured: (limit = 8) => api.get('/properties/featured', { params: { limit } }),
  getStats: () => api.get('/properties/stats'),
  getCities: () => api.get('/properties/cities'),
  getAmenities: () => api.get('/properties/amenities'),
  getBySlug: (slug: string) => api.get(`/properties/${slug}`),
  getSimilar: (id: string) => api.get(`/properties/${id}/similar`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  uploadImages: (id: string, formData: FormData) =>
    api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; email?: string; city?: string; company?: string }) =>
    api.patch('/auth/profile', data),
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string, name?: string) =>
    api.post('/auth/otp/verify', { phone, otp, name }),
};

// Locations
export const locationsApi = {
  search: (q: string) => api.get('/locations/search', { params: { q } }),
  getCities: () => api.get('/locations/cities'),
  getLocalities: (city: string) =>
    api.get('/locations/localities', { params: { city } }),
  getStates: () => api.get('/locations/states'),
  getCitiesByState: (stateId: string) => api.get(`/locations/states/${stateId}/cities`),
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
  getAgents: (params?: {
    page?: number;
    limit?: number;
    city?: string;
    state?: string;
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
    api.get('/inquiries/my', { params }),
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
};

// Subscription (Agent)
export const subscriptionApi = {
  getPlans: () => api.get('/wallet/subscription-plans'),
  getCurrent: () => api.get('/wallet/subscription'),
  purchase: (planId: string) => api.post('/wallet/subscription/purchase', { planId }),
};
