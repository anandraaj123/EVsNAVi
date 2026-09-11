import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import EVSetupScreen, { EVInfo } from './src/screens/EVSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

interface AppUser {
  uid: string;
  email: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'evSetup' | 'dashboard' | 'profile'>('splash');
  const [user, setUser] = useState<AppUser | null>({ uid: 'pilot', email: 'ev.pilot@evsnavi.com' });
  const [initializing, setInitializing] = useState(false);
  const [evInfo, setEvInfo] = useState<EVInfo | null>({
    brand: 'Tata',
    model: 'Nexon EV',
    connector: 'CCS2',
    charging: 'DC Fast Charging',
    battery: 84,
    rangeLeft: 360,
  });

  const handleFinishSplash = () => {
    setCurrentScreen('dashboard');
  };

  const handleSetupComplete = (info: EVInfo) => {
    setEvInfo(info);
    setCurrentScreen('dashboard');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogoutSuccess = () => {
    setCurrentScreen('evSetup');
  };

  const handleCustomizeEV = () => {
    setCurrentScreen('evSetup');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleFinishSplash} />
      )}
      {currentScreen === 'evSetup' && (
        <EVSetupScreen onSetupComplete={handleSetupComplete} />
      )}
      {currentScreen === 'dashboard' && (
        <DashboardScreen onProfilePress={handleGoToProfile} evInfo={evInfo || undefined} />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen
          onBack={handleBackToDashboard}
          onLogoutSuccess={handleLogoutSuccess}
          onCustomizeEV={handleCustomizeEV}
          evInfo={evInfo || undefined}
          userEmail={user?.email}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B18',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#060B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
