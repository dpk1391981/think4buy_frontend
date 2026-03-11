import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '@/lib/api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  locality?: string;
  company?: string;
  avatar?: string;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  agentRating?: number;
  agentExperience?: number;
  agentBio?: string;
  agentLicense?: string;
  totalDeals?: number;
  listingsCount?: number;
  reraNumber?: string;
}

export interface AgentFilters {
  city: string;
  state: string;
  locality: string;
  page: number;
  limit: number;
}

interface AgentsState {
  agents: Agent[];
  total: number;
  filters: AgentFilters;
  loading: boolean;
  error: string | null;
  // Cache: store previously loaded agent profiles by id
  profiles: Record<string, Agent>;
}

const initialFilters: AgentFilters = {
  city: '',
  state: '',
  locality: '',
  page: 1,
  limit: 12,
};

const initialState: AgentsState = {
  agents: [],
  total: 0,
  filters: initialFilters,
  loading: false,
  error: null,
  profiles: {},
};

export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (filters: Partial<AgentFilters>, { rejectWithValue }) => {
    try {
      const params: Record<string, any> = { ...filters };
      const response = await usersApi.getAgents(params);
      const data = response.data;
      return {
        agents: data?.agents || data?.items || data || [],
        total: data?.total || 0,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch agents');
    }
  },
);

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setAgentFilter<K extends keyof AgentFilters>(
      state: AgentsState,
      action: PayloadAction<{ key: K; value: AgentFilters[K] }>,
    ) {
      state.filters[action.payload.key] = action.payload.value;
      if (action.payload.key !== 'page') state.filters.page = 1;
    },
    resetAgentFilters(state) {
      state.filters = initialFilters;
    },
    cacheAgentProfile(state, action: PayloadAction<Agent>) {
      state.profiles[action.payload.id] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload.agents;
        state.total = action.payload.total;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setAgentFilter, resetAgentFilters, cacheAgentProfile } = agentsSlice.actions;
export default agentsSlice.reducer;
