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
  selectedState: string;   // state name, '' = All India
  selectedStateId: string; // state UUID from DB, '' = All India
}

const initialState: UIState = {
  authModalOpen: false,
  authModalMode: 'login',
  mobileMenuOpen: false,
  toasts: [],
  selectedState: '',
  selectedStateId: '',
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
    // New: set both name + ID together (preferred)
    setSelectedLocation: (
      state,
      action: PayloadAction<{ state: string; stateId: string }>
    ) => {
      state.selectedState = action.payload.state;
      state.selectedStateId = action.payload.stateId;
    },
  },
});

export const {
  openAuthModal, closeAuthModal, toggleMobileMenu,
  addToast, removeToast,
  setSelectedState, setSelectedLocation,
} = uiSlice.actions;
export default uiSlice.reducer;
