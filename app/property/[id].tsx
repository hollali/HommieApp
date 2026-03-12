import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatGhanaPhone } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import { FEATURE_FLAGS } from '../../lib/featureFlags';
import { getWatermarkedUrl, needsWatermark } from '../../lib/watermark';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Array.isArray(id) ? id[0] : id || '';
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required');
      const { getProperty } = await import('../../lib/data');
      const prop = await getProperty(propertyId);
      if (!prop) throw new Error('Property not found');
      return prop;
    },
  });

  const { data: isFavorite } = useQuery({
    queryKey: ['favorite', propertyId, user?.id],
    queryFn: async () => {
      if (!user || !propertyId) return false;
      const { isFavorite: checkFavorite } = await import('../../lib/data');
      return await checkFavorite(user.id, propertyId);
    },
    enabled: !!user && !!propertyId,
  });

  const { data: hasConfirmedBooking } = useQuery({
    queryKey: ['hasBooking', propertyId, user?.id],
    queryFn: async () => {
      if (!user || !propertyId) return false;
      const { getBookings } = await import('../../lib/data');
      const bookings = await getBookings(user.id);
      return bookings.some(
        (b) => b.property_id === propertyId && (b.status === 'confirmed' || b.status === 'pending')
      );
    },
    enabled: !!user && !!propertyId,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !propertyId) throw new Error('Not authenticated or missing property ID');

      const { addFavorite, removeFavorite, isFavorite: checkFavorite } = await import('../../lib/data');
      const currentlyFavorite = await checkFavorite(user.id, propertyId);

      if (currentlyFavorite) {
        await removeFavorite(user.id, propertyId);
      } else {
        await addFavorite(user.id, propertyId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', propertyId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const handleCallOwner = () => {
    if (!property) return;
    if (property.owner?.role === 'airbnb_host' || property.type === 'airbnb') {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = property.owner?.phone ? formatGhanaPhone(property.owner.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsAppOwner = () => {
    if (!property) return;
    if (property.owner?.role === 'airbnb_host' || property.type === 'airbnb') {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = property.owner?.phone ? formatGhanaPhone(property.owner.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    const waNumber = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${waNumber}`);
  };

  const handleReserve = () => {
    if (!property) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to reserve a stay.');
      router.push('/(auth)/login');
      return;
    }
    if (user.role !== 'tenant') {
      Alert.alert('Unavailable', 'Only tenants can reserve a stay.');
      return;
    }
    router.push(`/booking/${property.id}`);
  };

  const handleMessageOwner = () => {
    if (!property) return;
    // Only allow messaging for agents/landlords (not Airbnb hosts)
    if (property.owner?.role === 'airbnb_host' || property.type === 'airbnb') {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message the owner.');
      router.push('/(auth)/login');
      return;
    }
    // Go to the in-app message/enquiry screen
    router.push(`/message/${property.id}`);
  };

  if (isLoading || !property) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>Loading property...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAirbnb = property.type === 'airbnb';
  // Some mock data paths attach a minimal `owner` object without all optional fields.
  const hostProfile = property.owner as any;
  const isHostVerified = hostProfile?.verification_status === 'verified';
  const airbnbMeta = {
    hostRating: 4.8,
    responseTime: 'Within 1 hour',
    responseRate: hostProfile?.host_response_rate || '98%',
    hostSince: hostProfile?.host_since || '2022',
    languages: hostProfile?.host_languages || 'English',
    superhost: true,
    checkIn: '2:00 PM',
    checkOut: '11:00 AM',
    minNights: 2,
    maxNights: 30,
    availability: 'Available Aug 1 - Aug 30',
  };
  const availabilityMonth = calendarMonth;
  const availabilityYear = availabilityMonth.getFullYear();
  const availabilityMonthIndex = availabilityMonth.getMonth();
  const availabilityStart = new Date(availabilityYear, availabilityMonthIndex, 1);
  const availabilityDaysInMonth = new Date(availabilityYear, availabilityMonthIndex + 1, 0).getDate();
  const availabilityStartDay = availabilityStart.getDay();
  const availabilityDates = Array.from({ length: availabilityStartDay + availabilityDaysInMonth }, (_, i) =>
    i < availabilityStartDay ? null : i - availabilityStartDay + 1
  );
  const unavailableDays = new Set([3, 6, 9, 12, 15, 18, 21, 24, 27]);
  const availabilityMonthLabel = availabilityMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const airbnbReviews = [
    {
      id: 'review-1',
      name: 'Ama O.',
      rating: 5,
      date: '2 days ago',
      text: 'Great stay, clean space and responsive host.',
    },
    {
      id: 'review-2',
      name: 'Kofi M.',
      rating: 4,
      date: '1 week ago',
      text: 'Nice location and easy check-in.',
    },
  ];
  const homeMeta = {
    size: '1200 sqft',
    yearBuilt: '2020',
    deposit: formatCurrency(property.price * 2),
    utilities: 'Water, Electricity',
    security: '24/7 Security',
    pets: 'Not allowed',
    lease: property.payment_type === 'monthly' ? '6 - 12 months' : property.payment_type,
    availableFrom: 'Immediate',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {property.property_images && property.property_images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                snapToInterval={width}
                decelerationRate="fast"
                bounces={false}
              >
                {property.property_images.map((img: any, index: number) => (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => setSelectedImageIndex(index)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ 
                        uri: needsWatermark(property.type) 
                          ? getWatermarkedUrl(img.image_url) 
                          : img.image_url 
                      }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Image Indicators */}
              {property.property_images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {property.property_images.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              {/* Image Counter */}
              {property.property_images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {property.property_images.length}
                  </Text>
                </View>
              )}
              {property.property_images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {selectedImageIndex !== null ? selectedImageIndex + 1 : 1} / {property.property_images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.propertyImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={64} color="#999" />
            </View>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          {user && (
            <>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite.mutate()}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? '#FF3B30' : '#000'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.listButton}
                onPress={() => router.push(`/property/${propertyId}/add-to-list`)}
              >
                <Ionicons name="list-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => router.push(`/property/${propertyId}/report`)}
              >
                <Ionicons name="flag-outline" size={24} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {formatCurrency(property.price)}/{property.payment_type}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{property.title}</Text>
            <Text style={styles.location}>
              <Ionicons name="location" size={16} color="#666" />{' '}
              {isAirbnb && !hasConfirmedBooking ? (
                `General area in ${property.area}, ${property.city}`
              ) : (
                `${property.area}, ${property.city}, ${property.region}`
              )}
            </Text>
          </View>

          {/* Property Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailsGrid}>
              {property.bedrooms && (
                <View style={styles.detailItem}>
                  <Ionicons name="bed-outline" size={24} color="#0066FF" />
                  <Text style={styles.detailLabel}>Bedrooms</Text>
                  <Text style={styles.detailValue}>{property.bedrooms}</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={24} color="#0066FF" />
                  <Text style={styles.detailLabel}>Bathrooms</Text>
                  <Text style={styles.detailValue}>{property.bathrooms}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Ionicons name="cube-outline" size={24} color="#0066FF" />
                <Text style={styles.detailLabel}>Furnished</Text>
                <Text style={styles.detailValue}>{property.furnished ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="car-outline" size={24} color="#0066FF" />
                <Text style={styles.detailLabel}>Parking</Text>
                <Text style={styles.detailValue}>{property.parking ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </View>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesList}>
                {property.amenities.map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color="#0066FF" />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!isAirbnb && (
            <View style={styles.homeDetailsSection}>
              <Text style={styles.sectionTitle}>Home Details</Text>
              <View style={styles.homeDetailsCard}>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Size</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.size}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Year Built</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.yearBuilt}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Deposit</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.deposit}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Lease Duration</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.lease}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Utilities</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.utilities}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Security</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.security}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Pets</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.pets}</Text>
                </View>
                <View style={styles.homeDetailRow}>
                  <Text style={styles.homeDetailLabel}>Availability</Text>
                  <Text style={styles.homeDetailValue}>{homeMeta.availableFrom}</Text>
                </View>
              </View>
            </View>
          )}

          {isAirbnb && (
            <>
              {/* Host Details */}
              <View style={styles.hostSection}>
                <Text style={styles.sectionTitle}>Host</Text>
                <TouchableOpacity
                  style={styles.hostCard}
                  onPress={() => {
                    if (hostProfile?.id) {
                      router.push(`/host/${hostProfile.id}`);
                    }
                  }}
                  activeOpacity={hostProfile?.id ? 0.85 : 1}
                >
                  <View style={styles.hostInfo}>
                    <View style={styles.hostAvatar}>
                      {hostProfile?.avatar_url ? (
                        <Image source={{ uri: hostProfile.avatar_url }} style={styles.hostAvatarImage} />
                      ) : (
                        <Ionicons name="person" size={28} color="#0066FF" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.hostName}>
                        Hosted by {hostProfile?.full_name || 'Host'}
                        {isHostVerified ? ' (Verified Host)' : ''}
                      </Text>
                      <View style={styles.hostMetaRow}>
                        <Ionicons name="star" size={14} color="#FFB300" />
                        <Text style={styles.hostMetaText}>{airbnbMeta.hostRating}</Text>
                        {airbnbMeta.superhost && (
                          <View style={styles.superhostBadge}>
                            <Text style={styles.superhostText}>Superhost</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.hostMetaText}>Response time: {airbnbMeta.responseTime}</Text>
                    </View>
                  </View>
                  <View style={styles.hostDetails}>
                    <View style={styles.hostDetailRow}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#0066FF" />
                      <Text style={styles.hostDetailText}>
                        {isHostVerified ? 'Government ID verified' : 'Verification pending'}
                      </Text>
                    </View>
                    <View style={styles.hostDetailRow}>
                      <Ionicons name="time-outline" size={16} color="#0066FF" />
                      <Text style={styles.hostDetailText}>Host since {airbnbMeta.hostSince}</Text>
                    </View>
                    <View style={styles.hostDetailRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#0066FF" />
                      <Text style={styles.hostDetailText}>Response rate {airbnbMeta.responseRate}</Text>
                    </View>
                    <View style={styles.hostDetailRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0066FF" />
                      <Text style={styles.hostDetailText}>Languages: {airbnbMeta.languages}</Text>
                    </View>
                  </View>
                  <View style={styles.hostProfileButton}>
                    <Ionicons name="person-circle-outline" size={16} color="#4560F7" />
                    <Text style={styles.hostProfileButtonText}>View profile</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Availability */}
              <View style={styles.availabilitySection}>
                <Text style={styles.sectionTitle}>Availability</Text>
                <View style={styles.availabilityCard}>
                  <Text style={styles.availabilityRange}>{airbnbMeta.availability}</Text>
                  <View style={styles.availabilityRow}>
                    <View>
                      <Text style={styles.availabilityLabel}>Check-in</Text>
                      <Text style={styles.availabilityValue}>{airbnbMeta.checkIn}</Text>
                    </View>
                    <View>
                      <Text style={styles.availabilityLabel}>Check-out</Text>
                      <Text style={styles.availabilityValue}>{airbnbMeta.checkOut}</Text>
                    </View>
                  </View>
                  <View style={styles.availabilityRow}>
                    <View>
                      <Text style={styles.availabilityLabel}>Min stay</Text>
                      <Text style={styles.availabilityValue}>{airbnbMeta.minNights} nights</Text>
                    </View>
                    <View>
                      <Text style={styles.availabilityLabel}>Max stay</Text>
                      <Text style={styles.availabilityValue}>{airbnbMeta.maxNights} nights</Text>
                    </View>
                  </View>
                  {showCalendar && (
                    <View>
                      <View style={styles.calendarHeader}>
                        <TouchableOpacity
                          style={styles.calendarNavButton}
                          onPress={() =>
                            setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                          }
                        >
                          <Ionicons name="chevron-back" size={18} color="#0066FF" />
                        </TouchableOpacity>
                        <Text style={styles.calendarHeaderText}>{availabilityMonthLabel}</Text>
                        <TouchableOpacity
                          style={styles.calendarNavButton}
                          onPress={() =>
                            setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                          }
                        >
                          <Ionicons name="chevron-forward" size={18} color="#0066FF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.calendar}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                          <Text key={day} style={styles.calendarDayLabel}>
                            {day}
                          </Text>
                        ))}
                        {availabilityDates.map((date, index) => {
                          if (!date) {
                            return <View key={`empty-${index}`} style={styles.calendarDate} />;
                          }
                          const isUnavailable = unavailableDays.has(date);
                          return (
                            <View key={`${availabilityMonthIndex}-${date}`} style={styles.calendarDate}>
                              <Text style={[styles.calendarDateText, isUnavailable && styles.calendarDateUnavailable]}>
                                {date}
                              </Text>
                              {isUnavailable && <View style={styles.calendarStrike} />}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.availabilityLinkButton}
                    onPress={() => setShowCalendar((prev) => !prev)}
                  >
                    <Text style={styles.availabilityLink}>
                      {showCalendar ? 'Hide calendar' : 'View calendar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reviews */}
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewsRow}>
                  {airbnbReviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewName}>{review.name}</Text>
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                      <View style={styles.reviewRating}>
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Ionicons key={idx} name="star" size={14} color="#FFB300" />
                        ))}
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Description */}
          {property.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {/* Map */}
          {property.latitude && property.longitude && (
            <View style={styles.mapSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Location</Text>
                {isAirbnb && !hasConfirmedBooking && (
                  <View style={styles.restrictedBadge}>
                    <Ionicons name="lock-closed" size={12} color="#FFF" />
                    <Text style={styles.restrictedBadgeText}>Restricted View</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  scrollEnabled={!isAirbnb || !!hasConfirmedBooking}
                  zoomEnabled={!isAirbnb || !!hasConfirmedBooking}
                  rotateEnabled={!isAirbnb || !!hasConfirmedBooking}
                  pitchEnabled={!isAirbnb || !!hasConfirmedBooking}
                  initialRegion={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                    latitudeDelta: isAirbnb && !hasConfirmedBooking ? 0.05 : 0.01,
                    longitudeDelta: isAirbnb && !hasConfirmedBooking ? 0.05 : 0.01,
                  }}
                >
                  {(!isAirbnb || hasConfirmedBooking) && (
                    <Marker
                      coordinate={{
                        latitude: property.latitude,
                        longitude: property.longitude,
                      }}
                      title={property.title}
                    />
                  )}
                  {isAirbnb && !hasConfirmedBooking && (
                    <Circle
                      center={{
                        latitude: property.latitude,
                        longitude: property.longitude,
                      }}
                      radius={1000}
                      strokeColor="rgba(0, 102, 255, 0.3)"
                      fillColor="rgba(0, 102, 255, 0.1)"
                    />
                  )}
                </MapView>
                
                {isAirbnb && !hasConfirmedBooking && (
                  <View style={styles.mapOverlay}>
                    <Ionicons name="map-outline" size={32} color="#666" />
                    <Text style={styles.mapOverlayText}>
                      Exact location available after booking confirmation
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Owner Info */}
          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>{isAirbnb ? 'Host' : 'Contact'}</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person" size={24} color="#0066FF" />
                </View>
                <View>
                  <Text style={styles.ownerName}>
                    {isAirbnb
                      ? `Hosted by ${property.owner?.full_name || 'Host'}`
                      : `Listed by ${property.owner?.full_name || 'Property Owner'}`}
                  </Text>
                  <Text style={styles.ownerRole}>
                    {property.owner?.role === 'agent'
                      ? 'Agent'
                      : property.owner?.role === 'airbnb_host'
                        ? isHostVerified
                          ? 'Airbnb Host • Verified'
                          : 'Airbnb Host'
                        : 'Landlord'}
                  </Text>
                </View>
              </View>
              <View style={styles.ownerActions}>
                {!isAirbnb && (
                  <>
                    <TouchableOpacity style={styles.ownerContactButton} onPress={handleCallOwner}>
                      <Ionicons name="call-outline" size={20} color="#4560F7" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ownerContactButton} onPress={handleWhatsAppOwner}>
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ownerContactButton} onPress={handleMessageOwner}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4560F7" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Airbnb Reserve */}
      {isAirbnb && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.bookButton} onPress={handleReserve}>
            <Text style={styles.bookButtonText}>Reserve</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Screen Image Viewer */}
      {selectedImageIndex !== null && property.property_images && property.property_images.length > 0 && (
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setSelectedImageIndex(null)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * width, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {property.property_images.map((img: any, index: number) => (
              <Image
                key={img.id}
                source={{ uri: img.image_url }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
          <View style={styles.fullScreenCounter}>
            <Text style={styles.fullScreenCounterText}>
              {selectedImageIndex + 1} / {property.property_images.length}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  propertyImage: {
    width,
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#FFF',
  },
  fullScreenImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  fullScreenImage: {
    width,
    height: '100%',
  },
  fullScreenCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullScreenCounterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0066FF',
  },
  typeBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  homeDetailsSection: {
    marginBottom: 24,
  },
  homeDetailsCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  homeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  homeDetailLabel: {
    fontSize: 13,
    color: '#666',
  },
  homeDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  hostSection: {
    marginBottom: 24,
  },
  hostCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  hostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hostMetaText: {
    fontSize: 12,
    color: '#666',
  },
  hostDetails: {
    marginTop: 12,
    gap: 6,
  },
  hostProfileButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E9F1FF',
    marginTop: 10,
  },
  hostProfileButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4560F7',
  },
  hostDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostDetailText: {
    fontSize: 12,
    color: '#555',
  },
  superhostBadge: {
    backgroundColor: '#E8EDFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  superhostText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4560F7',
  },
  hostMessageButton: {
    backgroundColor: '#0066FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  hostMessageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hostNotice: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
  availabilitySection: {
    marginBottom: 24,
  },
  availabilityCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  availabilityRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  availabilityLink: {
    marginTop: 12,
    fontSize: 12,
    color: '#4560F7',
    fontWeight: '600',
  },
  availabilityLinkButton: {
    alignSelf: 'flex-start',
  },
  calendar: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  calendarHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  calendarNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarDate: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  calendarDateText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  calendarDateUnavailable: {
    color: '#B00020',
  },
  calendarStrike: {
    position: 'absolute',
    height: 2,
    width: 24,
    backgroundColor: '#B00020',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    width: 240,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    gap: 6,
  },
  amenityText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restrictedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
  },
  mapOverlayText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  ownerSection: {
    marginBottom: 100,
  },
  ownerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ownerRole: {
    fontSize: 14,
    color: '#666',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  ownerContactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF1FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4560F7',
  },
  chatButtonDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  messageButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  messageButtonTextDisabled: {
    color: '#999',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

