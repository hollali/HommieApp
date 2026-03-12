import { Linking } from 'react-native';
import Constants from 'expo-constants';

export interface PaymentRequest {
  amount: number;
  currency: string;
  email?: string;
  type: 'booking' | 'subscription' | 'verification' | 'featured_boost';
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: 'success' | 'failed' | 'pending';
  message: string;
  data?: {
    authorization_url?: string;
    reference: string;
  };
}

function getPaystackBackendUrl(): string {
  const fromExtra = (Constants as any)?.expoConfig?.extra?.paystackBackendUrl;
  const fromEnv = process.env.EXPO_PUBLIC_PAYSTACK_BACKEND_URL;
  const raw = (fromExtra || fromEnv || '').trim();
  return raw.replace(/\/+$/, '');
}

export function generatePaymentReference(prefix: string = 'PAYSTACK'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

// Paystack payment initialization
export async function processPaystackPaymentFlow(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const backendUrl = getPaystackBackendUrl();
  const reference = request.reference || generatePaymentReference('PAYSTACK');

  try {
    // Paystack "transaction/initialize" requires the SECRET key and must be done server-side.
    // The mobile app calls our backend API (e.g. the admin-dashboard Next.js route)
    // which uses PAYSTACK_SECRET_KEY securely.
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/api/paystack/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email || 'customer@hommie.com',
          amount: request.amount,
          currency: request.currency,
          reference,
          metadata: {
            ...request.metadata,
            type: request.type,
          },
          callback_url: 'hommie://payment-callback',
        }),
      });

      const data: any = await response.json();

      if (data?.status === 'success' && data?.data) {
        const authorizationUrl = data.data.authorization_url as string | undefined;
        
        // Open Paystack checkout in browser
        if (authorizationUrl) {
          await Linking.openURL(authorizationUrl);
        }

        return {
          status: 'success',
          message: 'Payment initialized successfully',
          data: {
            authorization_url: authorizationUrl,
            reference: data.data.reference || reference,
          },
        };
      } else {
        throw new Error(data?.message || 'Failed to initialize payment');
      }
    } else {
      // Fallback to mock if backend isn't configured (still opens a Paystack-like URL)
      console.warn('Paystack backend not configured, using mock payment');
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      const authorizationUrl = `https://checkout.paystack.com/mock-authorization-${reference}`;
      
      if (authorizationUrl) {
        await Linking.openURL(authorizationUrl);
      }

      return {
        status: 'success',
        message: 'Payment initialized successfully (mock mode)',
        data: {
          authorization_url: authorizationUrl,
          reference,
        },
      };
    }
  } catch (error: any) {
    console.error('Paystack payment error:', error);
    return {
      status: 'failed',
      message: error.message || 'Failed to initialize payment',
    };
  }
}

// Backward compatibility alias
export const processHubtelPaymentFlow = processPaystackPaymentFlow;
