import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@hommie:onboarding-complete';

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const logoWidth = width * 0.6;
  const logoHeight = height * 0.3;
  const hWidth = logoWidth * 0.18;
  const [revealWidth] = useState(new Animated.Value(hWidth));
  const [hScale] = useState(new Animated.Value(0.6));

  useEffect(() => {
    let cancelled = false;
    let timer: NodeJS.Timeout | undefined;

    // Animate logo in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();

    // Netflix-style: H zooms in, then rest reveals
    Animated.sequence([
      Animated.timing(hScale, {
        toValue: 1.15,
        duration: 450,
        delay: 150,
        useNativeDriver: false,
      }),
      Animated.timing(hScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(revealWidth, {
        toValue: logoWidth,
        duration: 700,
        useNativeDriver: false,
      }),
    ]).start();

    // Navigate after showing splash for 2.5 seconds
    timer = setTimeout(async () => {
      if (cancelled) return;
      if (!loading) {
        if (session) {
          router.replace('/(tabs)/home');
          return;
        }
        // Route groups like "(auth)" are not part of the URL path in Expo Router
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_KEY);
        router.replace(onboardingComplete ? '/login' : '/onboarding');
      }
    }, 2500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animation refs intentionally excluded
  }, [loading, session, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4560F7', '#6B7FFF', '#4560F7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.logoReveal,
                  { width: revealWidth, transform: [{ scale: hScale }] },
                ]}
              >
                <Image
                  source={require('../assets/splash.png')}
                  style={[styles.logo, { width: logoWidth, height: logoHeight }]}
                  contentFit="contain"
                />
              </Animated.View>
            </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoReveal: {
    overflow: 'hidden',
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
  },
});
