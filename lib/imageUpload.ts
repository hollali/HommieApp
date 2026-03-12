import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  publicId?: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes, default 5MB
  quality?: number; // 0-1, default 0.8
  compress?: boolean; // default true
  folder?: string; // default 'uploads'
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  quality: 0.8,
  compress: true,
  folder: 'uploads',
};

export const pickAndUploadImage = async (
  options: ImageUploadOptions = {}
): Promise<UploadResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access camera roll is required',
      };
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: opts.quality,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: 'No image selected',
      };
    }

    const asset = result.assets[0];

    // Check file size
    if (opts.maxSize && asset.fileSize && asset.fileSize > opts.maxSize) {
      return {
        success: false,
        error: `Image size must be less than ${(opts.maxSize / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    // Process and upload image
    return await uploadImageFromAsset(asset, opts);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to pick and upload image',
    };
  }
};

export const takePhotoAndUpload = async (
  options: ImageUploadOptions = {}
): Promise<UploadResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access camera is required',
      };
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: opts.quality,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: 'No photo taken',
      };
    }

    const asset = result.assets[0];

    // Check file size
    if (opts.maxSize && asset.fileSize && asset.fileSize > opts.maxSize) {
      return {
        success: false,
        error: `Image size must be less than ${(opts.maxSize / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    // Process and upload image
    return await uploadImageFromAsset(asset, opts);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to take and upload photo',
    };
  }
};

const uploadImageFromAsset = async (
  asset: ImagePicker.ImagePickerAsset,
  options: ImageUploadOptions
): Promise<UploadResult> => {
  try {
    let processedAsset = asset;

    // Compress image if needed
    if (options.compress) {
      const manipulated = await manipulateAsync(
        asset.uri,
        [
          {
            resize: {
              width: 1200, // Max width
              height: 900,  // Max height
            },
          },
        ],
        {
          compress: options.quality || 0.8,
          format: SaveFormat.JPEG,
        }
      );
      processedAsset = { ...asset, ...manipulated };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${randomString}.jpg`;
    const filePath = `${options.folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, {
        uri: processedAsset.uri,
        type: 'image/jpeg',
        name: filename,
      } as any, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      publicId: data.path,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
};

export const deleteImage = async (publicId: string): Promise<UploadResult> => {
  try {
    const { error } = await supabase.storage
      .from('property-images')
      .remove([publicId]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    };
  }
};

export const uploadMultipleImages = async (
  options: ImageUploadOptions = {}
): Promise<UploadResult[]> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return [{
        success: false,
        error: 'Permission to access camera roll is required',
      }];
    }

    // Pick multiple images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: options.quality || 0.8,
      allowsMultipleSelection: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [{
        success: false,
        error: 'No images selected',
      }];
    }

    // Upload each image
    const uploadPromises = result.assets.map(asset => 
      uploadImageFromAsset(asset, options)
    );

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    return [{
      success: false,
      error: error.message || 'Failed to upload images',
    }];
  }
};
