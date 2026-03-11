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

export type AuthModalReason = 'wishlist' | 'post-property' | 'general' | 'app-open';

export interface OpenAuthModalPayload {
  mode?: 'login' | 'register';
  reason?: AuthModalReason;
  redirectTo?: string;
}

interface UIState {
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalReason: AuthModalReason;
  authModalRedirectTo: string;
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
  authModalReason: 'general',
  authModalRedirectTo: '',
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
    openAuthModal: (state, action: PayloadAction<OpenAuthModalPayload | 'login' | 'register'>) => {
      state.authModalOpen = true;
      if (typeof action.payload === 'string') {
        state.authModalMode = action.payload;
        state.authModalReason = 'general';
        state.authModalRedirectTo = '';
      } else {
        state.authModalMode = action.payload.mode ?? 'login';
        state.authModalReason = action.payload.reason ?? 'general';
        state.authModalRedirectTo = action.payload.redirectTo ?? '';
      }
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
      state.authModalReason = 'general';
      state.authModalRedirectTo = '';
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
