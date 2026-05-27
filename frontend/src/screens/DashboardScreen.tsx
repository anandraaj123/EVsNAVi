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
  SafeAreaView,
  Platform,
  Linking,
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
} from 'lucide-react-native';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

import { EVInfo } from './EVSetupScreen';

// MapLibre GL JS + OpenStreetMap CartoDB Positron Light & ESRI Satellite base template
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>EVsNAVI MapLibre Navigation</title>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; background-color: #0F172A; overflow: hidden; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
        
        /* User location pulsing glow animation */
        @keyframes pulse {
            0% { transform: scale(0.7); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 0.9; }
            100% { transform: scale(0.7); opacity: 0.6; }
        }
        
        /* Cyan User Marker styling */
        .user-marker {
            width: 14px;
            height: 14px;
            border-radius: 7px;
            background-color: #00F2FE;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 10px #00F2FE, 0 0 20px #00F2FE;
            position: relative;
        }
        .user-marker::after {
            content: '';
            position: absolute;
            top: -6px;
            left: -6px;
            width: 22px;
            height: 22px;
            border-radius: 11px;
            border: 2px solid rgba(0, 242, 254, 0.4);
            animation: pulse 2s infinite;
        }
        
        /* Emerald Fast Charger Marker styling */
        .charger-marker {
            width: 22px;
            height: 22px;
            border-radius: 11px;
            background-color: #0F172A;
            border: 2px solid #10B981;
            box-shadow: 0 0 10px #10B981;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #10B981;
            font-size: 11px;
            font-weight: bold;
        }
        .charger-marker::after {
            content: '⚡';
            font-size: 11px;
        }
        
        /* Hide attribution info button */
        .maplibregl-ctrl-attrib {
            display: none !important;
        }

        /* Style Toggle Button */
        .style-toggle {
            position: absolute;
            bottom: 16px;
            left: 16px;
            z-index: 10;
            background-color: rgba(6, 11, 24, 0.85);
            border: 1px solid rgba(0, 242, 254, 0.25);
            border-radius: 20px;
            padding: 8px 14px;
            display: flex;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transition: all 0.2s ease-in-out;
            user-select: none;
        }
        .style-toggle:active {
            transform: scale(0.95);
        }
        .style-toggle-icon {
            margin-right: 6px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .style-toggle-text {
            color: #00F2FE;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="style-toggle" id="style-toggle" onclick="toggleMapStyle()">
        <span class="style-toggle-icon" id="toggle-icon">🛰️</span>
        <span class="style-toggle-text" id="toggle-text">Satellite</span>
    </div>
    
    <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
    <script>
        let map;
        let userMarkerInstance = null;
        let activeMarkers = [];
        let stationsList = [];
        let currentStyle = 'dark'; // 'dark' or 'satellite'

        // Initialize map with default center (Noida Sector 62 fallback)
        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'carto-dark': {
                        type: 'raster',
                        tiles: [
                            'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors, © CARTO'
                    },
                    'esri-satellite': {
                        type: 'raster',
                        tiles: [
                            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        ],
                        tileSize: 256,
                        attribution: 'Tiles &copy; Esri'
                    }
                },
                layers: [
                    {
                        id: 'background-layer',
                        type: 'background',
                        paint: {
                            'background-color': '#1E293B' // Slate-800 backdrop to soften dark matter tiles
                        }
                    },
                    {
                        id: 'dark-layer',
                        type: 'raster',
                        source: 'carto-dark',
                        minzoom: 0,
                        maxzoom: 20,
                        paint: {
                            'raster-opacity': 0.72 // Blends dark tiles with slate-800 for an elegant charcoal/softer dark look
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    },
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'esri-satellite',
                        minzoom: 0,
                        maxzoom: 20,
                        layout: {
                            visibility: 'none'
                        }
                    }
                ]
            },
            center: [77.368, 28.618], 
            zoom: 13.2,
            attributionControl: false // Disable attribution control 'i' button
        });

        // Add standard navigation controls
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        let activeHubId = ''; // Active selected hub identifier

        window.selectHub = function(hubId) {
            activeHubId = hubId;
            if (!userMarkerInstance) return;
            
            const userLngLat = userMarkerInstance.getLngLat();
            const targetStation = stationsList.find(function(s) {
                return s.id === hubId;
            });
            
            if (targetStation) {
                // Fly to bounds fitting user location and station location
                const minLng = Math.min(userLngLat.lng, targetStation.longitude);
                const maxLng = Math.max(userLngLat.lng, targetStation.longitude);
                const minLat = Math.min(userLngLat.lat, targetStation.latitude);
                const maxLat = Math.max(userLngLat.lat, targetStation.latitude);

                map.fitBounds([
                    [minLng, minLat],
                    [maxLng, maxLat]
                ], {
                    padding: { top: 60, bottom: 60, left: 60, right: 60 },
                    maxZoom: 14.8,
                    duration: 1200,
                    essential: true
                });

                // Fetch route from user to station
                window.fetchRealRoute(userLngLat.lat, userLngLat.lng, targetStation.latitude, targetStation.longitude);
            }
        };

        // Switch between soft dark and satellite view
        window.toggleMapStyle = function() {
            const toggleBtn = document.getElementById('style-toggle');
            const toggleText = document.getElementById('toggle-text');
            const toggleIcon = document.getElementById('toggle-icon');
            
            if (currentStyle === 'dark') {
                // Switch to satellite
                map.setLayoutProperty('dark-layer', 'visibility', 'none');
                map.setLayoutProperty('satellite-layer', 'visibility', 'visible');
                
                toggleText.innerText = 'Dark Map';
                toggleIcon.innerText = '🗺️';
                currentStyle = 'satellite';
            } else {
                // Switch to dark
                map.setLayoutProperty('dark-layer', 'visibility', 'visible');
                map.setLayoutProperty('satellite-layer', 'visibility', 'none');
                
                toggleText.innerText = 'Satellite';
                toggleIcon.innerText = '🛰️';
                currentStyle = 'dark';
            }
        };

        // Real-time directions API query helper proxying via Backend
        window.fetchRealRoute = function(startLat, startLng, endLat, endLng) {
            const apiUrl = '__API_URL__';
            const url = apiUrl + '/route?startLat=' + startLat + '&startLng=' + startLng + '&endLat=' + endLat + '&endLng=' + endLng;

            fetch(url)
                .then(function(res) {
                    if (!res.ok) throw new Error('API returned non-ok status');
                    return res.json();
                })
                .then(function(data) {
                    if (data.coordinates) {
                        drawRouteOnMap(data.coordinates);
                    } else {
                        throw new Error('Invalid routing payload');
                    }
                })
                .catch(function(err) {
                    console.log('Route proxy fetch error:', err);
                    // Visual emergency fallback (straight path vector)
                    drawRouteOnMap([
                        [startLng, startLat],
                        [endLng, endLat]
                    ]);
                });
        };

        function drawRouteOnMap(coordinates) {
            const source = map.getSource('route');
            if (source) {
                source.setData({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                });
            } else {
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }
                });

                if (!map.getLayer('route-layer')) {
                    map.addLayer({
                        id: 'route-layer',
                        type: 'line',
                        source: 'route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#00F2FE',
                            'line-width': 4.5,
                            'line-opacity': 0.85
                        }
                    });
                }
            }
        }

        // Receive dynamic stations list from React Native
        window.updateStations = function(stations) {
            stationsList = stations;
            
            // Clear old markers
            activeMarkers.forEach(function(marker) {
                marker.remove();
            });
            activeMarkers = [];
            
            // Add new markers
            stations.forEach(function(station) {
                const el = document.createElement('div');
                el.className = 'charger-marker';
                
                // Color formatting: Fast chargers (50kW+) vs others
                const isFast = station.power >= 50;
                const markerColor = isFast ? '#10B981' : '#00F2FE';
                el.style.borderColor = markerColor;
                el.style.color = markerColor;
                el.style.boxShadow = '0 0 10px ' + markerColor;
                
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'SELECT_STATION',
                            stationId: station.id
                        }));
                    }
                });

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([station.longitude, station.latitude])
                    .addTo(map);
                    
                activeMarkers.push(marker);
            });
            
            if (activeHubId) {
                window.selectHub(activeHubId);
            }
        };

        // Dynamic update location function exposed to React Native
        window.updateLocation = function(lat, lng) {
            if (!map) return;

            // Update Pulsing User Marker
            if (userMarkerInstance) {
                userMarkerInstance.setLngLat([lng, lat]);
            } else {
                const el = document.createElement('div');
                el.className = 'user-marker';
                userMarkerInstance = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);
            }

            if (activeHubId) {
                window.selectHub(activeHubId);
            }
        };

        window.onload = function() {
            // Wait for host React Native app to inject current coordinates via window.updateLocation
        };
    </script>
