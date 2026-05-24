import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Car,
  Zap,
  BatteryCharging,
  Cpu,
  Navigation,
  Check,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Data for EV brands and models
interface EVModel {
  name: string;
  defaultConnector: string;
  defaultCharging: string;
  fullRangeKm: number;
}

const EV_BRANDS: Record<string, EVModel[]> = {
  'Tata': [
    { name: 'Nexon EV', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 228 },
    { name: 'Punch EV', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 325 },
    { name: 'Tiago EV', defaultConnector: 'CCS2', defaultCharging: 'AC Fast Charging', fullRangeKm: 250 },
    { name: 'Tigor EV', defaultConnector: 'CCS2', defaultCharging: 'AC Normal', fullRangeKm: 210 },
  ],
  'MG': [
    { name: 'ZS EV', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 461 },
    { name: 'Comet EV', defaultConnector: 'Type 2', defaultCharging: 'AC Normal', fullRangeKm: 230 },
  ],
  'Hyundai': [
    { name: 'Ioniq 5', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 631 },
    { name: 'Kona Electric', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 452 },
  ],
  'BYD': [
    { name: 'Atto 3', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 521 },
    { name: 'E6', defaultConnector: 'CCS2', defaultCharging: 'AC Fast Charging', fullRangeKm: 415 },
  ],
  'Tesla': [
    { name: 'Model 3', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 491 },
    { name: 'Model Y', defaultConnector: 'CCS2', defaultCharging: 'DC Fast Charging', fullRangeKm: 510 },
  ]
};

const CONNECTOR_TYPES = ['CCS2', 'Type 2', 'GB/T', 'CHAdeMO'];
const CHARGING_MODES = ['DC Fast Charging', 'AC Fast Charging', 'AC Normal'];

export interface EVInfo {
  brand: string;
  model: string;
  connector: string;
  charging: string;
  battery: number;
  rangeLeft: number;
}

interface EVSetupScreenProps {
  onSetupComplete: (evInfo: EVInfo) => void;
}

