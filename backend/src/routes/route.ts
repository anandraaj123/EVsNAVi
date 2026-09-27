import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// In-Memory Fast Route Cache (30-Minute TTL)
interface RouteCacheEntry {
  timestamp: number;
  data: any;
}
const routeCache = new Map<string, RouteCacheEntry>();
const ROUTE_CACHE_TTL_MS = 30 * 60 * 1000;

// GET /api/route?startLat=...&startLng=...&endLat=...&endLng=...
router.get('/', async (req: Request, res: Response) => {
  const { startLat, startLng, endLat, endLng } = req.query;

  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'startLat, startLng, endLat, and endLng are required.' });
  }

  const sLat = parseFloat(startLat as string);
  const sLng = parseFloat(startLng as string);
  const eLat = parseFloat(endLat as string);
  const eLng = parseFloat(endLng as string);

  // 1. Check in-memory route cache
  const cacheKey = `${sLat.toFixed(4)}_${sLng.toFixed(4)}_${eLat.toFixed(4)}_${eLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < ROUTE_CACHE_TTL_MS)) {
    return res.json(cached.data);
  }

  const ORS_API_KEY = process.env.ORS_API_KEY;

  // 2. Try OpenRouteService if key is provided
  if (ORS_API_KEY && ORS_API_KEY.trim() !== '') {
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${sLng},${sLat}&end=${eLng},${eLat}`;
    try {
      const response = await axios.get(orsUrl, { timeout: 1800 });
      if (response.data?.features?.[0]?.geometry?.coordinates) {
        const result = {
          source: 'openrouteservice',
          coordinates: response.data.features[0].geometry.coordinates
        };
        routeCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return res.json(result);
      }
    } catch (error: any) {
      // Fallback to OSRM
    }
  }

  // 3. Fast OSRM query
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
  try {
    const response = await axios.get(osrmUrl, { timeout: 1800 });
    if (response.data?.routes?.[0]?.geometry?.coordinates) {
      const result = {
        source: 'osrm',
        coordinates: response.data.routes[0].geometry.coordinates
      };
      routeCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return res.json(result);
    }
  } catch (error: any) {
    // Fallback
  }

  // 4. Instant interpolated fallback path
  const fallbackResult = {
    source: 'interpolated',
    coordinates: [
      [sLng, sLat],
      [(sLng + eLng) / 2 + 0.001, (sLat + eLat) / 2 + 0.001],
      [eLng, eLat]
    ]
  };
  return res.json(fallbackResult);
});

export default router;
