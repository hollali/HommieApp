import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PROPERTY_TYPES, PAYMENT_TYPES } from '../../../lib/constants';
import { PropertyType, PaymentType } from '../../../lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { Image } from 'expo-image';
import { pickMultipleImages, ImageResult } from '../../../lib/imageService';
import { getProperties, getListingLimitForUser } from '../../../lib/mockData';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { getMockProfile } from '../../../lib/mockAuth';

const placeholderImage = require('../../../assets/property-placeholder.png');

export default function PropertyCreateStep1Screen() {
  const router = useRouter();
  const { user } = useAuth();
  const isHost = user?.role === 'airbnb_host';
  const [images, setImages] = useState<ImageResult[]>([]);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: PropertyType;
    price: string;
    payment_type: PaymentType;
    region: string;
    city: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    furnished: boolean;
    parking: boolean;
  }>({
    title: '',
    description: '',
    type: 'apartment',
    price: '',
    payment_type: 'monthly',
    region: '',
    city: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    parking: false,
  });

  useEffect(() => {
    if (isHost && formData.type !== 'airbnb') {
      setFormData((prev) => ({ ...prev, type: 'airbnb' }));
    }
  }, [formData.type, isHost]);

  useEffect(() => {
    if (isHost && formData.payment_type !== 'daily') {
      setFormData((prev) => ({ ...prev, payment_type: 'daily' }));
    }
  }, [formData.payment_type, isHost]);

  const questions = [
    {
      title: 'What photos should I add?',
      body: 'Add clear images of the living room, bedroom, kitchen, bathroom, and exterior.',
    },
    {
      title: 'What should I write in the description?',
      body: 'Mention size, amenities, parking, nearby landmarks, and any rules.',
    },
    {
      title: 'What location should I use?',
      body: 'Use the exact area and city so tenants can find the property easily.',
    },
  ];

  const handlePickImages = async () => {
    const selectedImages = await pickMultipleImages(10);
    if (selectedImages.length > 0) {
      setImages([...images, ...selectedImages].slice(0, 10));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (user?.role === 'agent' || user?.role === 'landlord') {
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
    if (!formData.title || !formData.price || !formData.region || !formData.city || !formData.area) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    // Save form data to route params and navigate to step 2
    router.push({
      pathname: '/property/create/step2',
      params: {
        formData: JSON.stringify({ ...formData, images }),
      },
    });
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>Save & Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step 1 of 2</Text>
        <TouchableOpacity onPress={() => setQuestionsOpen(true)}>
          <Text style={styles.headerButton}>Questions</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>Step 1</Text>
            <Text style={styles.stepTitle}>Tell us about</Text>
            <Text style={styles.stepTitle}>your place</Text>
            <Text style={styles.stepDescription}>
              in this step, we'll ask you which type of property you have. with key informations about
              the property such as the location, description and photos
            </Text>
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos *</Text>
            <View style={styles.imageGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity style={styles.addImageButton} onPress={handlePickImages}>
                  <Image source={placeholderImage} style={styles.addImagePlaceholder} />
                  <View style={styles.addImageOverlay}>
                    <Ionicons name="add" size={32} color="#FFF" />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Spacious 3-bedroom apartment"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your property..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Property Type *</Text>
              <View style={styles.chipContainer}>
                {(isHost ? PROPERTY_TYPES.filter((type) => type.value === 'airbnb') : PROPERTY_TYPES).map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      formData.type === type.value && styles.chipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.type === type.value && styles.chipTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {isHost && (
                <Text style={styles.helperText}>
                  Airbnb hosts can only list short-stay properties.
                </Text>
              )}
            </View>
          </View>

          {/* Price & Payment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price & Payment</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Price (₵) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Payment Type *</Text>
                <View style={styles.chipContainer}>
                  {(isHost ? PAYMENT_TYPES.filter((type) => type.value === 'daily') : PAYMENT_TYPES).map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        formData.payment_type === type.value && styles.chipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, payment_type: type.value })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formData.payment_type === type.value && styles.chipTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {isHost && (
                  <Text style={styles.helperText}>
                    Short-stay listings use daily pricing.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location *</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Region</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Greater Accra"
                value={formData.region}
                onChangeText={(text) => setFormData({ ...formData, region: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Accra"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Area/Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., East Legon"
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
              />
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.bedrooms}
                  onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.bathrooms}
                  onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, furnished: !formData.furnished })}
            >
              <View style={[styles.checkbox, formData.furnished && styles.checkboxChecked]}>
                {formData.furnished && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Furnished</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, parking: !formData.parking })}
            >
              <View style={[styles.checkbox, formData.parking && styles.checkboxChecked]}>
                {formData.parking && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Parking Available</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={questionsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Questions</Text>
              <TouchableOpacity onPress={() => setQuestionsOpen(false)}>
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {questions.map((item, index) => {
                const isOpen = expandedQuestion === index;
                return (
                  <TouchableOpacity
                    key={item.title}
                    style={styles.modalItem}
                    onPress={() => setExpandedQuestion(isOpen ? null : index)}
                  >
                    <View style={styles.modalItemHeader}>
                      <Text style={styles.modalItemTitle}>{item.title}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#666"
                      />
                    </View>
                    {isOpen && <Text style={styles.modalItemText}>{item.body}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    maxHeight: 320,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  modalItemText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
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
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#4560F7',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    overflow: 'hidden',
  },
  addImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  addImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(69, 96, 247, 0.3)',
  },
  addImageText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
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
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
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
  continueButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
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

