import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import VerificationBadge from '../../components/VerificationBadge';
import { getWatermarkedUrl, needsWatermark } from '../../lib/watermark';
import { propertyService } from '../../lib/propertyService';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Home');
  const router = useRouter();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ region: 'Greater Accra', city: 'Accra' });

  const { data: properties, isLoading, refetch } = useQuery({
    queryKey: ['properties', 'available'],
    queryFn: async () => {
      return await propertyService.searchProperties({});
    },
  });

  const filterMap: Record<string, string | 'all'> = {
    Home: 'house',
    Hostel: 'hostel',
    Hotels: 'hotel',
    Apartments: 'apartment',
    Stores: 'store',
    Airbnb: 'airbnb',
    Warehouse: 'warehouse',
    Land: 'land',
    'Land/Plot': 'land',
  };

  const filterIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home-outline',
    Hostel: 'bed-outline',
    Hotels: 'business-outline',
    Apartments: 'business-outline',
    Stores: 'storefront-outline',
    Airbnb: 'bed-outline',
    Warehouse: 'cube-outline',
    Land: 'map-outline',
    'Land/Plot': 'map-outline',
  };

  const filteredProperties = (properties || []).filter((p: any) => {
    const type = filterMap[selectedFilter] || 'all';
    if (type === 'all') return true;
    return p.type === type;
  });

  const featuredProperties = filteredProperties
    .filter((p: any) => p.is_featured)
    .slice(0, 20);

  const newArrivals = filteredProperties.slice(0, 20);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={20} color="#4560F7" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationButton} onPress={() => setLocationModalOpen(true)}>
            <Ionicons name="location" size={16} color="#4560F7" />
            <Text style={styles.locationText}>{selectedLocation.city}</Text>
            <Ionicons name="chevron-down" size={16} color="#4560F7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <View style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
              <View style={styles.notificationBadge} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search" size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>Search Address, City Or Postal Code</Text>
        </TouchableOpacity>

        {/* Filter Chips */}
        <View style={styles.filterChipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {['Home', 'Hostel', 'Hotels', 'Apartments', 'Stores', 'Airbnb', 'Warehouse', 'Land/Plot'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
              >
                <Ionicons
                  name={filterIcons[filter]}
                  size={16}
                  color={selectedFilter === filter ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Listings Nearby */}
        <View style={styles.section}>
          <SectionHeader title="Listings Nearby" onPress={() => router.push('/(tabs)/search')} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4560F7" />
            </View>
          ) : filteredProperties.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredProperties.map((property: any) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() => router.push(`/property/${property.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No properties available</Text>
          )}
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <SectionHeader title="Featured Listings" onPress={() => router.push('/(tabs)/search')} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4560F7" />
            </View>
          ) : featuredProperties.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredProperties.map((property: any) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() => router.push(`/property/${property.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No featured listings yet</Text>
          )}
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <SectionHeader title="New Arrivals" onPress={() => router.push('/(tabs)/search')} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4560F7" />
            </View>
          ) : newArrivals.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {newArrivals.map((property: any) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() => router.push(`/property/${property.id}`)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No new listings available</Text>
          )}
        </View>

      </ScrollView>

      <Modal
        visible={locationModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationModalOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                { region: 'Greater Accra', city: 'Accra' },
                { region: 'Ashanti', city: 'Kumasi' },
                { region: 'Western', city: 'Takoradi' },
                { region: 'Central', city: 'Cape Coast' },
                { region: 'Eastern', city: 'Koforidua' },
                { region: 'Volta', city: 'Ho' },
                { region: 'Northern', city: 'Tamale' },
                { region: 'Upper East', city: 'Bolgatanga' },
                { region: 'Upper West', city: 'Wa' },
                { region: 'Brong Ahafo', city: 'Sunyani' },
              ]}
              keyExtractor={(item) => `${item.region}-${item.city}`}
              renderItem={({ item }) => {
                const isActive =
                  item.region === selectedLocation.region && item.city === selectedLocation.city;
                return (
                  <TouchableOpacity
                    style={[styles.modalRow, isActive && styles.modalRowActive]}
                    onPress={() => {
                      setSelectedLocation(item);
                      setLocationModalOpen(false);
                    }}
                  >
                    <View>
                      <Text style={styles.modalRowTitle}>{item.city}</Text>
                      <Text style={styles.modalRowSubtitle}>{item.region}</Text>
                    </View>
                    {isActive && <Ionicons name="checkmark" size={20} color="#4560F7" />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.sectionLink}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

function PropertyCard({ property, onPress }: { property: any; onPress: () => void }) {
  const imageUrls = (property.property_images || [])
    .map((img: any) => img.image_url)
    .filter(Boolean);
  const ownerName = property.owner?.full_name || 'Owner';
  const isHost = property.owner?.role === 'airbnb_host';
  const isVerified = property.owner?.verification_status === 'verified';
  const ownerLabel = isHost
    ? `Hosted by ${ownerName}${isVerified ? ' (Verified Host)' : ''}`
    : `Listed by ${ownerName}${isVerified ? ' (Verified Owner)' : ''}`;

  return (
    <TouchableOpacity style={styles.propertyCard} onPress={onPress}>
      {imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {imageUrls.map((url: string, index: number) => (
            <Image
              key={`${property.id}-image-${index}`}
              source={{ 
                uri: needsWatermark(property.type) 
                  ? getWatermarkedUrl(url) 
                  : url 
              }}
              style={styles.propertyImage}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color="#999" />
        </View>
      )}
      {property.is_featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.propertyLocation} numberOfLines={1}>
          {property.area}, {property.city}
        </Text>
        <View style={styles.ownerRow}>
          <Text style={styles.ownerLabel}>
            {ownerLabel}
          </Text>
        </View>
        <View style={styles.propertyFooter}>
          <Text style={styles.propertyPrice}>
            {formatCurrency(property.price)}/{property.payment_type}
          </Text>
          <View style={styles.propertyTypeBadge}>
            <Text style={styles.propertyTypeText}>
              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4560F7',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalRowActive: {
    backgroundColor: '#F6F8FF',
  },
  modalRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalRowSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  filterChipsContainer: {
    marginBottom: 24,
  },
  filterChips: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChipActive: {
    backgroundColor: '#4560F7',
    borderColor: '#4560F7',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  sectionLink: {
    fontSize: 14,
    color: '#4560F7',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#999',
  },
  propertyCard: {
    width: 280,
    marginLeft: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  propertyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    padding: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#4560F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ownerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4560F7',
  },
  propertyTypeBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  propertyTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4560F7',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

