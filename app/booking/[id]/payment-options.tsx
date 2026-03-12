import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useBiometrics } from '../../../hooks/useBiometrics';
import { processPaystackPaymentFlow, generatePaymentReference } from '../../../lib/payments';
import { PaymentMethod } from '../../../lib/types';
import { getSavedPaymentMethods, SavedPaymentMethod, formatPaymentMethodDisplay, getPaymentMethodIcon } from '../../../lib/paymentMethods';
import { useQuery } from '@tanstack/react-query';

interface BookingDetails {
  propertyId: string;
  selectedDate: number | null;
  selectedTime: string | null;
  scheduledDateTime: string;
  bookingFee: number;
}

const PAYMENT_METHODS = [
  {
    id: 'paystack' as PaymentMethod,
    name: 'Paystack',
    description: 'Pay with card, mobile money, or bank transfer',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    popular: true,
  },
  {
    id: 'mobile_money' as PaymentMethod,
    name: 'Mobile Money',
    description: 'MTN, Vodafone, AirtelTigo',
    icon: 'phone-portrait-outline' as keyof typeof Ionicons.glyphMap,
    popular: false,
  },
  {
    id: 'card' as PaymentMethod,
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard',
    icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
    popular: false,
  },
  {
    id: 'bank_transfer' as PaymentMethod,
    name: 'Bank Transfer',
    description: 'Direct bank deposit',
    icon: 'cash-outline' as keyof typeof Ionicons.glyphMap,
    popular: false,
  },
];

