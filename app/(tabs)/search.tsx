import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PropertyType } from '../../lib/types';
import { formatCurrency, PROPERTY_TYPES, AMENITIES } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { getWatermarkedUrl, needsWatermark } from '../../lib/watermark';
import { LocationSuggestions } from '../../components/LocationSuggestions';
import AdvancedSearchFilters, { SearchFilters } from '../../components/AdvancedSearchFilters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation, geocodeAddress } from '../../lib/locationService';

const SAVED_SEARCHES_KEY = '@hommie:saved-searches';

type SavedSearch = {
  id: string;
  name: string;
  created_at: string;
  filters: {
    searchQuery: string;
    selectedType: PropertyType | 'all';
    selectedRegion: string;
    priceRange: [number, number];
    minBedrooms: number | null;
    minBathrooms: number | null;
    hasParking: boolean | null;
    selectedLocation: { region?: string; city?: string; area?: string } | null;
    selectedAmenities: string[];
    radiusKm: number | null;
    centerLocation: { latitude: number; longitude: number; label?: string } | null;
  };
};

export default function SearchScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | 'all'>(
    (type as PropertyType) || 'all'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [minBathrooms, setMinBathrooms] = useState<number | null>(null);
  const [hasParking, setHasParking] = useState<boolean | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [centerLocation, setCenterLocation] = useState<{ latitude: number; longitude: number; label?: string } | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    searchQuery: '',
    selectedType: 'all',
    selectedRegion: 'all',
    priceRange: [0, 100000],
    minBedrooms: null,
    minBathrooms: null,
    hasParking: null,
    furnished: null,
    selectedAmenities: [],
    sortBy: 'newest',
    radiusKm: null,
  });
  const [selectedLocation, setSelectedLocation] = useState<{ region?: string; city?: string; area?: string } | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem(SAVED_SEARCHES_KEY).then((raw) => {
      if (!raw) return;
      try {
        setSavedSearches(JSON.parse(raw));
      } catch {
        setSavedSearches([]);
      }
    });
  }, []);

  const saveSearches = async (next: SavedSearch[]) => {
    setSavedSearches(next);
    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
  };

  const handleSaveSearch = async () => {
    const next: SavedSearch = {
      id: `search_${Date.now()}`,
      name: `Search ${savedSearches.length + 1}`,
      created_at: new Date().toISOString(),
      filters: {
        searchQuery,
        selectedType,
        selectedRegion,
        priceRange,
        minBedrooms,
        minBathrooms,
        hasParking,
        selectedLocation,
        selectedAmenities,
        radiusKm,
        centerLocation,
      },
    };
    await saveSearches([next, ...savedSearches]);
    Alert.alert('Saved', 'Search saved to your list.');
  };

  const handleApplySavedSearch = (search: SavedSearch) => {
    const filters = search.filters;
    setSearchQuery(filters.searchQuery);
    setSelectedType(filters.selectedType);
    setSelectedRegion(filters.selectedRegion);
    setPriceRange(filters.priceRange);
    setMinBedrooms(filters.minBedrooms);
    setMinBathrooms(filters.minBathrooms);
    setHasParking(filters.hasParking);
    setSelectedLocation(filters.selectedLocation);
    setSelectedAmenities(filters.selectedAmenities || []);
    setRadiusKm(filters.radiusKm || null);
    setCenterLocation(filters.centerLocation || null);
    setShowFilters(false);
  };

  const handleDeleteSavedSearch = async (id: string) => {
    const next = savedSearches.filter((s) => s.id !== id);
    await saveSearches(next);
  };

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const { data: properties, isLoading } = useQuery({
    queryKey: [
      'properties',
      'search',
      selectedType,
      selectedRegion,
      priceRange,
      searchQuery,
      minBedrooms,
      minBathrooms,
      hasParking,
      selectedAmenities,
      radiusKm,
      centerLocation,
    ],
    queryFn: async () => {
      const { getProperties } = await import('../../lib/data');
      let allProperties = await getProperties();

      // Filter by availability
      allProperties = allProperties.filter((p) => p.is_available && p.status === 'approved');

      // Filter by type
      if (selectedType !== 'all') {
        allProperties = allProperties.filter((p) => p.type === selectedType);
      }

      // Filter by region
      if (selectedRegion !== 'all') {
        allProperties = allProperties.filter((p) => p.region === selectedRegion);
      }

      // Filter by price range
      allProperties = allProperties.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );

      // Filter by bedrooms
      if (minBedrooms !== null) {
        allProperties = allProperties.filter(
          (p) => p.bedrooms !== null && p.bedrooms >= minBedrooms
        );
      }

      // Filter by bathrooms
      if (minBathrooms !== null) {
        allProperties = allProperties.filter(
          (p) => p.bathrooms !== null && p.bathrooms >= minBathrooms
        );
      }

      // Filter by parking
      if (hasParking !== null) {
        allProperties = allProperties.filter(
          (p) => p.parking === hasParking
        );
      }

      // Filter by amenities
      if (selectedAmenities.length > 0) {
        allProperties = allProperties.filter((p) =>
          selectedAmenities.every((amenity) => p.amenities?.includes(amenity))
        );
      }

      // Filter by selected location or search query
      if (selectedLocation) {
        if (selectedLocation.area) {
          allProperties = allProperties.filter((p) => p.area.toLowerCase().includes(selectedLocation.area!.toLowerCase()));
        }
        if (selectedLocation.city) {
          allProperties = allProperties.filter((p) => p.city.toLowerCase() === selectedLocation.city!.toLowerCase());
        }
        if (selectedLocation.region) {
          allProperties = allProperties.filter((p) => p.region.toLowerCase() === selectedLocation.region!.toLowerCase());
        }
      } else if (searchQuery) {
        // Fallback to text search if no location selected
        const query = searchQuery.toLowerCase();
        allProperties = allProperties.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.area.toLowerCase().includes(query) ||
            p.city.toLowerCase().includes(query) ||
            p.region.toLowerCase().includes(query)
        );
      }

      // Filter by radius if center is set
      if (radiusKm && centerLocation) {
        allProperties = allProperties.filter((p) => {
          if (p.latitude == null || p.longitude == null) return false;
          const distance = haversineKm(
            centerLocation.latitude,
            centerLocation.longitude,
            p.latitude,
            p.longitude
          );
          return distance <= radiusKm;
        });
      }

      return allProperties.map((p) => ({
        ...p,
        property_images: [],
      }));
    },
  });

  // Properties are already filtered in the query
  const filteredProperties = properties;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search Address, City Or Postal Code"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowLocationSuggestions(text.length > 0);
            }}
            onFocus={() => {
              if (searchQuery.length > 0) {
                setShowLocationSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow suggestion click
              setTimeout(() => setShowLocationSuggestions(false), 200);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedLocation(null);
                setShowLocationSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {showLocationSuggestions && (
          <LocationSuggestions
            query={searchQuery}
            onSelect={(location) => {
              setSearchQuery(location.label);
              setSelectedLocation({
                region: location.region,
                city: location.city,
                area: location.type === 'area' ? location.label.split(',')[0] : undefined,
              });
              geocodeAddress(location.label).then((result) => {
                if (result) {
                  setCenterLocation({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    label: result.address || location.label,
                  });
                }
              });
              setShowLocationSuggestions(false);
              searchInputRef.current?.blur();
            }}
            onDismiss={() => setShowLocationSuggestions(false)}
          />
        )}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <View style={styles.filterButtonContent}>
            <Ionicons name="options" size={20} color={showFilters ? '#4560F7' : '#000'} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowAdvancedFilters(true)}
        >
          <View style={styles.filterButtonContent}>
            <Ionicons name="funnel-outline" size={20} color="#000" />
            <Text style={styles.filterButtonText}>Advanced</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredProperties?.length || 0} homes found
        </Text>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
            {/* Property Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Property Type</Text>
              <View style={styles.filterRow}>
                {['all', ...PROPERTY_TYPES.map((t) => t.value)].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.filterChip,
                      selectedType === t && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedType(t as any)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedType === t && styles.filterChipTextActive,
                      ]}
                    >
                      {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bedrooms Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Bedrooms</Text>
              <View style={styles.filterRow}>
                {[null, 1, 2, 3, 4, 5].map((beds) => (
                  <TouchableOpacity
                    key={beds ?? 'any'}
                    style={[
                      styles.filterChip,
                      minBedrooms === beds && styles.filterChipActive,
                    ]}
                    onPress={() => setMinBedrooms(beds)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        minBedrooms === beds && styles.filterChipTextActive,
                      ]}
                    >
                      {beds === null ? 'Any' : `${beds}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bathrooms Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Bathrooms</Text>
              <View style={styles.filterRow}>
                {[null, 1, 2, 3, 4].map((baths) => (
                  <TouchableOpacity
                    key={baths ?? 'any'}
                    style={[
                      styles.filterChip,
                      minBathrooms === baths && styles.filterChipActive,
                    ]}
                    onPress={() => setMinBathrooms(baths)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        minBathrooms === baths && styles.filterChipTextActive,
                      ]}
                    >
                      {baths === null ? 'Any' : `${baths}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Parking Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Parking</Text>
              <View style={styles.filterRow}>
                {[null, true, false].map((parking) => (
                  <TouchableOpacity
                    key={parking === null ? 'any' : parking ? 'yes' : 'no'}
                    style={[
                      styles.filterChip,
                      hasParking === parking && styles.filterChipActive,
                    ]}
                    onPress={() => setHasParking(parking)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        hasParking === parking && styles.filterChipTextActive,
                      ]}
                    >
                      {parking === null ? 'Any' : parking ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
              </Text>
              <View style={styles.priceInputRow}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    value={priceRange[0] === 0 ? '' : priceRange[0].toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setPriceRange([val, priceRange[1]]);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="100000"
                    value={priceRange[1] === 100000 ? '' : priceRange[1].toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 100000;
                      setPriceRange([priceRange[0], val]);
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Amenities</Text>
              <View style={styles.filterRow}>
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.filterChip,
                      selectedAmenities.includes(amenity) && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      setSelectedAmenities((prev) =>
                        prev.includes(amenity)
                          ? prev.filter((a) => a !== amenity)
                          : [...prev, amenity]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedAmenities.includes(amenity) && styles.filterChipTextActive,
                      ]}
                    >
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Map Radius */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Map Radius</Text>
              <View style={styles.filterRow}>
                {[null, 5, 10, 25, 50].map((radius) => (
                  <TouchableOpacity
                    key={radius === null ? 'any' : radius}
                    style={[
                      styles.filterChip,
                      radiusKm === radius && styles.filterChipActive,
                    ]}
                    onPress={() => setRadiusKm(radius)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        radiusKm === radius && styles.filterChipTextActive,
                      ]}
                    >
                      {radius === null ? 'Any' : `${radius} km`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={async () => {
                    const location = await getCurrentLocation();
                    if (!location) return;
                    setCenterLocation({
                      latitude: location.latitude,
                      longitude: location.longitude,
                      label: location.address || 'Current location',
                    });
                    if (!radiusKm) setRadiusKm(10);
                  }}
                >
                  <Ionicons name="locate-outline" size={16} color="#4560F7" />
                  <Text style={styles.locationButtonText}>Use my location</Text>
                </TouchableOpacity>
                {centerLocation?.label && (
                  <Text style={styles.locationNote}>Center: {centerLocation.label}</Text>
                )}
              </View>
            </View>

            {/* Saved Searches */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Saved Searches</Text>
              {savedSearches.length === 0 ? (
                <Text style={styles.savedEmptyText}>No saved searches yet.</Text>
              ) : (
                <View style={styles.savedSearchList}>
                  {savedSearches.map((item) => (
                    <View key={item.id} style={styles.savedSearchItem}>
                      <TouchableOpacity onPress={() => handleApplySavedSearch(item)}>
                        <Text style={styles.savedSearchText}>{item.name}</Text>
                        <Text style={styles.savedSearchSubText}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteSavedSearch(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.saveSearchButton} onPress={handleSaveSearch}>
                <Ionicons name="bookmark-outline" size={16} color="#FFF" />
                <Text style={styles.saveSearchText}>Save Search</Text>
              </TouchableOpacity>
            </View>

            {/* Clear Filters */}
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedType('all');
                setSelectedRegion('all');
                setPriceRange([0, 100000]);
                setMinBedrooms(null);
                setMinBathrooms(null);
                setHasParking(null);
                setSelectedAmenities([]);
                setRadiusKm(null);
                setCenterLocation(null);
                setSelectedLocation(null);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.mapViewButton}
            onPress={() => router.push('/search/map')}
          >
            <Ionicons name="map" size={20} color="#4560F7" />
            <Text style={styles.mapViewText}>Map View</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <PropertyListItem
            property={item}
            onPress={() => router.push(`/property/${item.id}`)}
          />
        )}
        refreshing={isLoading}
      />

      <AdvancedSearchFilters
        visible={showAdvancedFilters}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={() => {
          // Apply advanced filters to search
          setSearchQuery(advancedFilters.searchQuery);
          setSelectedType(advancedFilters.selectedType);
          setSelectedRegion(advancedFilters.selectedRegion);
          setPriceRange(advancedFilters.priceRange);
          setMinBedrooms(advancedFilters.minBedrooms);
          setMinBathrooms(advancedFilters.minBathrooms);
          setHasParking(advancedFilters.hasParking);
          setSelectedAmenities(advancedFilters.selectedAmenities);
          setRadiusKm(advancedFilters.radiusKm);
          setShowAdvancedFilters(false);
        }}
        onReset={() => {
          // Reset all filters
          setSearchQuery('');
          setSelectedType('all');
          setSelectedRegion('all');
          setPriceRange([0, 100000]);
          setMinBedrooms(null);
          setMinBathrooms(null);
          setHasParking(null);
          setSelectedAmenities([]);
          setRadiusKm(null);
          setShowAdvancedFilters(false);
        }}
      />
    </SafeAreaView>
  );
}

function PropertyListItem({ property, onPress }: { property: any; onPress: () => void }) {
  const imageUrls = (property.property_images || [])
    .map((img: any) => img.image_url)
    .filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isForSale = property.payment_type === 'monthly' && property.type !== 'airbnb';
  const ownerName = property.owner?.full_name || 'Owner';
  const isHost = property.owner?.role === 'airbnb_host';
  const isVerified = property.owner?.verification_status === 'verified';
  const ownerLabel = isHost
    ? `Hosted by ${ownerName}${isVerified ? ' (Verified Host)' : ''}`
    : `Listed by ${ownerName}${isVerified ? ' (Verified Owner)' : ''}`;

  const handleImageScrollEnd = (event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const nextIndex = Math.round(contentOffset.x / layoutMeasurement.width);
    setActiveImageIndex(nextIndex);
  };

  return (
    <TouchableOpacity style={styles.propertyItem} onPress={onPress}>
      <View style={styles.propertyImageContainer}>
        {imageUrls.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScrollEnd}
          >
            {imageUrls.map((url: string, index: number) => (
              <Image
                key={`${property.id}-image-${index}`}
                source={{ 
                  uri: needsWatermark(property.type) 
                    ? getWatermarkedUrl(url) 
                    : url 
                }}
                style={styles.propertyItemImage}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.propertyItemImage, styles.propertyItemImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#999" />
          </View>
        )}
        <View style={styles.propertyTag}>
          <Text style={styles.propertyTagText}>
            {isForSale ? 'For Sale' : 'For Rent'}
          </Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#FFF" />
        </TouchableOpacity>
        {imageUrls.length > 1 && (
          <View style={styles.imageIndicator}>
            {imageUrls.map((_: string, i: number) => (
              <View
                key={`${property.id}-dot-${i}`}
                style={[styles.indicatorDot, i === activeImageIndex && styles.indicatorDotActive]}
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.propertyItemInfo}>
        <Text style={styles.propertyItemPrice}>
          {isForSale
            ? formatCurrency(property.price)
            : `${formatCurrency(property.price)}/ ${property.payment_type === 'monthly' ? 'A Month' : property.payment_type}`}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4560F7" />
          <Text style={styles.propertyItemLocation} numberOfLines={1}>
            {property.area}, {property.city}
          </Text>
        </View>
        <Text style={styles.ownerLabel} numberOfLines={1}>
          {ownerLabel}
        </Text>
        <View style={styles.propertyItemDetails}>
          {property.bedrooms && (
            <View style={styles.propertyItemDetail}>
              <Ionicons name="bed" size={18} color="#666" />
              <Text style={styles.propertyItemDetailText}>{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms && (
            <View style={styles.propertyItemDetail}>
              <Ionicons name="water" size={18} color="#666" />
              <Text style={styles.propertyItemDetailText}>{property.bathrooms}</Text>
            </View>
          )}
          {property.parking && (
            <View style={styles.propertyItemDetail}>
              <Ionicons name="car" size={18} color="#666" />
              <Text style={styles.propertyItemDetailText}>Parking</Text>
            </View>
          )}
          <View style={styles.propertyItemDetail}>
            <Ionicons name="square-outline" size={18} color="#666" />
            <Text style={styles.propertyItemDetailText}>1200sqt</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
    position: 'relative',
    zIndex: 100,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    padding: 8,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  filtersContainer: {
    backgroundColor: '#F9F9F9',
    maxHeight: 400,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersScroll: {
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationActions: {
    marginTop: 10,
    gap: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4560F7',
  },
  locationNote: {
    fontSize: 12,
    color: '#666',
  },
  savedSearchList: {
    gap: 10,
  },
  savedSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  savedSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  savedSearchSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  savedEmptyText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  saveSearchButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4560F7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  saveSearchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  priceInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  clearFiltersButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4560F7',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4560F7',
    borderColor: '#4560F7',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 20,
  },
  mapViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  mapViewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4560F7',
  },
  propertyItem: {
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
  propertyImageContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  propertyItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  propertyItemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 102, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  propertyTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -24 }],
    flexDirection: 'row',
    gap: 4,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorDotActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  propertyItemInfo: {
    padding: 16,
  },
  propertyItemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4560F7',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  propertyItemLocation: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  ownerLabel: {
    fontSize: 12,
    color: '#4560F7',
    marginBottom: 12,
  },
  propertyItemDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  propertyItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyItemDetailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  },
});

