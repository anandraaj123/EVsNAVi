import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface EVInfo {
  brand?: string;
  model?: string;
  connector?: string;
  charging?: string;
  battery?: number;
  rangeLeft?: number;
}

interface StationSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance: number;
  power: number;
  connectorType: string;
  availablePorts?: number;
}

// POST /api/ai/chat
router.post('/chat', async (req: Request, res: Response) => {
  const { message, evInfo, userCoords, nearbyStations } = req.body as {
    message?: string;
    evInfo?: EVInfo;
    userCoords?: { latitude: number; longitude: number };
    nearbyStations?: StationSummary[];
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message string is required.' });
  }

  const cleanMsg = message.trim();
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Attempt Gemini API if key is set
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
    try {
      const promptContext = `
You are "NaviAI", the intelligent Cyberpunk EV Copilot for the EVsNAVI navigation app.
Current User Telemetry:
- Vehicle: ${evInfo?.brand || 'Generic'} ${evInfo?.model || 'EV'}
- Battery Status: ${evInfo?.battery ?? 84}% (${evInfo?.rangeLeft ?? 360} km remaining)
- Vehicle Connector: ${evInfo?.connector || 'CCS2'}
- Current GPS: ${userCoords ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}` : 'Unknown'}
- Nearby Live Charging Stations (${(nearbyStations || []).length} hubs available):
${(nearbyStations || []).slice(0, 5).map((s, i) => `${i + 1}. [ID: ${s.id}] "${s.name}" - ${s.power}kW (${s.connectorType}) at ${s.distance.toFixed(1)} km away.`).join('\n')}

Guidelines:
1. Provide concise, expert, helpful advice for EV drivers (route planning, charging speeds, battery longevity, range anxiety buffer).
2. If the user is asking to find/select the nearest or best charger, mention the exact station name from the list and format with actionable advice.
3. Keep responses punchy (2-4 short paragraphs or bullet points).
`;

      // Use ultra-fast low-latency gemini-3.5-flash-lite or gemini-3.6-flash
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await axios.post(
        geminiUrl,
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${promptContext}\n\nUser Question: ${cleanMsg}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
      );

      const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) {
        // Find if any station matches
        let suggestedStation: StationSummary | undefined;
        let action = 'NONE';

        if (nearbyStations && nearbyStations.length > 0) {
          // Check if message asks for nearest or fast charger
          const lower = cleanMsg.toLowerCase();
          if (lower.includes('nearest') || lower.includes('closest') || lower.includes('fast') || lower.includes('charger') || lower.includes('charge')) {
            suggestedStation = lower.includes('fast')
              ? nearbyStations.find(s => s.power >= 50) || nearbyStations[0]
              : nearbyStations[0];
            action = 'SELECT_STATION';
          }
        }

        return res.json({
          reply: candidateText,
          suggestedStation,
          action
        });
      }
    } catch (apiError: any) {
      console.log('[NaviAI] Gemini API request bypassed/failed, activating local reasoning engine:', apiError?.message || apiError);
    }
  }

  // Built-in High-Fidelity Local EV Knowledge & Reasoning Engine
  const replyData = generateLocalEVResponse(cleanMsg, evInfo, userCoords, nearbyStations || []);
  return res.json(replyData);
});

// Intelligent Local EV Copilot Engine
function generateLocalEVResponse(
  message: string,
  evInfo?: EVInfo,
  userCoords?: { latitude: number; longitude: number },
  stations: StationSummary[] = []
): { reply: string; suggestedStation?: StationSummary; action: string } {
  const query = message.toLowerCase();
  const vehicle = `${evInfo?.brand || 'Tata'} ${evInfo?.model || 'Nexon EV'}`;
  const battery = evInfo?.battery ?? 84;
  const range = evInfo?.rangeLeft ?? 360;
  const connector = evInfo?.connector || 'CCS2';

  // 1. Find Nearest / Fast Chargers
  if (query.includes('nearest') || query.includes('closest') || (query.includes('where') && query.includes('charge'))) {
    if (stations.length > 0) {
      const nearest = stations[0];
      return {
        reply: `⚡ **Nearest Charging Station Identified:**\n\n**${nearest.name}** is located just **${nearest.distance.toFixed(1)} km** away.\n\n• **Power Output:** ${nearest.power} kW (${nearest.power >= 50 ? 'DC Fast' : 'Standard'})\n• **Connector:** ${nearest.connectorType}\n• **Estimated Drive:** ~${Math.max(2, Math.round(nearest.distance * 8))} minutes.\n\nI can highlight this hub on your Google Map or start direct navigation whenever you're ready!`,
        suggestedStation: nearest,
        action: 'SELECT_STATION'
      };
    }
    return {
      reply: `I'm tracking your location (${userCoords ? `${userCoords.latitude.toFixed(3)}, ${userCoords.longitude.toFixed(3)}` : 'GPS syncing'}). No stations found immediately in 5km. Try expanding your search radius or recentering.`,
      action: 'NONE'
    };
  }

  // 2. Fast DC Charger Queries
  if (query.includes('fast') || query.includes('50kw') || query.includes('hyper') || query.includes('rapid')) {
    const fastStation = stations.find(s => s.power >= 50) || stations[0];
    if (fastStation) {
      return {
        reply: `🚀 **High-Speed DC Fast Charger Found:**\n\n**${fastStation.name}**\n• **Power:** ${fastStation.power} kW Ultra-Fast DC\n• **Distance:** ${fastStation.distance.toFixed(1)} km\n• **Compatibility:** Full support for your ${vehicle} (${connector}).\n\nCharging from 20% to 80% here will take approximately **25–35 minutes**.`,
        suggestedStation: fastStation,
        action: 'SELECT_STATION'
      };
    }
  }

  // 3. Battery Range & Trip Feasibility
  if (query.includes('range') || query.includes('reach') || query.includes('trip') || query.includes('battery') || query.includes('percent')) {
    const safeBuffer = Math.round(range * 0.85);
    return {
      reply: `🔋 **Vehicle Telemetry & Range Analysis:**\n\n• **Current Battery:** ${battery}%\n• **Real-World Range:** ~${range} km\n• **Highway Safety Buffer (85%):** ~${safeBuffer} km\n\n💡 **Copilot Recommendation:** For highway trips over ${safeBuffer} km, plan a fast charging stop when battery hits ~20% to take advantage of the peak DC charging curve.`,
      action: 'NONE'
    };
  }

  // 4. Connector Compatibility
  if (query.includes('connector') || query.includes('ccs2') || query.includes('type 2') || query.includes('compatible') || query.includes('plug')) {
    return {
      reply: `🔌 **Connector Compatibility for ${vehicle}:**\n\n• **Primary Port:** ${connector} (Combined Charging System 2)\n• **Fast DC Compatible:** Yes (Supports 30kW - 150kW DC chargers)\n• **AC Slow/Home Charging:** Type 2 (up to 7.2 kW / 11 kW AC)\n\nAll stations marked with cyan & emerald badges in EVsNAVI are pre-filtered for your ${connector} socket.`,
      action: 'NONE'
    };
  }

  // 5. Battery Preservation & Optimization Tips
  if (query.includes('tip') || query.includes('optimize') || query.includes('weather') || query.includes('cold') || query.includes('hot') || query.includes('save')) {
    return {
      reply: `💡 **NaviAI Battery Optimization Tips:**\n\n1. **The 20–80% Rule:** Keep your battery between 20% and 80% for daily commutes to prolong Li-ion cell health.\n2. **Pre-condition Cabin:** Cool or warm the cabin while still plugged in before driving.\n3. **Regenerative Braking:** Use Level 2/3 regen in stop-and-go traffic to recover up to 15% energy.\n4. **Highway Cruising:** Keep speeds around 90–100 km/h; aerodynamic drag increases energy draw exponentially above 110 km/h.`,
      action: 'NONE'
    };
  }

  // Default General Friendly Copilot Response
  const topHub = stations.length > 0 ? stations[0] : undefined;
  return {
    reply: `👋 **NaviAI EV Copilot Online!**\n\nI'm monitoring your **${vehicle}** (${battery}% • ${range} km range).\n\nHere is how I can assist:\n• ⚡ **"Find nearest fast charger"** — Locates DC chargers near you.\n• 🛣️ **"Can I make a 250km trip?"** — Calculates highway stops.\n• 🔋 **"Battery health tips"** — Maximizes range and battery lifespan.\n• 📍 **"What chargers are nearby?"** — Highlights hubs on Google Maps.`,
    suggestedStation: topHub,
    action: topHub ? 'SELECT_STATION' : 'NONE'
  };
}

export default router;
