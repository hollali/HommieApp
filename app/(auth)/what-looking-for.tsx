import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WhatLookingForScreen() {
  const [selected, setSelected] = useState<'buy' | 'rent' | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selected) {
      router.push('/(auth)/where-looking');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/where-looking');
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <View style={[styles.signalBar, styles.signalBar1]} />
          <View style={[styles.signalBar, styles.signalBar2]} />
          <View style={[styles.signalBar, styles.signalBar3]} />
          <View style={styles.wifiIcon} />
          <View style={styles.batteryIcon} />
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>1/5</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '20%' }]} />
          <View style={styles.progressEmpty} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What are you looking for ?</Text>
        <Text style={styles.subtitle}>
          We'll start with these listings, you can change them later.
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCircle, selected === 'buy' && styles.optionCircleSelected]}
            onPress={() => setSelected('buy')}
          >
            <Text style={[styles.optionText, selected === 'buy' && styles.optionTextSelected]}>
              Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCircle, selected === 'rent' && styles.optionCircleSelected]}
            onPress={() => setSelected('rent')}
          >
            <Text style={[styles.optionText, selected === 'rent' && styles.optionTextSelected]}>
              Rent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  statusTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBar: {
    width: 4,
    backgroundColor: '#000',
    marginLeft: 2,
  },
  signalBar1: { height: 4 },
  signalBar2: { height: 6 },
  signalBar3: { height: 8 },
  wifiIcon: {
    width: 16,
    height: 12,
    backgroundColor: '#000',
    marginLeft: 4,
    borderRadius: 2,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 2,
    marginLeft: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  progressEmpty: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 40,
  },
  optionCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#0066FF',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleSelected: {
    backgroundColor: '#0066FF',
  },
  optionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0066FF',
  },
  optionTextSelected: {
    color: '#FFF',
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  skipButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
});

