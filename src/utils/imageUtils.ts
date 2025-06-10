import { uploadImageToCloudinary, type ImageUploadOptions } from '@/services/cloudinaryService';
import { saveStoreImageMetadata, type StoreImageMetadata } from '@/firebase/firebase';

/**
 * Convert a URL to a File object for uploading
 * @param imageUrl - The URL of the image to convert
 * @param fileName - The desired filename
 * @returns Promise<File>
 */
export async function urlToFile(imageUrl: string, fileName: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Upload default images to Cloudinary for a store
 * @param storeId - The store ID (use "default" for default store)
 * @returns Promise with upload results
 */
export async function uploadDefaultImages(storeId: string = "default"): Promise<{
  success: boolean;
  uploadedImages: string[];
  errors: string[];
}> {
  const results = {
    success: true,
    uploadedImages: [] as string[],
    errors: [] as string[]
  };

  // Default images to upload (assuming they exist in the public folder or as imports)
  const defaultImages = [
    {
      type: 'default-device-session',
      url: '/default-device-sessions.png', // Adjust path as needed
      fileName: 'default-device-session.png'
    },
    {
      type: 'default-rate-breakdown', 
      url: '/default-rate-breakdown.png', // Adjust path as needed
      fileName: 'default-rate-breakdown.png'
    }
  ];

  for (const imageInfo of defaultImages) {
    try {
      // Convert URL to File
      const file = await urlToFile(imageInfo.url, imageInfo.fileName);
      
      // Upload to Cloudinary
      const uploadOptions: ImageUploadOptions = {
        storeId,
        imageType: imageInfo.type
      };

      const cloudinaryResponse = await uploadImageToCloudinary(file, uploadOptions);

      // Save metadata to Firestore
      const imageMetadata: StoreImageMetadata = {
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        imageType: imageInfo.type,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        format: cloudinaryResponse.format,
        bytes: cloudinaryResponse.bytes,
        uploadedAt: cloudinaryResponse.created_at
      };

      await saveStoreImageMetadata(storeId, imageMetadata);
      results.uploadedImages.push(imageInfo.type);

    } catch (error) {
      console.error(`Failed to upload ${imageInfo.type}:`, error);
      results.errors.push(`Failed to upload ${imageInfo.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.success = false;
    }
  }

  return results;
}

/**
 * Get image URL with fallback to default
 * @param imageUrl - The primary image URL
 * @param fallbackUrl - The fallback URL if primary is not available
 * @returns The image URL to use
 */
export function getImageUrlWithFallback(imageUrl?: string | null, fallbackUrl?: string): string {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  return fallbackUrl || '/default-placeholder.png';
}

/**
 * Validate image dimensions
 * @param file - The image file to validate
 * @param maxWidth - Maximum width allowed
 * @param maxHeight - Maximum height allowed
 * @returns Promise with validation result
 */
export async function validateImageDimensions(
  file: File, 
  maxWidth?: number, 
  maxHeight?: number
): Promise<{ isValid: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      let isValid = true;
      let error = '';

      if (maxWidth && img.width > maxWidth) {
        isValid = false;
        error = `Image width (${img.width}px) exceeds maximum allowed width (${maxWidth}px)`;
      }
      
      if (maxHeight && img.height > maxHeight) {
        isValid = false;
        error = error ? `${error} and height (${img.height}px) exceeds maximum allowed height (${maxHeight}px)` 
                      : `Image height (${img.height}px) exceeds maximum allowed height (${maxHeight}px)`;
      }

      resolve({
        isValid,
        error: error || undefined,
        width: img.width,
        height: img.height
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to load image for validation'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress image if it's too large
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in KB
 * @param quality - Compression quality (0-1)
 * @returns Promise<File> - Compressed file
 */
export async function compressImage(
  file: File, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions to maintain aspect ratio
      const ratio = Math.min(800 / img.width, 600 / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Return original if compression fails
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate thumbnail from image file
 * @param file - The image file
 * @param size - Thumbnail size (width and height)
 * @returns Promise<string> - Data URL of thumbnail
 */
export async function generateThumbnail(file: File, size: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio and center crop
      const scale = Math.max(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      ctx?.drawImage(img, x, y, scaledWidth, scaledHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.src = URL.createObjectURL(file);
  });
} 