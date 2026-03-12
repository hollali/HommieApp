import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAndUploadImage, takePhotoAndUpload, deleteImage, UploadResult } from '../lib/imageUpload';

interface ImageUploadProps {
  images: { url: string; publicId: string }[];
  onImagesChange: (images: { url: string; publicId: string }[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  showLabel?: boolean;
  label?: string;
  aspectRatio?: [number, number];
  editable?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  maxSize = 5,
  showLabel = true,
  label = 'Property Images',
  aspectRatio = [4, 3],
  editable = true,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (source: 'camera' | 'library') => {
    if (!editable) return;

    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    try {
      const result = source === 'camera' 
        ? await takePhotoAndUpload({ maxSize: maxSize * 1024 * 1024 })
        : await pickAndUploadImage({ maxSize: maxSize * 1024 * 1024 });

      if (result.success && result.url && result.publicId) {
        const newImages = [...images, { url: result.url, publicId: result.publicId }];
        onImagesChange(newImages);
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!editable) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const imageToRemove = images[index];
            
            // Try to delete from storage, but don't fail if it doesn't work
            try {
              await deleteImage(imageToRemove.publicId);
            } catch (error) {
              console.warn('Failed to delete image from storage:', error);
            }

            // Remove from local state regardless of storage deletion
            const newImages = images.filter((_, i) => i !== index);
            onImagesChange(newImages);
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option to add image',
      [
        {
          text: 'Take Photo',
          onPress: () => handleImageUpload('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => handleImageUpload('library'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>
          {label} ({images.length}/{maxImages})
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {images.map((image, index) => (
          <View key={image.publicId} style={styles.imageContainer}>
            <Image source={{ uri: image.url }} style={styles.image} />
            {editable && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {editable && images.length < maxImages && (
          <TouchableOpacity
            style={[styles.addImageButton, uploading && styles.disabledButton]}
            onPress={showImageOptions}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#666" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={32} color="#666" />
                <Text style={styles.addImageText}>Add Image</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {editable && (
        <Text style={styles.helperText}>
          Tap to add images. Max {maxSize}MB per image. {maxImages - images.length} remaining.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  scrollContainer: {
    paddingRight: 16,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addImageButton: {
    width: 120,
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  disabledButton: {
    opacity: 0.5,
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default ImageUpload;
