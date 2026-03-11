import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminApi } from '@/lib/api';

export interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  rejectedProperties: number;
  featuredProperties: number;
  totalInquiries: number;
}

export interface AdminProperty {
  id: string;
  title: string;
  slug: string;
  city: string;
  locality: string;
  type: string;
  category: string;
  price: number;
  status: string;
  approvalStatus: string;
  listingPlan: string;
  isFeatured: boolean;
  createdAt: string;
  owner?: { id: string; name: string; phone?: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface AdminState {
  stats: DashboardStats | null;
  statsLoading: boolean;
  properties: AdminProperty[];
  propertiesTotal: number;
  propertiesLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  statsLoading: false,
  properties: [],
  propertiesTotal: 0,
  propertiesLoading: false,
  categories: [],
  categoriesLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const r = await adminApi.getDashboard();
      return r.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats');
    }
  },
);

export const fetchAdminProperties = createAsyncThunk(
  'admin/fetchProperties',
  async (params: Record<string, any>, { rejectWithValue }) => {
    try {
      const r = await adminApi.getProperties(params);
      const data = r.data;
      return {
        properties: data?.properties || data?.items || data || [],
        total: data?.total || 0,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch properties');
    }
  },
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<Category[]>) {
      state.categories = action.payload;
    },
    addCategory(state, action: PayloadAction<Category>) {
      state.categories.unshift(action.payload);
    },
    updateCategory(state, action: PayloadAction<Category>) {
      const idx = state.categories.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.categories[idx] = action.payload;
    },
    removeCategory(state, action: PayloadAction<string>) {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
    updatePropertyStatus(state, action: PayloadAction<{ id: string; approvalStatus: string }>) {
      const p = state.properties.find((p) => p.id === action.payload.id);
      if (p) p.approvalStatus = action.payload.approvalStatus;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAdminProperties.pending, (state) => { state.propertiesLoading = true; })
      .addCase(fetchAdminProperties.fulfilled, (state, action) => {
        state.propertiesLoading = false;
        state.properties = action.payload.properties;
        state.propertiesTotal = action.payload.total;
      })
      .addCase(fetchAdminProperties.rejected, (state, action) => {
        state.propertiesLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCategories, addCategory, updateCategory, removeCategory, updatePropertyStatus } = adminSlice.actions;
export default adminSlice.reducer;