export default function EVSetupScreen({ onSetupComplete }: EVSetupScreenProps) {
  const [selectedBrand, setSelectedBrand] = useState('Tata');
  const [selectedModel, setSelectedModel] = useState('Nexon EV');
  const [selectedConnector, setSelectedConnector] = useState('CCS2');
  const [selectedCharging, setSelectedCharging] = useState('DC Fast Charging');
  const [batteryValue, setBatteryValue] = useState('14'); // Default 14%
  const [rangeKm, setRangeKm] = useState('32'); // Default 32km

  // Search/Diagnostics State
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scanRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Update model details dynamically when brand or model changes
  useEffect(() => {
    const models = EV_BRANDS[selectedBrand];
    if (models && models.length > 0) {
      // Find model or fallback to first
      const matched = models.find(m => m.name === selectedModel) || models[0];
      setSelectedModel(matched.name);
      setSelectedConnector(matched.defaultConnector);
      setSelectedCharging(matched.defaultCharging);

      // Auto-calculate range based on battery %
      const batteryNum = parseFloat(batteryValue) || 0;
      const calculatedRange = Math.round((matched.fullRangeKm * batteryNum) / 100);
      setRangeKm(calculatedRange.toString());
    }
  }, [selectedBrand]);

  // Recalculate range when battery % changes manually
  const handleBatteryChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = Math.min(100, Math.max(0, parseInt(cleaned) || 0));
    setBatteryValue(num.toString());

    // Update range based on new battery %
    const models = EV_BRANDS[selectedBrand];
    const currentModel = models.find(m => m.name === selectedModel) || models[0];
    const calculatedRange = Math.round((currentModel.fullRangeKm * num) / 100);
    setRangeKm(calculatedRange.toString());
  };

  const handleRangeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setRangeKm(cleaned);
  };

  // Starts the telemetry search animations
  const triggerTelemetrySearch = () => {
    setIsSearching(true);
    setSearchStep(0);

    // Start rotating radar animation
    Animated.loop(
      Animated.timing(scanRotation, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse pulseAnim
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Step 1: Scan Grid
    setTimeout(() => setSearchStep(1), 1000);
    // Step 2: Compatibility filter
    setTimeout(() => setSearchStep(2), 2200);
    // Step 4: Real-time availability (skip step 3)
    setTimeout(() => setSearchStep(4), 3400);
    // Step 5: Finished / Display output
    setTimeout(() => setSearchStep(5), 4600);
  };

  const finalizeSetup = () => {
    const finalEvInfo: EVInfo = {
      brand: selectedBrand,
      model: selectedModel,
      connector: selectedConnector,
      charging: selectedCharging,
      battery: parseInt(batteryValue) || 14,
      rangeLeft: parseInt(rangeKm) || 32,
    };
    onSetupComplete(finalEvInfo);
  };

  const spin = scanRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Screen Mesh Gradients */}
      <LinearGradient
        colors={['#060B18', '#0D1527', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      {!isSearching ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Header Title */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Car size={30} color="#00F2FE" />
              </View>
              <Text style={styles.title}>EV PROFILE SETUP</Text>
              <Text style={styles.subtitle}>Calibrate your vehicle telemetry for optimized route charging</Text>
            </View>

            <View style={styles.form}>
              
              {/* BRAND SELECTION */}
              <Text style={styles.inputLabel}>VEHICLE BRAND</Text>
              <View style={styles.brandContainer}>
                {Object.keys(EV_BRANDS).map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedBrand(brand);
                      setSelectedModel(EV_BRANDS[brand][0].name);
                    }}
                    style={[
                      styles.brandButton,
                      selectedBrand === brand && styles.brandButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.brandButtonText,
                      selectedBrand === brand && styles.brandButtonTextActive
                    ]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* MODEL SELECTION */}
              <Text style={styles.inputLabel}>EV MODEL</Text>
              <View style={styles.brandContainer}>
                {EV_BRANDS[selectedBrand]?.map((model) => (
                  <TouchableOpacity
                    key={model.name}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedModel(model.name);
                      setSelectedConnector(model.defaultConnector);
                      setSelectedCharging(model.defaultCharging);
                      const batteryNum = parseFloat(batteryValue) || 0;
                      const calculatedRange = Math.round((model.fullRangeKm * batteryNum) / 100);
                      setRangeKm(calculatedRange.toString());
                    }}
                    style={[
                      styles.modelButton,
                      selectedModel === model.name && styles.modelButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.modelButtonText,
                      selectedModel === model.name && styles.modelButtonTextActive
                    ]}>
                      {model.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CONNECTOR & CHARGING TYPE */}
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>CONNECTOR</Text>
                  <View style={styles.dropdownFake}>
                    <Text style={styles.dropdownFakeText}>{selectedConnector}</Text>
                  </View>
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>CHARGING SPEED</Text>
                  <View style={styles.dropdownFake}>
                    <Text style={styles.dropdownFakeText}>{selectedCharging.split(' ')[0]} Fast</Text>
                  </View>
                </View>
              </View>



              {/* Submit CTA */}
              <TouchableOpacity
                onPress={triggerTelemetrySearch}
                activeOpacity={0.85}
                style={styles.submitButtonWrapper}
              >
                <LinearGradient
                  colors={['#00F2FE', '#4FACFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>CONNECT VEHICLE TELEMETRY</Text>
                  <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </Animated.View>
        </ScrollView>
      ) : (
        /* TELEMETRY SEARCHING STAGE */
        <View style={styles.searchingContainer}>
          {searchStep < 5 ? (
            /* PHASE 1-4: Scanning & Checking */
            <View style={styles.scanningBody}>
              <View style={styles.radarWrapper}>
                {/* Rotating scanner */}
                <Animated.View style={[styles.radarScanLine, { transform: [{ rotate: spin }] }]} />
                {/* Inner glowing pulsing orb */}
                <Animated.View style={[styles.radarCenter, { transform: [{ scale: pulseAnim }] }]}>
                  <Cpu size={32} color="#00F2FE" />
                </Animated.View>
              </View>

              <Text style={styles.scanningHeader}>GRID CALIBRATION IN PROGRESS</Text>
              <Text style={styles.scanningSubtitle}>Matching your {selectedBrand} {selectedModel} with ideal charger grids...</Text>

              {/* Diagnostic console ticks */}
              <View style={styles.diagnosticsConsole}>
                {/* Tick 1: Scanning Grid */}
                <View style={styles.diagRow}>
                  <View style={[styles.statusDot, searchStep >= 1 && styles.statusDotActive]}>
                    {searchStep >= 1 ? <Check size={10} color="#060B18" /> : null}
                  </View>
                  <Text style={[styles.diagText, searchStep >= 1 && styles.diagTextCompleted]}>
                    {searchStep >= 1 ? '[OK] Scanning regional power grids...' : 'Analyzing regional grids...'}
                  </Text>
                </View>

                {/* Tick 2: Filter connector compatibility */}
                <View style={styles.diagRow}>
                  <View style={[styles.statusDot, searchStep >= 2 && styles.statusDotActive]}>
                    {searchStep >= 2 ? <Check size={10} color="#060B18" /> : null}
                  </View>
                  <Text style={[styles.diagText, searchStep >= 2 && styles.diagTextCompleted]}>
                    {searchStep >= 2 ? `[OK] Locked target: ${selectedConnector} Compatible` : `Verifying ${selectedConnector} socket pins...`}
                  </Text>
                </View>


                {/* Tick 4: Active Stations only */}
                <View style={styles.diagRow}>
                  <View style={[styles.statusDot, searchStep >= 4 && styles.statusDotActive]}>
                    {searchStep >= 4 ? <Check size={10} color="#060B18" /> : null}
                  </View>
                  <Text style={[styles.diagText, searchStep >= 4 && styles.diagTextCompleted]}>
                    {searchStep >= 4 ? '[OK] Isolated active, available stations' : 'Checking live hub occupation status...'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* PHASE 5: Results Found banner! */
            <View style={styles.successScreen}>
              <View style={styles.successBadge}>
                <ShieldCheck size={56} color="#10B981" />
              </View>

              <Text style={styles.successTitle}>BEST COMPATIBLE CHARGER FOUND</Text>
              <Text style={styles.successSubtitle}>An optimal fast charger has been identified within your battery limits.</Text>

              {/* Match Card */}
              <View style={styles.matchCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.08)', 'rgba(0, 242, 254, 0.04)']}
                  style={styles.matchCardGradient}
                >
                  <View style={styles.matchHeader}>
                    <MapPin size={22} color="#10B981" />
                    <View style={styles.matchMeta}>
                      <Text style={styles.stationName}>Tata Power EZ Grid Hub - Sector 62</Text>
                      <Text style={styles.stationDistance}>2.8 km away • Available Now</Text>
                    </View>
                  </View>

                  <View style={styles.matchStatsRow}>
                    <View style={styles.matchStat}>
                      <Text style={styles.statLabel}>PORT TYPE</Text>
                      <Text style={styles.statValue}>{selectedConnector}</Text>
                    </View>
                    <View style={styles.matchStat}>
                      <Text style={styles.statLabel}>CHARGING SPEED</Text>
                      <Text style={styles.statValue}>60 kW DC</Text>
                    </View>
                    <View style={styles.matchStat}>
                      <Text style={styles.statLabel}>COMPATIBILITY</Text>
                      <Text style={[styles.statValue, { color: '#10B981' }]}>100% Match</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Continue to dashboard */}
              <TouchableOpacity
                onPress={finalizeSetup}
                activeOpacity={0.8}
                style={styles.dashboardButton}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dashboardButtonGradient}
                >
                  <Text style={styles.dashboardButtonText}>ENTER NAVIGATION PILOT</Text>
                  <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B18',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  brandButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0A0E1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  brandButtonActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderColor: '#00F2FE',
  },
  brandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  brandButtonTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  modelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0A0E1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modelButtonActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderColor: '#00F2FE',
  },
  modelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modelButtonTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfCol: {
    width: '48%',
  },
  dropdownFake: {
    height: 48,
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dropdownFakeText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#090E1A',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
    fontWeight: '600',
  },
  inputSuffix: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitButtonWrapper: {
    marginTop: 15,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scanningBody: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  radarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
    backgroundColor: 'rgba(6, 11, 24, 0.5)',
    position: 'relative',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  radarScanLine: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#00F2FE',
    borderTopColor: 'transparent',
  },
  radarCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  scanningHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 18,
  },
  diagnosticsConsole: {
    width: '100%',
    backgroundColor: '#090E1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 18,
    gap: 14,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotActive: {
    backgroundColor: '#00F2FE',
  },
  diagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  diagTextCompleted: {
    color: '#00F2FE',
    fontWeight: '700',
  },
  successScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  matchCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 35,
    backgroundColor: '#090E1A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  matchCardGradient: {
    padding: 20,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  matchMeta: {
    marginLeft: 12,
    flex: 1,
  },
  stationName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stationDistance: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  matchStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },
  matchStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  dashboardButton: {
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  dashboardButtonGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
