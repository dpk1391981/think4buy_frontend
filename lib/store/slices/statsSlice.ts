import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { propertiesApi, usersApi } from '@/lib/api';

export interface PlatformStats {
  total: number;
  forSale: number;
  forRent: number;
  forPG: number;
  totalCities: number;
  totalAgents: number;
}

interface StatsState {
  data: PlatformStats | null;
  loaded: boolean;
  loading: boolean;
}

const initialState: StatsState = {
  data: null,
  loaded: false,
  loading: false,
};

export const fetchPlatformStats = createAsyncThunk(
  'stats/fetchPlatformStats',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { stats: StatsState };
    if (state.stats.loaded) return null; // already cached
    try {
      const [propsRes, usersRes] = await Promise.all([
        propertiesApi.getStats(),
        usersApi.getStats(),
      ]);
      const props = propsRes.data as any;
      const users = usersRes.data as any;
      return {
        total:       props.total       ?? 0,
        forSale:     props.forSale     ?? 0,
        forRent:     props.forRent     ?? 0,
        forPG:       props.forPG       ?? 0,
        totalCities: props.totalCities ?? 0,
        totalAgents: users.totalAgents ?? 0,
      } as PlatformStats;
    } catch {
      return rejectWithValue('Failed to load platform stats');
    }
  },
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.data = action.payload;
          state.loaded = true;
        }
      })
      .addCase(fetchPlatformStats.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default statsSlice.reducer;
