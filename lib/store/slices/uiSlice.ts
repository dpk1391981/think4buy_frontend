import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const LS_KEY = 't4bs_location';

export function loadLocationFromLS(): { state: string; stateId: string } {
  if (typeof window === 'undefined') return { state: '', stateId: '' };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { state: '', stateId: '' };
}

export function saveLocationToLS(state: string, stateId: string) {
  if (typeof window === 'undefined') return;
  try {
    if (state) {
      localStorage.setItem(LS_KEY, JSON.stringify({ state, stateId }));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {}
}

interface UIState {
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  mobileMenuOpen: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  selectedCountry: string;    // country name, '' = All
  selectedCountryId: string;  // country UUID
  selectedState: string;      // state name, '' = All India
  selectedStateId: string;    // state UUID from DB
  selectedCity: string;       // city name, '' = All
  selectedCityId: string;     // city UUID
}

const initialState: UIState = {
  authModalOpen: false,
  authModalMode: 'login',
  mobileMenuOpen: false,
  toasts: [],
  selectedCountry: '',
  selectedCountryId: '',
  selectedState: '',
  selectedStateId: '',
  selectedCity: '',
  selectedCityId: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAuthModal: (state, action: PayloadAction<'login' | 'register'>) => {
      state.authModalOpen = true;
      state.authModalMode = action.payload;
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    addToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>
    ) => {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    setSelectedState: (state, action: PayloadAction<string>) => {
      state.selectedState = action.payload;
    },
    // Set country
    setSelectedCountry: (
      state,
      action: PayloadAction<{ country: string; countryId: string }>
    ) => {
      state.selectedCountry = action.payload.country;
      state.selectedCountryId = action.payload.countryId;
      // Reset state/city when country changes
      state.selectedState = '';
      state.selectedStateId = '';
      state.selectedCity = '';
      state.selectedCityId = '';
    },
    // Set state (and reset city)
    setSelectedLocation: (
      state,
      action: PayloadAction<{ state: string; stateId: string }>
    ) => {
      state.selectedState = action.payload.state;
      state.selectedStateId = action.payload.stateId;
      state.selectedCity = '';
      state.selectedCityId = '';
    },
    // Set city
    setSelectedCity: (
      state,
      action: PayloadAction<{ city: string; cityId: string }>
    ) => {
      state.selectedCity = action.payload.city;
      state.selectedCityId = action.payload.cityId;
    },
    // Clear all location filters
    clearLocationFilter: (state) => {
      state.selectedCountry = '';
      state.selectedCountryId = '';
      state.selectedState = '';
      state.selectedStateId = '';
      state.selectedCity = '';
      state.selectedCityId = '';
    },
  },
});

export const {
  openAuthModal, closeAuthModal, toggleMobileMenu,
  addToast, removeToast,
  setSelectedState, setSelectedLocation,
  setSelectedCountry, setSelectedCity, clearLocationFilter,
} = uiSlice.actions;
export default uiSlice.reducer;
