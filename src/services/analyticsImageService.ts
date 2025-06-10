import { getStoreImageMetadata } from '@/firebase/firebase';
import { getOptimizedImageUrl } from './cloudinaryService';

export interface AnalyticsImages {
  conversionRateBreakdown: string;
  sessionByDeviceType: string;
}

export interface AnalyticsImagesWithStatus {
  images: AnalyticsImages;
  status: {
    conversionRateBreakdown: 'default' | 'custom' | 'error';
    sessionByDeviceType: 'default' | 'custom' | 'error';
  };
}

/**
 * Get analytics images for a specific store
 * @param storeId - The store ID (use "default" for default store)
 * @returns Promise with image URLs
 */
export const getAnalyticsImages = async (storeId?: string): Promise<AnalyticsImages> => {
  const result = await getAnalyticsImagesWithStatus(storeId);
  return result.images;
};

/**
 * Get analytics images with status information for a specific store
 * @param storeId - The store ID (use "default" for default store)
 * @returns Promise with image URLs and status information
 */
export const getAnalyticsImagesWithStatus = async (storeId?: string): Promise<AnalyticsImagesWithStatus> => {
  const defaultImages: AnalyticsImages = {
    conversionRateBreakdown: '/default-rate-breakdown.png',
    sessionByDeviceType: '/default-device-sessions.png'
  };

  const defaultStatus: AnalyticsImagesWithStatus['status'] = {
    conversionRateBreakdown: 'default',
    sessionByDeviceType: 'default'
  };

  // If no storeId provided, use default images
  if (!storeId) {
    return {
      images: defaultImages,
      status: defaultStatus
    };
  }

  try {
    // Fetch both image types for the store - handle each independently
    const [conversionRateResult, deviceSessionResult] = await Promise.allSettled([
      getStoreImageMetadata(storeId, 'default-rate-breakdown'),
      getStoreImageMetadata(storeId, 'default-device-session')
    ]);

    // Build the result object starting with defaults
    const result: AnalyticsImages = { ...defaultImages };
    const status = { ...defaultStatus };

    // Handle conversion rate breakdown image
    if (conversionRateResult.status === 'fulfilled' && conversionRateResult.value) {
      const optimizedUrl = getOptimizedImageUrl(
        conversionRateResult.value.publicId,
        { width: 400, height: 300, quality: 'auto', format: 'auto' }
      );
      result.conversionRateBreakdown = optimizedUrl || conversionRateResult.value.url;
      status.conversionRateBreakdown = 'custom';
    } else if (conversionRateResult.status === 'rejected') {
      status.conversionRateBreakdown = 'error';
    }

    // Handle device session image
    if (deviceSessionResult.status === 'fulfilled' && deviceSessionResult.value) {
      const optimizedUrl = getOptimizedImageUrl(
        deviceSessionResult.value.publicId,
        { width: 400, height: 300, quality: 'auto', format: 'auto' }
      );
      result.sessionByDeviceType = optimizedUrl || deviceSessionResult.value.url;
      status.sessionByDeviceType = 'custom';
    } else if (deviceSessionResult.status === 'rejected') {
      status.sessionByDeviceType = 'error';
    }

    return {
      images: result,
      status
    };
  } catch (error) {
    console.error('Error fetching analytics images for store:', storeId, error);
    // Return default images if there's an error
    return {
      images: defaultImages,
      status: {
        conversionRateBreakdown: 'error',
        sessionByDeviceType: 'error'
      }
    };
  }
};

/**
 * Get a single analytics image by type
 * @param storeId - The store ID
 * @param imageType - The type of image ('default-rate-breakdown' | 'default-device-session')
 * @param fallbackUrl - Fallback URL if image not found
 * @returns Promise with image URL
 */
export const getAnalyticsImage = async (
  storeId: string | undefined,
  imageType: 'default-rate-breakdown' | 'default-device-session',
  fallbackUrl: string
): Promise<string> => {
  if (!storeId) {
    return fallbackUrl;
  }

  try {
    const imageMetadata = await getStoreImageMetadata(storeId, imageType);
    
    if (imageMetadata) {
      // Try to get optimized URL first
      const optimizedUrl = getOptimizedImageUrl(
        imageMetadata.publicId,
        { width: 400, height: 300, quality: 'auto', format: 'auto' }
      );
      
      return optimizedUrl || imageMetadata.url;
    }
    
    return fallbackUrl;
  } catch (error) {
    console.error(`Error fetching ${imageType} for store ${storeId}:`, error);
    return fallbackUrl;
  }
};

/**
 * Preload analytics images for better performance
 * @param images - The analytics images object
 */
export const preloadAnalyticsImages = (images: AnalyticsImages): void => {
  Object.values(images).forEach(imageUrl => {
    if (imageUrl.startsWith('http')) {
      const img = new Image();
      img.src = imageUrl;
    }
  });
}; 