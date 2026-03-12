import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PropertyType } from '../lib/types';
import { PROPERTY_TYPES, AMENITIES, GHANA_REGIONS } from '../lib/constants';

export interface SearchFilters {
  searchQuery: string;
  selectedType: PropertyType | 'all';
  selectedRegion: string;
  priceRange: [number, number];
  minBedrooms: number | null;
  minBathrooms: number | null;
  hasParking: boolean | null;
  furnished: boolean | null;
  selectedAmenities: string[];
  sortBy: 'price_low' | 'price_high' | 'newest' | 'popular';
  radiusKm: number | null;
}

interface AdvancedSearchFiltersProps {
  visible: boolean;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  visible,
  filters,
  onFiltersChange,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity],
    }));
  };

  const handlePriceRangeChange = (index: 0 | 1, value: string) => {
    const numValue = parseInt(value) || 0;
    const newRange: [number, number] = [...localFilters.priceRange];
    newRange[index] = numValue;
    
    // Ensure min <= max
    if (index === 0 && numValue > newRange[1]) {
      newRange[1] = numValue;
    } else if (index === 1 && numValue < newRange[0]) {
      newRange[0] = numValue;
    }
    
    updateFilter('priceRange', newRange);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
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
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    onReset();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.selectedType !== 'all') count++;
    if (localFilters.selectedRegion !== 'all') count++;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 100000) count++;
    if (localFilters.minBedrooms !== null) count++;
    if (localFilters.minBathrooms !== null) count++;
    if (localFilters.hasParking !== null) count++;
    if (localFilters.furnished !== null) count++;
    if (localFilters.selectedAmenities.length > 0) count++;
    if (localFilters.sortBy !== 'newest') count++;
    if (localFilters.radiusKm !== null) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Advanced Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsContainer}>
                {(['all', ...PROPERTY_TYPES.map(t => t.value)] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      localFilters.selectedType === type && styles.chipActive,
                    ]}
                    onPress={() => updateFilter('selectedType', type)}
                  >
                    <Text style={[
                      styles.chipText,
                      localFilters.selectedType === type && styles.chipTextActive,
                    ]}>
                      {type === 'all' ? 'All Types' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Region */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsContainer}>
                {['all', ...GHANA_REGIONS.map(r => r.name)].map((region) => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.chip,
                      localFilters.selectedRegion === region && styles.chipActive,
                    ]}
                    onPress={() => updateFilter('selectedRegion', region)}
                  >
                    <Text style={[
                      styles.chipText,
                      localFilters.selectedRegion === region && styles.chipTextActive,
                    ]}>
                      {region === 'all' ? 'All Regions' : region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range (GHS/month)</Text>
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  value={localFilters.priceRange[0].toString()}
                  onChangeText={(value) => handlePriceRangeChange(0, value)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.priceSeparator}>
                <Ionicons name="remove" size={16} color="#666" />
              </View>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  value={localFilters.priceRange[1].toString()}
                  onChangeText={(value) => handlePriceRangeChange(1, value)}
                  keyboardType="numeric"
                  placeholder="100000"
                />
              </View>
            </View>
          </View>

          {/* Bedrooms & Bathrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bedrooms & Bathrooms</Text>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Min Bedrooms</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => {
                    const options = [null, 1, 2, 3, 4, 5];
                    const currentIndex = options.indexOf(localFilters.minBedrooms);
                    const nextIndex = (currentIndex + 1) % options.length;
                    updateFilter('minBedrooms', options[nextIndex]);
                  }}
                >
                  <Text style={styles.selectorText}>
                    {localFilters.minBedrooms === null ? 'Any' : localFilters.minBedrooms}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Min Bathrooms</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => {
                    const options = [null, 1, 2, 3, 4, 5];
                    const currentIndex = options.indexOf(localFilters.minBathrooms);
                    const nextIndex = (currentIndex + 1) % options.length;
                    updateFilter('minBathrooms', options[nextIndex]);
                  }}
                >
                  <Text style={styles.selectorText}>
                    {localFilters.minBathrooms === null ? 'Any' : localFilters.minBathrooms}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.featureChip,
                  localFilters.hasParking === true && styles.featureChipActive,
                ]}
                onPress={() => updateFilter('hasParking', localFilters.hasParking === true ? null : true)}
              >
                <Ionicons 
                  name="car" 
                  size={16} 
                  color={localFilters.hasParking === true ? '#0066FF' : '#666'} 
                />
                <Text style={[
                  styles.featureChipText,
                  localFilters.hasParking === true && styles.featureChipTextActive,
                ]}>
                  Parking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.featureChip,
                  localFilters.furnished === true && styles.featureChipActive,
                ]}
                onPress={() => updateFilter('furnished', localFilters.furnished === true ? null : true)}
              >
                <Ionicons 
                  name="home" 
                  size={16} 
                  color={localFilters.furnished === true ? '#0066FF' : '#666'} 
                />
                <Text style={[
                  styles.featureChipText,
                  localFilters.furnished === true && styles.featureChipTextActive,
                ]}>
                  Furnished
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITIES.slice(0, 12).map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.amenityChip,
                    localFilters.selectedAmenities.includes(amenity) && styles.amenityChipActive,
                  ]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text style={[
                    styles.amenityChipText,
                    localFilters.selectedAmenities.includes(amenity) && styles.amenityChipTextActive,
                  ]}>
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'newest', label: 'Newest First' },
                { key: 'price_low', label: 'Price: Low to High' },
                { key: 'price_high', label: 'Price: High to Low' },
                { key: 'popular', label: 'Most Popular' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    localFilters.sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => updateFilter('sortBy', option.key)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    localFilters.sortBy === option.key && styles.sortOptionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersText}>
              {getActiveFiltersCount()} active filters
            </Text>
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  resetText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  priceSeparator: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureChipActive: {
    backgroundColor: '#E6F3FF',
    borderColor: '#0066FF',
  },
  featureChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  featureChipTextActive: {
    color: '#0066FF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amenityChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  amenityChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  amenityChipTextActive: {
    color: '#FFF',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortOptionActive: {
    backgroundColor: '#E6F3FF',
    borderColor: '#0066FF',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#000',
  },
  sortOptionTextActive: {
    color: '#0066FF',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  activeFiltersContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#666',
  },
  applyButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AdvancedSearchFilters;
