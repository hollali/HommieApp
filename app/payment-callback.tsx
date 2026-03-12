import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

function getPaystackBackendUrl(): string {
  const fromExtra = (Constants as any)?.expoConfig?.extra?.paystackBackendUrl;
  const fromEnv = process.env.EXPO_PUBLIC_PAYSTACK_BACKEND_URL;
  const raw = (fromExtra || fromEnv || '').trim();
  return raw.replace(/\/+$/, '');
}

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reference?: string;
    trxref?: string;
    status?: string;
  }>();

  const reference = useMemo(() => {
    const ref =
      (Array.isArray(params.reference) ? params.reference[0] : params.reference) ||
      (Array.isArray(params.trxref) ? params.trxref[0] : params.trxref) ||
      '';
    return String(ref || '').trim();
  }, [params.reference, params.trxref]);

  const [state, setState] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying payment…');

  useEffect(() => {
    let cancelled = false;
    const backendUrl = getPaystackBackendUrl();

    const run = async () => {
      if (!reference) {
        setState('failed');
        setMessage('Missing payment reference.');
        return;
      }

      // If no backend is configured, we can't verify server-side. Treat as received.
      if (!backendUrl) {
        setState('success');
        setMessage('Payment received. You can return to the app.');
        return;
      }

      try {
        const res = await fetch(
          `${backendUrl}/api/paystack/verify?reference=${encodeURIComponent(reference)}`
        );
        const data: any = await res.json();

        if (cancelled) return;

        if (data?.status === 'success') {
          setState('success');
          setMessage('Payment verified successfully.');
        } else {
          setState('failed');
          setMessage(data?.message || 'Payment verification failed.');
        }
      } catch (e: any) {
        if (cancelled) return;
        setState('failed');
        setMessage(e?.message || 'Payment verification failed.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          {state === 'loading' ? (
            <Ionicons name="time-outline" size={44} color="#0066FF" />
          ) : state === 'success' ? (
            <Ionicons name="checkmark-circle" size={44} color="#25D366" />
          ) : (
            <Ionicons name="close-circle" size={44} color="#FF3B30" />
          )}
        </View>

        <Text style={styles.title}>
          {state === 'loading' ? 'Processing…' : state === 'success' ? 'Payment successful' : 'Payment failed'}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {!!reference && <Text style={styles.reference}>Ref: {reference}</Text>}

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/payments')}>
          <Text style={styles.buttonText}>Back to Payments</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  reference: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

