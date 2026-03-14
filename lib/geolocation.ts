export interface DetectedLocation {
  lat: number;
  lng: number;
  state: string;
  city: string;
  country: string;
  locality: string;
}

/** Reverse-geocode via our own proxy route (avoids CSP issues with direct Nominatim calls). */
export async function reverseGeocode(lat: number, lng: number): Promise<Omit<DetectedLocation, 'lat' | 'lng'>> {
  const res = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lng}`, { cache: 'no-store' });
  const data = await res.json();
  const addr = data.address || {};

  // Indian cities often appear in city_district / state_district / municipality
  // before falling back to county/village
  const city =
    addr.city ||
    addr.city_district ||
    addr.town ||
    addr.municipality ||
    addr.state_district ||
    addr.village ||
    addr.county ||
    '';

  const locality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.residential ||
    addr.village ||
    '';

  return {
    state:   addr.state   || '',
    city,
    country: addr.country || '',
    locality,
  };
}

/** Get browser geolocation + reverse-geocode in one call. */
export function detectLocation(): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const geo = await reverseGeocode(lat, lng);
          resolve({ lat, lng, ...geo });
        } catch {
          resolve({ lat, lng, state: '', city: '', country: '', locality: '' });
        }
      },
      (err) => reject(err),
      { timeout: 10000, maximumAge: 0 },  // maximumAge: 0 — always get a fresh fix
    );
  });
}
