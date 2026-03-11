export interface DetectedLocation {
  lat: number;
  lng: number;
  state: string;
  city: string;
  country: string;
  locality: string;
}

/** Reverse-geocode using OpenStreetMap Nominatim (free, no API key). */
export async function reverseGeocode(lat: number, lng: number): Promise<Omit<DetectedLocation, 'lat' | 'lng'>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } },
  );
  const data = await res.json();
  const addr = data.address || {};
  return {
    state: addr.state || '',
    city: addr.city || addr.town || addr.village || addr.county || '',
    country: addr.country || '',
    locality: addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '',
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
      { timeout: 10000, maximumAge: 300000 },
    );
  });
}
