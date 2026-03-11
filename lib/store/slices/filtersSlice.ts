import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FiltersState {
  category: string;
  city: string;
  state: string;
  locality: string;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: string[];
  type: string;
  furnishingStatus: string;
  possessionStatus: string;
  agentId: string;
  search: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

const initialState: FiltersState = {
  category: '',
  city: '',
  state: '',
  locality: '',
  minPrice: null,
  maxPrice: null,
  bedrooms: [],
  type: '',
  furnishingStatus: '',
  possessionStatus: '',
  agentId: '',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 12,
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<FiltersState>>) => {
      Object.assign(state, action.payload);
      state.page = 1; // reset page on filter change
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    clearFilters: (state) => {
      const { category, city } = state;
      return { ...initialState, category, city }; // keep category + city
    },
    resetAll: () => initialState,
  },
});

export const { setFilter, setPage, clearFilters, resetAll } = filtersSlice.actions;
export default filtersSlice.reducer;
