import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { 
  checkBiometricAvailability, 
  authenticateWithBiometrics, 
  checkIfBiometricsEnrolled,
  getBiometricTypeDisplay 
} from '../../lib/biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRICS_ENABLED_KEY = '@hommie_biometrics_enabled';

export default function BiometricsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadSettings();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const { available, biometricType: type } = await checkBiometricAvailability();
      setIsAvailable(available);
      setBiometricType(type);
    } catch (error) {
      console.error('Error checking biometric support:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY);
      setBiometricsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  };

  const saveSettings = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, enabled.toString());
      setBiometricsEnabled(enabled);
    } catch (error) {
      console.error('Error saving biometric settings:', error);
      Alert.alert('Error', 'Failed to save biometric settings');
    }
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (!enabled) {
      // Disabling biometrics - no authentication needed
      await saveSettings(false);
      return;
    }

    // Enabling biometrics - require authentication first
    if (!isAvailable || !biometricType) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }

    const isEnrolled = await checkIfBiometricsEnrolled();
    if (!isEnrolled) {
      Alert.alert(
        'Not Enrolled', 
        `Please set up ${getBiometricTypeDisplay(biometricType)} in your device settings first.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateWithBiometrics(
        `Enable ${getBiometricTypeDisplay(biometricType)} for Hommie`
      );

      if (result.success) {
        await saveSettings(true);
        Alert.alert(
          'Success', 
          `${getBiometricTypeDisplay(biometricType)} has been enabled for Hommie`
        );
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable biometrics');
    } finally {
      setIsLoading(false);
    }
  };

  const testBiometrics = async () => {
    if (!isAvailable || !biometricType) {
      Alert.alert('Not Available', 'Biometric authentication is not available');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateWithBiometrics(
        `Test ${getBiometricTypeDisplay(biometricType)}`
      );

      if (result.success) {
        Alert.alert('Success', `${getBiometricTypeDisplay(biometricType)} is working correctly!`);
      } else {
        Alert.alert('Failed', result.error || 'Authentication failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test biometrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAvailability) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Biometric Authentication</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking biometric support...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Biometric Authentication</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!isAvailable ? (
          <View style={styles.notAvailableContainer}>
            <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
            <Text style={styles.notAvailableTitle}>Biometrics Not Available</Text>
            <Text style={styles.notAvailableText}>
              Your device doesn't support biometric authentication or it's not properly configured.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#00C853" />
                <Text style={styles.infoTitle}>Biometrics Available</Text>
              </View>
              <Text style={styles.infoText}>
                Your device supports {getBiometricTypeDisplay(biometricType || 'biometric')}.
                You can enable it for faster and more secure access to Hommie.
              </Text>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <View style={styles.settingLeft}>
                  <Ionicons name="finger-print-outline" size={24} color="#0066FF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>
                      Enable {getBiometricTypeDisplay(biometricType || 'Biometrics')}
                    </Text>
                    <Text style={styles.settingDescription}>
                      Use {getBiometricTypeDisplay(biometricType || 'biometrics')} instead of password for quick access
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={isLoading}
                  trackColor={{ false: '#E0E0E0', true: '#C5E1A5' }}
                  thumbColor={biometricsEnabled ? '#00C853' : '#FFF'}
                />
              </View>
            </View>

            {biometricsEnabled && (
              <TouchableOpacity style={styles.testButton} onPress={testBiometrics} disabled={isLoading}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0066FF" />
                <Text style={styles.testButtonText}>Test Biometrics</Text>
                {isLoading && <Ionicons name="refresh" size={20} color="#666" />}
              </TouchableOpacity>
            )}

            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>Benefits of Biometric Authentication</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="speedometer-outline" size={20} color="#0066FF" />
                <Text style={styles.benefitText}>Faster access to your account</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-outline" size={20} color="#0066FF" />
                <Text style={styles.benefitText}>Enhanced security with unique biometrics</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="key-outline" size={20} color="#0066FF" />
                <Text style={styles.benefitText}>No need to remember passwords</Text>
              </View>
            </View>

            <View style={styles.securityNote}>
              <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
              <Text style={styles.securityNoteText}>
                Biometric data is stored securely on your device and is never shared with our servers.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  notAvailableContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  notAvailableText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  benefitsCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  securityNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
});
