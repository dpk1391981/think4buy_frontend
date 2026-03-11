import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import filtersReducer from './slices/filtersSlice';
import postPropertyReducer from './slices/postPropertySlice';
import uiReducer from './slices/uiSlice';
import agentsReducer from './slices/agentsSlice';
import locationsReducer from './slices/locationsSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
    postProperty: postPropertyReducer,
    ui: uiReducer,
    agents: agentsReducer,
    locations: locationsReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
