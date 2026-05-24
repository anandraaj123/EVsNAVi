import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Navigation, Compass, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const STATUS_MESSAGES = [
  'Initializing global charging grid...',
  'Analyzing EV battery telemetry...',
  'Calculating hyper-optimized routes...',
  'Synchronizing real-time charger status...',
  'System online. Ready to drive.'
];

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideTextAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // 1. Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(slideTextAnim, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse animations for GPS tracking circles
    const pulseLoop = () => {
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      
      Animated.parallel([
        Animated.timing(pulseAnim1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ]).start(() => pulseLoop());
    };
    pulseLoop();

    // 3. Status updates & Progress loading
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          setIsLoaded(true);
          // Fade in primary Call to Action
          Animated.parallel([
            Animated.timing(buttonFadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(buttonScaleAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            })
          ]).start();
          return 100;
        }
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Sync status text messages with progress
  useEffect(() => {
    const idx = Math.min(
      Math.floor((progress / 100) * STATUS_MESSAGES.length),
      STATUS_MESSAGES.length - 1
    );
    setStatusIndex(idx);

    // Animate local progress bar width
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleStart = () => {
    // Elegant fade out before starting
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start(() => {
      onFinish();
    });
  };

  // Pulse rings styling
  const ring1Style = {
    transform: [
      {
        scale: pulseAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.2],
        }),
      },
    ],
    opacity: pulseAnim1.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.4, 0],
    }),
  };

  const ring2Style = {
    transform: [
      {
        scale: pulseAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.8],
        }),
      },
    ],
    opacity: pulseAnim2.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.5, 0],
    }),
  };

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#060B18', '#0D1527', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* Top Floating Glow Icons */}
        <View style={styles.headerDecoration}>
          <Compass size={22} color="#00F2FE" style={styles.headerIcon} />
          <View style={styles.dividerDot} />
          <Zap size={22} color="#10B981" style={styles.headerIcon} />
          <View style={styles.dividerDot} />
          <MapPin size={22} color="#4FACFE" style={styles.headerIcon} />
        </View>

        {/* Central Logo with animated pulse rings */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.pulseRing, ring1Style]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRingInner, ring2Style]} />
          
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text Section */}
        <Animated.View style={[styles.textContainer, { transform: [{ translateY: slideTextAnim }] }]}>
          <Text style={styles.brandTitle}>NAVIGATE</Text>
          <View style={styles.appNameRow}>
            <Text style={styles.appNameLight}>YOUR </Text>
            <Text style={styles.appNameBold}>EVs</Text>
          </View>
          <Text style={styles.tagline}>
            Smart routes. Optimized charging. Green driving.
          </Text>
        </Animated.View>

        {/* Lower Loading & Action Section */}
        <View style={styles.footerContainer}>
          {!isLoaded ? (
            <View style={styles.loaderContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: animatedProgressWidth }]} />
              </View>
              
              <Text style={styles.progressPercent}>{progress}%</Text>
              
              <Text style={styles.statusText}>
                {STATUS_MESSAGES[statusIndex]}
              </Text>
            </View>
          ) : (
            <Animated.View
              style={{
                opacity: buttonFadeAnim,
                transform: [{ scale: buttonScaleAnim }],
                width: '100%',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.85}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={['#00F2FE', '#4FACFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>START EXPLORING</Text>
                  <Navigation size={18} color="#FFFFFF" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.footerNote}>Ready for green navigation</Text>
            </Animated.View>
          )}
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060B18',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.08,
    paddingHorizontal: 24,
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    opacity: 0.8,
  },
  headerIcon: {
    marginHorizontal: 10,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    opacity: 0.3,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.65,
    height: width * 0.65,
    marginVertical: height * 0.02,
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: '90%',
    height: '90%',
  },
  pulseRing: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.4)',
  },
  pulseRingInner: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 242, 254, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  appNameRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  appNameLight: {
    fontFamily: 'System',
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appNameBold: {
    fontFamily: 'System',
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  footerContainer: {
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  loaderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBg: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F2FE',
    borderRadius: 2,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  progressPercent: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: '#00F2FE',
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusText: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonWrapper: {
    width: '85%',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  footerNote: {
    fontSize: 11,
    color: '#475569',
    marginTop: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
