import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { processPaystackPaymentFlow, generatePaymentReference } from '../../lib/payments';
import { FEATURE_FLAGS } from '../../lib/featureFlags';
import { propertyService } from '../../lib/propertyService';
import { bookingService } from '../../lib/bookingService';

const timeSlots = ['11:00AM', '1:00PM', '3:00PM', '5:00PM', '7:00PM'];

export default function ScheduleTourScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router = useRouter();
  const bookingFee = 20;
  const bookingsEnabled = FEATURE_FLAGS.airbnbBookings;

  const monthLabel = selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = monthStart.getDay();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { data: propertyBookings = [] } = useQuery({
    queryKey: ['bookings', propertyId],
    queryFn: async () => {
      // In a real app we'd fetch actual bookings for this property to block dates
      return [];
    },
    enabled: bookingsEnabled && !!propertyId,
  });

  const { data: property } = useQuery({
    queryKey: ['property', propertyId, 'booking'],
    queryFn: async () => {
      return await propertyService.getPropertyById(propertyId);
    },
    enabled: bookingsEnabled && !!propertyId,
  });

  const bookedByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    propertyBookings.forEach((booking: any) => {
      const date = new Date(booking.scheduled_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toUpperCase();
      map[key] = map[key] ? [...map[key], time] : [time];
    });
    return map;
  }, [propertyBookings]);

  if (!bookingsEnabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Book Stay</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Bookings coming soon</Text>
          <Text style={styles.emptyText}>Short-stay bookings will open after launch.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const datesGrid = Array.from({ length: startDay + daysInMonth }, (_, i) => {
    if (i < startDay) return null;
    return i - startDay + 1;
  });

  const selectedDateKey = selectedDate
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
    : null;
  const bookedTimesForSelected = selectedDateKey ? bookedByDate[selectedDateKey] || [] : [];
  const availableTimes = timeSlots.filter((slot) => !bookedTimesForSelected.includes(slot));

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select a date and time');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to book a stay');
      return;
    }

    if (!property || property.type !== 'airbnb') {
      Alert.alert('Booking unavailable', 'Bookings are only available for short-stay listings.');
      return;
    }

    if (property.owner?.role === 'airbnb_host' && property.owner?.verification_status !== 'verified') {
      Alert.alert('Host not verified', 'This host must be verified before accepting bookings.');
      return;
    }

    // Navigate to payment options screen with booking details
    router.push({
      pathname: '/booking/[id]/payment-options',
      params: {
        id: propertyId,
        date: selectedDate.toString(),
        time: selectedTime,
        year: year.toString(),
        month: (month + 1).toString(), // +1 because getMonth() is 0-indexed
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Book Stay</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Select date</Text>
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => setSelectedMonth(new Date(year, month - 1, 1))}
            >
              <Ionicons name="chevron-back" size={20} color="#0066FF" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => setSelectedMonth(new Date(year, month + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color="#0066FF" />
            </TouchableOpacity>
          </View>
          <View style={styles.weekDays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={index} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          <View style={styles.datesGrid}>
            {datesGrid.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dateButton} />;
              }
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
              const bookedTimes = bookedByDate[key] || [];
              const isFullyBooked = bookedTimes.length >= timeSlots.length;
              const isPast = key < todayKey;
              const isDisabled = isPast || isFullyBooked;
              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateButton,
                    selectedDate === date && styles.dateButtonSelected,
                    isDisabled && styles.dateButtonDisabled,
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === date && styles.dateTextSelected,
                      isDisabled && styles.dateTextDisabled,
                    ]}
                  >
                    {date}
                  </Text>
                  {isFullyBooked && <View style={styles.blockedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {timeSlots.map((time) => {
            const isUnavailable = bookedTimesForSelected.includes(time);
            return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeButton,
                selectedTime === time && styles.timeButtonSelected,
                isUnavailable && styles.timeButtonDisabled,
              ]}
              onPress={() => !isUnavailable && setSelectedTime(time)}
              disabled={isUnavailable}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime === time && styles.timeTextSelected,
                  isUnavailable && styles.timeTextDisabled,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          )})}
        </ScrollView>

        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityTitle}>Availability</Text>
          <View style={styles.availabilityRow}>
            <Text style={styles.availabilityLabel}>Available slots</Text>
            <Text style={styles.availabilityValue}>{selectedDateKey ? availableTimes.length : 0}</Text>
          </View>
          <View style={styles.availabilityRow}>
            <Text style={styles.availabilityLabel}>Booking fee</Text>
            <Text style={styles.availabilityValue}>₵{bookingFee}</Text>
          </View>
          <View style={styles.availabilityRow}>
            <Text style={styles.availabilityLabel}>Tour duration</Text>
            <Text style={styles.availabilityValue}>45 minutes</Text>
          </View>
          <View style={styles.availabilityRow}>
            <Text style={styles.availabilityLabel}>Blocked dates</Text>
            <Text style={styles.availabilityValue}>Marked with dot</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.scheduleButton,
            (!selectedDate || !selectedTime) && styles.scheduleButtonDisabled,
          ]}
          onPress={handleSchedule}
          disabled={!selectedDate || !selectedTime}
        >
          <Text style={styles.scheduleButtonText}>
            Continue to Payment
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateButtonSelected: {
    backgroundColor: '#0066FF',
  },
  dateButtonDisabled: {
    backgroundColor: '#F2F2F2',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  dateTextSelected: {
    color: '#FFF',
  },
  dateTextDisabled: {
    color: '#AAA',
  },
  blockedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginTop: 4,
  },
  timeScroll: {
    marginBottom: 20,
  },
  timeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066FF',
    backgroundColor: '#FFF',
    marginRight: 12,
  },
  timeButtonSelected: {
    backgroundColor: '#0066FF',
  },
  timeButtonDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  timeTextSelected: {
    color: '#FFF',
  },
  timeTextDisabled: {
    color: '#AAA',
  },
  availabilityCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#666',
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  scheduleButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

