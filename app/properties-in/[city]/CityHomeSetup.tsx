'use client';

/**
 * Syncs the city page's city into Redux store + localStorage after hydration.
 * This keeps the navbar city selector and future navigations consistent.
 * Runs AFTER hydration so it never causes a server/client mismatch.
 */
import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store';
import { setSelectedCity, saveCityToLS } from '@/lib/store/slices/uiSlice';

export default function CityHomeSetup({ city }: { city: string }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setSelectedCity({ city, cityId: '' }));
    saveCityToLS(city, '');
  }, [city, dispatch]);

  return null;
}