</body>
</html>
`;

interface DashboardScreenProps {
  onProfilePress: () => void;
  evInfo?: EVInfo;
}

export default function DashboardScreen({ onProfilePress, evInfo }: DashboardScreenProps) {
  const batteryPct = evInfo ? evInfo.battery : 84;
  const rangeLeft = evInfo ? evInfo.rangeLeft : 360;
  const vehicleName = evInfo ? `${evInfo.brand} ${evInfo.model}` : 'Nexon EV';
  const connectorType = evInfo ? evInfo.connector : 'CCS2';  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Active selected option from suggestion list
  const [selectedHub, setSelectedHub] = useState<string>('');
  
  // GPS Location States
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const webviewRef = useRef<WebView>(null);

  // Open Charge Map API State & Helper Functionality
  interface OCMStation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    distance: number;
    power: number; // in kW
    connectorType: string;
    availablePorts: number;
  }
  
  const [stations, setStations] = useState<OCMStation[]>([]);

  const fetchNearbyStations = async (lat: number, lng: number) => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
    const url = `${apiUrl}/stations?latitude=${lat}&longitude=${lng}`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EVsNAVI-MobileApp'
        }
      });
      if (!response.ok) throw new Error('OCM API status error');
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const formatted: OCMStation[] = data.map((item: any) => {
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
          
          return {
            id: String(item.ID),
            name: addressInfo.Title || 'EV Charger',
            latitude: addressInfo.Latitude,
            longitude: addressInfo.Longitude,
            address: addressInfo.AddressLine1 || addressInfo.Town || 'Nearby Location',
            distance: addressInfo.Distance || calculateDistanceKm(lat, lng, addressInfo.Latitude, addressInfo.Longitude),
            power: Math.round(power),
            connectorType: connType,
            availablePorts: item.NumberOfPoints || 2
          };
        });
        
        formatted.sort((a, b) => a.distance - b.distance);
        setStations(formatted);
        if (formatted.length > 0) {
          setSelectedHub(formatted[0].id);
        }
      } else {
        throw new Error('No stations found');
      }
    } catch (error) {
      console.log('Open Charge Map fetch error, fallback to simulated stations:', error);
      // High fidelity simulated stations around the user's live position
      const fallbackStations: OCMStation[] = [
        {
          id: 'scenic',
          name: 'Scenic EcoRoute Hub',
          latitude: lat + 0.002,
          longitude: lng + 0.003,
          address: 'Sector 62, Noida',
          distance: calculateDistanceKm(lat, lng, lat + 0.002, lng + 0.003),
          power: 120,
          connectorType: 'CCS2',
          availablePorts: 3
        },
        {
          id: 'alpha',
          name: 'HyperCharge Station Alpha',
          latitude: lat + 0.004,
          longitude: lng - 0.005,
          address: 'Sector 63, Noida',
          distance: calculateDistanceKm(lat, lng, lat + 0.004, lng - 0.005),
          power: 150,
          connectorType: 'CCS2',
          availablePorts: 4
        },
        {
          id: 'voltgrid',
          name: 'VoltGrid Urban Hub 4',
          latitude: lat - 0.006,
          longitude: lng + 0.007,
          address: 'Indirapuram, Ghaziabad',
          distance: calculateDistanceKm(lat, lng, lat - 0.006, lng + 0.007),
          power: 50,
          connectorType: 'CCS2',
          availablePorts: 2
        }
      ];
      setStations(fallbackStations);
      setSelectedHub('scenic');
    }
  };

  // Proximity mathematical helper: Haversine distance
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
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

  // Redirect to external Google Maps application for turn-by-turn navigation
  const handleNavigate = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch(err => {
      console.log('Error opening Google Maps:', err);
    });
  };

  // Request and retrieve GPS position (optimized three-tier fast-resolve)
  const requestLocation = async () => {
    setIsGpsLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Simulated Location (GPS Denied)');
        setUserCoords({ latitude: 28.612, longitude: 77.360 }); // default Noida coordinates
        return;
      }

      // 1. Check cached last known position first (super high speed!)
      const cachedLoc = await Location.getLastKnownPositionAsync({});
      if (cachedLoc) {
        setUserCoords({
          latitude: cachedLoc.coords.latitude,
          longitude: cachedLoc.coords.longitude,
        });
        setIsGpsLoading(false);

        // 2. Fetch fresh coordinates in the background to refine accuracy
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).then((freshLoc) => {
          if (freshLoc) {
            setUserCoords({
              latitude: freshLoc.coords.latitude,
              longitude: freshLoc.coords.longitude,
            });
          }
        }).catch(e => console.log("Background location fetch bypassed:", e));

        return;
      }

      // 3. Fallback: Quick query if no cache is available
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err: any) {
      console.log('Error getting location:', err);
      setLocationError('GPS Inactive (Using Default)');
      setUserCoords({ latitude: 28.612, longitude: 77.360 });
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Inject coordinate state directly to the MapLibre WebView
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

  // Inject selected charging hub directly to WebView map layer
  useEffect(() => {
    if (webviewRef.current && selectedHub) {
      const js = `
        if (typeof window.selectHub === 'function') {
          window.selectHub('${selectedHub}');
        }
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [selectedHub]);

  useEffect(() => {
    requestLocation();
  }, []);

  // Update locations and trigger live OCM fetch
  useEffect(() => {
    if (userCoords) {
      injectGpsCoordinates(userCoords.latitude, userCoords.longitude);
      fetchNearbyStations(userCoords.latitude, userCoords.longitude);
    }
  }, [userCoords]);

  // Inject stations to WebView dynamically
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

  const handleMapLoadEnd = () => {
    const active = userCoords || { latitude: 28.612, longitude: 77.360 };
    injectGpsCoordinates(active.latitude, active.longitude);
    
    // Inject stations if available
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

    // Trigger selector on load to preserve navigation state
    if (webviewRef.current && selectedHub) {
      const js = `
        if (typeof window.selectHub === 'function') {
          window.selectHub('${selectedHub}');
        }
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#060B18', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Top Header */}
        <View style={styles.header}>
          {/* Left spacing block to balance the right-side profile button for centered title */}
          <View style={{ width: 40 }} />
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>{evInfo ? `${evInfo.brand.toUpperCase()} ${evInfo.model.toUpperCase()}` : 'ACTIVE EV PILOT'}</Text>
            <Text style={styles.headerTitle}>EVsNAVI</Text>
          </View>
          
          {/* Top-Right Profile Button */}
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7} style={styles.profileButton}>
            <User size={20} color="#00F2FE" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Search Box */}
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
            style={styles.searchHero}
          >
            <Text style={styles.searchPrompt}>Find optimal EV routes & chargers</Text>
            
            <View style={styles.searchInputContainer}>
              <Search size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Where to? Enter destination..."
                placeholderTextColor="#64748B"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.filterButton}>
                <Sliders size={16} color="#00F2FE" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickTags}>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                style={[styles.tag, activeTab === 'all' && styles.tagActive]}
              >
                <Text style={[styles.tagText, activeTab === 'all' && styles.tagTextActive]}>All Stations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('fast')}
                style={[styles.tag, activeTab === 'fast' && styles.tagActive]}
              >
                <Zap size={12} color={activeTab === 'fast' ? '#FFFFFF' : '#10B981'} style={styles.tagIcon} />
                <Text style={[styles.tagText, activeTab === 'fast' && styles.tagTextActive]}>Fast DC</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('saved')}
                style={[styles.tag, activeTab === 'saved' && styles.tagActive]}
              >
                <Text style={[styles.tagText, activeTab === 'saved' && styles.tagTextActive]}>Favorites</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Map Area */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Interactive Route Map</Text>
            {locationError && (
              <Text style={styles.locationErrorText}>{locationError}</Text>
            )}
          </View>
          
          <View style={styles.mapContainer}>
            {userCoords ? (
              <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: MAP_HTML.replace('__API_URL__', process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api') }}
                style={StyleSheet.absoluteFill}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onLoadEnd={handleMapLoadEnd}
                onMessage={(event) => {
                  try {
                    const msg = JSON.parse(event.nativeEvent.data);
                    if (msg.type === 'SELECT_STATION') {
                      setSelectedHub(msg.stationId);
                    }
                  } catch (e) {
                    console.log('WebView message error:', e);
                  }
                }}
              />
            ) : (
              <LinearGradient
                colors={['#070E1E', '#060B18']}
                style={[StyleSheet.absoluteFill, styles.mapLoadingPlaceholder]}
              >
                <View style={styles.radarScanningRing} />
                <Locate size={28} color="#00F2FE" />
                <Text style={styles.radarText}>LOCKING SATELLITE GPS...</Text>
              </LinearGradient>
            )}

            {/* Tactile Recenter/GPS Sync Button (only active after map loads) */}
            {userCoords && (
              <>
                <TouchableOpacity
                  onPress={requestLocation}
                  disabled={isGpsLoading}
                  activeOpacity={0.7}
                  style={styles.recenterButton}
                >
                  <Locate
                    size={18}
                    color={isGpsLoading ? '#64748B' : '#00F2FE'}
                  />
                </TouchableOpacity>

                {/* Pulsing Sync Ring Loader overlay */}
                {isGpsLoading && (
                  <View style={styles.mapLoaderOverlay}>
                    <View style={styles.loaderPulseRing} />
                    <Text style={styles.loaderText}>Syncing GPS...</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Charger List Section */}
          <View style={styles.chargerSectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Charging Hubs</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>

          {stations.length > 0 ? (
            stations.map((station, index) => {
              const isSelected = selectedHub === station.id;
              const isNearest = index === 0;
              const isFast = station.power >= 50;
              
              const themeColor = isFast ? '#10B981' : '#00F2FE';
              const activeButtonStyle = isFast 
                ? styles.navigatePillButtonActiveGreen 
                : styles.navigatePillButtonActiveCyan;
              
              const travelTime = Math.max(1, Math.round(station.distance * 10));

              return (
                <TouchableOpacity
                  key={station.id}
                  onPress={() => setSelectedHub(station.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isSelected 
                      ? [isFast ? 'rgba(16, 185, 129, 0.22)' : 'rgba(0, 242, 254, 0.22)', 'rgba(15, 23, 42, 0.6)'] as const
                      : ['rgba(30, 41, 59, 0.3)', 'rgba(15, 23, 42, 0.4)'] as const
                    }
                    style={[
                      styles.chargerItem,
                      isSelected
                        ? { borderColor: themeColor, borderWidth: 1.8, shadowColor: themeColor, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 }
                        : { borderColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1 }
                    ]}
                  >
                    <View style={[styles.chargerBadgeBg, { backgroundColor: isFast ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 242, 254, 0.15)' }]}>
                      {isNearest ? (
                        <Navigation size={16} color={themeColor} />
                      ) : (
                        <Zap size={16} color={themeColor} />
                      )}
                    </View>
                    <View style={styles.chargerInfo}>
                      <View style={styles.suggestedBadgeRow}>
                        <Text style={[styles.chargerName, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{station.name}</Text>
                        {isNearest && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>NEAREST</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.chargerDistance}>
                        {station.distance.toFixed(1)} km • {travelTime} mins away • {station.availablePorts}/{station.availablePorts} ports
                      </Text>
                    </View>
                    
                    {/* Right Action Area */}
                    <View style={styles.rightActionContainer}>
                      <View style={styles.chargerSpeed}>
                        <Text style={[styles.speedVal, { color: themeColor }]}>{station.power}kW</Text>
                        <Text style={styles.speedLabel}>{station.connectorType}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedHub(station.id);
                          handleNavigate(station.latitude, station.longitude);
                        }}
                        style={[
                          styles.navigatePillButton,
                          { borderColor: isFast ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 242, 254, 0.3)' },
                          isSelected && activeButtonStyle
                        ]}
                        activeOpacity={0.7}
                      >
                        <Navigation
                          size={10}
                          color={isSelected ? '#060B18' : themeColor}
                          style={{ marginRight: 4, transform: [{ rotate: '45deg' }] }}
                        />
                        <Text style={[
                          styles.navigatePillButtonText,
                          isSelected ? { color: '#060B18', fontWeight: '800' } : { color: themeColor }
                        ]}>
                          NAVIGATE
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noStationsContainer}>
              <Text style={styles.noStationsText}>Fetching live charging stations...</Text>
            </View>
          )}

        </ScrollView>
      </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B18',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00F2FE',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchHero: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#090E1A',
    borderRadius: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.15)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  filterButton: {
    padding: 6,
  },
  quickTags: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  tagActive: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#060B18',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  batteryProgressContainer: {
    marginTop: 10,
  },
  batteryProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  batterySub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  badgeText: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    color: '#00F2FE',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationErrorText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 380,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  recenterButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 11, 24, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLoaderOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 11, 24, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  loaderPulseRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F2FE',
    marginRight: 8,
    opacity: 0.8,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapGridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapGridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '70%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapGridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapGridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '70%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapRoutePath: {
    position: 'absolute',
    width: '120%',
    height: 100,
    top: '25%',
    left: '-10%',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 254, 0.5)',
    borderRadius: 50,
    transform: [{ rotate: '-15deg' }],
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  pinPulseRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00F2FE',
    opacity: 0.4,
    position: 'absolute',
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00F2FE',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  pinLabelBg: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  pinLabelText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  suggestedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  chargerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chargerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  chargerBadgeBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chargerInfo: {
    flex: 1,
  },
  chargerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chargerDistance: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  chargerSpeed: {
    alignItems: 'flex-end',
  },
  speedVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  speedLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigatePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  navigatePillButtonActiveGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  navigatePillButtonActiveCyan: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  navigatePillButtonText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapLoadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  radarScanningRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 16,
    textShadowColor: 'rgba(0, 242, 254, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  noStationsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noStationsText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
