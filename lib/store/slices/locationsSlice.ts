import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { locationsApi, adminApi } from '@/lib/api';

export interface StateEntry {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  propertyCount?: number;
  imageUrl?: string;
  countryId?: string;
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
  // Cached cities per stateId
  citiesByState: Record<string, CityEntry[]>;
  // Countries (for home page country selector)
  countries: Array<{ id: string; name: string; code: string; flag?: string }>;
  statesLoaded: boolean;
  citiesLoaded: boolean;
  countriesLoaded: boolean;
  loading: boolean;
}

const initialState: LocationsState = {
  states: [],
  cities: [],
  localities: [],
  localityCache: {},
  citiesByState: {},
  countries: [],
  statesLoaded: false,
  citiesLoaded: false,
  countriesLoaded: false,
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

export const fetchCountries = createAsyncThunk('locations/fetchCountries', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { locations: LocationsState };
  if (state.locations.countriesLoaded) return null;
  try {
    const r = await adminApi.getCountries();
    const data = r.data;
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  } catch {
    return rejectWithValue('Failed to load countries');
  }
});

export const fetchCitiesByState = createAsyncThunk(
  'locations/fetchCitiesByState',
  async (stateId: string, { getState, rejectWithValue }) => {
    const state = getState() as { locations: LocationsState };
    if (state.locations.citiesByState[stateId]) return null; // cached
    try {
      const r = await locationsApi.getCitiesByState(stateId);
      const cities = Array.isArray(r.data) ? r.data : r.data?.cities || [];
      return { stateId, cities };
    } catch {
      return rejectWithValue('Failed to load cities');
    }
  },
);

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
      })

      .addCase(fetchCountries.fulfilled, (state, action) => {
        if (action.payload) {
          state.countries = action.payload;
          state.countriesLoaded = true;
        }
      })

      .addCase(fetchCitiesByState.fulfilled, (state, action) => {
        if (action.payload) {
          state.citiesByState[action.payload.stateId] = action.payload.cities;
        }
      });
  },
});

export const { setLocalities } = locationsSlice.actions;
export default locationsSlice.reducer;
