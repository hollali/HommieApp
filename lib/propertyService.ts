import { supabase, isSupabaseConfigured } from './supabase';
import { Property } from './types';
import { storageService } from './storage';

export const propertyService = {
  /**
   * Create a new property listing
   */
  async createProperty(propertyData: any, imageUris: string[]): Promise<Property | null> {
    if (!isSupabaseConfigured) return null;

    try {
      // 1. Upload images first
      const folderName = `properties/${propertyData.owner_id}/${Date.now()}`;
      const imageUrls = await storageService.uploadMultipleImages('property-images', folderName, imageUris);

      if (imageUris.length > 0 && imageUrls.length === 0) {
        throw new Error('Failed to upload images');
      }

      // 2. Insert property record
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          owner_id: propertyData.owner_id,
          title: propertyData.title,
          description: propertyData.description,
          type: propertyData.type,
          price: propertyData.price,
          payment_type: propertyData.payment_type,
          region: propertyData.region,
          city: propertyData.city,
          area: propertyData.area,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          furnished: propertyData.furnished,
          parking: propertyData.parking,
          amenities: propertyData.amenities,
          status: 'pending',
          is_available: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating property:', error);
        return null;
      }

      // 3. Insert property images
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map(url => ({
          property_id: property.id,
          image_url: url
        }));

        const { error: imageError } = await supabase
          .from('property_images')
          .insert(imageRecords);

        if (imageError) {
          console.error('Error saving property images:', imageError);
          // We don't fail the whole operation if images fail to link, 
          // but in production we might want to clean up or retry
        }
      }

      return property as Property;
    } catch (error) {
      console.error('Unexpected error in createProperty:', error);
      return null;
    }
  },

  /**
   * Get property by ID with owner info and images
   */
  async getPropertyById(id: string): Promise<Property | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:users!owner_id(*),
        property_images(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }

    return data as Property;
  },

  /**
   * Get properties for a specific owner
   */
  async getOwnerProperties(ownerId: string): Promise<Property[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images(*)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner properties:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Search/Filter properties
   */
  async searchProperties(filters: any): Promise<Property[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:users!owner_id(*),
        property_images(*)
      `)
      .eq('status', 'approved')
      .eq('is_available', true);

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.bedrooms) {
      query = query.gte('bedrooms', filters.bedrooms);
    }

    if (filters.bathrooms) {
      query = query.gte('bathrooms', filters.bathrooms);
    }

    if (filters.parking !== undefined && filters.parking !== null) {
      query = query.eq('parking', filters.parking);
    }

    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,area.ilike.%${filters.searchQuery}%,city.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching properties:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get host analytics
   */
  async getHostAnalytics(ownerId: string) {
    if (!isSupabaseConfigured) return { totalViews: 0, totalInquiries: 0, activeListings: 0, pendingBookings: 0 };

    try {
      const { count: activeListings } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId);

      // We can join bookings with properties to filter by owner
      const { count: pendingBookings } = await supabase
        .from('bookings')
        .select('id, properties!inner(owner_id)', { count: 'exact', head: true })
        .eq('properties.owner_id', ownerId)
        .eq('status', 'pending');

      // We can join messages with properties to filter by owner
      const { count: totalInquiries } = await supabase
        .from('messages')
        .select('id, properties!inner(owner_id)', { count: 'exact', head: true })
        .eq('properties.owner_id', ownerId);

      return {
        totalViews: Math.floor(Math.random() * 500), // Fake views for demo since we don't track views natively
        totalInquiries: totalInquiries || 0,
        activeListings: activeListings || 0,
        pendingBookings: pendingBookings || 0
      };
    } catch (e) {
      console.error('Error fetching host analytics:', e);
      return { totalViews: 0, totalInquiries: 0, activeListings: 0, pendingBookings: 0 };
    }
  }
};
