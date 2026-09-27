import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Linking,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Zap,
  MapPin,
  Sliders,
  Navigation,
  User,
  Locate,
  Bot,
  Sparkles,
  Leaf,
  ChevronUp,
  ChevronDown,
  Clock,
  BatteryCharging,
  Layers,
} from 'lucide-react-native';
import * as Location from 'expo-location';

import { EVInfo } from './EVSetupScreen';
import AIAssistantModal, { StationItem } from '../components/AIAssistantModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rapido-Style Bottom Sheet Heights & Snap Points
const SHEET_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.86;
const SHEET_HALF_HEIGHT = SCREEN_HEIGHT * 0.52;
const SHEET_PEEK_HEIGHT = SCREEN_HEIGHT * 0.22;

const TRANSLATE_EXPANDED = 0;
const TRANSLATE_HALF = SHEET_EXPANDED_HEIGHT - SHEET_HALF_HEIGHT;
const TRANSLATE_PEEK = SHEET_EXPANDED_HEIGHT - SHEET_PEEK_HEIGHT;

// Clean, Premium Minimalist Leaflet Engine (Dark Navy/Charcoal OSM & ESRI Satellite + OSRM Routing)
const MAPLIBRE_OSM_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>EVsNAVI Minimalist Map Engine</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map {
            width: 100%;
            height: 100%;
            background-color: #080C14;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        /* User location - Clean, minimalist electric cyan indicator */
        .user-marker-wrap {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .user-marker-core {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #00F2FE;
            border: 2px solid #FFFFFF;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
            z-index: 2;
        }
        .user-marker-pulse {
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: rgba(0, 242, 254, 0.15);
            border: 1px solid rgba(0, 242, 254, 0.35);
            z-index: 1;
        }
        
        /* Charger Markers - Small circular dark markers, thin cyan outline, clean yellow ⚡ */
        .charger-pin-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: auto;
            cursor: pointer;
        }
        .charger-pin {
            width: 28px;
            height: 28px;
            border-radius: 14px;
            background-color: #0B111E;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            line-height: 1;
            border: 1.5px solid rgba(0, 242, 254, 0.5);
            color: #FBBF24;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
            user-select: none;
        }
        .charger-pin.selected {
            background-color: #0F172A;
            border-color: #00F2FE;
            border-width: 2px;
            color: #FBBF24;
            box-shadow: 0 0 12px rgba(0, 242, 254, 0.6);
            transform: scale(1.2);
        }
        .charger-city-badge {
            margin-top: 3px;
            padding: 2px 5px;
            background: rgba(11, 17, 30, 0.94);
            border: 1px solid rgba(0, 242, 254, 0.4);
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            color: #E2E8F0;
            letter-spacing: 0.3px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.6);
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        /* Destination Marker - Radiant Coral/Red 🏁 Pin */
        .dest-marker-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: auto;
            cursor: pointer;
        }
        .dest-marker-pin {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            background: linear-gradient(135deg, #FF0844, #FFB199);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 14px rgba(255, 8, 68, 0.7);
            user-select: none;
        }
        .dest-marker-badge {
            margin-top: 3px;
            padding: 2px 6px;
            background: rgba(11, 17, 30, 0.95);
            border: 1px solid rgba(255, 8, 68, 0.5);
            border-radius: 4px;
            font-size: 9px;
            font-weight: 800;
            color: #FFFFFF;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.6);
        }
        
        .leaflet-control-container .leaflet-control-attribution,
        .leaflet-control-container .leaflet-control-zoom {
            display: none !important;
        }
        
        /* Dark navy / charcoal map theme with subtle road lines & minimal visual clutter */
        .dark-tiles .leaflet-tile {
            filter: brightness(0.52) invert(1) contrast(2.4) hue-rotate(212deg) saturate(0.18) opacity(0.88);
        }
        .leaflet-container {
            background-color: #080C14 !important;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map;
        let userMarker = null;
        let destMarker = null;
        let stationMarkers = {};
        let routePolyline = null;
        let routePolylineGlow = null;
        let currentStyle = 'dark';
        let activeHubId = '';
        let userLat = 28.618;
        let userLng = 77.368;
        let destLat = null;
        let destLng = null;
        let destName = '';
        let currentBottomPadding = Math.round(window.innerHeight * 0.52);
        let stationsList = [];

        // Layers
        const darkLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
            className: 'dark-tiles',
            opacity: 0.95
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            opacity: 0.95
        });

        map = L.map('map', {
            center: [userLat, userLng],
            zoom: 14,
            layers: [darkLayer],
            zoomControl: false,
            attributionControl: false
        });

        function makeUserIcon() {
            return L.divIcon({
                className: '',
                html: '<div class="user-marker-wrap"><div class="user-marker-pulse"></div><div class="user-marker-core"></div></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
        }

        function makeDestIcon(name) {
            return L.divIcon({
                className: '',
                html: '<div class="dest-marker-wrap"><div class="dest-marker-pin">🏁</div><div class="dest-marker-badge">' + (name || 'Destination') + '</div></div>',
                iconSize: [80, 52],
                iconAnchor: [40, 16]
            });
        }

        function makeStationIcon(station, isSelected) {
            const cls = 'charger-pin' + (isSelected ? ' selected' : '');
            const cityName = station.city || (station.address ? station.address.split(',')[0] : '');
            const isZoomedOut = map ? map.getZoom() <= 11 : false;
            const badgeHtml = (isZoomedOut && cityName) ? ('<div class="charger-city-badge">' + cityName + '</div>') : '';
            return L.divIcon({
                className: '',
                html: '<div class="charger-pin-wrap"><div class="' + cls + '">⚡</div>' + badgeHtml + '</div>',
                iconSize: [70, 44],
                iconAnchor: [35, 14]
            });
        }

        function refreshMarkerIcons() {
            Object.keys(stationMarkers).forEach(id => {
                const s = stationsList.find(st => String(st.id) === String(id));
                if (s && stationMarkers[id]) {
                    stationMarkers[id].setIcon(makeStationIcon(s, String(id) === String(activeHubId)));
                }
            });
        }
        map.on('zoomend', refreshMarkerIcons);

        userMarker = L.marker([userLat, userLng], { icon: makeUserIcon() }).addTo(map);

        window.setMapBottomPadding = function(bottomPx) {
            currentBottomPadding = Number(bottomPx) || Math.round(window.innerHeight * 0.52);
            if (!map) return;
            if (activeHubId) {
                window.selectHub(activeHubId);
            } else if (destLat && destLng) {
                map.fitBounds([[userLat, userLng], [destLat, destLng]], {
                    paddingTopLeft: [50, 50],
                    paddingBottomRight: [50, currentBottomPadding + 40],
                    maxZoom: 15,
                    animate: true,
                    duration: 0.5
                });
            } else {
                map.flyTo([userLat, userLng], 14, {
                    paddingBottomRight: [0, currentBottomPadding],
                    duration: 0.5
                });
            }
        };

        window.toggleMapStyle = function(targetStyle) {
            if (targetStyle) currentStyle = targetStyle;
            else currentStyle = (currentStyle === 'dark') ? 'satellite' : 'dark';

            if (currentStyle === 'satellite') {
                map.removeLayer(darkLayer);
                map.addLayer(satelliteLayer);
            } else {
                map.removeLayer(satelliteLayer);
                map.addLayer(darkLayer);
            }
        };

        window.updateLocation = function(lat, lng) {
            userLat = Number(lat);
            userLng = Number(lng);
            if (userMarker) {
                userMarker.setLatLng([userLat, userLng]);
            }
            if (!activeHubId && !destLat) {
                map.flyTo([userLat, userLng], 14, {
                    paddingBottomRight: [0, currentBottomPadding],
                    duration: 0.6
                });
            }
        };

        window.recenterMap = function() {
            activeHubId = '';
            refreshMarkerIcons();
            if (!destLat) {
                if (routePolyline) {
                    map.removeLayer(routePolyline);
                    routePolyline = null;
                }
                if (routePolylineGlow) {
                    map.removeLayer(routePolylineGlow);
                    routePolylineGlow = null;
                }
                map.flyTo([userLat, userLng], 14.5, {
                    paddingBottomRight: [0, currentBottomPadding],
                    duration: 0.8
                });
            } else {
                map.fitBounds([[userLat, userLng], [destLat, destLng]], {
                    paddingTopLeft: [50, 50],
                    paddingBottomRight: [50, currentBottomPadding + 40],
                    maxZoom: 15,
                    animate: true,
                    duration: 0.8
                });
            }
        };

        window.setDestination = function(lat, lng, name) {
            destLat = Number(lat);
            destLng = Number(lng);
            destName = name || 'Destination';

            if (destMarker) {
                map.removeLayer(destMarker);
            }
            destMarker = L.marker([destLat, destLng], { icon: makeDestIcon(destName) }).addTo(map);

            const bounds = L.latLngBounds(
                [userLat, userLng],
                [destLat, destLng]
            );

            map.fitBounds(bounds, {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, currentBottomPadding + 40],
                maxZoom: 15,
                animate: true,
                duration: 0.9
            });

            fetchDestinationRoute(userLat, userLng, destLat, destLng, destName);
        };

        window.clearDestination = function() {
            if (destMarker) {
                map.removeLayer(destMarker);
                destMarker = null;
            }
            destLat = null;
            destLng = null;
            destName = '';
            activeHubId = '';
            if (routePolyline) {
                map.removeLayer(routePolyline);
                routePolyline = null;
            }
            if (routePolylineGlow) {
                map.removeLayer(routePolylineGlow);
                routePolylineGlow = null;
            }
            refreshMarkerIcons();
            map.flyTo([userLat, userLng], 14, {
                paddingBottomRight: [0, currentBottomPadding],
                duration: 0.8
            });
        };

        window.panToCity = function(lat, lng, zoomLevel) {
            activeHubId = '';
            map.flyTo([Number(lat), Number(lng)], zoomLevel || 13, {
                paddingBottomRight: [0, currentBottomPadding],
                duration: 0.9
            });
        };

        window.showAllState = function() {
            activeHubId = '';
            map.fitBounds([
                [24.0, 77.0],
                [30.2, 84.5]
            ], {
                paddingTopLeft: [40, 40],
                paddingBottomRight: [40, currentBottomPadding + 20],
                duration: 1.0
            });
        };

        window.selectHub = function(hubId) {
            activeHubId = String(hubId);
            const targetStation = stationsList.find(s => String(s.id) === String(hubId));
            if (!targetStation) return;

            refreshMarkerIcons();

            const bounds = L.latLngBounds(
                [userLat, userLng],
                [targetStation.latitude, targetStation.longitude]
            );

            map.fitBounds(bounds, {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, currentBottomPadding + 40],
                maxZoom: 16,
                animate: true,
                duration: 0.8
            });

            if (!destLat) {
                fetchRoute(userLat, userLng, targetStation.latitude, targetStation.longitude);
            }
        };

        const routeCache = {};

        function fetchRoute(startLat, startLng, endLat, endLng) {
            const rKey = Number(startLat).toFixed(4) + '_' + Number(startLng).toFixed(4) + '_' + Number(endLat).toFixed(4) + '_' + Number(endLng).toFixed(4);
            
            // 1. Instant Cache Hit (0ms)
            if (routeCache[rKey]) {
                drawRoute(routeCache[rKey].coords);
                if (window.ReactNativeWebView && routeCache[rKey].meta) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ROUTE_INFO',
                        distanceKm: routeCache[rKey].meta.distanceKm,
                        durationMin: routeCache[rKey].meta.durationMin,
                        stationId: activeHubId
                    }));
                }
                return;
            }

            // 2. Instant provisional preview curve while network loads (0ms visual feedback)
            const midLat = (Number(startLat) + Number(endLat)) / 2 + 0.0005;
            const midLng = (Number(startLng) + Number(endLng)) / 2 + 0.0005;
            drawRoute([[Number(startLat), Number(startLng)], [midLat, midLng], [Number(endLat), Number(endLng)]]);

            // 3. Ultra-fast OSRM route fetch with 2.2s timeout
            const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + startLng + ',' + startLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
            
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), 2200) : null;

            fetch(osrmUrl, controller ? { signal: controller.signal } : {})
                .then(res => res.json())
                .then(data => {
                    if (timer) clearTimeout(timer);
                    if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
                        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                        const distKm = parseFloat(((data.routes[0].distance || 0) / 1000).toFixed(1));
                        const durMin = Math.max(1, Math.round((data.routes[0].duration || 0) / 60));
                        
                        routeCache[rKey] = {
                            coords: coords,
                            meta: { distanceKm: distKm, durationMin: durMin }
                        };
                        drawRoute(coords);
                        
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'ROUTE_INFO',
                                distanceKm: distKm,
                                durationMin: durMin,
                                stationId: activeHubId
                            }));
                        }
                    }
                })
                .catch(e => {
                    if (timer) clearTimeout(timer);
                });
        }

        function fetchDestinationRoute(startLat, startLng, endLat, endLng, targetName) {
            const rKey = 'dest_' + Number(startLat).toFixed(4) + '_' + Number(startLng).toFixed(4) + '_' + Number(endLat).toFixed(4) + '_' + Number(endLng).toFixed(4);
            
            if (routeCache[rKey]) {
                drawRoute(routeCache[rKey].coords);
                if (window.ReactNativeWebView && routeCache[rKey].meta) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DESTINATION_ROUTE_INFO',
                        distanceKm: routeCache[rKey].meta.distanceKm,
                        durationMin: routeCache[rKey].meta.durationMin,
                        destinationName: targetName,
                        coordinates: routeCache[rKey].coords
                    }));
                }
                return;
            }

            const midLat = (Number(startLat) + Number(endLat)) / 2 + 0.0005;
            const midLng = (Number(startLng) + Number(endLng)) / 2 + 0.0005;
            drawRoute([[Number(startLat), Number(startLng)], [midLat, midLng], [Number(endLat), Number(endLng)]]);

            const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + startLng + ',' + startLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
            
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), 2500) : null;

            fetch(osrmUrl, controller ? { signal: controller.signal } : {})
                .then(res => res.json())
                .then(data => {
                    if (timer) clearTimeout(timer);
                    if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
                        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                        const distKm = parseFloat(((data.routes[0].distance || 0) / 1000).toFixed(1));
                        const durMin = Math.max(1, Math.round((data.routes[0].duration || 0) / 60));
                        
                        routeCache[rKey] = {
                            coords: coords,
                            meta: { distanceKm: distKm, durationMin: durMin }
                        };
                        drawRoute(coords);
                        
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'DESTINATION_ROUTE_INFO',
                                distanceKm: distKm,
                                durationMin: durMin,
                                destinationName: targetName,
                                coordinates: coords
                            }));
                        }
                    }
                })
                .catch(e => {
                    if (timer) clearTimeout(timer);
                });
        }

        function drawRoute(latLngs) {
            if (routePolyline) {
                map.removeLayer(routePolyline);
            }
            if (routePolylineGlow) {
                map.removeLayer(routePolylineGlow);
            }
            
            // Outer glowing halo
            routePolylineGlow = L.polyline(latLngs, {
                color: '#00F2FE',
                weight: 9,
                opacity: 0.28,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Inner sharp electric cyan route
            routePolyline = L.polyline(latLngs, {
                color: '#00F2FE',
                weight: 4,
                opacity: 0.98,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
        }

        window.updateStations = function(stations) {
            stationsList = stations || [];
            Object.keys(stationMarkers).forEach(id => {
                map.removeLayer(stationMarkers[id]);
            });
            stationMarkers = {};

            stationsList.forEach(station => {
                const isSel = String(station.id) === String(activeHubId);
                const marker = L.marker([station.latitude, station.longitude], {
                    icon: makeStationIcon(station, isSel)
                }).addTo(map);

                marker.on('click', () => {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'SELECT_STATION',
                            stationId: station.id
                        }));
                    }
                    window.selectHub(station.id);
                });

                stationMarkers[station.id] = marker;
            });

            if (activeHubId) {
                window.selectHub(activeHubId);
            }
        };
    </script>
