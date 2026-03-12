import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addSavedPaymentMethod } from '../../lib/paymentMethods';

export default function CardSetupScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const { user } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're coming from booking flow
  const isFromBooking = !!(params.propertyId && params.date && params.time);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const handleSave = async () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }
    if (!cardName.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      Alert.alert('Error', 'Please enter expiry date');
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Error', 'Please enter CVV');
      return;
    }

    setLoading(true);
    try {
      // In production, save to secure payment processor
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

        Alert.alert('Success', 'Card added and booking confirmed!', [
          { text: 'OK', onPress: () => router.push('/booking/success') },
        ]);
      } else {
        // Just adding payment method - save it for future use
        const cleanedCardNumber = cardNumber.replace(/\s/g, '');
        const cardType = cleanedCardNumber.startsWith('4') ? 'visa' : 
                       cleanedCardNumber.startsWith('5') ? 'mastercard' : 'verve';
        
        await addSavedPaymentMethod({
          type: 'card',
          details: {
            lastFour: cleanedCardNumber.slice(-4),
            cardType,
            expiryMonth,
            expiryYear,
            cardholderName: cardName,
          },
          isDefault: false, // First payment method is not default by default
        });

        Alert.alert('Success', 'Card added successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add card');
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
        <Text style={styles.title}>Add Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.cardPreview}>
            <View style={styles.cardFront}>
              <View style={styles.cardHeader}>
                <Ionicons name="card" size={32} color="#FFF" />
                <Text style={styles.cardType}>VISA</Text>
              </View>
              <Text style={styles.cardNumberPreview}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARDHOLDER NAME</Text>
                  <Text style={styles.cardNamePreview}>
                    {cardName.toUpperCase() || 'YOUR NAME'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardExpiryPreview}>
                    {expiryMonth || 'MM'}/{expiryYear || 'YY'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#999"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#999"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Expiry Date</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  placeholder="MM"
                  placeholderTextColor="#999"
                  value={expiryMonth}
                  onChangeText={(text) => setExpiryMonth(text.slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.separator}>/</Text>
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  placeholder="YY"
                  placeholderTextColor="#999"
                  value={expiryYear}
                  onChangeText={(text) => setExpiryYear(text.slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={[styles.formSection, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#999"
                value={cvv}
                onChangeText={(text) => setCvv(text.slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color="#666" />
            <Text style={styles.securityText}>
              Your card details are encrypted and secure
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Add Card'}
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
  cardPreview: {
    marginBottom: 32,
    alignItems: 'center',
  },
  cardFront: {
    width: '100%',
    height: 200,
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
  },
  cardNumberPreview: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  cardNamePreview: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
  },
  cardExpiryPreview: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
  },
  inputSmall: {
    flex: 1,
  },
  separator: {
    fontSize: 20,
    color: '#000',
    marginHorizontal: 8,
    alignSelf: 'flex-end',
    marginBottom: 14,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
