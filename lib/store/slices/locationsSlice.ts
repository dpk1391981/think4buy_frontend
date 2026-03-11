import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { locationsApi } from '@/lib/api';

export interface StateEntry {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface CityEntry {
  id: string;
  name: string;
  stateId: string;
  stateName?: string;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl?: string;
}

export interface LocalityEntry {
  id?: string;
  name: string;
  city: string;
  state: string;
}

interface LocationsState {
  states: StateEntry[];
  cities: CityEntry[];
  localities: LocalityEntry[];
  // Cached localities per city
  localityCache: Record<string, LocalityEntry[]>;
  statesLoaded: boolean;
  citiesLoaded: boolean;
  loading: boolean;
}

const initialState: LocationsState = {
  states: [],
  cities: [],
  localities: [],
  localityCache: {},
  statesLoaded: false,
  citiesLoaded: false,
  loading: false,
};

export const fetchStates = createAsyncThunk('locations/fetchStates', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { locations: LocationsState };
  if (state.locations.statesLoaded) return null; // Already cached
  try {
    const r = await locationsApi.getStates();
    return r.data || [];
  } catch {
    return rejectWithValue('Failed to load states');
  }
});

export const fetchCities = createAsyncThunk('locations/fetchCities', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { locations: LocationsState };
  if (state.locations.citiesLoaded) return null; // Already cached
  try {
    const r = await locationsApi.getCities();
    return r.data || [];
  } catch {
    return rejectWithValue('Failed to load cities');
  }
});

export const fetchLocalities = createAsyncThunk(
  'locations/fetchLocalities',
  async (city: string, { getState, rejectWithValue }) => {
    const state = getState() as { locations: LocationsState };
    if (state.locations.localityCache[city]) return null; // Already cached
    try {
      const r = await locationsApi.getLocalities(city);
      return { city, localities: r.data || [] };
    } catch {
      return rejectWithValue('Failed to load localities');
    }
  },
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setLocalities(state, action: PayloadAction<{ city: string; localities: LocalityEntry[] }>) {
      state.localityCache[action.payload.city] = action.payload.localities;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStates.pending, (state) => { state.loading = true; })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.states = action.payload;
          state.statesLoaded = true;
        }
      })
      .addCase(fetchStates.rejected, (state) => { state.loading = false; })

      .addCase(fetchCities.pending, (state) => { state.loading = true; })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.cities = action.payload;
          state.citiesLoaded = true;
        }
      })
      .addCase(fetchCities.rejected, (state) => { state.loading = false; })

      .addCase(fetchLocalities.fulfilled, (state, action) => {
        if (action.payload) {
          state.localityCache[action.payload.city] = action.payload.localities;
        }
      });
  },
});

export const { setLocalities } = locationsSlice.actions;
export default locationsSlice.reducer;