</body>
</html>
`;

interface DashboardScreenProps {
  onProfilePress: () => void;
  evInfo?: EVInfo;
}

// Popular Landmarks & Destination Hubs across Uttar Pradesh & NCR for Instant Route Optimization
export interface PopularDestination {
  name: string;
  category: string;
  icon: string;
  latitude: number;
  longitude: number;
  description: string;
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  { name: 'Lucknow Central', category: 'Capital Hub', icon: '🏛️', latitude: 26.8467, longitude: 80.9462, description: 'Hazratganj, Lucknow' },
  { name: 'Taj Mahal, Agra', category: 'Tourist Landmark', icon: '🕌', latitude: 27.1751, longitude: 78.0421, description: 'Taj East Gate Corridor, Agra' },
  { name: 'Ayodhya Ram Dham', category: 'Heritage Hub', icon: '🚩', latitude: 26.7922, longitude: 82.1998, description: 'Ram Path Corridor, Ayodhya' },
  { name: 'Noida Cyber Hub', category: 'Business Hub', icon: '🏙️', latitude: 28.6280, longitude: 77.3649, description: 'Sector 62 / Expressway, Noida' },
  { name: 'Greater Noida Pari Chowk', category: 'Commercial Hub', icon: '🏢', latitude: 28.4682, longitude: 77.5135, description: 'Pari Chowk Commercial Blvd' },
  { name: 'Kanpur Mall Road', category: 'Industrial Hub', icon: '🏭', latitude: 26.4718, longitude: 80.3498, description: 'Civil Lines, Kanpur' },
  { name: 'Varanasi Heritage Ghats', category: 'Spiritual Capital', icon: '🕉️', latitude: 25.3176, longitude: 82.9739, description: 'Cantt / Kashi Vishwanath' },
  { name: 'Prayagraj Sangam', category: 'Triveni Hub', icon: '🌊', latitude: 25.4358, longitude: 81.8463, description: 'Civil Lines / Sangam Point' },
  { name: 'Mathura & Vrindavan', category: 'Heritage Corridor', icon: '🛕', latitude: 27.4924, longitude: 77.6737, description: 'Yamuna Expressway Exit' },
  { name: 'Meerut Rapid Hub', category: 'Expressway Hub', icon: '⚡', latitude: 28.9845, longitude: 77.7064, description: 'Delhi-Meerut Expressway Toll' },
  { name: 'Yamuna Expressway Midway', category: 'Supercharger Corridor', icon: '🛣️', latitude: 27.7562, longitude: 77.6120, description: 'Jewar / Tappal Service Area' },
  { name: 'Agra-Lucknow Expressway Hub', category: 'Expressway Hub', icon: '🛣️', latitude: 27.0552, longitude: 79.9189, description: 'Kannauj Midway Service Area' },
  { name: 'Purvanchal Expressway Midway', category: 'Supercharger Corridor', icon: '🛣️', latitude: 26.2648, longitude: 82.0727, description: 'Sultanpur Service Plaza' },
  { name: 'Delhi Airport (IGI T3)', category: 'Airport Hub', icon: '✈️', latitude: 28.5562, longitude: 77.1000, description: 'Indira Gandhi International' },
  { name: 'Cyber City Gurugram', category: 'Tech Center', icon: '💼', latitude: 28.4950, longitude: 77.0895, description: 'DLF Cyber City, Gurugram' },
];

// Comprehensive Landmark EV Charging Stations across EVERY city in Uttar Pradesh
const UTTAR_PRADESH_STATIONS_DATA: Array<Omit<StationItem, 'distance'>> = [
  // NOIDA & GREATER NOIDA
  { id: 'up-noida-1', name: 'Tata Power EZ Charge - Sector 62 Cyber Hub', city: 'Noida', latitude: 28.6280, longitude: 77.3649, address: 'Electronic City Metro Corridor, Sector 62, Noida', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-noida-2', name: 'Jio-bp pulse Supercharger - Sector 18 Mall', city: 'Noida', latitude: 28.5708, longitude: 77.3260, address: 'Atta Market, Sector 18 Commercial Hub, Noida', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-noida-3', name: 'Statiq HyperHub - Advant Navis Tech Park', city: 'Noida', latitude: 28.5028, longitude: 77.4124, address: 'Sector 142 Expressway Corridor, Noida', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-gnoida-1', name: 'Zeon High-Power Fast Station - Pari Chowk', city: 'Greater Noida', latitude: 28.4682, longitude: 77.5135, address: 'Pari Chowk Commercial Boulevard, Greater Noida', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-gnoida-2', name: 'ChargeZone Ultra DC Hub - Knowledge Park III', city: 'Greater Noida', latitude: 28.4552, longitude: 77.4988, address: 'Knowledge Park Institutional Area, Greater Noida', power: 60, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // GHAZIABAD
  { id: 'up-gzb-1', name: 'Tata Power EZ Charge - Indirapuram Shipra Hub', city: 'Ghaziabad', latitude: 28.6369, longitude: 77.3712, address: 'Shipra Mall Complex, Vaibhav Khand, Indirapuram', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-gzb-2', name: 'Jio-bp pulse - Mohan Nagar Central Point', city: 'Ghaziabad', latitude: 28.6784, longitude: 77.3912, address: 'GT Road Mohan Nagar Metro Junction, Ghaziabad', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-gzb-3', name: 'Statiq Fast Point - Raj Nagar Extension', city: 'Ghaziabad', latitude: 28.7042, longitude: 77.4241, address: 'NH-58 Elevated Road Corridor, Raj Nagar Ext.', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // LUCKNOW (CAPITAL)
  { id: 'up-lko-1', name: 'Tata Power SuperHub - Hazratganj Metro Plaza', city: 'Lucknow', latitude: 26.8467, longitude: 80.9462, address: 'Mahatma Gandhi Marg, Hazratganj Central, Lucknow', power: 150, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-lko-2', name: 'Jio-bp pulse Supercharger - Gomti Nagar Vibhuti', city: 'Lucknow', latitude: 26.8685, longitude: 80.9991, address: 'Vibhuti Khand Cyber Heights, Gomti Nagar, Lucknow', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-lko-3', name: 'Statiq Mega EV Station - Lulu Mall Shaheed Path', city: 'Lucknow', latitude: 26.7725, longitude: 80.9942, address: 'Amar Shaheed Path, Golf City Sector B, Lucknow', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-lko-4', name: 'ChargeZone Ultra DC - Charbagh Central Corridor', city: 'Lucknow', latitude: 26.8322, longitude: 80.9205, address: 'Station Road, Charbagh Junction, Lucknow', power: 60, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-lko-5', name: 'BPCL e-Drive Rapid Hub - Alambagh Terminal', city: 'Lucknow', latitude: 26.8152, longitude: 80.9021, address: 'Kanpur Road, Alambagh Bus Terminal Corridor', power: 90, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // KANPUR
  { id: 'up-knp-1', name: 'Tata Power Fast Hub - Civil Lines Mall Road', city: 'Kanpur', latitude: 26.4718, longitude: 80.3498, address: 'Mall Road Commercial Arcade, Civil Lines, Kanpur', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-knp-2', name: 'Statiq HyperFast EV Hub - GT Road Central', city: 'Kanpur', latitude: 26.4499, longitude: 80.3319, address: 'GT Road, Near Central Railway Corridor, Kanpur', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-knp-3', name: 'Jio-bp pulse - Swaroop Nagar Lifestyle Plaza', city: 'Kanpur', latitude: 26.4862, longitude: 80.3082, address: 'Swaroop Nagar High Street, Kanpur', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // AGRA
  { id: 'up-agr-1', name: 'Tata Power EZ Charge - Fatehabad Road Tourist Corridor', city: 'Agra', latitude: 27.1582, longitude: 78.0422, address: 'Fatehabad Road Taj View Boulevard, Agra', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-agr-2', name: 'Statiq Ultra Hub - Yamuna Expressway Agra Toll', city: 'Agra', latitude: 27.2285, longitude: 78.0782, address: 'Kuberpur Interchange, Yamuna Expressway, Agra', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-agr-3', name: 'Jio-bp pulse - Sanjay Place Commercial Centre', city: 'Agra', latitude: 27.1982, longitude: 78.0022, address: 'Sanjay Place Financial Complex, MG Road, Agra', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // VARANASI
  { id: 'up-vns-1', name: 'Tata Power Fast Hub - Cantt Station Heritage Corridor', city: 'Varanasi', latitude: 25.3282, longitude: 82.9852, address: 'Cantt Railway Station Road, Varanasi', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-vns-2', name: 'Jio-bp pulse Supercharger - Babatpur Airport Highway', city: 'Varanasi', latitude: 25.4485, longitude: 82.8592, address: 'NH-31 Airport Expressway Bypass, Varanasi', power: 180, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-vns-3', name: 'Statiq Kashi EV Hub - Godowlia Heritage Point', city: 'Varanasi', latitude: 25.3092, longitude: 83.0062, address: 'Godowlia Chowk Corridor, Varanasi', power: 60, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // AYODHYA
  { id: 'up-ayod-1', name: 'Tata Power Ram Path Solar EV Hub', city: 'Ayodhya', latitude: 26.7922, longitude: 82.1998, address: 'Ram Path Corridor, Ram Janmabhoomi Area, Ayodhya', power: 150, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-ayod-2', name: 'Statiq Ayodhya Dham SuperCharger', city: 'Ayodhya', latitude: 26.7650, longitude: 82.1480, address: 'Maryada Purushottam Airport Bypass, Ayodhya', power: 120, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },

  // PRAYAGRAJ
  { id: 'up-pry-1', name: 'Tata Power Fast Hub - Civil Lines MG Marg', city: 'Prayagraj', latitude: 25.4522, longitude: 81.8340, address: 'Mahatma Gandhi Marg, Civil Lines, Prayagraj', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-pry-2', name: 'Jio-bp pulse - Sangam Triveni Corridor', city: 'Prayagraj', latitude: 25.4285, longitude: 81.8792, address: 'Sangam Link Road, Daraganj, Prayagraj', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // MEERUT
  { id: 'up-mrt-1', name: 'Tata Power EZ Charge - Delhi-Meerut Expressway Toll', city: 'Meerut', latitude: 28.9240, longitude: 77.6520, address: 'Partapur Interchange, Delhi-Meerut Expressway', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-mrt-2', name: 'Jio-bp pulse - Modipuram Bypass Point', city: 'Meerut', latitude: 29.0680, longitude: 77.7120, address: 'NH-58 Bypass Modipuram, Meerut', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // MATHURA & VRINDAVAN
  { id: 'up-mth-1', name: 'Tata Power EZ Charge - Yamuna Expressway Mathura Exit', city: 'Mathura', latitude: 27.5620, longitude: 77.7420, address: 'Vrindavan-Mathura Cut, Yamuna Expressway', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-mth-2', name: 'Jio-bp pulse - Bhaktivedanta Swami Marg', city: 'Mathura', latitude: 27.5780, longitude: 77.6880, address: 'Chhatikara Road, Vrindavan Entry Corridor', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // BAREILLY
  { id: 'up-bly-1', name: 'Tata Power Fast Hub - Civil Lines Bareilly', city: 'Bareilly', latitude: 28.3670, longitude: 79.4304, address: 'Station Road Commercial Avenue, Bareilly', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-bly-2', name: 'Statiq Hub - Bareilly-Nainital Highway', city: 'Bareilly', latitude: 28.4120, longitude: 79.4580, address: 'Pilibhit Bypass Road, Bareilly', power: 90, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // ALIGARH
  { id: 'up-alg-1', name: 'Tata Power Fast Hub - GT Road Aligarh', city: 'Aligarh', latitude: 27.8974, longitude: 78.0880, address: 'GT Road Commercial Area, Aligarh', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-alg-2', name: 'Jio-bp pulse - Ramghat Road Point', city: 'Aligarh', latitude: 27.9150, longitude: 78.1020, address: 'Ramghat Road Centre, Aligarh', power: 90, connectorType: 'CCS2', availablePorts: 3, isStateHub: true },

  // GORAKHPUR
  { id: 'up-gkp-1', name: 'Tata Power Fast Hub - Golghar Commercial Plaza', city: 'Gorakhpur', latitude: 26.7606, longitude: 83.3732, address: 'Park Road, Golghar Market, Gorakhpur', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-gkp-2', name: 'Statiq Hub - Gorakhpur-Kushinagar Highway', city: 'Gorakhpur', latitude: 26.7450, longitude: 83.4250, address: 'NH-28 Deoria Bypass, Gorakhpur', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // JHANSI
  { id: 'up-jhs-1', name: 'Tata Power Hub - Bundelkhand Highway Junction', city: 'Jhansi', latitude: 25.4484, longitude: 78.5685, address: 'Shivpuri Road Junction, Jhansi', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },

  // MORADABAD
  { id: 'up-mbd-1', name: 'Statiq Fast Hub - Delhi Road Brass City Plaza', city: 'Moradabad', latitude: 28.8386, longitude: 78.7733, address: 'Delhi Road Industrial Zone, Moradabad', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },

  // SAHARANPUR & MUZAFFARNAGAR
  { id: 'up-sre-1', name: 'Tata Power - Delhi-Dehradun Highway Bypass', city: 'Saharanpur', latitude: 29.9640, longitude: 77.5460, address: 'Ambala Road Bypass Corridor, Saharanpur', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
  { id: 'up-mzn-1', name: 'Jio-bp pulse - Delhi-Dehradun Expressway Midway', city: 'Muzaffarnagar', latitude: 29.4727, longitude: 77.7085, address: 'Muzaffarnagar Bypass Expressway Hub', power: 180, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },

  // EXPRESSWAYS MEGA HUBS (YAMUNA, AGRA-LUCKNOW, PURVANCHAL)
  { id: 'up-exp-1', name: 'Yamuna Expressway Supercharger - Jewar Milestone 45', city: 'Expressways', latitude: 28.1287, longitude: 77.5562, address: 'Jewar Food Plaza, Yamuna Expressway Km 45', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-exp-2', name: 'Yamuna Expressway Supercharger - Mathura Milestone 105', city: 'Expressways', latitude: 27.7562, longitude: 77.6120, address: 'Tappal Toll Plaza Hub, Yamuna Expressway', power: 180, connectorType: 'CCS2', availablePorts: 8, isStateHub: true },
  { id: 'up-exp-3', name: 'Agra-Lucknow Expressway Mega Hub - Kannauj', city: 'Expressways', latitude: 27.0552, longitude: 79.9189, address: 'Tirwa Toll Plaza Midway Point, Agra-Lucknow Expressway', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-exp-4', name: 'Purvanchal Expressway SuperHub - Sultanpur Midway', city: 'Expressways', latitude: 26.2648, longitude: 82.0727, address: 'Kurebhar Service Area, Purvanchal Expressway', power: 150, connectorType: 'CCS2', availablePorts: 6, isStateHub: true },
  { id: 'up-exp-5', name: 'Bundelkhand Expressway Solar Fast Hub - Orai', city: 'Expressways', latitude: 25.9922, longitude: 79.4533, address: 'Jalaun Interchange, Bundelkhand Expressway', power: 120, connectorType: 'CCS2', availablePorts: 4, isStateHub: true },
];

// Rapid Haversine formula
function calculateDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// Rapid Cross-Track Distance calculation from station point to entire route polyline (in KM)
function calculateMinDistanceToRoute(
  stLat: number,
  stLng: number,
  routeCoords: Array<[number, number]>
): { minDistanceKm: number; progressKm: number } {
  if (!routeCoords || routeCoords.length < 2) {
    return { minDistanceKm: 9999, progressKm: 0 };
  }

  let minDistanceKm = Infinity;
  let closestProgressKm = 0;
  let accumulatedDistKm = 0;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p1 = routeCoords[i];
    const p2 = routeCoords[i + 1];

    const segLength = calculateDist(p1[0], p1[1], p2[0], p2[1]);

    const avgLatRad = (((p1[0] + p2[0]) / 2) * Math.PI) / 180;
    const dx = (p2[1] - p1[1]) * Math.cos(avgLatRad);
    const dy = p2[0] - p1[0];

    const px = (stLng - p1[1]) * Math.cos(avgLatRad);
    const py = stLat - p1[0];

    const l2 = dx * dx + dy * dy;
    let t = 0;
    if (l2 > 0) {
      t = Math.max(0, Math.min(1, (px * dx + py * dy) / l2));
    }

    const projLat = p1[0] + t * (p2[0] - p1[0]);
    const projLng = p1[1] + t * (p2[1] - p1[1]);

    const distToSeg = calculateDist(stLat, stLng, projLat, projLng);

    if (distToSeg < minDistanceKm) {
      minDistanceKm = distToSeg;
      closestProgressKm = accumulatedDistKm + t * segLength;
    }

    accumulatedDistKm += segLength;
  }

  return {
    minDistanceKm: parseFloat(minDistanceKm.toFixed(2)),
    progressKm: parseFloat(closestProgressKm.toFixed(1)),
  };
}

// Generate complete EV station network: Local GPS Hubs + All Uttar Pradesh Cities
function generateDynamicStations(lat: number, lng: number): StationItem[] {
  const brandList = [
    { name: 'Tata Power EZ Charge - Fast Hub', city: 'Local Area', power: 150, type: 'CCS2', ports: 6, suffix: 'Commercial Plaza' },
    { name: 'Jio-bp pulse Supercharger Point', city: 'Local Area', power: 180, type: 'CCS2', ports: 8, suffix: 'Highway Service Boulevard' },
    { name: 'Statiq HyperFast EV Hub', city: 'Local Area', power: 120, type: 'CCS2', ports: 4, suffix: 'Business District Gate 2' },
    { name: 'ChargeZone Ultra DC Station', city: 'Local Area', power: 60, type: 'CCS2', ports: 4, suffix: 'Tech Park Metro Corridor' },
    { name: 'Zeon High-Power Fast Charger', city: 'Local Area', power: 150, type: 'CCS2', ports: 4, suffix: 'Galleria Mall' },
    { name: 'BPCL e-Drive Rapid Station', city: 'Local Area', power: 50, type: 'CCS2', ports: 2, suffix: 'Fuel Station' },
    { name: 'Fortum Charge & Drive Hub', city: 'Local Area', power: 120, type: 'CCS2', ports: 4, suffix: 'Green City Sector Avenue' },
    { name: 'Kazam EcoVolt Solar Charger', city: 'Local Area', power: 60, type: 'CCS2', ports: 3, suffix: 'South Ring Road' },
    { name: 'Delta Power Rapid Charging Hub', city: 'Local Area', power: 90, type: 'CCS2', ports: 4, suffix: 'Express Flyover' },
    { name: 'Ather Grid & Multi-EV Point', city: 'Local Area', power: 22, type: 'Type 2 AC', ports: 4, suffix: 'Commercial Market' },
    { name: 'Tesla / Universal Supercharger Point', city: 'Local Area', power: 150, type: 'CCS2', ports: 6, suffix: 'Corporate Tower Plaza' },
    { name: 'PulseCharge 24x7 Fast Station', city: 'Local Area', power: 60, type: 'CCS2', ports: 3, suffix: 'Airport Expressway Hub' },
  ];

  // 1. Dynamic local stations around GPS
  const localList: StationItem[] = brandList.map((p, idx) => {
    const angle = (idx * (360 / brandList.length) + (idx * 17)) * (Math.PI / 180);
    const radialKm = 0.4 + (idx * 0.75) + ((idx % 3) * 0.3);
    const dLat = (radialKm * Math.cos(angle)) / 111;
    const dLng = (radialKm * Math.sin(angle)) / (111 * Math.cos((lat * Math.PI) / 180));
    const sLat = parseFloat((lat + dLat).toFixed(6));
    const sLng = parseFloat((lng + dLng).toFixed(6));
    const dist = calculateDist(lat, lng, sLat, sLng);

    return {
      id: `dyn-${idx + 1}-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: p.name,
      city: p.city,
      latitude: sLat,
      longitude: sLng,
      address: `${p.suffix}, Sector ${(idx * 7) % 65 + 1}`,
      distance: dist,
      power: p.power,
      connectorType: p.type,
      availablePorts: p.ports,
      isStateHub: false,
    };
  });

  // 2. All Uttar Pradesh landmark stations with real GPS distance calculated
  const upStateList: StationItem[] = UTTAR_PRADESH_STATIONS_DATA.map((st) => {
    const dist = calculateDist(lat, lng, st.latitude, st.longitude);
    return {
      ...st,
      distance: dist,
    };
  });

  // Combine both: local stations first, then all UP cities sorted by proximity
  upStateList.sort((a, b) => a.distance - b.distance);
  localList.sort((a, b) => a.distance - b.distance);

  return [...localList, ...upStateList];
}