export default function BookingPaymentOptionsScreen() {
  const router = useRouter();
  const { id, date, time, year, month } = useLocalSearchParams<{
    id: string;
    date: string;
    time: string;
    year: string;
    month: string;
  }>();
  
  const { user } = useAuth();
  const { authenticate, isEnabled: biometricsEnabled, biometricType } = useBiometrics();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch saved payment methods
  const { data: savedPaymentMethods = [] } = useQuery({
    queryKey: ['savedPaymentMethods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await getSavedPaymentMethods();
    },
    enabled: !!user,
  });

  // Reconstruct booking details from params
  const bookingDetails: BookingDetails = {
    propertyId: Array.isArray(id) ? id[0] : id || '',
    selectedDate: date ? parseInt(date) : null,
    selectedTime: Array.isArray(time) ? time[0] : time || '',
    scheduledDateTime: '', // Will be calculated
    bookingFee: 20,
  };

  // Calculate scheduled date time
  if (bookingDetails.selectedDate && bookingDetails.selectedTime && year && month) {
    const [hours, minutes] = bookingDetails.selectedTime.replace(/AM|PM/i, '').split(':').map(Number);
    const isPM = bookingDetails.selectedTime.toUpperCase().includes('PM');
    const hour24 = isPM && hours !== 12 ? hours + 12 : !isPM && hours === 12 ? 0 : hours;
    
    const scheduledDateTime = new Date();
    scheduledDateTime.setDate(bookingDetails.selectedDate);
    scheduledDateTime.setFullYear(parseInt(year));
    scheduledDateTime.setMonth(parseInt(month) - 1);
    scheduledDateTime.setHours(hour24, minutes, 0, 0);
    bookingDetails.scheduledDateTime = scheduledDateTime.toISOString();
  }

  const handlePayment = async () => {
    // Check if user selected a saved payment method or a new payment method
    if (!selectedSavedMethod && !selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    if (!bookingDetails.propertyId) {
      Alert.alert('Error', 'Property information missing');
      return;
    }

    // Biometric authentication if enabled
    if (biometricsEnabled) {
      const biometricSuccess = await authenticate('Authenticate to complete payment');
      if (!biometricSuccess) {
        Alert.alert('Authentication Failed', 'Biometric authentication was cancelled or failed');
        return;
      }
    }

    try {
      setLoading(true);

      // If a saved payment method is selected, use it directly
      if (selectedSavedMethod) {
        const savedMethod = savedPaymentMethods.find(method => method.id === selectedSavedMethod);
        if (savedMethod) {
          // Process booking with saved payment method
          const { createBooking, addNotification } = await import('../../../lib/mockData');
          
          await createBooking({
            tenant_id: user.id,
            property_id: bookingDetails.propertyId,
            scheduled_date: bookingDetails.scheduledDateTime,
            status: 'pending',
          });

          // Add notifications
          const { getProperties } = await import('../../../lib/mockData');
          const properties = await getProperties();
          const property = properties.find((p: any) => p.id === bookingDetails.propertyId);

          if (property) {
            await addNotification({
              user_id: user.id,
              type: 'payment',
              title: 'Booking confirmed',
              message: `Booking confirmed using ${formatPaymentMethodDisplay(savedMethod)} for "${property.title}".`,
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

          router.push('/booking/success');
          return;
        }
      }

      // Handle new payment method selection
      if (selectedMethod === 'paystack') {
        // Process through Paystack (handles multiple payment options)
        const paymentResponse = await processPaystackPaymentFlow({
          amount: bookingDetails.bookingFee,
          currency: 'GHS',
          email: user?.email || undefined,
          type: 'booking',
          reference: generatePaymentReference('PAYSTACK'),
          metadata: { 
            property_id: bookingDetails.propertyId, 
            tenant_id: user.id,
            payment_method: selectedMethod,
            scheduled_date: bookingDetails.scheduledDateTime,
          },
        });

        if (paymentResponse.status !== 'success') {
          Alert.alert('Payment Failed', paymentResponse.message || 'Unable to start payment');
          return;
        }

        // Create booking after successful payment initiation
        const { createBooking, addNotification } = await import('../../../lib/mockData');
        
        await createBooking({
          tenant_id: user.id,
          property_id: bookingDetails.propertyId,
          scheduled_date: bookingDetails.scheduledDateTime,
          status: 'pending',
        });

        // Add notifications
        const { getProperties } = await import('../../../lib/mockData');
        const properties = await getProperties();
        const property = properties.find((p: any) => p.id === bookingDetails.propertyId);

        if (property) {
          await addNotification({
            user_id: user.id,
            type: 'payment',
            title: 'Payment initiated',
            message: `Payment started for booking "${property.title}".`,
            metadata: { property_id: property.id },
          });
          await addNotification({
            user_id: property.owner_id,
            type: 'payment',
            title: 'Payment initiated',
            message: `A booking payment was initiated for "${property.title}".`,
            metadata: { property_id: property.id },
          });
        }

        router.push('/booking/success');
      } else {
        // For other payment methods, redirect to specific payment screens
        switch (selectedMethod) {
          case 'mobile_money':
            router.push({
              pathname: '/payments/mobile-money',
              params: {
                propertyId: bookingDetails.propertyId,
                date: bookingDetails.selectedDate?.toString(),
                time: bookingDetails.selectedTime,
                year: year?.toString(),
                month: (parseInt(month || '0') + 1).toString(),
              },
            });
            break;
          case 'card':
            router.push({
              pathname: '/payments/card',
              params: {
                propertyId: bookingDetails.propertyId,
                date: bookingDetails.selectedDate?.toString(),
                time: bookingDetails.selectedTime,
                year: year?.toString(),
                month: (parseInt(month || '0') + 1).toString(),
              },
            });
            break;
          case 'bank_transfer':
            router.push({
              pathname: '/payments/bank-transfer',
              params: {
                propertyId: bookingDetails.propertyId,
                date: bookingDetails.selectedDate?.toString(),
                time: bookingDetails.selectedTime,
                year: year?.toString(),
                month: (parseInt(month || '0') + 1).toString(),
              },
            });
            break;
          default:
            Alert.alert('Coming Soon', 'This payment method will be available soon');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const formatBookingDate = () => {
    if (!bookingDetails.selectedDate || !year || !month) return '';
    const date = new Date();
    date.setDate(bookingDetails.selectedDate);
    date.setFullYear(parseInt(year));
    date.setMonth(parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatBookingDate()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{bookingDetails.selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>45 minutes</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Booking Fee</Text>
            <Text style={styles.totalValue}>₵{bookingDetails.bookingFee}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        {/* Saved Payment Methods */}
        {savedPaymentMethods.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Saved Payment Methods</Text>
            <View style={styles.methodsContainer}>
              {savedPaymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedSavedMethod === method.id && styles.methodCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedSavedMethod(method.id);
                    setSelectedMethod(null); // Clear new method selection
                  }}
                >
                  <View style={styles.methodLeft}>
                    <View style={styles.methodIcon}>
                      <Ionicons 
                        name={getPaymentMethodIcon(method.type)} 
                        size={24} 
                        color={selectedSavedMethod === method.id ? '#0066FF' : '#666'} 
                      />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={[
                        styles.methodName,
                        selectedSavedMethod === method.id && styles.methodNameSelected
                      ]}>
                        {formatPaymentMethodDisplay(method)}
                      </Text>
                      <Text style={styles.methodDescription}>
                        {method.isDefault ? 'Default payment method' : 'Tap to use this method'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.methodRadio}>
                    <View style={[
                      styles.radioCircle,
                      selectedSavedMethod === method.id && styles.radioCircleSelected
                    ]}>
                      {selectedSavedMethod === method.id && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* New Payment Methods */}
        <Text style={styles.subsectionTitle}>
          {savedPaymentMethods.length > 0 ? 'Add New Payment Method' : 'Payment Methods'}
        </Text>
        <View style={styles.methodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => {
                setSelectedMethod(method.id);
                setSelectedSavedMethod(null); // Clear saved method selection
              }}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIcon}>
                  <Ionicons 
                    name={method.icon} 
                    size={24} 
                    color={selectedMethod === method.id ? '#0066FF' : '#666'} 
                  />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Text style={[
                      styles.methodName,
                      selectedMethod === method.id && styles.methodNameSelected
                    ]}>
                      {method.name}
                    </Text>
                    {method.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              <View style={styles.methodRadio}>
                <View style={[
                  styles.radioCircle,
                  selectedMethod === method.id && styles.radioCircleSelected
                ]}>
                  {selectedMethod === method.id && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0066FF" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted. We use industry-standard security measures to protect your data.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod && !selectedSavedMethod || loading) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod && !selectedSavedMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonText}>
                Pay ₵{bookingDetails.bookingFee}
              </Text>
              {biometricsEnabled && (
                <Ionicons 
                  name="finger-print-outline" 
                  size={16} 
                  color="#FFF" 
                  style={styles.biometricIcon}
                />
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
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
  summaryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 24,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  methodCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F7FF',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  methodNameSelected: {
    color: '#0066FF',
  },
  popularBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
  },
  methodRadio: {
    marginLeft: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0066FF',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E8FF',
    marginBottom: 20,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  biometricIcon: {
    marginLeft: 4,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
