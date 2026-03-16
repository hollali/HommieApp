import { supabase } from './supabase';

export const adminService = {
  /**
   * Fetches users who have submitted verification documents but are not yet verified.
   */
  async getPendingVerifications() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          role,
          verification_status,
          verification_documents,
          verification_requested_at
        `)
        .eq('verification_status', 'pending')
        .order('verification_requested_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }
  },

  /**
   * Approves or rejects a user's verification.
   */
  async updateVerificationStatus(userId: string, status: 'verified' | 'unverified', rejectionReason?: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          verification_status: status,
          // metadata can store rejection reason
          metadata: status === 'unverified' ? { rejection_reason: rejectionReason } : null
        })
        .eq('id', userId);

      if (error) throw error;

      // Also create a notification for the user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'system',
        title: status === 'verified' ? 'Identity Verified!' : 'Verification Rejected',
        message: status === 'verified' 
          ? 'Congratulations! Your identity has been verified. You can now list properties and receive payments.'
          : `Unfortunately, your identity verification was rejected. ${rejectionReason || 'Please check your documents and try again.'}`,
        is_read: false
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  },

  /**
   * Fetches platform-wide statistics for the admin.
   */
  async getPlatformStats() {
    try {
      const [
        { count: totalUsers },
        { count: totalProperties },
        { count: pendingVerifications },
        { data: totalRevenue }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('bookings').select('price').eq('status', 'confirmed') // Simplified revenue query
      ]);

      const revenue = totalRevenue?.reduce((acc, curr: any) => acc + (curr.price || 0), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        totalProperties: totalProperties || 0,
        pendingVerifications: pendingVerifications || 0,
        totalRevenue: revenue
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return null;
    }
  },

  /**
   * Fetches all payout requests.
   */
  async getPayoutRequests() {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          users (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payouts:', error);
      return [];
    }
  },

  /**
   * Approves or rejects a payout request.
   */
  async updatePayoutStatus(payoutId: string, status: 'paid' | 'rejected', rejectionReason?: string) {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .update({
          status,
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString()
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) throw error;

      // Create a notification for the user
      if (data) {
        await supabase.from('notifications').insert({
          user_id: data.user_id,
          type: 'payment',
          title: status === 'paid' ? 'Payout Processed' : 'Payout Rejected',
          message: status === 'paid' 
            ? `Your payout of ₵${data.amount} has been processed.`
            : `Your payout of ₵${data.amount} was rejected. ${rejectionReason || ''}`,
          read: false
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating payout status:', error);
      throw error;
    }
  },

  /**
   * Fetches all users for management.
   */
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
};
