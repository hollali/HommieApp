import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '../../hooks/useAuth';
import { addSavedPaymentMethod } from '../../lib/paymentMethods';

const PROVIDER_LOGOS = {
  mtn: { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/29/MTN-Logo.png' },
  vodafone: { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Vodafone_Logo.svg/512px-Vodafone_Logo.svg.png' },
  airtel: { uri: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Airtel_logo-01.png' },
  tigo: { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Tigo.png' },
} as const;

export default function MobileMoneySetupScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState<'mtn' | 'vodafone' | 'airteltigo' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're coming from booking flow
  const isFromBooking = !!(params.propertyId && params.date && params.time);

  const handleSave = async () => {
    if (!provider) {
      Alert.alert('Error', 'Please select a provider');
      return;
    }
    // Expect Ghana local number WITHOUT country code:
    // - typically 9 digits (e.g. 241234567)
    // - allow user to type/paste leading 0 (e.g. 0241234567) and normalize to 9 digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const normalized = digitsOnly.length === 10 && digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
    if (normalized.length !== 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // In production, save to Supabase
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isFromBooking && params.propertyId) {
        // Complete the booking process
        const { createBooking, addNotification } = await import('../../lib/mockData');
        
        // Calculate scheduled date time from params
        const scheduledDateTime = new Date();
        if (params.date && params.year && params.month) {
          scheduledDateTime.setDate(parseInt(params.date as string));
          scheduledDateTime.setFullYear(parseInt(params.year as string));
          scheduledDateTime.setMonth(parseInt(params.month as string) - 1);
        }
        if (params.time) {
          const [hours, minutes] = (params.time as string).replace(/AM|PM/i, '').split(':').map(Number);
          const isPM = (params.time as string).toUpperCase().includes('PM');
          const hour24 = isPM && hours !== 12 ? hours + 12 : !isPM && hours === 12 ? 0 : hours;
          scheduledDateTime.setHours(hour24, minutes, 0, 0);
        }

        await createBooking({
          tenant_id: user?.id || '',
          property_id: params.propertyId as string,
          scheduled_date: scheduledDateTime.toISOString(),
          status: 'pending',
        });

        // Add notifications
        const { getProperties } = await import('../../lib/mockData');
        const properties = await getProperties();
        const property = properties.find((p: any) => p.id === params.propertyId);

        if (property && user) {
          await addNotification({
            user_id: user.id,
            type: 'payment',
            title: 'Booking confirmed',
            message: `Your booking for "${property.title}" is confirmed.`,
            metadata: { property_id: property.id },
          });
          await addNotification({
            user_id: property.owner_id,
            type: 'payment',
            title: 'New booking',
            message: `A new booking was made for "${property.title}".`,
            metadata: { property_id: property.id },
          });
        }

        Alert.alert('Success', 'Mobile Money account added and booking confirmed!', [
          { text: 'OK', onPress: () => router.push('/booking/success') },
        ]);
      } else {
        // Just adding payment method - save it for future use
        await addSavedPaymentMethod({
          type: 'mobile_money',
          details: {
            provider: provider!,
            phoneNumber: normalized,
          },
          isDefault: false, // First payment method is not default by default
        });

        Alert.alert('Success', 'Mobile Money account added successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add Mobile Money account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Mobile Money</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Select Provider</Text>
          <View style={styles.providerContainer}>
            <TouchableOpacity
              style={[styles.providerCard, provider === 'mtn' && styles.providerCardSelected]}
              onPress={() => setProvider('mtn')}
            >
              <View style={styles.providerIcon}>
                <Image
                  source={PROVIDER_LOGOS.mtn}
                  style={styles.providerLogo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <Text style={styles.providerName}>MTN Mobile Money</Text>
              {provider === 'mtn' && (
                <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.providerCard, provider === 'vodafone' && styles.providerCardSelected]}
              onPress={() => setProvider('vodafone')}
            >
              <View style={styles.providerIcon}>
                <Image
                  source={PROVIDER_LOGOS.vodafone}
                  style={styles.providerLogo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <Text style={styles.providerName}>Vodafone Cash</Text>
              {provider === 'vodafone' && (
                <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.providerCard, provider === 'airteltigo' && styles.providerCardSelected]}
              onPress={() => setProvider('airteltigo')}
            >
              <View style={styles.providerIcon}>
                <View style={styles.airtelTigoRow}>
                  <Image
                    source={PROVIDER_LOGOS.airtel}
                    style={styles.airtelTigoLogo}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                  <Image
                    source={PROVIDER_LOGOS.tigo}
                    style={styles.airtelTigoLogo}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </View>
              </View>
              <Text style={styles.providerName}>AirtelTigo Money</Text>
              {provider === 'airteltigo' && (
                <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+233</Text>
              <TextInput
                style={styles.input}
                placeholder="241234567"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Text style={styles.hint}>Enter your mobile money number without the country code</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Mobile Money'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  providerContainer: {
    gap: 12,
    marginBottom: 32,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  providerCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  providerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  providerLogo: {
    width: 40,
    height: 40,
  },
  airtelTigoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  airtelTigoLogo: {
    width: 20,
    height: 20,
  },
  providerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
