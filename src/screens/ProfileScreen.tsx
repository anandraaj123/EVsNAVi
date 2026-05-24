import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Calendar,
  Award,
  Car,
  Zap,
  Cable,
  LogOut,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react-native';
import { auth } from '../config/firebase';
import { signOut } from '@firebase/auth';
import { EVInfo } from './EVSetupScreen';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onBack: () => void;
  onLogoutSuccess: () => void;
  onCustomizeEV: () => void;
  evInfo?: EVInfo;
}

export default function ProfileScreen({ onBack, onLogoutSuccess, onCustomizeEV, evInfo }: ProfileScreenProps) {
  const userEmail = auth.currentUser?.email || 'ev.pilot@evsnavi.com';
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogoutSuccess();
    } catch (error) {
      console.error('[ProfileScreen] Error signing out:', error);
      onLogoutSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

      {/* Screen Mesh Gradients */}
      <LinearGradient
        colors={['#060B18', '#0D1527', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Notch Optimization SafeArea top spacing */}
      <SafeAreaSpacing />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER PROFILE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Avatar Profile Hero */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarGlowRing}>
              <View style={styles.avatarBadge}>
                <User size={40} color="#00F2FE" />
              </View>
            </View>
            <Text style={styles.pilotName}>EV Pilot Status</Text>
            <View style={styles.pilotLevelBadge}>
              <Award size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.pilotLevelText}>Eco Leader Level 4</Text>
            </View>
          </View>

          {/* 1. USER INFO SECTION */}
          <Text style={styles.sectionLabel}>USER INFO</Text>
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
            style={styles.card}
          >
            <View style={styles.infoRow}>
              <Mail size={18} color="#00F2FE" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.infoValue}>{userEmail}</Text>
              </View>
            </View>

            <View style={styles.infoRowDivider} />

            <View style={styles.infoRow}>
              <Award size={18} color="#00F2FE" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>MEMBERSHIP CLASS</Text>
                <Text style={styles.infoValue}>Premium Route Explorer</Text>
              </View>
            </View>

            <View style={styles.infoRowDivider} />

            <View style={styles.infoRow}>
              <Calendar size={18} color="#00F2FE" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>PILOT SINCE</Text>
                <Text style={styles.infoValue}>May 2026</Text>
              </View>
            </View>
          </LinearGradient>

          {/* 2. VEHICLE CARD SECTION */}
          <Text style={styles.sectionLabel}>VEHICLE SPECIFICATIONS</Text>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.08)', 'rgba(0, 242, 254, 0.04)']}
            style={styles.vehicleCard}
          >
            <View style={styles.vehicleHeader}>
              <Car size={24} color="#10B981" />
              <Text style={styles.vehicleTitle}>
                {evInfo ? `${evInfo.brand.toUpperCase()} ${evInfo.model.toUpperCase()}` : 'TATA NEXON EV'}
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onCustomizeEV} activeOpacity={0.7} style={styles.customizeButton}>
                <Text style={styles.customizeButtonText}>EDIT EV</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleSpecsRow}>
              <View style={styles.specItem}>
                <Cable size={16} color="#00F2FE" style={{ marginBottom: 4 }} />
                <Text style={styles.specLabel}>PORT TYPE</Text>
                <Text style={styles.specValue}>{evInfo ? evInfo.connector : 'CCS2'}</Text>
              </View>

              <View style={styles.specVerticalDivider} />

              <View style={styles.specItem}>
                <Zap size={16} color="#00F2FE" style={{ marginBottom: 4 }} />
                <Text style={styles.specLabel}>CHARGING</Text>
                <Text style={styles.specValue}>{evInfo ? evInfo.charging.split(' ')[0] : 'DC'} Fast</Text>
              </View>

              <View style={styles.specVerticalDivider} />

              <View style={styles.specItem}>
                <Award size={16} color="#00F2FE" style={{ marginBottom: 4 }} />
                <Text style={styles.specLabel}>BATTERY</Text>
                <Text style={styles.specValue}>{evInfo ? evInfo.battery : 14}% Left</Text>
              </View>
            </View>
          </LinearGradient>



          {/* 4. LOGOUT BUTTON */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={styles.logoutButtonWrapper}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutButton}
            >
              <LogOut size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>SECURE SIGN OUT</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Copyright Text */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>© 2026 Application By Anand Raj</Text>
            <Text style={styles.footerSubtext}>All Rights Reserved</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Notch spacer padding component
function SafeAreaSpacing() {
  return (
    <View
      style={{
        height: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight || 24,
        backgroundColor: 'transparent',
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B18',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 25,
  },
  avatarGlowRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    marginBottom: 16,
  },
  avatarBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilotName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pilotLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  pilotLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    gap: 15,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  vehicleCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 20,
    marginBottom: 10,
    backgroundColor: '#090E1A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  customizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  customizeButtonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: 0.5,
  },
  vehicleSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 16,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  specVerticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  logoutButtonWrapper: {
    marginTop: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  logoutButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    marginBottom: 10,
    paddingBottom: 20,
  },
  footerText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerSubtext: {
    color: '#334155',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
});
