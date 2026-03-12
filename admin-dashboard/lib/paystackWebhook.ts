import crypto from 'crypto';

/**
 * Verify Paystack webhook signature.
 *
 * Paystack sends an `x-paystack-signature` header which is an HMAC SHA512 hash
 * of the raw request body using your Paystack secret key.
 */
export function verifyPaystackWebhook(rawBody: string, signature: string): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;
  if (!signature) return false;

  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  // Use a constant-time compare to reduce timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

