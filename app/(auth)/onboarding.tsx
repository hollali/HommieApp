import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@hommie:onboarding-complete';

const onboardingData = [
  {
    title: 'Rent Your Apartment Without The Hustle',
    description: 'Lorem ipsum dolor sit amet consectetur. Quisque pharetra metus donec ultrices dui. Sed.',
    illustration: require('../../assets/onboarding-1.png'),
  },
  {
    title: 'Discover your dream home',
    description: 'Lorem ipsum dolor sit amet consectetur. Quisque pharetra metus donec ultrices dui. Sed.',
    illustration: require('../../assets/onboarding-2.png'),
  },
  {
    title: 'Find your dream apartment now',
    description: 'Lorem ipsum dolor sit amet consectetur. Quisque pharetra metus donec ultrices dui. Sed.',
    illustration: require('../../assets/onboarding-3.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Best-effort; continue to login
    }
  };

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Route groups like "(auth)" are not part of the URL path in Expo Router
      await completeOnboarding();
      router.replace('/login');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={true}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={styles.illustrationContainer}>
              <Image
                source={item.illustration}
                style={styles.illustrationImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex < onboardingData.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton,
              currentIndex === onboardingData.length - 1 && styles.nextButtonFull,
            ]}
          >
            <Text style={styles.nextText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustrationImage: {
    width: width * 0.85,
    height: height * 0.4,
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#4560F7',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#4560F7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    marginLeft: 'auto',
    alignItems: 'center',
  },
  nextButtonFull: {
    marginLeft: 0,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

