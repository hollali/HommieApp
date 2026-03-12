import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImageResult {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera permission is required to take photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Media library permission is required to select photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Pick image from camera
 */
export async function pickImageFromCamera(): Promise<ImageResult | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled) return null;

  return {
    uri: result.assets[0].uri,
    type: result.assets[0].type || 'image',
    name: result.assets[0].fileName || 'photo.jpg',
    size: result.assets[0].fileSize || 0,
  };
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<ImageResult | null> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    allowsMultipleSelection: false,
  });

  if (result.canceled) return null;

  return {
    uri: result.assets[0].uri,
    type: result.assets[0].type || 'image',
    name: result.assets[0].fileName || 'photo.jpg',
    size: result.assets[0].fileSize || 0,
  };
}

/**
 * Pick multiple images from gallery
 */
export async function pickMultipleImages(maxImages: number = 10): Promise<ImageResult[]> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: maxImages,
  });

  if (result.canceled) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    type: asset.type || 'image',
    name: asset.fileName || 'photo.jpg',
    size: asset.fileSize || 0,
  }));
}

/**
 * Show image picker options (Camera or Gallery)
 */
export async function showImagePickerOptions(): Promise<ImageResult | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const image = await pickImageFromCamera();
            resolve(image);
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const image = await pickImageFromGallery();
            resolve(image);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]
    );
  });
}

