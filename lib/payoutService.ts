import { supabase } from './supabase';

export const payoutService = {
  /**
   * Requests a payout from the wallet balance.
   */
  async requestPayout(userId: string, amount: number, method: 'bank' | 'mobile_money', accountDetails: any) {
    try {
      // 1. Check user balance (Simplified for now, in production use a dedicated wallet table)
      // For this implementation, we'll record a pending payout transaction.
      
      const { data, error } = await supabase
        .from('payouts')
        .insert({
          user_id: userId,
          amount,
          method,
          account_details: accountDetails,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Notify admin (e.g., via a system notification or edge function)
      // This part is handled by the admin dashboard fetching pending payouts.

      return data;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw error;
    }
  },

  /**
   * Fetches payout history for a user.
   */
  async getPayoutHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payout history:', error);
      return [];
    }
  },

  /**
   * Fetches the current balance for a user's earnings.
   * In a real app, this would query a 'wallet' or aggregate confirmed bookings.
   */
  async getBalance(userId: string) {
    try {
      // Calculate earnings from confirmed bookings where the user is the owner
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('price')
        .eq('status', 'confirmed'); // In production, filter by property owner

      const totalEarnings = bookings?.reduce((acc, curr: any) => acc + (curr.price || 0), 0) || 0;
      
      // Subtract confirmed payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'paid');
      
      const totalPaidOut = payouts?.reduce((acc, curr: any) => acc + (curr.amount || 0), 0) || 0;

      return totalEarnings - totalPaidOut;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }
};
