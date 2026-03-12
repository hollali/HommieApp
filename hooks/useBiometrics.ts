import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  checkBiometricAvailability, 
  authenticateWithBiometrics,
  getBiometricTypeDisplay 
} from '../lib/biometrics';

const BIOMETRICS_ENABLED_KEY = '@hommie_biometrics_enabled';

export interface UseBiometricsReturn {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: string | null;
  isLoading: boolean;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  checkAvailability: () => Promise<void>;
  toggleEnabled: (enabled: boolean) => Promise<void>;
}

export const useBiometrics = (): UseBiometricsReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAvailability = async () => {
    try {
      const { available, biometricType: type } = await checkBiometricAvailability();
      setIsAvailable(available);
      setBiometricType(type);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      setBiometricType(null);
    }
  };

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY);
      setIsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric settings:', error);
      setIsEnabled(false);
    }
  };

  const authenticate = async (promptMessage?: string): Promise<boolean> => {
    if (!isAvailable || !isEnabled) {
      return false;
    }

    setIsLoading(true);
    try {
      const result = await authenticateWithBiometrics(
        promptMessage || `Authenticate with ${getBiometricTypeDisplay(biometricType || 'biometrics')}`
      );
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, enabled.toString());
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error saving biometric settings:', error);
      Alert.alert('Error', 'Failed to save biometric settings');
    }
  };

  useEffect(() => {
    checkAvailability();
    loadSettings();
  }, []);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    isLoading,
    authenticate,
    checkAvailability,
    toggleEnabled,
  };
};

// Utility function for biometric protection
export const checkBiometricAuth = async (promptMessage?: string): Promise<boolean> => {
  const { authenticate, isAvailable, isEnabled } = useBiometrics();
  
  if (isAvailable && isEnabled) {
    return await authenticate(promptMessage);
  }
  return true; // Continue if biometrics not available or not enabled
};
