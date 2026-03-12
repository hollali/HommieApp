import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getProperties } from '../../lib/mockData';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { formatGhanaPhone } from '../../lib/constants';

export default function SendMessageScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { user } = useAuth();
  const [yourName, setYourName] = useState(user?.full_name || '');
  const [yourMessage, setYourMessage] = useState('');
  const router = useRouter();

  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      // Use mock data
      const properties = await getProperties();
      const prop = properties.find((p) => p.id === propertyId);
      if (!prop) throw new Error('Property not found');
      return {
        ...prop,
        owner:
          prop.owner || {
            id: prop.owner_id,
            full_name: 'Property Owner',
            phone: null,
            role: 'landlord',
          },
      };
    },
  });

  const handleSend = async () => {
    if (!yourName.trim() || !yourMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user || !property) {
      Alert.alert('Error', 'Missing user or property information');
      return;
    }

    // For Airbnb listings, require confirmed booking before allowing messages
    if (property.type === 'airbnb') {
      const { getBookings } = await import('../../lib/mockData');
      const bookings = await getBookings(user.id);
      const hasConfirmedBooking = bookings.some(
        (b) => b.property_id === property.id && (b.status === 'confirmed' || b.status === 'pending')
      );
      
      if (!hasConfirmedBooking) {
        Alert.alert(
          'Booking Required',
          'You need to book and confirm your stay before you can message the host. This helps protect both guests and hosts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Book Now', onPress: () => router.push(`/booking/${property.id}`) },
          ]
        );
        return;
      }
    }

    try {
      // Create or get chat
      const { getOrCreateChat, sendMessage } = await import('../../lib/mockData');
      const chat = await getOrCreateChat(user.id, property.owner_id, property.id);

      // Send initial enquiry message
      await sendMessage({
        chat_id: chat.id,
        sender_id: user.id,
        receiver_id: property.owner_id,
        property_id: property.id,
        text: `Hi, ${yourName} here. ${yourMessage}`,
      });

      router.push('/message/success');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const handleCall = () => {
    if (property?.owner?.role === 'airbnb_host') {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = property?.owner?.phone ? formatGhanaPhone(property.owner.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    if (property?.owner?.role === 'airbnb_host') {
      Alert.alert('Contact disabled', 'Airbnb hosts are booked in-app only.');
      return;
    }
    const phone = property?.owner?.phone ? formatGhanaPhone(property.owner.phone) : null;
    if (!phone) {
      Alert.alert('No phone number', 'This user has not added a phone number.');
      return;
    }
    const waNumber = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${waNumber}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {property?.type === 'airbnb' ? 'Message Host' : 'Send a Message'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.contactCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#0066FF" />
          </View>
          <Text style={styles.contactName}>
            {property?.type === 'airbnb' ? 'Host' : property?.owner?.full_name || 'Property Owner'}
          </Text>
          {property?.type !== 'airbnb' && (
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#0066FF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.whatsAppButton} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#999"
            value={yourName}
            onChangeText={setYourName}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Your Message"
            placeholderTextColor="#999"
            value={yourMessage}
            onChangeText={setYourMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText} numberOfLines={1} ellipsizeMode="tail">
            {property?.type === 'airbnb' ? 'Message Host' : 'Send Enquiry'}
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
    padding: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsAppButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
  messageInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  sendButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    flexShrink: 1,
  },
});

