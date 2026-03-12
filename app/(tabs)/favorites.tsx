import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { getFavorites } = await import('../../lib/data');
      return await getFavorites(user.id);
    },
    enabled: !!user,
  });

  const handleRemoveFavorite = async (propertyId: string) => {
    if (!user) return;
    try {
      const { removeFavorite } = await import('../../lib/data');
      await removeFavorite(user.id, propertyId);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove favorite');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please sign in to view favorites</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading favorites...</Text>
        </View>
      ) : favorites && favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (!item.property) return null;
            return (
              <FavoriteItem
                favorite={item}
                onPress={() => router.push(`/property/${item.property!.id}`)}
                onRemove={() => handleRemoveFavorite(item.property_id)}
              />
            );
          }}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>Start saving properties you like</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.browseButtonText}>Browse Properties</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function FavoriteItem({ favorite, onPress, onRemove }: { favorite: any; onPress: () => void; onRemove: () => void }) {
  const property = favorite.property;
  const imageUrls = (property?.property_images || [])
    .map((img: any) => img.image_url)
    .filter(Boolean);

  return (
    <TouchableOpacity style={styles.favoriteItem} onPress={onPress}>
      {imageUrls.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {imageUrls.map((url: string, index: number) => (
            <Image
              key={`${property?.id || 'favorite'}-image-${index}`}
              source={{ uri: url }}
              style={styles.favoriteImage}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.favoriteImage, styles.favoriteImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color="#999" />
        </View>
      )}
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteTitle} numberOfLines={2}>
          {property?.title}
        </Text>
        <Text style={styles.favoriteLocation} numberOfLines={1}>
          {property?.area}, {property?.city}
        </Text>
        <Text style={styles.favoritePrice}>
          {formatCurrency(property?.price || 0)}/{property?.payment_type}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Ionicons name="heart" size={24} color="#FF3B30" />
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  listContent: {
    padding: 20,
  },
  favoriteItem: {
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
  favoriteImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  favoriteImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  favoriteLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  favoritePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
  },
  removeButton: {
    padding: 12,
    justifyContent: 'center',
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
  browseButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

