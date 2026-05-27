import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import EVSetupScreen, { EVInfo } from './src/screens/EVSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { auth } from './src/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'signup' | 'evSetup' | 'dashboard' | 'profile'>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [evInfo, setEvInfo] = useState<EVInfo | null>(null);

  // Monitor Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
      
      // Dynamic routing based on Auth state
      if (currentUser) {
        // Route to EV setup screen if they are transitioning from login/signup,
        // otherwise let them go straight to dashboard if it was an auto-session restore
        setCurrentScreen((prev) => (prev === 'login' || prev === 'signup' ? 'evSetup' : 'dashboard'));
      } else {
        // Only divert back to login if they were not on splash
        setCurrentScreen((prev) => (prev === 'splash' ? 'splash' : 'login'));
      }
    });

    return unsubscribe;
  }, [initializing]);

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
