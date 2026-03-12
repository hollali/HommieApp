import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { SubscriptionPlan } from '../lib/types';
import { processPaystackPaymentFlow, generatePaymentReference } from '../lib/payments';
import { addSubscription, addTransaction, getSubscriptionsByUser, getTransactions, updateUser } from '../lib/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { setMockProfile } from '../lib/mockAuth';
import { useQuery } from '@tanstack/react-query';
import { getSavedPaymentMethods } from '../lib/paymentMethods';

export default function PaymentsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch saved payment methods
  const { data: savedPaymentMethods = [] } = useQuery({
    queryKey: ['savedPaymentMethods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await getSavedPaymentMethods();
    },
    enabled: !!user,
  });

  const openSalesEmail = async () => {
    const to = 'hommie2066@gmail.com';
    const subject = encodeURIComponent('Hommie — Sales enquiry');
    const url = `mailto:${to}?subject=${subject}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Email not available', `Please email us at ${to}.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email not available', `Please email us at ${to}.`);
    }
  };
  const { data: transactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      }
      return getTransactions(user.id);
    },
    enabled: !!user,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      }
      return getSubscriptionsByUser(user.id);
    },
    enabled: !!user,
  });

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to subscribe.');
      return;
    }
    if (plan === 'enterprise') {
      await openSalesEmail();
      return;
    }
    try {
      const planPrices: Record<SubscriptionPlan, number> = {
        free: 0,
        basic: 100,
        pro: 300,
        enterprise: 0,
      };

      const amount = planPrices[plan] || 0;
      const response = await processPaystackPaymentFlow({
        amount,
        currency: 'GHS',
        email: user.email || undefined,
        type: 'subscription',
        reference: generatePaymentReference('PAYSTACK'),
      });

      if (response.status !== 'success') {
        Alert.alert('Payment Failed', response.message || 'Unable to start payment');
        return;
      }
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const updates = {
        subscription_plan: plan,
        subscription_status: 'active' as const,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
      };

      const reference = response.data?.reference || generatePaymentReference('PAYSTACK');
      const transaction = {
        user_id: user.id,
        type: 'subscription',
        amount,
        currency: 'GHS',
        payment_method: 'paystack',
        status: 'completed',
        reference,
        created_at: new Date().toISOString(),
      };
      if (isSupabaseConfigured) {
        await supabase.from('users').update(updates).eq('id', user.id);
        await supabase.from('subscriptions').insert([
          {
            user_id: user.id,
            plan,
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            amount,
            created_at: new Date().toISOString(),
          },
        ]);
        await supabase.from('transactions').insert([transaction]);
      } else {
        await updateUser(user.id, updates);
        await setMockProfile(updates);
        await addSubscription({
          id: `sub_${Date.now()}`,
          user_id: user.id,
          plan,
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          amount,
          created_at: startDate,
        });
        await addTransaction({ id: `tx_${Date.now()}`, ...transaction });
      }

      Alert.alert('Success', 'Subscription activated.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to activate subscription');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscriptions</Text>
          {[
            { plan: 'free' as SubscriptionPlan, title: 'Free Plan', detail: '1 listing', price: '₵0 / month' },
            { plan: 'basic' as SubscriptionPlan, title: 'Basic Plan', detail: '10 listings', price: '₵100 / month' },
            { plan: 'pro' as SubscriptionPlan, title: 'Pro Plan', detail: 'Unlimited listings', price: '₵300 / month' },
            { plan: 'enterprise' as SubscriptionPlan, title: 'Enterprise', detail: 'Custom plan', price: 'Contact sales' },
          ].map((item) => (
            <View key={item.plan} style={styles.planCard}>
              <Text style={styles.planTitle}>{item.title}</Text>
              <Text style={styles.planDetail}>{item.detail}</Text>
              <Text style={styles.planPrice}>{item.price}</Text>
              {user?.subscription_plan === item.plan ? (
                <Text style={styles.planBadge}>Active Plan</Text>
              ) : item.plan === 'free' ? (
                <Text style={styles.planBadge}>Current Plan</Text>
              ) : (
                <TouchableOpacity style={styles.subscribeButton} onPress={() => handleSubscribe(item.plan)}>
                  <Text style={styles.subscribeButtonText}>
                    {item.plan === 'enterprise' ? 'Contact Sales' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={styles.subscriptionHistory}>
            <Text style={styles.sectionSubtitle}>Your subscriptions</Text>
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub: any) => (
                <View key={sub.id} style={styles.subscriptionItem}>
                  <View>
                    <Text style={styles.subscriptionPlan}>
                      {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Plan
                    </Text>
                    <Text style={styles.subscriptionDates}>
                      {new Date(sub.start_date).toLocaleDateString()} -{' '}
                      {new Date(sub.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.subscriptionStatus}>
                    <Text style={styles.subscriptionAmount}>₵{sub.amount}</Text>
                    <Text style={styles.subscriptionState}>{sub.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No subscriptions yet</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          {/* Saved Payment Methods */}
          {savedPaymentMethods.length > 0 && (
            <TouchableOpacity
              style={styles.savedMethodsCard}
              onPress={() => router.push('/payments/saved-methods')}
            >
              <View style={styles.savedMethodsHeader}>
                <Ionicons name="wallet-outline" size={22} color="#0066FF" />
                <Text style={styles.savedMethodsTitle}>
                  Saved Methods ({savedPaymentMethods.length})
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
              <Text style={styles.savedMethodsSubtitle}>
                Manage your saved payment methods for quick checkout
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => router.push('/payments/mobile-money')}
          >
            <Ionicons name="phone-portrait-outline" size={22} color="#0066FF" />
            <Text style={styles.methodText}>Mobile Money (MTN / Vodafone / AirtelTigo)</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => router.push('/payments/card')}
          >
            <Ionicons name="card-outline" size={22} color="#0066FF" />
            <Text style={styles.methodText}>Card (Visa / MasterCard)</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => router.push('/payments/bank-transfer')}
          >
            <Ionicons name="cash-outline" size={22} color="#0066FF" />
            <Text style={styles.methodText}>Bank Transfer</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <View style={styles.paystackNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#0066FF" />
            <Text style={styles.paystackNoteText}>
              Checkout payments (subscriptions, bookings, featured boosts) are processed securely via Paystack.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions && transactions.length > 0 ? (
            <View style={styles.transactionList}>
              {transactions.map((tx: any) => (
                <View key={tx.id || tx.reference} style={styles.transactionItem}>
                  <View>
                    <Text style={styles.transactionTitle}>
                      {tx.type === 'subscription' ? 'Subscription' : tx.type}
                    </Text>
                    <Text style={styles.transactionMeta}>{tx.reference}</Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.transactionPrice}>₵{tx.amount}</Text>
                    <Text style={styles.transactionStatus}>{tx.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
          )}
        </View>
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
  section: {
    marginBottom: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  savedMethodsCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D6E8FF',
    marginBottom: 10,
  },
  savedMethodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  savedMethodsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  savedMethodsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginLeft: 34,
  },
  methodText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  paystackNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#D6E8FF',
    marginTop: 4,
  },
  paystackNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#0066FF',
    lineHeight: 18,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  subscriptionHistory: {
    marginTop: 10,
  },
  subscriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  subscriptionPlan: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  subscriptionDates: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  subscriptionStatus: {
    alignItems: 'flex-end',
  },
  subscriptionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  subscriptionState: {
    fontSize: 12,
    color: '#4560F7',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  planDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4560F7',
    marginBottom: 8,
  },
  planBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  subscribeButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    gap: 12,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4560F7',
  },
  transactionStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
  },
});


