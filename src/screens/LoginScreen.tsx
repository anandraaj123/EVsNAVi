import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Navigation, Globe, ArrowLeft } from 'lucide-react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  onSignUpPress: () => void;
}

export default function LoginScreen({ onLoginSuccess, onBack, onSignUpPress }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Authenticating...');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter your EV credentials.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Securing tunnel...');

    try {
      // Real Firebase Login
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      onLoginSuccess();
    } catch (error: any) {
      setIsLoading(false);
      console.error(error);

      // Friendly Firebase errors mapping
      let errMsg = 'Authentication failed. Please verify your credentials.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errMsg = 'Invalid email address or password.';
      } else if (error.code === 'auth/user-not-found') {
        errMsg = 'No EV profile found for this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'The email address format is invalid.';
      }
      alert(errMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#060B18', '#0D1527', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Fixed Absolute Back Button (Top Left) */}
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <ArrowLeft size={20} color="#94A3B8" />
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <View style={styles.mainFormWrapper}>
            {/* Header section with brand */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Navigation size={28} color="#00F2FE" />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to navigate your green journeys</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Field */}
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  placeholder="your.ev@domain.com"
                  placeholderTextColor="#475569"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••••••"
                  placeholderTextColor="#475569"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
                style={styles.loginButtonWrapper}
              >
                <LinearGradient
                  colors={['#00F2FE', '#4FACFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {isLoading ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loaderText}>{loadingMessage}</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Navigation size={18} color="#FFFFFF" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Guest</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Globe size={18} color="#FFFFFF" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Fixed Create Account Option (Middle Bottom) */}
      <View style={styles.signUpRow}>
        <Text style={styles.signUpText}>New to EVsNAVI? </Text>
        <TouchableOpacity onPress={onSignUpPress} activeOpacity={0.7}>
          <Text style={styles.signUpLink}>Create Account</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainFormWrapper: {
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    padding: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 6,
    letterSpacing: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 1.5,
    marginBottom: 8,
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
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 6,
  },
  loginButtonWrapper: {
    marginTop: 10,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  loginButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
    marginHorizontal: 16,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 100) / 2,
    height: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  signUpRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  signUpText: {
    fontSize: 12,
    color: '#64748B',
  },
  signUpLink: {
    fontSize: 12,
    color: '#00F2FE',
    fontWeight: '700',
  },
});
