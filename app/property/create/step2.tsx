import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { getListingLimitForUser, getProperties, saveProperty } from '../../../lib/mockData';
import { AMENITIES } from '../../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation, geocodeAddress } from '../../../lib/locationService';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { getMockProfile } from '../../../lib/mockAuth';
import ImageUpload from '../../../components/ImageUpload';

export default function PropertyCreateStep2Screen() {
  const { formData: formDataParam } = useLocalSearchParams<{ formData: string }>();
  const { user } = useAuth();
  const isHost = user?.role === 'airbnb_host';
  const router = useRouter();
  
  const [formStep1, setFormStep1] = useState<any>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formDataParam) {
      try {
        const parsed = JSON.parse(formDataParam);
        setFormStep1(parsed);
        // Extract location from address
        if (parsed.area && parsed.city) {
          handleGeocodeLocation(`${parsed.area}, ${parsed.city}, ${parsed.region}`);
        }
      } catch (e) {
        console.error('Error parsing form data:', e);
        router.back();
      }
    }
  }, [formDataParam, router]);

  const handleGeocodeLocation = async (address: string) => {
    const location = await geocodeAddress(address);
    if (location) {
      setLatitude(location.latitude.toString());
      setLongitude(location.longitude.toString());
    }
  };

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setLatitude(location.latitude.toString());
      setLongitude(location.longitude.toString());
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to create a property');
      return;
    }

    if (!formStep1) {
      Alert.alert('Error', 'Missing property information');
      return;
    }

    if (user.role === 'agent' || user.role === 'landlord') {
      const mockProfile = !isSupabaseConfigured ? await getMockProfile() : null;
      const currentUser = { ...user, ...mockProfile };
      const listingLimit = getListingLimitForUser(currentUser);
      const allProperties = await getProperties();
      const activeListings = allProperties.filter((p) => p.owner_id === user.id).length;
      if (activeListings >= listingLimit) {
        Alert.alert(
          'Upgrade required',
          `Your current plan allows ${listingLimit} listing${listingLimit === 1 ? '' : 's'}. Upgrade to add more.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/payments') },
          ]
        );
        return;
      }
    }

    if (isHost && formStep1.type !== 'airbnb') {
      Alert.alert('Error', 'Airbnb hosts can only list short-stay properties.');
      return;
    }

    if (isHost && formStep1.payment_type !== 'daily') {
      Alert.alert('Error', 'Short-stay listings must use daily pricing.');
      return;
    }

    setLoading(true);
    try {
      // Save property with mock data
      const property = await saveProperty({
        owner_id: user.id,
        title: formStep1.title,
        description: formStep1.description || null,
        type: formStep1.type,
        price: parseFloat(formStep1.price) || 0,
        payment_type: formStep1.payment_type,
        region: formStep1.region,
        city: formStep1.city,
        area: formStep1.area,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        bedrooms: formStep1.bedrooms ? parseInt(formStep1.bedrooms) : null,
        bathrooms: formStep1.bathrooms ? parseInt(formStep1.bathrooms) : null,
        furnished: formStep1.furnished,
        parking: formStep1.parking,
        amenities,
        status: 'pending',
        is_available: false,
        images: images.map(img => img.url), // Store image URLs
      });

      // Save images to mock storage (in real app, upload to Supabase Storage)
      // For now, we'll just store the URIs
      if (images && images.length > 0) {
        console.log('Images saved:', images.length);
      }

      Alert.alert(
        'Submitted',
        'Your listing was submitted for approval. You’ll be notified once it’s approved.',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/property/${property.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'tenant') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
          <Text style={styles.lockTitle}>Listings are for agents, landlords, and hosts</Text>
          <Text style={styles.lockSubtitle}>Switch role to create listings</Text>
          <TouchableOpacity style={styles.lockButton} onPress={() => router.push('/switch-role')}>
            <Text style={styles.lockButtonText}>Switch Role</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!formStep1) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step 2 of 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>Step 2</Text>
          <Text style={styles.stepTitle}>Add Details & Amenities</Text>
        </View>

        {/* Location Coordinates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Coordinates</Text>
          <Text style={styles.sectionDescription}>
            Add GPS coordinates for better search results (optional)
          </Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0000"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0000"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
            <Ionicons name="location" size={20} color="#0066FF" />
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Property Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Images</Text>
          <Text style={styles.sectionDescription}>
            Add high-quality photos to attract more tenants
          </Text>

          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={8}
            maxSize={5}
            label="Property Photos"
          />
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <Text style={styles.sectionDescription}>Select all that apply</Text>

          <View style={styles.amenitiesGrid}>
            {AMENITIES.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityChip,
                  amenities.includes(amenity) && styles.amenityChipActive,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                {amenities.includes(amenity) && (
                  <Ionicons name="checkmark-circle" size={20} color="#0066FF" />
                )}
                <Text
                  style={[
                    styles.amenityText,
                    amenities.includes(amenity) && styles.amenityTextActive,
                  ]}
                >
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Review Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review</Text>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Title:</Text>
            <Text style={styles.reviewValue}>{formStep1.title}</Text>

            <Text style={styles.reviewLabel}>Type:</Text>
            <Text style={styles.reviewValue}>
              {formStep1.type.charAt(0).toUpperCase() + formStep1.type.slice(1)}
            </Text>

            <Text style={styles.reviewLabel}>Price:</Text>
            <Text style={styles.reviewValue}>
              ₵{parseFloat(formStep1.price || '0').toLocaleString()}/{formStep1.payment_type}
            </Text>

            <Text style={styles.reviewLabel}>Location:</Text>
            <Text style={styles.reviewValue}>
              {formStep1.area}, {formStep1.city}, {formStep1.region}
            </Text>

            <Text style={styles.reviewLabel}>Photos:</Text>
            <Text style={styles.reviewValue}>{formStep1.images?.length || 0} images</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Publish Property'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  amenityChipActive: {
    backgroundColor: '#F0F7FF',
    borderColor: '#0066FF',
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  amenityTextActive: {
    color: '#0066FF',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  lockButton: {
    marginTop: 20,
    backgroundColor: '#4560F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lockButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

