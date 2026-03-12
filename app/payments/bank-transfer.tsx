import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addSavedPaymentMethod } from '../../lib/paymentMethods';

export default function BankTransferSetupScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're coming from booking flow
  const isFromBooking = !!(params.propertyId && params.date && params.time);

  const banks = [
    'Access Bank',
    'Cal Bank',
    'Ecobank',
    'Fidelity Bank',
    'GCB Bank',
    'Guaranty Trust Bank',
    'Republic Bank',
    'Standard Chartered Bank',
    'Stanbic Bank',
    'United Bank for Africa',
  ];

  const [showBankPicker, setShowBankPicker] = useState(false);

  const handleSave = async () => {
    if (!bankName) {
      Alert.alert('Error', 'Please select a bank');
      return;
    }
    if (!accountNumber || accountNumber.length < 8) {
      Alert.alert('Error', 'Please enter a valid account number');
      return;
    }
    if (!accountName.trim()) {
      Alert.alert('Error', 'Please enter account name');
      return;
    }

    setLoading(true);
    try {
      // In production, save to Supabase
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

        Alert.alert('Success', 'Bank account added and booking confirmed!', [
          { text: 'OK', onPress: () => router.push('/booking/success') },
        ]);
      } else {
        // Just adding payment method - save it for future use
        await addSavedPaymentMethod({
          type: 'bank_transfer',
          details: {
            bankName: bankName!,
            accountNumber,
            accountName,
            branch,
          },
          isDefault: false, // First payment method is not default by default
        });

        Alert.alert('Success', 'Bank account added successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add bank account');
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
        <Text style={styles.title}>Add Bank Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Bank Name</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowBankPicker(!showBankPicker)}
            >
              <Text style={[styles.selectText, !bankName && styles.selectPlaceholder]}>
                {bankName || 'Select Bank'}
              </Text>
              <Ionicons
                name={showBankPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {showBankPicker && (
              <View style={styles.pickerContainer}>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={styles.pickerItem}
                    onPress={() => {
                      setBankName(bank);
                      setShowBankPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{bank}</Text>
                    {bankName === bank && (
                      <Ionicons name="checkmark" size={20} color="#0066FF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234567890"
              placeholderTextColor="#999"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#999"
              value={accountName}
              onChangeText={setAccountName}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>Name as it appears on your bank account</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Branch (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Accra Main Branch"
              placeholderTextColor="#999"
              value={branch}
              onChangeText={setBranch}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Add Bank Account'}
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
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectText: {
    fontSize: 16,
    color: '#000',
  },
  selectPlaceholder: {
    color: '#999',
  },
  pickerContainer: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000',
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
