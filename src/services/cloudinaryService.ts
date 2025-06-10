import { Cloudinary } from '@cloudinary/url-gen';
import { scale, fit } from '@cloudinary/url-gen/actions/resize';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { format } from '@cloudinary/url-gen/actions/delivery';

// Cloudinary configuration
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
});

// Upload preset from Cloudinary dashboard (needs to be created)
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

export interface ImageUploadOptions {
  storeId: string;
  imageType: 'default-device-session' | 'default-rate-breakdown' | string;
  folder?: string;
}

/**
 * Upload image to Cloudinary with proper folder structure
 * @param file - The image file to upload
 * @param options - Upload options including store ID and image type
 * @returns Promise with Cloudinary response
 */
export const uploadImageToCloudinary = async (
  file: File,
  options: ImageUploadOptions
): Promise<CloudinaryUploadResponse> => {
  try {
    // Validate environment variables
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary cloud name not configured');
    }
    
    if (!UPLOAD_PRESET) {
      throw new Error('Cloudinary upload preset not configured');
    }

    // Create the folder path: images/stores/{storeId}/
    const folderPath = `images/stores/${options.storeId}`;
    
    // Create filename based on image type with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const fileName = `${options.imageType}_${timestamp}`;
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folderPath);
    formData.append('public_id', fileName);
    formData.append('resource_type', 'image');

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result: CloudinaryUploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary cloud name not configured');
    }

    // Call server endpoint to delete from Cloudinary
    const response = await fetch('/api/delete-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to delete image: ${errorData.error}`);
    }

    const result = await response.json();
    console.log(`Successfully deleted image: ${publicId}`, result);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error - allow metadata deletion to proceed
    console.warn('Image may still exist in Cloudinary but metadata will be removed');
  }
};

/**
 * Generate optimized URL for an image
 * @param publicId - The public ID of the image
 * @param transformations - Optional transformations to apply
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | string;
  }
): string => {
  try {
    const image = cloudinary.image(publicId);
    
    if (transformations) {
      if (transformations.width && transformations.height) {
        image.resize(fit().width(transformations.width).height(transformations.height));
      } else if (transformations.width) {
        image.resize(scale().width(transformations.width));
      } else if (transformations.height) {
        image.resize(scale().height(transformations.height));
      }
      
      if (transformations.quality) {
        image.delivery(quality(transformations.quality));
      }
      if (transformations.format) {
        image.delivery(format(transformations.format));
      }
    }
    
    return image.toURL();
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    // Fallback to basic Cloudinary URL
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (cloudName && publicId) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    }
    return '';
  }
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Validation result
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)',
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file size must be less than 10MB',
    };
  }

  return { isValid: true };
};

export default cloudinary; 