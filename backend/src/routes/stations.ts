import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/stations
router.get('/', async (req: Request, res: Response) => {
  const { latitude, longitude, distance, maxresults } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required query parameters.' });
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const dist = distance ? parseInt(distance as string, 10) : 50;
  const maxRes = maxresults ? parseInt(maxresults as string, 10) : 30;

  const OCM_API_KEY = process.env.OCM_API_KEY;
  if (!OCM_API_KEY) {
    return res.status(500).json({ error: 'Server OCM API Key configuration missing' });
  }

  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${dist}&maxresults=${maxRes}&key=${OCM_API_KEY}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'EVsNAVI-API-Gateway',
        'Accept-Encoding': 'gzip,deflate,compress'
      }
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error('[Backend OCM API Proxy Error]:', error.message || error);
    return res.status(502).json({
      error: 'Failed to fetch charging stations from upstream API',
      details: error.response?.data || error.message
    });
  }
});

export default router;