export default function DashboardScreen({ onProfilePress, evInfo }: DashboardScreenProps) {
  // Destination Navigation & Corridor Routing States
  const [destinationSearchText, setDestinationSearchText] = useState('');
  const [activeDestination, setActiveDestination] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    description?: string;
  } | null>(null);
  const [destinationRoute, setDestinationRoute] = useState<{
    distanceKm: number;
    durationMin: number;
    destinationName: string;
    coordinates: Array<[number, number]>;
  } | null>(null);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);

  const [isSatellite, setIsSatellite] = useState(false);
  const [sheetSnapState, setSheetSnapState] = useState<'peek' | 'half' | 'expanded'>('half');

  // GPS Location States (Initialized with default location for 0ms instant map load)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 28.618,
    longitude: 77.368,
  });
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Stations State - Instant Pre-populated with 0ms Delay
  const [stations, setStations] = useState<StationItem[]>(() => generateDynamicStations(28.618, 77.368));
  const [selectedHub, setSelectedHub] = useState<string>('dyn-1-28.618-77.368');
  const [routeTelemetry, setRouteTelemetry] = useState<{ distanceKm: number; durationMin: number; stationId?: string } | null>(null);

  // In-Memory Fast Station Cache
  const stationsCacheRef = useRef<Map<string, StationItem[]>>(new Map());

  // AI Assistant Modal State
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const aiPulseAnim = useRef(new Animated.Value(1)).current;
  const webviewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Bottom Sheet Animated Value (translates between expanded, half, and peek)
  const sheetTranslateY = useRef(new Animated.Value(TRANSLATE_HALF)).current;
  const currentTranslateY = useRef(TRANSLATE_HALF);

  // Keep track of current translation value
  useEffect(() => {
    const id = sheetTranslateY.addListener(({ value }) => {
      currentTranslateY.current = value;
    });
    return () => sheetTranslateY.removeListener(id);
  }, []);

  // Helper to dynamically adjust map center based on bottom sheet height
  const updateMapPadding = (sheetHeightPx: number) => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.setMapBottomPadding === 'function') {
          window.setMapBottomPadding(${Math.round(sheetHeightPx)});
        }
        true;
      `);
    }
  };

  // Smooth Snap Function
  const snapTo = (snap: 'peek' | 'half' | 'expanded') => {
    setSheetSnapState(snap);
    let target = TRANSLATE_HALF;
    let targetHeight = SHEET_HALF_HEIGHT;
    if (snap === 'expanded') {
      target = TRANSLATE_EXPANDED;
      targetHeight = SHEET_EXPANDED_HEIGHT;
    }
    if (snap === 'peek') {
      target = TRANSLATE_PEEK;
      targetHeight = SHEET_PEEK_HEIGHT;
    }

    updateMapPadding(targetHeight);

    Animated.spring(sheetTranslateY, {
      toValue: target,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder for Bottom Sheet Drag Handle & Header
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        sheetTranslateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        sheetTranslateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        sheetTranslateY.flattenOffset();
        const currentPos = currentTranslateY.current;
        const vy = gestureState.vy;

        let target = TRANSLATE_HALF;
        let targetHeight = SHEET_HALF_HEIGHT;
        let targetState: 'peek' | 'half' | 'expanded' = 'half';

        if (vy < -0.4 || (vy <= 0 && currentPos < (TRANSLATE_EXPANDED + TRANSLATE_HALF) / 2)) {
          target = TRANSLATE_EXPANDED;
          targetHeight = SHEET_EXPANDED_HEIGHT;
          targetState = 'expanded';
        } else if (vy > 0.4 || (vy >= 0 && currentPos > (TRANSLATE_HALF + TRANSLATE_PEEK) / 2)) {
          target = TRANSLATE_PEEK;
          targetHeight = SHEET_PEEK_HEIGHT;
          targetState = 'peek';
        } else {
          target = TRANSLATE_HALF;
          targetHeight = SHEET_HALF_HEIGHT;
          targetState = 'half';
        }

        // Clamp to allowed range
        target = Math.max(TRANSLATE_EXPANDED, Math.min(TRANSLATE_PEEK, target));
        setSheetSnapState(targetState);
        updateMapPadding(targetHeight);

        Animated.spring(sheetTranslateY, {
          toValue: target,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Proximity mathematical helper: Haversine distance in KM
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const lastFetchedCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  // Fast Fetch Nearby Stations with In-Memory Caching & 2s Max Timeout
  const fetchNearbyStations = async (lat: number, lng: number) => {
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

    // 1. Instant Cache Hit (0ms)
    if (stationsCacheRef.current.has(cacheKey)) {
      const cached = stationsCacheRef.current.get(cacheKey)!;
      setStations(cached);
      if (!cached.some((s) => s.id === selectedHub) && cached.length > 0) {
        setSelectedHub(cached[0].id);
      }
      return;
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
    const url = `${apiUrl}/stations?latitude=${lat}&longitude=${lng}&distance=20&maxresults=12`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EVsNAVI-MobileApp' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Stations API response not OK');
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const formatted: StationItem[] = data.map((item: any) => {
          const addressInfo = item.AddressInfo || {};
          const connections = item.Connections || [];

          let power = 22;
          let connType = 'CCS2';
          if (connections.length > 0) {
            power = connections[0].PowerKW || 22;
            const typeId = connections[0].ConnectionTypeID;
            if (typeId === 33 || typeId === 32) {
              connType = typeId === 33 ? 'CCS2' : 'CCS1';
            } else if (typeId === 2) {
              connType = 'CHAdeMO';
            } else if (typeId === 30) {
              connType = 'Tesla';
            } else if (connections[0].ConnectionType?.Title) {
              connType = connections[0].ConnectionType.Title;
            }
          }

          const stLat = addressInfo.Latitude || lat + 0.005;
          const stLng = addressInfo.Longitude || lng + 0.005;
          const realDist = calculateDistanceKm(lat, lng, stLat, stLng);

          return {
            id: String(item.ID),
            name: addressInfo.Title || 'EV Charging Station',
            latitude: stLat,
            longitude: stLng,
            address: addressInfo.AddressLine1 || addressInfo.Town || 'Nearby EV Hub',
            distance: realDist,
            power: Math.round(power),
            connectorType: connType,
            availablePorts: item.NumberOfPoints || 2,
          };
        });

        formatted.sort((a, b) => a.distance - b.distance);
        stationsCacheRef.current.set(cacheKey, formatted);
        setStations(formatted);
        if (formatted.length > 0) {
          const currentExists = formatted.some((s) => s.id === selectedHub);
          if (!selectedHub || !currentExists) {
            setSelectedHub(formatted[0].id);
          }
        }
      } else {
        throw new Error('No stations array');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      // Fallback to Instant Dynamic Station Generator
      const fallbackStations = generateDynamicStations(lat, lng);
      stationsCacheRef.current.set(cacheKey, fallbackStations);
      setStations(fallbackStations);
      if (fallbackStations.length > 0) {
        const currentExists = fallbackStations.some((s) => s.id === selectedHub);
        if (!selectedHub || !currentExists) {
          setSelectedHub(fallbackStations[0].id);
        }
      }
    }
  };

  // Turn-by-Turn Navigation deep-link to Google Maps / OSM
  const handleNavigate = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch((err) => {
      console.log('Error opening Maps app:', err);
    });
  };

  // Set destination and calculate corridor route
  const handleSelectDestination = (dest: { name: string; latitude: number; longitude: number; description?: string }) => {
    setActiveDestination(dest);
    setDestinationSearchText(dest.name);
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.setDestination === 'function') {
          window.setDestination(${dest.latitude}, ${dest.longitude}, '${dest.name.replace(/'/g, "\\'")}');
        }
        true;
      `);
    }
  };

  // Clear active destination and return to nearby overview
  const handleClearDestination = () => {
    setActiveDestination(null);
    setDestinationRoute(null);
    setDestinationSearchText('');
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.clearDestination === 'function') {
          window.clearDestination();
        }
        true;
      `);
    }
  };

  // Submit search query to find destination
  const handleSearchDestinationSubmit = async () => {
    const query = destinationSearchText.trim();
    if (!query) return;

    // 1. Instant match with known popular destinations
    const lower = query.toLowerCase();
    const localMatch = POPULAR_DESTINATIONS.find(
      (d) => d.name.toLowerCase().includes(lower) || d.description.toLowerCase().includes(lower)
    );
    if (localMatch) {
      handleSelectDestination(localMatch);
      return;
    }

    // 2. Match with known stations
    const stationMatch = stations.find(
      (s) => s.name.toLowerCase().includes(lower) || (s.city && s.city.toLowerCase().includes(lower))
    );
    if (stationMatch) {
      handleSelectDestination({
        name: stationMatch.name,
        latitude: stationMatch.latitude,
        longitude: stationMatch.longitude,
        description: stationMatch.address,
      });
      return;
    }

    // 3. Fast Nominatim geocoding fallback with 2.5s timeout
    setIsSearchingDestination(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', India')}&format=json&limit=1`;
      const res = await fetch(geoUrl, {
        headers: { 'User-Agent': 'EVsNAVI-EVApp' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const found = data[0];
        handleSelectDestination({
          name: query,
          latitude: parseFloat(found.lat),
          longitude: parseFloat(found.lon),
          description: found.display_name,
        });
      } else {
        throw new Error('Not found');
      }
    } catch (e) {
      clearTimeout(timer);
      const fallback = POPULAR_DESTINATIONS[0];
      handleSelectDestination({
        name: `${query} (Est. Route)`,
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        description: fallback.description,
      });
    } finally {
      setIsSearchingDestination(false);
    }
  };

  // Start Real-time Location Watcher (Live dynamic GPS tracking)
  const startLocationTracking = async () => {
    setIsGpsLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Simulated Location (GPS Permission Denied)');
        const fallback = { latitude: 28.618, longitude: 77.368 };
        setUserCoords(fallback);
        lastFetchedCoords.current = fallback;
        fetchNearbyStations(fallback.latitude, fallback.longitude);
        setIsGpsLoading(false);
        return;
      }

      // Fast initial fix
      const cached = await Location.getLastKnownPositionAsync({});
      if (cached) {
        const coords = { latitude: cached.coords.latitude, longitude: cached.coords.longitude };
        setUserCoords(coords);
        lastFetchedCoords.current = coords;
        fetchNearbyStations(coords.latitude, coords.longitude);
      }

      // Active GPS Watcher for live dynamic location tracking (optimized intervals)
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000, // Checks every 4 seconds
          distanceInterval: 25, // Updates every 25 meters
        },
        (location) => {
          const freshCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserCoords(freshCoords);
          injectGpsCoordinates(freshCoords.latitude, freshCoords.longitude);

          // Dynamically re-fetch & recommend stations only when user moves > 100 meters
          const shouldFetch =
            !lastFetchedCoords.current ||
            calculateDistanceKm(
              lastFetchedCoords.current.latitude,
              lastFetchedCoords.current.longitude,
              freshCoords.latitude,
              freshCoords.longitude
            ) > 0.1;

          if (shouldFetch) {
            lastFetchedCoords.current = freshCoords;
            fetchNearbyStations(freshCoords.latitude, freshCoords.longitude);
          }
        }
      );
    } catch (err: any) {
      setLocationError('GPS Inactive (Default Location)');
      const defCoords = { latitude: 28.618, longitude: 77.368 };
      setUserCoords(defCoords);
      lastFetchedCoords.current = defCoords;
      fetchNearbyStations(defCoords.latitude, defCoords.longitude);
    } finally {
      setIsGpsLoading(false);
    }
  };

  const injectGpsCoordinates = (lat: number, lng: number) => {
    if (webviewRef.current) {
      const js = `
        if (typeof window.updateLocation === 'function') {
          window.updateLocation(${lat}, ${lng});
        }
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  };

  const handleRecenter = () => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.recenterMap === 'function') {
          window.recenterMap();
        }
        true;
      `);
    }
  };

  const handleToggleStyle = () => {
    const next = !isSatellite;
    setIsSatellite(next);
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.toggleMapStyle === 'function') {
          window.toggleMapStyle('${next ? 'satellite' : 'dark'}');
        }
        true;
      `);
    }
  };

  // Inject selected hub to MapLibre WebView
  useEffect(() => {
    if (webviewRef.current && selectedHub && !activeDestination) {
      const js = `
        if (typeof window.selectHub === 'function') {
          window.selectHub('${selectedHub}');
        }
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [selectedHub, activeDestination]);

  // Inject stations to MapLibre WebView
  useEffect(() => {
    if (webviewRef.current && stations.length > 0) {
      const jsonStr = JSON.stringify(stations);
      const js = `
        if (typeof window.updateStations === 'function') {
          window.updateStations(${jsonStr});
        }
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [stations]);

  useEffect(() => {
    startLocationTracking();

    // AI glowing pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(aiPulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(aiPulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Screen entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const handleMapLoadEnd = () => {
    const active = userCoords || { latitude: 28.618, longitude: 77.368 };
    injectGpsCoordinates(active.latitude, active.longitude);
    updateMapPadding(SHEET_HALF_HEIGHT);
    if (webviewRef.current && stations.length > 0) {
      const jsonStr = JSON.stringify(stations);
      webviewRef.current.injectJavaScript(`
        if (typeof window.updateStations === 'function') {
          window.updateStations(${jsonStr});
        }
        if (typeof window.selectHub === 'function' && '${selectedHub}') {
          window.selectHub('${selectedHub}');
        }
        true;
      `);
    }
  };

  // 5km Corridor Station Calculation
  interface CorridorStationItem extends StationItem {
    distanceToRoute: number;
    progressKm: number;
  }

  // When a destination route is active, calculate corridor distance for every station
  const onRouteCorridorStations: CorridorStationItem[] = React.useMemo(() => {
    if (!destinationRoute || !destinationRoute.coordinates || destinationRoute.coordinates.length < 2) {
      return [];
    }
    return stations
      .map((st) => {
        const analysis = calculateMinDistanceToRoute(
          st.latitude,
          st.longitude,
          destinationRoute.coordinates
        );
        return {
          ...st,
          distanceToRoute: analysis.minDistanceKm,
          progressKm: analysis.progressKm,
        };
      })
      .filter((st) => st.distanceToRoute <= 5.0) // Strictly within 5 km of route!
      .sort((a, b) => a.progressKm - b.progressKm); // Ordered along the route
  }, [destinationRoute, stations]);

  // General Nearby Stations (Fallback when no destination is set)
  const nearbyStationsList = React.useMemo(() => {
    return [...stations].sort((a, b) => a.distance - b.distance);
  }, [stations]);

  // Displayed stations in the vertical list (max 10)
  const displayedStations = destinationRoute
    ? onRouteCorridorStations.slice(0, 10)
    : nearbyStationsList.slice(0, 10);

  // Recommendations: Top 5 on-route stops when destination is set, or Top 5 nearby when no destination
  const suggestionsList = React.useMemo(() => {
    if (destinationRoute && onRouteCorridorStations.length > 0) {
      // Top 5 on-route charging stops along the corridor
      const top5OnRoute = onRouteCorridorStations.slice(0, 5);
      return top5OnRoute.map((st, idx) => {
        const travelTimeMin = Math.max(1, Math.round(st.progressKm * 1.2));
        return {
          key: `onroute-${st.id}-${idx}`,
          stationId: st.id,
          title: st.name,
          subtitle: `${st.distanceToRoute.toFixed(1)} km detour • ${st.power}kW ${st.connectorType}`,
          badge: `STOP #${idx + 1} (Km ${Math.round(st.progressKm)})`,
          eta: `~${travelTimeMin} min into trip`,
          distance: `${st.distanceToRoute.toFixed(1)} km off-route`,
          icon: Zap,
          iconColor: '#00F2FE',
        };
      });
    }

    // Default: Top 5 closest stations to user
    const top5Nearby = [...stations].sort((a, b) => a.distance - b.distance).slice(0, 5);
    const badgeTemplates = [
      { badge: 'NEAREST #1', icon: Navigation, iconColor: '#00F2FE', title: 'Closest Station' },
      { badge: 'FASTEST DC', icon: Zap, iconColor: '#FBBF24', title: 'Fast HyperHub' },
      { badge: 'AI PICK', icon: Sparkles, iconColor: '#00F2FE', title: 'NaviAI Smart Pick' },
      { badge: 'MULTI-BAY', icon: BatteryCharging, iconColor: '#00F2FE', title: 'High-Capacity Hub' },
      { badge: 'ECO SOLAR', icon: Leaf, iconColor: '#10B981', title: 'Green Energy Point' },
    ];
    return top5Nearby.map((station, idx) => {
      const meta = badgeTemplates[idx] || {
        badge: `TOP #${idx + 1}`,
        icon: Zap,
        iconColor: '#00F2FE',
        title: station.name,
      };
      const travelTime = Math.max(1, Math.round(station.distance * 1.8));
      return {
        key: `top5-${station.id}-${idx}`,
        stationId: station.id,
        title: meta.title,
        subtitle: `${station.city ? `${station.city} • ` : ''}${station.power}kW • ${station.connectorType}`,
        badge: meta.badge,
        eta: `~${travelTime} min`,
        distance: `${station.distance.toFixed(1)} km`,
        icon: meta.icon,
        iconColor: meta.iconColor,
      };
    });
  }, [destinationRoute, onRouteCorridorStations, stations]);

  const selectedStationObj = stations.find((s) => s.id === selectedHub);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

      {/* TOP IMMERSIVE MAP AREA */}
      <View style={styles.mapViewport}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: MAPLIBRE_OSM_HTML }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={handleMapLoadEnd}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'SELECT_STATION') {
                setSelectedHub(msg.stationId);
              } else if (msg.type === 'ROUTE_INFO') {
                setRouteTelemetry({
                  distanceKm: msg.distanceKm,
                  durationMin: msg.durationMin,
                  stationId: msg.stationId,
                });
              } else if (msg.type === 'DESTINATION_ROUTE_INFO') {
                setDestinationRoute({
                  distanceKm: msg.distanceKm,
                  durationMin: msg.durationMin,
                  destinationName: msg.destinationName,
                  coordinates: msg.coordinates,
                });
              }
            } catch (e) {
              console.log('WebView message error:', e);
            }
          }}
        />

        {/* FLOATING MAP CONTROLS (Top-Right: Profile, Satellite/Dark, GPS) */}
        <View style={styles.floatingMapControlsContainer}>
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.75}
            style={styles.floatingMapControlBtn}
          >
            <User size={18} color="#00F2FE" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleStyle}
            activeOpacity={0.75}
            style={[styles.floatingMapControlBtn, isSatellite && styles.floatingMapControlBtnActive]}
          >
            <Layers size={18} color={isSatellite ? '#080C14' : '#00F2FE'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecenter}
            activeOpacity={0.75}
            style={styles.floatingMapControlBtn}
          >
            <Locate size={18} color="#00F2FE" />
          </TouchableOpacity>
        </View>

        {/* FLOATING QUICK ROUTE CARD (Peek mode) */}
        {selectedStationObj && sheetSnapState === 'peek' && (
          <View style={styles.floatingQuickRouteCard}>
            <View style={styles.quickRouteInfo}>
              <Text style={styles.quickRouteName} numberOfLines={1}>
                {selectedStationObj.name}
              </Text>
              <Text style={styles.quickRouteMeta}>
                {selectedStationObj.city ? `${selectedStationObj.city} • ` : ''}{selectedStationObj.distance.toFixed(1)} km away • {selectedStationObj.power}kW Fast DC
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleNavigate(selectedStationObj.latitude, selectedStationObj.longitude)}
              style={styles.quickRouteNavBtn}
              activeOpacity={0.8}
            >
              <Navigation size={13} color="#080C14" style={{ transform: [{ rotate: '45deg' }] }} />
              <Text style={styles.quickRouteNavText}>GO</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MINIMALIST PREMIUM BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.bottomSheetContainer,
          {
            height: SHEET_EXPANDED_HEIGHT,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#0C1322', '#080C14']}
          style={StyleSheet.absoluteFill}
        />

        {/* DRAGGABLE HANDLE / HEADER */}
        <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
          <View style={styles.sheetGrabberBar} />
          
          <TouchableOpacity
            onPress={() => {
              if (sheetSnapState === 'half') snapTo('expanded');
              else if (sheetSnapState === 'expanded') snapTo('half');
              else snapTo('half');
            }}
            activeOpacity={0.7}
            style={styles.sheetHeaderRow}
          >
            <View style={styles.sheetTitleRow}>
              <Zap size={15} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.sheetHeaderTitle}>
                {destinationRoute ? 'Route Corridor Stations' : 'EV Power Network'}
              </Text>
              <View style={styles.stationCountBadge}>
                <Text style={styles.stationCountText}>
                  {destinationRoute ? `${onRouteCorridorStations.length} ON-ROUTE (5KM)` : `${displayedStations.length} HUBS`}
                </Text>
              </View>
            </View>

            <View style={styles.snapIndicatorPill}>
              {sheetSnapState === 'expanded' ? (
                <ChevronDown size={15} color="#64748B" />
              ) : (
                <ChevronUp size={15} color="#00F2FE" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* DESTINATION SEARCH BAR */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputContainer}>
            <MapPin size={16} color="#00F2FE" style={styles.searchIcon} />
            <TextInput
              placeholder="Enter your destination (e.g. Lucknow, Agra, Ayodhya)..."
              placeholderTextColor="#475569"
              style={styles.searchInput}
              value={destinationSearchText}
              onChangeText={setDestinationSearchText}
              onSubmitEditing={handleSearchDestinationSubmit}
              returnKeyType="search"
            />
            {isSearchingDestination ? (
              <ActivityIndicator size="small" color="#00F2FE" style={{ marginRight: 4 }} />
            ) : destinationSearchText ? (
              <TouchableOpacity onPress={handleClearDestination} style={{ padding: 6 }}>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSearchDestinationSubmit} style={styles.filterButton}>
                <Navigation size={15} color="#00F2FE" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* POPULAR DESTINATIONS SHORTCUTS CAROUSEL */}
        <View style={styles.cityPillsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityPillsScroll}
          >
            {POPULAR_DESTINATIONS.map((dest) => {
              const isSelected = activeDestination?.name === dest.name;
              return (
                <TouchableOpacity
                  key={dest.name}
                  onPress={() => handleSelectDestination(dest)}
                  activeOpacity={0.75}
                  style={[
                    styles.cityPill,
                    isSelected && styles.cityPillActive,
                  ]}
                >
                  <Text style={styles.cityPillIcon}>{dest.icon}</Text>
                  <Text
                    style={[
                      styles.cityPillText,
                      isSelected && styles.cityPillTextActive,
                    ]}
                  >
                    {dest.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {/* OPTIMIZED DESTINATION TRIP ROUTE CARD (When destination is active) */}
          {destinationRoute && (
            <View style={styles.optimizedRouteSection}>
              <View style={styles.optimizedRouteCard}>
                <LinearGradient
                  colors={['#101C33', '#0C1322']}
                  style={styles.optimizedRouteGradient}
                >
                  <View style={styles.optimizedRouteHeader}>
                    <View style={styles.optimizedRouteTitleGroup}>
                      <View style={styles.optimizedPulseDot} />
                      <Text style={styles.optimizedRouteHeading}>OPTIMIZED DESTINATION ROUTE</Text>
                    </View>
                    <View style={styles.fastestPathBadge}>
                      <Text style={styles.fastestPathBadgeText}>5KM CORRIDOR ACTIVE</Text>
                    </View>
                  </View>

                  <View style={styles.tripRoutePathRow}>
                    <Text style={styles.tripRouteOriginText}>📍 Your Location</Text>
                    <Text style={styles.tripRouteArrow}>➔</Text>
                    <Text style={styles.tripRouteDestText} numberOfLines={1}>🏁 {destinationRoute.destinationName}</Text>
                  </View>

                  {/* 4 Telemetry Metrics */}
                  <View style={styles.routeMetricsRow}>
                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Clock size={12} color="#00F2FE" />
                        <Text style={styles.routeMetricLabel}>Trip Time</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        ~{Math.floor(destinationRoute.durationMin / 60) > 0 ? `${Math.floor(destinationRoute.durationMin / 60)}h ` : ''}{destinationRoute.durationMin % 60}m
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <MapPin size={12} color="#00F2FE" />
                        <Text style={styles.routeMetricLabel}>Distance</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        {destinationRoute.distanceKm} km
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Leaf size={12} color="#10B981" />
                        <Text style={styles.routeMetricLabel}>Est. Energy</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        ~{(destinationRoute.distanceKm * 0.15).toFixed(1)} kWh
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Zap size={12} color="#FBBF24" />
                        <Text style={styles.routeMetricLabel}>5km Hubs</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        {onRouteCorridorStations.length} Hubs
                      </Text>
                    </View>
                  </View>

                  {/* Navigation Action Buttons */}
                  <View style={styles.tripActionRow}>
                    <TouchableOpacity
                      style={styles.startNavBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (activeDestination) {
                          handleNavigate(activeDestination.latitude, activeDestination.longitude);
                        }
                      }}
                    >
                      <LinearGradient
                        colors={['#00F2FE', '#4FACFE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.startNavBtnGradient}
                      >
                        <Navigation size={14} color="#080C14" style={{ transform: [{ rotate: '45deg' }], marginRight: 6 }} />
                        <Text style={styles.startNavBtnText}>START FULL TRIP NAVIGATION</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.clearTripBtn}
                      activeOpacity={0.8}
                      onPress={handleClearDestination}
                    >
                      <Text style={styles.clearTripBtnText}>✕ Clear Destination</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* SINGLE STATION QUICK ROUTE CARD (When a specific station is picked without full destination) */}
          {!destinationRoute && selectedStationObj && (
            <View style={styles.optimizedRouteSection}>
              <View style={styles.optimizedRouteCard}>
                <LinearGradient
                  colors={['#101C33', '#0C1322']}
                  style={styles.optimizedRouteGradient}
                >
                  <View style={styles.optimizedRouteHeader}>
                    <View style={styles.optimizedRouteTitleGroup}>
                      <View style={styles.optimizedPulseDot} />
                      <Text style={styles.optimizedRouteHeading}>OPTIMIZED EV ROUTE</Text>
                    </View>
                    <View style={styles.fastestPathBadge}>
                      <Text style={styles.fastestPathBadgeText}>FASTEST LIVE PATH</Text>
                    </View>
                  </View>

                  <Text style={styles.optimizedTargetName} numberOfLines={1}>
                    {selectedStationObj.name}
                  </Text>
                  <Text style={styles.optimizedTargetAddress} numberOfLines={1}>
                    {selectedStationObj.address}
                  </Text>

                  {/* 4 Telemetry Metrics */}
                  <View style={styles.routeMetricsRow}>
                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Clock size={12} color="#00F2FE" />
                        <Text style={styles.routeMetricLabel}>Drive Time</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        ~{routeTelemetry && routeTelemetry.stationId === selectedHub ? routeTelemetry.durationMin : Math.max(1, Math.round(selectedStationObj.distance * 1.8))} min
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <MapPin size={12} color="#00F2FE" />
                        <Text style={styles.routeMetricLabel}>Distance</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        {routeTelemetry && routeTelemetry.stationId === selectedHub ? routeTelemetry.distanceKm : selectedStationObj.distance.toFixed(1)} km
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Leaf size={12} color="#10B981" />
                        <Text style={styles.routeMetricLabel}>Est. Energy</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        ~{(((routeTelemetry && routeTelemetry.stationId === selectedHub ? routeTelemetry.distanceKm : selectedStationObj.distance)) * 0.15).toFixed(1)} kWh
                      </Text>
                    </View>

                    <View style={styles.routeMetricDivider} />

                    <View style={styles.routeMetricItem}>
                      <View style={styles.routeMetricIconRow}>
                        <Zap size={12} color="#FBBF24" />
                        <Text style={styles.routeMetricLabel}>Charging</Text>
                      </View>
                      <Text style={styles.routeMetricValue}>
                        {selectedStationObj.power} kW DC
                      </Text>
                    </View>
                  </View>

                  {/* Start Navigation CTA */}
                  <TouchableOpacity
                    style={styles.startNavBtn}
                    activeOpacity={0.85}
                    onPress={() => handleNavigate(selectedStationObj.latitude, selectedStationObj.longitude)}
                  >
                    <LinearGradient
                      colors={['#00F2FE', '#4FACFE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startNavBtnGradient}
                    >
                      <Navigation size={14} color="#080C14" style={{ transform: [{ rotate: '45deg' }], marginRight: 6 }} />
                      <Text style={styles.startNavBtnText}>START TURN-BY-TURN NAVIGATION</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* HORIZONTAL RECOMMENDED HUBS */}
          <View style={styles.suggestionSection}>
            <View style={styles.suggestionSectionHeader}>
              <Text style={styles.sectionHeadingText}>
                {destinationRoute ? 'TOP 5 ON-ROUTE CHARGING STOPS' : 'TOP 5 NEARBY RECOMMENDATIONS'}
              </Text>
              <Text style={styles.sectionHeadingSub}>
                {destinationRoute ? 'Within 5km of Route' : '5 Closest Stations'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSuggestionsScroll}
            >
              {suggestionsList.map((item: any) => {
                const isSelected = selectedHub === item.stationId;
                const IconComponent = item.icon;

                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      if (item.stationId) setSelectedHub(item.stationId);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.suggestionCard,
                      isSelected && styles.suggestionCardSelected,
                    ]}
                  >
                    <View style={styles.suggestionCardInner}>
                      {/* Top Badge & Icon */}
                      <View style={styles.suggestionCardTop}>
                        <View style={[styles.suggestionIconBg, { borderColor: item.iconColor === '#FBBF24' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(0, 242, 254, 0.25)' }]}>
                          <IconComponent size={13} color={item.iconColor || '#00F2FE'} />
                        </View>
                        <View style={styles.suggestionBadge}>
                          <Text style={styles.suggestionBadgeText}>{item.badge}</Text>
                        </View>
                      </View>

                      {/* Main Title & Info */}
                      <Text style={styles.suggestionCardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.suggestionCardSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>

                      {/* ETA & Distance Footer */}
                      <View style={styles.suggestionCardFooter}>
                        <View style={styles.etaChip}>
                          <Clock size={10} color="#00F2FE" style={{ marginRight: 3 }} />
                          <Text style={styles.etaChipText}>{item.eta}</Text>
                        </View>
                        <Text style={styles.distChipText}>{item.distance}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* VERTICAL STATION LIST */}
          <View style={styles.stationsListSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeadingText}>
                {destinationRoute
                  ? `POWER STATIONS WITHIN 5 KM CORRIDOR (${onRouteCorridorStations.length})`
                  : 'TOP 10 NEARBY POWER STATIONS'}
              </Text>
              <TouchableOpacity onPress={() => startLocationTracking()} style={styles.syncButton}>
                <Text style={styles.syncButtonText}>Live Sync</Text>
              </TouchableOpacity>
            </View>

            {displayedStations.length > 0 ? (
              displayedStations.map((station: any, index: number) => {
                const isSelected = selectedHub === station.id;
                const isNearest = index === 0 && station.distance < 10;
                const isCorridor = destinationRoute && typeof station.distanceToRoute === 'number';
                const travelTime = Math.max(1, Math.round(station.distance * 1.8));

                return (
                  <TouchableOpacity
                    key={station.id}
                    onPress={() => setSelectedHub(station.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.stationCard,
                      isSelected && styles.stationCardSelected,
                    ]}
                  >
                    {/* Left Icon */}
                    <View
                      style={[
                        styles.stationBadgeBg,
                        isSelected && styles.stationBadgeBgSelected,
                      ]}
                    >
                      <Zap size={15} color="#FBBF24" />
                    </View>

                    {/* Middle Info */}
                    <View style={styles.stationInfoBlock}>
                      <View style={styles.stationNameRow}>
                        <Text
                          style={[styles.stationTitle, isSelected && styles.stationTitleSelected]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {station.name}
                        </Text>
                        {isCorridor ? (
                          <View style={styles.corridorBadge}>
                            <Text style={styles.corridorBadgeText}>⚡ {station.distanceToRoute.toFixed(1)} km detour</Text>
                          </View>
                        ) : station.city ? (
                          <View style={styles.stationCityBadge}>
                            <Text style={styles.stationCityBadgeText}>{station.city.toUpperCase()}</Text>
                          </View>
                        ) : null}
                        {isNearest && !isCorridor && (
                          <View style={styles.nearestPill}>
                            <Text style={styles.nearestPillText}>NEAREST</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.stationAddressText} numberOfLines={1}>
                        {station.address}
                      </Text>
                      <View style={styles.stationMetaRow}>
                        <Text style={styles.stationDistanceText}>
                          {isCorridor
                            ? `At Km ${Math.round(station.progressKm)} • ${station.distanceToRoute.toFixed(1)} km off route`
                            : `${station.distance.toFixed(1)} km • ~${travelTime} min`}
                        </Text>
                        <Text style={styles.stationPortsText}>
                          {station.availablePorts} ports open
                        </Text>
                      </View>
                    </View>

                    {/* Right Action */}
                    <View style={styles.stationActionBlock}>
                      <View style={styles.stationSpeedPill}>
                        <Text style={styles.speedKWText}>
                          {station.power} kW
                        </Text>
                        <Text style={styles.speedConnectorText}>{station.connectorType}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedHub(station.id);
                          handleNavigate(station.latitude, station.longitude);
                        }}
                        style={[
                          styles.navigateDirectBtn,
                          isSelected && styles.navigateDirectBtnSelected,
                        ]}
                        activeOpacity={0.75}
                      >
                        <Navigation
                          size={11}
                          color={isSelected ? '#080C14' : '#00F2FE'}
                          style={{ marginRight: 3, transform: [{ rotate: '45deg' }] }}
                        />
                        <Text
                          style={[
                            styles.navigateDirectText,
                            isSelected && styles.navigateDirectTextSelected,
                          ]}
                        >
                          NAV
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noStationsBox}>
                <Text style={styles.noStationsText}>
                  {destinationRoute
                    ? 'No power stations found within 5 km of this route corridor. Try selecting a nearby waypoint.'
                    : 'No charging stations found in current vicinity.'}
                </Text>
              </View>
            )}

            {destinationRoute && onRouteCorridorStations.length > 10 && (
              <View style={styles.listCappedNotice}>
                <Text style={styles.listCappedNoticeText}>
                  Showing top 10 on-route stations along your corridor • Fast optimized view
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* FLOATING AI ASSISTANT BUTTON */}
        <Animated.View
          style={[
            styles.floatingAiButtonContainer,
            { transform: [{ scale: aiPulseAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => setIsAiModalVisible(true)}
            activeOpacity={0.85}
            style={styles.floatingAiButton}
          >
            <Bot size={17} color="#080C14" />
            <Text style={styles.floatingAiText}>Ask NaviAI</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* AI EV ASSISTANT MODAL */}
      <AIAssistantModal
        visible={isAiModalVisible}
        onClose={() => setIsAiModalVisible(false)}
        evInfo={evInfo}
        userCoords={userCoords}
        nearbyStations={stations}
        onSelectStation={(stationId) => {
          setSelectedHub(stationId);
        }}
        onNavigateStation={(lat, lng) => {
          handleNavigate(lat, lng);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  mapViewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#080C14',
  },
  mapLoadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarScanningRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.15)',
  },
  radarText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 14,
  },

  // Floating Map Controls (Top-Right: Profile, Satellite/Dark, GPS)
  floatingMapControlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52,
    right: 16,
    zIndex: 25,
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
  floatingMapControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B111E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingMapControlBtnActive: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },

  // Floating Quick Route Card (Peek mode)
  floatingQuickRouteCard: {
    position: 'absolute',
    bottom: SHEET_PEEK_HEIGHT + 12,
    left: 14,
    right: 14,
    backgroundColor: '#0B111E',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  quickRouteInfo: {
    flex: 1,
    marginRight: 10,
  },
  quickRouteName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  quickRouteMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  quickRouteNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  quickRouteNavText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080C14',
    marginLeft: 3,
  },

  // Minimalist Premium Bottom Sheet
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 30,
    backgroundColor: '#0A0F1D',
  },
  sheetHandleArea: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  sheetGrabberBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  sheetHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  stationCountBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  stationCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00F2FE',
  },
  snapIndicatorPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Minimalist Search Bar
  searchBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#111728',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    height: '100%',
  },
  filterButton: {
    padding: 6,
  },

  // City Pills Carousel
  cityPillsContainer: {
    marginBottom: 12,
  },
  cityPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10172A',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cityPillActive: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },
  cityPillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  cityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  cityPillTextActive: {
    color: '#080C14',
    fontWeight: '800',
  },

  // Sheet Scroll Content
  sheetScrollContent: {
    paddingBottom: 90,
  },

  // Horizontal Recommended Hubs
  suggestionSection: {
    marginBottom: 14,
  },
  suggestionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeadingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionHeadingSub: {
    fontSize: 10,
    color: '#00F2FE',
    fontWeight: '500',
  },
  horizontalSuggestionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  suggestionCard: {
    width: SCREEN_WIDTH * 0.44,
    borderRadius: 14,
    backgroundColor: '#10172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  suggestionCardSelected: {
    borderColor: '#00F2FE',
    borderWidth: 1.5,
  },
  suggestionCardInner: {
    padding: 11,
  },
  suggestionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B111E',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  suggestionBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  suggestionCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  suggestionCardSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  suggestionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  etaChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00F2FE',
  },
  distChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Vertical Stations Section
  stationsListSection: {
    paddingHorizontal: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  syncButton: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  syncButtonText: {
    color: '#00F2FE',
    fontSize: 9,
    fontWeight: '600',
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#10172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  stationCardSelected: {
    borderColor: '#00F2FE',
    borderWidth: 1.5,
    backgroundColor: '#121B30',
  },
  stationBadgeBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0B111E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stationBadgeBgSelected: {
    borderColor: 'rgba(0, 242, 254, 0.4)',
  },
  stationInfoBlock: {
    flex: 1,
  },
  stationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  stationTitleSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stationCityBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 242, 254, 0.35)',
  },
  stationCityBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.3,
  },
  nearestPill: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  nearestPillText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.3,
  },
  stationAddressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  stationDistanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stationPortsText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  stationActionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  stationSpeedPill: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  speedKWText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00F2FE',
  },
  speedConnectorText: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  navigateDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00F2FE',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  navigateDirectBtnSelected: {
    backgroundColor: '#00F2FE',
  },
  navigateDirectText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: '#00F2FE',
  },
  navigateDirectTextSelected: {
    color: '#080C14',
  },
  noStationsBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noStationsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },

  // Optimized EV Route Intelligence Section
  optimizedRouteSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  optimizedRouteCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  optimizedRouteGradient: {
    padding: 14,
  },
  optimizedRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optimizedRouteTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimizedPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F2FE',
    marginRight: 6,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  optimizedRouteHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.8,
  },
  fastestPathBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  fastestPathBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.4,
  },
  optimizedTargetName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  optimizedTargetAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#080C14',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  routeMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  routeMetricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 3,
  },
  routeMetricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  routeMetricValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  routeMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  startNavBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startNavBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  startNavBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080C14',
    letterSpacing: 0.5,
  },

  // List Capped Notice
  listCappedNotice: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  listCappedNoticeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },

  // Floating AI Button
  floatingAiButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    zIndex: 999,
  },
  floatingAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F2FE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingAiText: {
    color: '#080C14',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginLeft: 6,
  },

  // Trip Route Corridor Styles
  tripRoutePathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080C14',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tripRouteOriginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tripRouteArrow: {
    fontSize: 11,
    color: '#00F2FE',
    marginHorizontal: 8,
  },
  tripRouteDestText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    flex: 1,
  },
  tripActionRow: {
    flexDirection: 'column',
    gap: 8,
  },
  clearTripBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearTripBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  corridorBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 242, 254, 0.35)',
  },
  corridorBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.3,
  },
});
