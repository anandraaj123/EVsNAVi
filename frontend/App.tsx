import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import EVSetupScreen, { EVInfo } from './src/screens/EVSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppUser {
  uid: string;
  email: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'signup' | 'evSetup' | 'dashboard' | 'profile'>('splash');
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [evInfo, setEvInfo] = useState<EVInfo | null>(null);

  // Validate active backend session token on app startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setUser(null);
          setCurrentScreen('splash');
          return;
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
        const response = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setCurrentScreen('dashboard');
        } else {
          // Token expired or invalid, remove it
          await AsyncStorage.removeItem('userToken');
          setUser(null);
          setCurrentScreen('login');
        }
      } catch (error) {
        console.log('Session verification error:', error);
        setUser(null);
        setCurrentScreen('login');
      } finally {
        setInitializing(false);
      }
    };

    checkSession();
  }, []);

  const handleFinishSplash = () => {
    // If user is already loaded/logged in during splash, go straight to dashboard!
    if (user) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('evSetup');
  };

  const handleSignUpSuccess = () => {
    // Redirect to EV configuration screen after successful registration
    setCurrentScreen('evSetup');
  };

  const handleSetupComplete = (info: EVInfo) => {
    setEvInfo(info);
    setCurrentScreen('dashboard');
  };

  const handleBackToSplash = () => {
    setCurrentScreen('splash');
  };

  const handleGoToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogoutSuccess = () => {
    setCurrentScreen('login');
  };

  const handleCustomizeEV = () => {
    setCurrentScreen('evSetup');
  };

  // Optionally show a premium loader during initial boot check
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F2FE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleFinishSplash} />
      )}
      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackToSplash}
          onSignUpPress={handleGoToSignUp}
        />
      )}
      {currentScreen === 'signup' && (
        <SignUpScreen
          onSignUpSuccess={handleSignUpSuccess}
          onBackToLogin={handleBackToLogin}
        />
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
