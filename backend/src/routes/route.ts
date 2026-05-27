import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/route?startLat=...&startLng=...&endLat=...&endLng=...
router.get('/', async (req: Request, res: Response) => {
  const { startLat, startLng, endLat, endLng } = req.query;

  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'startLat, startLng, endLat, and endLng are required.' });
  }

  const ORS_API_KEY = process.env.ORS_API_KEY;

  // 1. Try OpenRouteService
  if (ORS_API_KEY) {
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startLng},${startLat}&end=${endLng},${endLat}`;
    try {
      console.log(`[Route Service] Trying OpenRouteService...`);
      const response = await axios.get(orsUrl);
      if (response.data?.features?.[0]?.geometry?.coordinates) {
        return res.json({
          source: 'openrouteservice',
          coordinates: response.data.features[0].geometry.coordinates
        });
      }
    } catch (error: any) {
      console.log(`[Route Service] OpenRouteService failed. Falling back to OSRM. Error: ${error.message}`);
    }
  }

  // 2. Fallback to OSRM
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  try {
    console.log(`[Route Service] Trying OSRM fallback...`);
    const response = await axios.get(osrmUrl);
    if (response.data?.routes?.[0]?.geometry?.coordinates) {
      return res.json({
        source: 'osrm',
        coordinates: response.data.routes[0].geometry.coordinates
      });
    }
  } catch (error: any) {
    console.log(`[Route Service] OSRM fallback failed too. Error: ${error.message}`);
  }

  // 3. Last resort straight-line emergency path
  console.log(`[Route Service] Returning emergency straight-line path.`);
  return res.json({
    source: 'fallback-straight',
    coordinates: [
      [parseFloat(startLng as string), parseFloat(startLat as string)],
      [parseFloat(endLng as string), parseFloat(endLat as string)]
    ]
  });
});

export default router;
