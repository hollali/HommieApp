// Paystack Payment Verification API Route
// GET /api/paystack/verify?reference=xxx

import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackPayment } from '@/lib/payments';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { status: 'failed', message: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment using the payment library function
    const result = await verifyPaystackPayment(reference);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { status: 'failed', message: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
