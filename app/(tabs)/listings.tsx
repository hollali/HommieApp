import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function ListingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: listings, isLoading, refetch } = useQuery({
    queryKey: ['listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Use mock data
      const { getProperties } = await import('../../lib/mockData');
      const allProperties = await getProperties();
      return allProperties
        .filter((p) => p.owner_id === user.id)
        .map((p) => ({
          ...p,
          property_images: [],
        }));
    },
    enabled: !!user && user.role !== 'tenant',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/property/create/step1')}
        >
          <Ionicons name="add" size={24} color="#4560F7" />
        </TouchableOpacity>
      </View>

      {user?.role === 'tenant' ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Listings are for agents, landlords, and hosts</Text>
          <Text style={styles.emptySubtext}>Switch role to create listings</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/switch-role')}
          >
            <Text style={styles.createButtonText}>Switch Role</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading listings...</Text>
        </View>
      ) : listings && listings.length > 0 ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ListingItem
              listing={item}
              onPress={() => router.push(`/property/${item.id}/edit`)}
            />
          )}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="home-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No listings yet</Text>
          <Text style={styles.emptySubtext}>Create your first property listing</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/property/create')}
          >
            <Text style={styles.createButtonText}>Create Listing</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ListingItem({ listing, onPress }: { listing: any; onPress: () => void }) {
  const imageUrls = (listing?.property_images || [])
    .map((img: any) => img.image_url)
    .filter(Boolean);

  return (
    <TouchableOpacity style={styles.listingItem} onPress={onPress}>
      {imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {imageUrls.map((url: string, index: number) => (
            <Image
              key={`${listing.id}-image-${index}`}
              source={{ uri: url }}
              style={styles.listingImage}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.listingImage, styles.listingImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color="#999" />
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.listingLocation} numberOfLines={1}>
          {listing.area}, {listing.city}
        </Text>
        <Text style={styles.listingPrice}>
          {formatCurrency(listing.price)}/{listing.payment_type}
        </Text>
        <View
          style={[
            styles.statusBadge,
            listing.status === 'approved'
              ? styles.statusBadgeAvailable
              : listing.status === 'pending'
                ? styles.statusBadgePending
                : styles.statusBadgeUnavailable,
          ]}
        >
          <Text style={styles.statusText}>
            {listing.status === 'approved'
              ? 'Approved'
              : listing.status === 'pending'
                ? 'Pending Approval'
                : 'Unavailable'}
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 20,
  },
  listingItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listingImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  listingImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4560F7',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeAvailable: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgePending: {
    backgroundColor: '#FFF8E1',
  },
  statusBadgeUnavailable: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4560F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

