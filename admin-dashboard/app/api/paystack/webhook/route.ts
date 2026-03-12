// Paystack Webhook Handler
// This API route handles Paystack payment webhooks
// POST /api/paystack/webhook

import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackWebhook } from '@/lib/paystackWebhook';
import { fulfillPayment } from '@/lib/fulfillment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    const isValid = verifyPaystackWebhook(body, signature);

    if (!isValid) {
      console.warn('❌ Invalid Paystack signature');
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const data = payload.data;

    console.log(`📨 Received Paystack event: ${event}`);

    // Handle different Paystack events
    switch (event) {
      case 'charge.success':
        // Payment successful
        const result = await fulfillPayment(data);
        if (result.success) {
          console.log('✅ Payment fulfilled successfully:', data.reference);
        } else {
          console.error('❌ Payment fulfillment failed:', result.error);
        }
        break;

      case 'charge.failed':
        // Payment failed
        console.log('❌ Payment failed:', data.reference);
        // You could update txn status to 'failed' here if needed
        break;

      case 'transfer.success':
        // Transfer successful (for payouts)
        console.log('✅ Transfer successful:', data.reference);
        break;

      case 'transfer.failed':
        // Transfer failed
        console.log('❌ Transfer failed:', data.reference);
        break;

      default:
        console.log('📨 Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Paystack requires GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ message: 'Paystack webhook endpoint' });
}
