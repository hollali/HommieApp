// Paystack Payment Initialization API Route
// This handles payment initialization server-side using the secret key
// POST /api/paystack/initialize

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { status: 'failed', message: 'Paystack secret key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency, email, reference, metadata, callback_url } = body;

    // Convert amount to pesewas (Paystack uses pesewas for GHS)
    const amountInPesewas = Math.round(amount * 100);

    // Call Paystack API to initialize payment
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency,
        reference,
        metadata,
        callback_url,
      }),
    });

    const data = await response.json();

    if (data.status && data.data) {
      return NextResponse.json({
        status: 'success',
        message: 'Payment initialized successfully',
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference || reference,
        },
      });
    } else {
      return NextResponse.json(
        { status: 'failed', message: data.message || 'Failed to initialize payment' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json(
      { status: 'failed', message: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}
