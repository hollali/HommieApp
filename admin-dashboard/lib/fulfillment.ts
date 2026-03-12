
import { supabase } from './supabase';
import { TransactionType, SubscriptionPlan } from './types';
import { addAdminLog } from './data';

export async function fulfillPayment(data: any) {
  const reference = data.reference;
  const amount = data.amount / 100; // Paystack sends in pesewas
  const metadata = data.metadata || {};
  const userId = metadata.user_id;
  const type = metadata.type as TransactionType;

  console.log(`Processing fulfillment for ${reference}, type: ${type}`);

  try {
    // 1. Update Transaction status
    const { error: txnError } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        payment_method: 'paystack'
      })
      .eq('reference', reference);

    if (txnError) throw txnError;

    // 2. Process based on type
    switch (type) {
      case 'subscription':
        await handleSubscriptionFulfillment(userId, metadata.plan as SubscriptionPlan, amount);
        break;
      case 'featured_listing':
        await handleFeaturedFulfillment(metadata.property_id);
        break;
      case 'verification':
        await handleVerificationFulfillment(metadata.property_id);
        break;
      case 'boost':
        await handleBoostFulfillment(metadata.property_id);
        break;
      case 'booking':
        await handleBookingFulfillment(metadata.booking_id, metadata.property_id);
        break;
      default:
        console.warn(`Unknown transaction type: ${type}`);
    }

    // 3. Log the fulfillment
    await addAdminLog({
      action: 'payment_fulfillment',
      entity_type: type,
      entity_id: metadata.property_id || userId,
      details: { reference, amount, type },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Fulfillment error:', error);
    return { success: false, error: error.message };
  }
}

async function handleSubscriptionFulfillment(userId: string, plan: SubscriptionPlan, amount: number) {
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Update user profile
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_start_date: startDate,
      subscription_end_date: endDate
    })
    .eq('id', userId);

  if (userError) throw userError;

  // Create subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: userId,
      plan: plan,
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      amount: amount
    }]);

  if (subError) throw subError;
}

async function handleFeaturedFulfillment(propertyId: string) {
  const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { error } = await supabase
    .from('properties')
    .update({
      is_featured: true,
      featured_until: featuredUntil
    })
    .eq('id', propertyId);

  if (error) throw error;
}

async function handleVerificationFulfillment(propertyId: string) {
  const { error } = await supabase
    .from('properties')
    .update({
      verification_fee_paid: true,
      status: 'pending' // Keeps it pending for admin review, but marks fee as paid
    })
    .eq('id', propertyId);

  if (error) throw error;
}

async function handleBoostFulfillment(propertyId: string) {
  const boostedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const { error } = await supabase
    .from('properties')
    .update({
      is_boosted: true,
      boosted_until: boostedUntil
    })
    .eq('id', propertyId);

  if (error) throw error;
}

async function handleBookingFulfillment(bookingId: string, propertyId: string) {
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (bookingError) throw bookingError;
}