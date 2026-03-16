import { supabase, isSupabaseConfigured } from './supabase';
import { Booking, BookingStatus } from './types';

export const bookingService = {
  /**
   * Create a new booking request
   */
  async createBooking(bookingData: {
    tenant_id: string;
    property_id: string;
    scheduled_date: string;
  }): Promise<Booking | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: bookingData.tenant_id,
        property_id: bookingData.property_id,
        scheduled_date: bookingData.scheduled_date,
        status: 'pending'
      })
      .select(`
        *,
        property:properties(*)
      `)
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return null;
    }

    return data as Booking;
  },

  /**
   * Get bookings for a user (tenant or owner)
   */
  async getUserBookings(userId: string, role: 'tenant' | 'owner'): Promise<Booking[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        tenant:users!tenant_id(*)
      `);

    if (role === 'tenant') {
      query = query.eq('tenant_id', userId);
    } else {
      // For owner, we need to filter where property.owner_id is the user
      // This might require a join or a specific RPC if RLS is tight
      // For now, let's assume properties join works
      query = query.eq('properties.owner_id', userId);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }

    return true;
  }
};
