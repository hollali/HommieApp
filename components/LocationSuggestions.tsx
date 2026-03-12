import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GHANA_REGIONS } from '../lib/constants';

interface LocationSuggestion {
  id: string;
  label: string;
  type: 'region' | 'city' | 'area';
  region?: string;
  city?: string;
}

interface LocationSuggestionsProps {
  query: string;
  onSelect: (location: LocationSuggestion) => void;
  onDismiss: () => void;
}

export function LocationSuggestions({ query, onSelect, onDismiss }: LocationSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      const lowerQuery = query.toLowerCase().trim();
      const results: LocationSuggestion[] = [];

      // Search through regions, cities, and areas
      GHANA_REGIONS.forEach((region) => {
        // Check region name
        if (region.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: `region_${region.id}`,
            label: region.name,
            type: 'region',
            region: region.name,
          });
        }

        // Check cities in region
        region.cities.forEach((city) => {
          if (city.name.toLowerCase().includes(lowerQuery)) {
            results.push({
              id: `city_${city.id}`,
              label: `${city.name}, ${region.name}`,
              type: 'city',
              region: region.name,
              city: city.name,
            });
          }

          // Check areas in city
          city.areas.forEach((area) => {
            if (area.toLowerCase().includes(lowerQuery)) {
              results.push({
                id: `area_${region.id}_${city.id}_${area}`,
                label: `${area}, ${city.name}, ${region.name}`,
                type: 'area',
                region: region.name,
                city: city.name,
              });
            }
          });
        });
      });

      // Limit results to 10
      setSuggestions(results.slice(0, 10));
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!query || query.length < 2 || suggestions.length === 0) {
    if (loading) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0066FF" />
          </View>
        </View>
      );
    }
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'region':
        return 'location-outline';
      case 'city':
        return 'business-outline';
      case 'area':
        return 'map-outline';
      default:
        return 'location-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Locations</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => onSelect(item)}
          >
            <Ionicons name={getIcon(item.type) as any} size={20} color="#0066FF" />
            <Text style={styles.suggestionText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
        )}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  list: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
