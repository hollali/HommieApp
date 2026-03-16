import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { payoutService } from '../../lib/payoutService';
import { formatCurrency } from '../../lib/constants';

export default function PayoutScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'mobile_money'>('mobile_money');
  const [accountNumber, setAccountNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      payoutService.getBalance(user.id).then(setBalance);
      payoutService.getPayoutHistory(user.id).then(setHistory);
    }
  }, [user]);

  const handlePayout = async () => {
    const payoutAmount = parseFloat(amount);
    if (!payoutAmount || payoutAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (payoutAmount > balance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current balance.');
      return;
    }

    if (!accountNumber || !provider) {
      Alert.alert('Details Missing', 'Please fill in all account details.');
      return;
    }

    setLoading(true);
    try {
      await payoutService.requestPayout(user!.id, payoutAmount, method, {
        account_number: accountNumber,
        provider: provider
      });
      
      Alert.alert('Success', 'Payout request submitted successfully!');
      setAmount('');
      // Refresh balance and history
      payoutService.getBalance(user!.id).then(setBalance);
      payoutService.getPayoutHistory(user!.id).then(setHistory);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request payout');
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
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceInfo}>Earnings are available for withdrawal 24h after booking completion.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Request Payout</Text>
          
          <Text style={styles.inputLabel}>Amount to Withdraw</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₵</Text>
            <TextInput 
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <Text style={styles.inputLabel}>Withdrawal Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity 
              style={[styles.methodBtn, method === 'mobile_money' && styles.methodBtnActive]}
              onPress={() => setMethod('mobile_money')}
            >
              <Ionicons name="phone-portrait-outline" size={20} color={method === 'mobile_money' ? '#FFF' : '#666'} />
              <Text style={[styles.methodText, method === 'mobile_money' && styles.methodTextActive]}>Mobile Money</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.methodBtn, method === 'bank' && styles.methodBtnActive]}
              onPress={() => setMethod('bank')}
            >
              <Ionicons name="business-outline" size={20} color={method === 'bank' ? '#FFF' : '#666'} />
              <Text style={[styles.methodText, method === 'bank' && styles.methodTextActive]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>{method === 'mobile_money' ? 'Mobile Network' : 'Bank Name'}</Text>
          <TextInput 
            style={styles.input}
            placeholder={method === 'mobile_money' ? 'e.g., MTN, Vodafone' : 'e.g., GCB, Ecobank'}
            value={provider}
            onChangeText={setProvider}
          />

          <Text style={styles.inputLabel}>{method === 'mobile_money' ? 'Phone Number' : 'Account Number'}</Text>
          <TextInput 
            style={styles.input}
            placeholder={method === 'mobile_money' ? '024 XXX XXXX' : 'Account Number'}
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />

          <TouchableOpacity 
            style={[styles.payoutBtn, loading && styles.btnDisabled]}
            onPress={handlePayout}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payoutBtnText}>Request Payout</Text>}
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons 
                    name={item.status === 'paid' ? 'checkmark-circle' : 'time'} 
                    size={24} 
                    color={item.status === 'paid' ? '#00C853' : '#FF9500'} 
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.historyDate}>{new Date(item.requested_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'paid' ? '#2E7D32' : '#EF6C00' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
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
  balanceCard: {
    backgroundColor: '#4560F7',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#4560F7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginVertical: 8,
  },
  balanceInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  formContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 60,
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  methodBtnActive: {
    backgroundColor: '#4560F7',
    borderColor: '#4560F7',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodTextActive: {
    color: '#FFF',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  payoutBtn: {
    backgroundColor: '#4560F7',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  payoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  historySection: {
    paddingTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
