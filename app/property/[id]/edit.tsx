import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { PROPERTY_TYPES, PAYMENT_TYPES } from '../../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { processPaystackPaymentFlow, generatePaymentReference } from '../../../lib/payments';
import { updateProperty as updateMockProperty, getProperties } from '../../../lib/mockData';
import { pickMultipleImages, ImageResult } from '../../../lib/imageService';

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isHost = user?.role === 'airbnb_host';
  const [images, setImages] = useState<ImageResult[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
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
    is_available: true,
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id, 'edit'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const properties = await getProperties();
        const prop = properties.find((p) => p.id === id);
        if (!prop) throw new Error('Property not found');
        return {
          ...prop,
          property_images: [],
        };
      }
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        type: property.type || 'apartment',
        price: property.price?.toString() || '',
        payment_type: property.payment_type || 'monthly',
        region: property.region || '',
        city: property.city || '',
        area: property.area || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        furnished: property.furnished || false,
        is_available: property.is_available ?? true,
      });
      if (property.property_images) {
        setExistingImages(property.property_images);
      }
    }
  }, [property]);

  const handlePickImages = async () => {
    const selectedImages = await pickMultipleImages(10 - existingImages.length - images.length);
    if (selectedImages.length > 0) {
      setImages([...images, ...selectedImages]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!isSupabaseConfigured) {
            setExistingImages(existingImages.filter((img) => img.id !== imageId));
            return;
          }
          try {
            const { error } = await supabase.from('property_images').delete().eq('id', imageId);
            if (error) throw error;
            setExistingImages(existingImages.filter((img) => img.id !== imageId));
            queryClient.invalidateQueries({ queryKey: ['property', id, 'edit'] });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete image');
          }
        },
      },
    ]);
  };

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

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Property updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update property');
    },
  });

  const handleFeatureListing = async (durationDays: number, amount: number) => {
    if (!property) return;
    if (property.status !== 'approved') {
      Alert.alert('Approval required', 'Your listing must be approved before featuring.');
      return;
    }
    try {
      const response = await processPaystackPaymentFlow({
        amount,
        currency: 'GHS',
        email: user?.email || undefined,
        type: 'featured_boost',
        reference: generatePaymentReference('PAYSTACK'),
        metadata: { property_id: property.id, duration_days: durationDays },
      });

      if (response.status !== 'success') {
        Alert.alert('Payment Failed', response.message || 'Unable to start payment');
        return;
      }

      const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      if (!isSupabaseConfigured) {
        await updateMockProperty(property.id, { is_featured: true, featured_until: featuredUntil });
      } else {
        await supabase.from('properties').update({ is_featured: true, featured_until: featuredUntil }).eq('id', id);
      }

      Alert.alert('Success', `Listing featured for ${durationDays} days.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to feature listing');
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isHost && formData.type !== 'airbnb') {
      Alert.alert('Error', 'Airbnb hosts can only list short-stay properties.');
      return;
    }

    updateMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Property</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Property</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          <Text style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          {/* Image Management Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Property Images</Text>
            <Text style={styles.helperText}>
              Add up to 10 images. Tap to view full size, long press to delete.
            </Text>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <View style={styles.imagesGrid}>
                {existingImages.map((img, index) => (
                  <TouchableOpacity
                    key={img.id}
                    style={styles.imageItem}
                    onPress={() => setSelectedImageIndex(index)}
                    onLongPress={() => handleRemoveExistingImage(img.id)}
                  >
                    <Image source={{ uri: img.image_url }} style={styles.imageThumbnail} />
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={() => handleRemoveExistingImage(img.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* New Images */}
            {images.length > 0 && (
              <View style={styles.imagesGrid}>
                {images.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageItem}
                    onPress={() => setSelectedImageIndex(existingImages.length + index)}
                    onLongPress={() => handleRemoveNewImage(index)}
                  >
                    <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={() => handleRemoveNewImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add Image Button */}
            {existingImages.length + images.length < 10 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handlePickImages}>
                <Ionicons name="add" size={32} color="#0066FF" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Property title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Property description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Property Type *</Text>
            <View style={styles.optionsRow}>
              {(isHost ? PROPERTY_TYPES.filter((type) => type.value === 'airbnb') : PROPERTY_TYPES).map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionChip,
                    formData.type === type.value && styles.optionChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      formData.type === type.value && styles.optionChipTextActive,
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

          {(user?.role === 'agent' || user?.role === 'landlord') && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Featured Listing</Text>
              <Text style={styles.helperText}>
                Boost your listing for more visibility.
              </Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.featureButton}
                  onPress={() => handleFeatureListing(7, 50)}
                >
                  <Text style={styles.featureButtonText}>Feature 7 days • ₵50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.featureButton}
                  onPress={() => handleFeatureListing(30, 120)}
                >
                  <Text style={styles.featureButtonText}>Feature 30 days • ₵120</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Price *</Text>
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
            <View style={styles.optionsRow}>
              {(isHost ? PAYMENT_TYPES.filter((type) => type.value === 'daily') : PAYMENT_TYPES).map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.optionChip,
                      formData.payment_type === type.value && styles.optionChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, payment_type: type.value })}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        formData.payment_type === type.value && styles.optionChipTextActive,
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Region"
              value={formData.region}
              onChangeText={(text) => setFormData({ ...formData, region: text })}
            />
            <TextInput
              style={[styles.input, styles.inputMargin]}
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
            <TextInput
              style={[styles.input, styles.inputMargin]}
              placeholder="Area"
              value={formData.area}
              onChangeText={(text) => setFormData({ ...formData, area: text })}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, furnished: !formData.furnished })}
            >
              <View style={[styles.checkbox, formData.furnished && styles.checkboxChecked]}>
                {formData.furnished && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Furnished</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData({ ...formData, is_available: !formData.is_available })}
            >
              <View style={[styles.checkbox, formData.is_available && styles.checkboxChecked]}>
                {formData.is_available && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Available for rent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setSelectedImageIndex(null)}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {selectedImageIndex !== null && (
            <Image
              source={{
                uri:
                  selectedImageIndex < existingImages.length
                    ? existingImages[selectedImageIndex].image_url
                    : images[selectedImageIndex - existingImages.length]?.uri,
              }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          {selectedImageIndex !== null && (
            <View style={styles.fullScreenCounter}>
              <Text style={styles.fullScreenCounterText}>
                {selectedImageIndex + 1} / {existingImages.length + images.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  form: {
    gap: 0,
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
  inputMargin: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionChipActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionChipTextActive: {
    color: '#FFF',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  featureButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#D7E4FF',
  },
  featureButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4560F7',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  addImageText: {
    fontSize: 12,
    color: '#0066FF',
    marginTop: 4,
    fontWeight: '600',
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenCounter: {
    position: 'absolute',
    bottom: 50,
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
});


