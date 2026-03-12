
import { supabase, isSupabaseConfigured } from './supabase';
import * as mock from './mockData';
import { Property, Favorite, Booking, User } from './types';

// Generic Fetcher
async function safeSupabase<T>(
    query: any,
    mockFallback: () => Promise<T>,
    mapper?: (data: any) => T
): Promise<T> {
    if (!isSupabaseConfigured) return mockFallback();

    const { data, error } = await query;
    if (error) {
        console.error('Supabase error:', error);
        return mockFallback();
    }

    return mapper ? mapper(data) : (data as T);
}

// Properties
export async function getProperties(): Promise<Property[]> {
    if (!isSupabaseConfigured) return mock.getProperties();

    const { data, error } = await supabase
        .from('properties')
        .select('*, owner:users(*), property_images(*)');

    if (error) {
        console.error('Error fetching properties:', error);
        return mock.getProperties();
    }

    return data || [];
}

export async function getProperty(id: string): Promise<Property | null> {
    if (!isSupabaseConfigured) {
        const properties = await mock.getProperties();
        return properties.find(p => p.id === id) || null;
    }

    const { data, error } = await supabase
        .from('properties')
        .select('*, owner:users(*), property_images(*)')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

// Favorites
export async function getFavorites(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured) {
        const userFavorites = await mock.getFavorites(userId);
        const allProps = await mock.getProperties();
        return userFavorites.map(fav => ({
            ...fav,
            property: allProps.find(p => p.id === fav.property_id)
        }));
    }

    const { data, error } = await supabase
        .from('favorites')
        .select('*, property:properties(*, owner:users(*), property_images(*))')
        .eq('user_id', userId);

    if (error) return [];
    return data || [];
}

export async function addFavorite(userId: string, propertyId: string) {
    if (!isSupabaseConfigured) return mock.addFavorite(userId, propertyId);

    const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, property_id: propertyId }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeFavorite(userId: string, propertyId: string) {
    if (!isSupabaseConfigured) return mock.removeFavorite(userId, propertyId);

    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);

    if (error) throw error;
}

export async function isFavorite(userId: string, propertyId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return mock.isFavorite(userId, propertyId);

    const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('property_id', propertyId);

    if (error) return false;
    return (count || 0) > 0;
}

// Bookings
export async function getBookings(userId: string): Promise<Booking[]> {
    if (!isSupabaseConfigured) return mock.getBookings(userId);

    const { data, error } = await supabase
        .from('bookings')
        .select('*, property:properties(*)')
        .eq('tenant_id', userId);

    if (error) return [];
    return data || [];
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) return mock.createBooking(booking);

    const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Notifications
export async function getNotifications(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured) return mock.getNotifications(userId);

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
}
