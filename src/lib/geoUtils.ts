export interface GeoCoords {
  latitude: number;
  longitude: number;
  area?: string;
}

const PINCODE_COORDS: Record<string, GeoCoords> = {
  '834001': { latitude: 23.3441, longitude: 85.3096, area: 'Ranchi Central / Main Road' },
  '834002': { latitude: 23.3620, longitude: 85.3120, area: 'Harmu / Doranda, Ranchi' },
  '834003': { latitude: 23.3175, longitude: 85.3112, area: 'Hinoo / Hatia, Ranchi' },
  '834004': { latitude: 23.3105, longitude: 85.2910, area: 'Dhurwa / HEC, Ranchi' },
  '834005': { latitude: 23.3792, longitude: 85.2845, area: 'Ratu Road / Piska More, Ranchi' },
  '834006': { latitude: 23.4018, longitude: 85.3170, area: 'Kanke Road, Ranchi' },
  '834008': { latitude: 23.3945, longitude: 85.3352, area: 'Bariatu / Morabadi, Ranchi' },
  '834009': { latitude: 23.3812, longitude: 85.3490, area: 'Booty More / Kokar, Ranchi' },
  '834010': { latitude: 23.3328, longitude: 85.3672, area: 'Namkum, Ranchi' },
  '826001': { latitude: 23.7957, longitude: 86.4304, area: 'Dhanbad Central' },
  '831001': { latitude: 22.8046, longitude: 86.2029, area: 'Jamshedpur Bistupur' },
  '825301': { latitude: 23.9925, longitude: 85.3637, area: 'Hazaribagh' },
  '110001': { latitude: 28.6139, longitude: 77.2090, area: 'New Delhi' },
  '400001': { latitude: 18.9388, longitude: 72.8354, area: 'Mumbai' },
  '560001': { latitude: 12.9716, longitude: 77.5946, area: 'Bengaluru' },
};

/**
 * Resolve approximate coordinates from a 6-digit Indian pincode.
 */
export function resolvePincodeCoords(pincode?: string): GeoCoords {
  const clean = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  if (PINCODE_COORDS[clean]) {
    return PINCODE_COORDS[clean];
  }
  const num = parseInt(clean || '834001', 10) || 834001;
  const latOffset = ((num % 100) - 50) * 0.002;
  const lngOffset = (((Math.floor(num / 100)) % 100) - 50) * 0.002;
  return {
    latitude: Number((23.3441 + latOffset).toFixed(4)),
    longitude: Number((85.3096 + lngOffset).toFixed(4)),
    area: clean ? `Pincode ${clean}` : 'Ranchi Central',
  };
}

/**
 * Great-circle Haversine distance in kilometers, rounded to 1 decimal place.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const globalForGeo = globalThis as unknown as {
  geocodeCache?: Map<string, GeoCoords>;
};
const geocodeCache = globalForGeo.geocodeCache || (globalForGeo.geocodeCache = new Map());

/**
 * Geocode a street address or pincode using Google Maps Geocoding API (when GOOGLE_MAPS_API_KEY is set),
 * falling back to fast pincode lookup, cached OpenStreetMap Nominatim (1.5s timeout), and pincode table.
 */
export async function geocodeAddress(query: string, pincode?: string): Promise<GeoCoords> {
  const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  const cleanQuery = query.trim();
  const cacheKey = `${cleanQuery.toLowerCase()}|${cleanPin}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleKey && (cleanQuery || cleanPin)) {
    try {
      const q = cleanQuery || `${cleanPin}, India`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(googleKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        const result = {
          latitude: Number(loc.lat.toFixed(6)),
          longitude: Number(loc.lng.toFixed(6)),
          area: data.results[0].formatted_address || cleanQuery || cleanPin,
        };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch {}
  }

  // Fast path: known Indian pincode coordinates (avoid external 1.5s Nominatim latency when no Google key is set)
  if (cleanPin && PINCODE_COORDS[cleanPin]) {
    const res = PINCODE_COORDS[cleanPin];
    geocodeCache.set(cacheKey, res);
    return res;
  }

  if (cleanQuery) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(cleanQuery)}`;
      const res = await fetch(nomUrl, {
        headers: { 'User-Agent': 'MegaBachatMart/1.0 (support@mymbmart.com)' },
        signal: AbortSignal.timeout(1500),
      });
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]?.lat && rows[0]?.lon) {
        const result = {
          latitude: Number(parseFloat(rows[0].lat).toFixed(6)),
          longitude: Number(parseFloat(rows[0].lon).toFixed(6)),
          area: rows[0].display_name || cleanQuery,
        };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch {}
  }

  const fallback = resolvePincodeCoords(cleanPin);
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Compute road distances via Google Maps Distance Matrix API when GOOGLE_MAPS_API_KEY is configured,
 * falling back to Haversine distance otherwise.
 */
export async function getGoogleMapsDistances(
  userLat: number,
  userLng: number,
  destinations: { latitude: number; longitude: number }[]
): Promise<{ distanceKm: number; durationText?: string; source: 'google_maps' | 'gps_haversine' }[]> {
  if (destinations.length === 0) return [];

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const destStr = destinations.map((d) => `${d.latitude},${d.longitude}`).join('|');
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${encodeURIComponent(destStr)}&mode=driving&key=${encodeURIComponent(googleKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      const data = await res.json();
      const elements = data?.rows?.[0]?.elements;
      if (Array.isArray(elements) && elements.length === destinations.length) {
        return elements.map((el: any, idx: number) => {
          if (el?.status === 'OK' && typeof el.distance?.value === 'number') {
            return {
              distanceKm: Math.round((el.distance.value / 1000) * 10) / 10,
              durationText: el.duration?.text,
              source: 'google_maps' as const,
            };
          }
          return {
            distanceKm: haversineDistanceKm(userLat, userLng, destinations[idx].latitude, destinations[idx].longitude),
            source: 'gps_haversine' as const,
          };
        });
      }
    } catch {}
  }

  return destinations.map((d) => ({
    distanceKm: haversineDistanceKm(userLat, userLng, d.latitude, d.longitude),
    source: 'gps_haversine' as const,
  }));
}

export function getGoogleMapsDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}
