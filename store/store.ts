import { configureStore } from '@reduxjs/toolkit';
import siteVisitsReducer from './siteVisitsSlice';

export const store = configureStore({
  reducer: {
    siteVisits: siteVisitsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
