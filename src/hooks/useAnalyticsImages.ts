import { useState, useEffect } from 'react';
import { getAnalyticsImagesWithStatus, type AnalyticsImages, type AnalyticsImagesWithStatus } from '@/services/analyticsImageService';

export interface AnalyticsImagesState extends AnalyticsImagesWithStatus {
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage analytics images for a store
 * @param storeId - The store ID to fetch images for
 * @returns Object with images, loading state, error state, and individual image status
 */
export const useAnalyticsImages = (storeId?: string) => {
  const [images, setImages] = useState<AnalyticsImages>({
    conversionRateBreakdown: '/default-rate-breakdown.png',
    sessionByDeviceType: '/default-device-sessions.png'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<AnalyticsImagesWithStatus['status']>({
    conversionRateBreakdown: 'default',
    sessionByDeviceType: 'default'
  });

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getAnalyticsImagesWithStatus(storeId);
        setImages(result.images);
        setImageStatus(result.status);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics images';
        setError(errorMessage);
        console.error('Error loading analytics images:', err);
        
        // Keep default images on error
        setImages({
          conversionRateBreakdown: '/default-rate-breakdown.png',
          sessionByDeviceType: '/default-device-sessions.png'
        });
        setImageStatus({
          conversionRateBreakdown: 'error',
          sessionByDeviceType: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [storeId]);

  return {
    images,
    loading,
    error,
    imageStatus,
    refetch: () => {
      const loadImages = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const result = await getAnalyticsImagesWithStatus(storeId);
          setImages(result.images);
          setImageStatus(result.status);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics images';
          setError(errorMessage);
          setImageStatus({
            conversionRateBreakdown: 'error',
            sessionByDeviceType: 'error'
          });
        } finally {
          setLoading(false);
        }
      };
      loadImages();
    }
  };
}; 