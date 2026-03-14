import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Think4BuySale/1.0 (real-estate portal)',
        },
        next: { revalidate: 3600 }, // cache for 1 hour — same coords = same place
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 503 });
  }
}
