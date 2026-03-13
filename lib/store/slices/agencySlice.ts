import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { agencyApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agency {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  licenseNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  totalAgents: number;
  totalListings: number;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  agencyId?: string;
  agency?: Agency;
  experienceYears: number;
  licenseNumber?: string;
  rating: number;
  totalDeals: number;
  totalListings: number;
  bio?: string;
  tick: 'none' | 'blue' | 'gold' | 'diamond';
  isActive: boolean;
  locationMaps?: AgentLocationMap[];
  createdAt: string;
}

export interface AgentLocationMap {
  id: string;
  agentId: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  createdAt: string;
}

export interface PropertyAgentMap {
  id: string;
  propertyId: string;
  agentId: string;
  agent?: AgentProfile;
  assignedByAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AgencyDashboard {
  profile: AgentProfile | null;
  agency: Agency | null;
  totalListings: number;
  totalDeals: number;
  rating: number;
  adminAssignedCount: number;
  recentPropertyMaps: PropertyAgentMap[];
  locations: AgentLocationMap[];
}

// ── State ─────────────────────────────────────────────────────────────────────

interface AgencyState {
  // Public agency list
  agencies: Agency[];
  agenciesTotal: number;
  agenciesLoading: boolean;

  // Admin-loaded single agency
  currentAgency: Agency | null;
  currentAgencyLoading: boolean;

  // Agent's own dashboard
  agentDashboard: AgencyDashboard | null;
  agentDashboardLoading: boolean;

  // My agency (for agent side)
  myAgency: Agency | null;
  myAgencyLoading: boolean;

  // Cache: agency profiles by id
  agencyCache: Record<string, Agency>;
  agentProfileCache: Record<string, AgentProfile>;

  error: string | null;
}

const initialState: AgencyState = {
  agencies: [],
  agenciesTotal: 0,
  agenciesLoading: false,
  currentAgency: null,
  currentAgencyLoading: false,
  agentDashboard: null,
  agentDashboardLoading: false,
  myAgency: null,
  myAgencyLoading: false,
  agencyCache: {},
  agentProfileCache: {},
  error: null,
};

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchAgencies = createAsyncThunk(
  'agency/fetchAgencies',
  async (
    params: { page?: number; limit?: number; search?: string; cityId?: string },
    { rejectWithValue },
  ) => {
    try {
      const r = await agencyApi.getAgencies(params);
      return { items: r.data.items ?? r.data, total: r.data.total ?? 0 };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch agencies');
    }
  },
);

export const fetchAgencyById = createAsyncThunk(
  'agency/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const r = await agencyApi.getAgency(id);
      return r.data as Agency;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch agency');
    }
  },
);

export const fetchAgentDashboard = createAsyncThunk(
  'agency/fetchAgentDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const r = await agencyApi.getMyDashboard();
      return r.data as AgencyDashboard;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch agency dashboard');
    }
  },
);

export const fetchMyAgency = createAsyncThunk(
  'agency/fetchMyAgency',
  async (_, { rejectWithValue }) => {
    try {
      const r = await agencyApi.getMyAgency();
      return r.data as Agency;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'No agency found');
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    cacheAgency(state, action: PayloadAction<Agency>) {
      state.agencyCache[action.payload.id] = action.payload;
    },
    cacheAgentProfile(state, action: PayloadAction<AgentProfile>) {
      state.agentProfileCache[action.payload.id] = action.payload;
    },
    updateAgencyInList(state, action: PayloadAction<Agency>) {
      const idx = state.agencies.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) state.agencies[idx] = action.payload;
      state.agencyCache[action.payload.id] = action.payload;
    },
    removeAgencyFromList(state, action: PayloadAction<string>) {
      state.agencies = state.agencies.filter((a) => a.id !== action.payload);
      delete state.agencyCache[action.payload];
    },
    clearAgentDashboard(state) {
      state.agentDashboard = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAgencies
    builder
      .addCase(fetchAgencies.pending, (state) => {
        state.agenciesLoading = true;
        state.error = null;
      })
      .addCase(fetchAgencies.fulfilled, (state, action) => {
        state.agenciesLoading = false;
        state.agencies = action.payload.items;
        state.agenciesTotal = action.payload.total;
        // cache each
        action.payload.items.forEach((a: Agency) => {
          state.agencyCache[a.id] = a;
        });
      })
      .addCase(fetchAgencies.rejected, (state, action) => {
        state.agenciesLoading = false;
        state.error = action.payload as string;
      });

    // fetchAgencyById
    builder
      .addCase(fetchAgencyById.pending, (state) => {
        state.currentAgencyLoading = true;
      })
      .addCase(fetchAgencyById.fulfilled, (state, action) => {
        state.currentAgencyLoading = false;
        state.currentAgency = action.payload;
        state.agencyCache[action.payload.id] = action.payload;
      })
      .addCase(fetchAgencyById.rejected, (state, action) => {
        state.currentAgencyLoading = false;
        state.error = action.payload as string;
      });

    // fetchAgentDashboard
    builder
      .addCase(fetchAgentDashboard.pending, (state) => {
        state.agentDashboardLoading = true;
      })
      .addCase(fetchAgentDashboard.fulfilled, (state, action) => {
        state.agentDashboardLoading = false;
        state.agentDashboard = action.payload;
        if (action.payload.agency) {
          state.myAgency = action.payload.agency;
          state.agencyCache[action.payload.agency.id] = action.payload.agency;
        }
      })
      .addCase(fetchAgentDashboard.rejected, (state, action) => {
        state.agentDashboardLoading = false;
        state.error = action.payload as string;
      });

    // fetchMyAgency
    builder
      .addCase(fetchMyAgency.pending, (state) => {
        state.myAgencyLoading = true;
      })
      .addCase(fetchMyAgency.fulfilled, (state, action) => {
        state.myAgencyLoading = false;
        state.myAgency = action.payload;
      })
      .addCase(fetchMyAgency.rejected, (state, action) => {
        state.myAgencyLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  cacheAgency,
  cacheAgentProfile,
  updateAgencyInList,
  removeAgencyFromList,
  clearAgentDashboard,
} = agencySlice.actions;

export default agencySlice.reducer;
