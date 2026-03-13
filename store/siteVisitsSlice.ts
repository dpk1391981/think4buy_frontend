import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { siteVisitsApi, leadsApi } from '@/lib/api';

interface SiteVisitsState {
  visits: any[];
  todayVisits: any[];
  myLeads: any[];
  total: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: SiteVisitsState = {
  visits: [],
  todayVisits: [],
  myLeads: [],
  total: 0,
  loading: false,
  saving: false,
  error: null,
};

export const fetchMyVisits = createAsyncThunk(
  'siteVisits/fetchMy',
  async (params: { page: number; limit: number; status?: string }) => {
    const [visitsRes, todayRes] = await Promise.all([
      siteVisitsApi.getMy({ ...params, status: params.status || undefined }),
      siteVisitsApi.getToday(),
    ]);
    return {
      visits: visitsRes.data.items || [],
      total: visitsRes.data.total || 0,
      todayVisits: Array.isArray(todayRes.data) ? todayRes.data : [],
    };
  },
);

export const fetchMyLeads = createAsyncThunk('siteVisits/fetchLeads', async () => {
  const r = await leadsApi.getMy({ limit: 50 });
  return r.data.items || [];
});

export const completeVisitThunk = createAsyncThunk(
  'siteVisits/complete',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      await siteVisitsApi.complete(id, data);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to complete visit');
    }
  },
);

export const cancelVisitThunk = createAsyncThunk(
  'siteVisits/cancel',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      await siteVisitsApi.cancel(id, reason);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to cancel visit');
    }
  },
);

export const createVisitThunk = createAsyncThunk(
  'siteVisits/create',
  async (data: any, { rejectWithValue }) => {
    try {
      await siteVisitsApi.create(data);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to schedule visit');
    }
  },
);

const siteVisitsSlice = createSlice({
  name: 'siteVisits',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyVisits.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = action.payload.visits;
        state.total = action.payload.total;
        state.todayVisits = action.payload.todayVisits;
      })
      .addCase(fetchMyVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load visits';
      })
      .addCase(fetchMyLeads.fulfilled, (state, action) => {
        state.myLeads = action.payload;
      })
      .addCase(completeVisitThunk.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(completeVisitThunk.fulfilled, (state) => { state.saving = false; })
      .addCase(completeVisitThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(cancelVisitThunk.pending, (state) => { state.saving = true; })
      .addCase(cancelVisitThunk.fulfilled, (state) => { state.saving = false; })
      .addCase(cancelVisitThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(createVisitThunk.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(createVisitThunk.fulfilled, (state) => { state.saving = false; })
      .addCase(createVisitThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = siteVisitsSlice.actions;
export default siteVisitsSlice.reducer;
