// Payment Integration Structure (Paystack Skeleton)
// This is a placeholder for actual Paystack integration

import { TransactionType, PaymentMethod } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

export interface PaymentRequest {
  amount: number;
  currency: string;
  email: string;
  type: TransactionType;
  reference?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface PaymentResponse {
  status: 'success' | 'failed' | 'pending';
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference: string;
  };
}

// Paystack payment initialization
// Uses API route to securely handle payment initialization with secret key
export async function initializePaystackPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const reference = request.reference || `PAYSTACK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Call our API route which uses the secret key server-side
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: request.email,
        amount: request.amount,
        currency: request.currency,
        reference,
        metadata: {
          ...request.metadata,
          type: request.type,
        },
        callback_url: request.callback_url || `${typeof window !== 'undefined' ? window.location.origin : ''}/payment-callback`,
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.data) {
      return {
        status: 'success',
        message: data.message || 'Payment initialized successfully',
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference || reference,
        },
      };
    } else {
      throw new Error(data.message || 'Failed to initialize payment');
    }
  } catch (error: any) {
    console.error('Paystack payment error:', error);
    return {
      status: 'failed',
      message: error.message || 'Failed to initialize payment',
    };
  }
}

// Verify Paystack payment
// Note: In production, this should be called from a server-side API route using the secret key
export async function verifyPaystackPayment(reference: string): Promise<PaymentResponse> {
  // Prefer secret key for verification (more secure), fallback to public key
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const apiKey = secretKey || publicKey;

  try {
    if (apiKey) {
      // Call Paystack API to verify transaction
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();

      if (data.status && data.data) {
        const transaction = data.data;
        return {
          status: transaction.status === 'success' ? 'success' : 'failed',
          message: transaction.status === 'success' ? 'Payment verified successfully' : 'Payment verification failed',
          data: {
            reference: transaction.reference,
          },
        };
      } else {
        throw new Error(data.message || 'Failed to verify payment');
      }
    } else {
      // Fallback to mock if no API key is configured
      console.warn('Paystack API key not configured, using mock verification');
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        status: 'success',
        message: 'Payment verified successfully (mock mode)',
        data: {
          reference,
        },
      };
    }
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return {
      status: 'failed',
      message: error.message || 'Failed to verify payment',
    };
  }
}

// Backward compatibility aliases
export const initializeHubtelPayment = initializePaystackPayment;
export const verifyHubtelPayment = verifyPaystackPayment;

// Create transaction record in database
export async function createTransactionRecord(
  userId: string,
  type: TransactionType,
  amount: number,
  reference: string,
  paymentMethod: PaymentMethod = 'paystack',
  propertyId?: string,
  subscriptionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('transactions').insert([
      {
        user_id: userId,
        type,
        amount,
        currency: 'GHS',
        payment_method: paymentMethod,
        status: 'pending',
        reference,
        property_id: propertyId || null,
        subscription_id: subscriptionId || null,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      },
    ]);

    if (!error) return;
  }

  console.log('💾 [MOCK] Creating transaction record:', {
    userId,
    type,
    amount,
    reference,
    paymentMethod,
    propertyId,
    subscriptionId,
    metadata,
  });
}

// Payment flow helper
export async function processPaystackPaymentFlow(
  request: PaymentRequest
): Promise<PaymentResponse> {
  try {
    // Step 1: Initialize payment with Paystack
    const paymentInit = await initializePaystackPayment(request);

    if (paymentInit.status !== 'success' || !paymentInit.data) {
      return {
        status: 'failed',
        message: paymentInit.message || 'Failed to initialize payment',
      };
    }

    // Step 2: In production, redirect user to authorization_url
    // For now, we'll just return the response
    // In a real app, you'd do: window.location.href = paymentInit.data.authorization_url

    return paymentInit;
  } catch (error: any) {
    console.error('Payment flow error:', error);
    return {
      status: 'failed',
      message: error.message || 'Payment processing failed',
    };
  }
}

// Payment webhook handler (for server-side)
// This would be called by Paystack when payment is completed
export async function handlePaystackWebhook(
  payload: any,
  signature: string
): Promise<{ success: boolean; message: string }> {
  // In production, this would:
  // 1. Verify the webhook signature from Paystack
  // 2. Parse the event (charge.success, charge.failed, etc.)
  // 3. Update transaction status in database
  // 4. Trigger any necessary actions (update subscription, feature listing, etc.)

  console.log('📨 [MOCK] Handling Paystack webhook:', {
    event: payload.event,
    reference: payload.data?.reference,
    signature,
  });

  // Verify signature
  // const isValid = verifyPaystackSignature(payload, signature);
  // if (!isValid) return { success: false, message: 'Invalid signature' };

  // Handle different event types
  if (payload.event === 'charge.success') {
    // Payment successful
    // await updateTransactionStatus(payload.data.reference, 'completed');
    // await processPaymentSuccess(payload.data);
    return { success: true, message: 'Payment processed successfully' };
  } else if (payload.event === 'charge.failed') {
    // Payment failed
    // await updateTransactionStatus(payload.data.reference, 'failed');
    return { success: true, message: 'Payment failed notification processed' };
  }

  return { success: true, message: 'Webhook processed' };
}

// Backward-compatible aliases
export const processHubtelPaymentFlow = processPaystackPaymentFlow;
export const handleHubtelWebhook = handlePaystackWebhook;
export const processPaymentFlow = processPaystackPaymentFlow;

// Helper: Format amount for display
export function formatPaymentAmount(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper: Generate payment reference
export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}
