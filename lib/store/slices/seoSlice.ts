import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { seoApi } from '@/lib/api';

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FooterGroup {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLink[];
}

interface SeoState {
  footerGroups: FooterGroup[];
  footerLoaded: boolean;
  footerLoading: boolean;
}

const initialState: SeoState = {
  footerGroups: [],
  footerLoaded: false,
  footerLoading: false,
};

export const fetchFooterLinks = createAsyncThunk(
  'seo/fetchFooterLinks',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { seo: SeoState };
    if (state.seo.footerLoaded) return null; // already cached
    try {
      const r = await seoApi.getFooterLinks();
      return Array.isArray(r.data) ? r.data : [];
    } catch {
      return rejectWithValue('Failed to load footer links');
    }
  },
);

const seoSlice = createSlice({
  name: 'seo',
  initialState,
  reducers: {
    setFooterGroups(state, action: PayloadAction<FooterGroup[]>) {
      state.footerGroups = action.payload;
      state.footerLoaded = true;
    },
    invalidateFooterCache(state) {
      state.footerLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterLinks.pending, (state) => {
        state.footerLoading = true;
      })
      .addCase(fetchFooterLinks.fulfilled, (state, action) => {
        state.footerLoading = false;
        if (action.payload) {
          state.footerGroups = action.payload;
          state.footerLoaded = true;
        }
      })
      .addCase(fetchFooterLinks.rejected, (state) => {
        state.footerLoading = false;
      });
  },
});

export const { setFooterGroups, invalidateFooterCache } = seoSlice.actions;
export default seoSlice.reducer;
