import React, { useState, useEffect } from 'react';
import { 
  uploadImageToCloudinary, 
  validateImageFile, 
  getOptimizedImageUrl,
  type CloudinaryUploadResponse,
  type ImageUploadOptions 
} from '@/services/cloudinaryService';
import { 
  saveStoreImageMetadata, 
  getStoreImageMetadata, 
  deleteStoreImageMetadata,
  type StoreImageMetadata 
} from '@/firebase/firebase';

interface ImageManagementProps {
  storeId: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface AnalyticsImageConfig {
  id: 'default-device-session' | 'default-rate-breakdown';
  title: string;
  description: string;
  usedIn: string;
  defaultImage: string;
}

const ANALYTICS_IMAGES: AnalyticsImageConfig[] = [
  {
    id: 'default-device-session',
    title: 'Device Session Chart',
    description: 'Sessions breakdown by device type (Desktop, Mobile, Tablet)',
    usedIn: 'Sessions by device type graph',
    defaultImage: '/default-device-sessions.png'
  },
  {
    id: 'default-rate-breakdown',
    title: 'Conversion Rate Chart', 
    description: 'Conversion rate breakdown visualization',
    usedIn: 'Conversion rate breakdown graph',
    defaultImage: '/default-rate-breakdown.png'
  }
];

interface ImageCardState {
  metadata: StoreImageMetadata | null;
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  error: string;
}

const ImageManagement: React.FC<ImageManagementProps> = ({ 
  storeId, 
  isLoading, 
  setIsLoading 
}) => {
  const [imageStates, setImageStates] = useState<Record<string, ImageCardState>>({});

  // Initialize image states
  useEffect(() => {
    const initialStates: Record<string, ImageCardState> = {};
    ANALYTICS_IMAGES.forEach(config => {
      initialStates[config.id] = {
        metadata: null,
        loading: false,
        uploading: false,
        uploadProgress: 0,
        error: ''
      };
    });
    setImageStates(initialStates);
    loadExistingImages();
  }, [storeId]);

  const loadExistingImages = async () => {
    try {
      setIsLoading(true);
      
      // Load each image type
      for (const config of ANALYTICS_IMAGES) {
        setImageStates(prev => ({
          ...prev,
          [config.id]: { ...prev[config.id], loading: true, error: '' }
        }));

        try {
          const metadata = await getStoreImageMetadata(storeId, config.id);
          setImageStates(prev => ({
            ...prev,
            [config.id]: { ...prev[config.id], metadata, loading: false }
          }));
        } catch (err) {
          // Image doesn't exist, which is fine
          setImageStates(prev => ({
            ...prev,
            [config.id]: { ...prev[config.id], metadata: null, loading: false }
          }));
        }
      }
    } catch (err) {
      console.error('Error loading images:', err);
      ANALYTICS_IMAGES.forEach(config => {
        setImageStates(prev => ({
          ...prev,
          [config.id]: { 
            ...prev[config.id], 
            loading: false, 
            error: 'Failed to load image' 
          }
        }));
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (imageType: string, file: File) => {
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          error: validation.error || 'Invalid file' 
        }
      }));
      return;
    }

    try {
      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          uploading: true, 
          uploadProgress: 0, 
          error: '' 
        }
      }));

      // Upload to Cloudinary
      const uploadOptions: ImageUploadOptions = {
        storeId,
        imageType
      };

      setImageStates(prev => ({
        ...prev,
        [imageType]: { ...prev[imageType], uploadProgress: 30 }
      }));

      const cloudinaryResponse: CloudinaryUploadResponse = await uploadImageToCloudinary(
        file,
        uploadOptions
      );

      setImageStates(prev => ({
        ...prev,
        [imageType]: { ...prev[imageType], uploadProgress: 70 }
      }));

      // Save metadata to Firestore
      const imageMetadata: StoreImageMetadata = {
        url: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        imageType: imageType,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        format: cloudinaryResponse.format,
        bytes: cloudinaryResponse.bytes,
        uploadedAt: cloudinaryResponse.created_at
      };

      await saveStoreImageMetadata(storeId, imageMetadata);

      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          uploadProgress: 100,
          metadata: imageMetadata,
          uploading: false
        }
      }));

      // Clear upload progress after 2 seconds
      setTimeout(() => {
        setImageStates(prev => ({
          ...prev,
          [imageType]: { ...prev[imageType], uploadProgress: 0 }
        }));
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          uploading: false, 
          uploadProgress: 0,
          error: err instanceof Error ? err.message : 'Upload failed' 
        }
      }));
    }
  };

  const handleImageDelete = async (imageType: string) => {
    const imageState = imageStates[imageType];
    if (!imageState?.metadata) return;

    if (!confirm(`Are you sure you want to delete the ${ANALYTICS_IMAGES.find(img => img.id === imageType)?.title} image?`)) {
      return;
    }

    try {
      setImageStates(prev => ({
        ...prev,
        [imageType]: { ...prev[imageType], loading: true, error: '' }
      }));
      
      // Note: Images remain in Cloudinary but metadata is removed
      // This is common practice for client-side apps without server endpoints
      console.log(`Removing metadata for image: ${imageState.metadata.publicId}`);
      
      // Delete metadata from Firestore
      await deleteStoreImageMetadata(storeId, imageType);
      
      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          metadata: null, 
          loading: false 
        }
      }));
      
    } catch (err) {
      console.error('Delete error:', err);
      setImageStates(prev => ({
        ...prev,
        [imageType]: { 
          ...prev[imageType], 
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to delete image' 
        }
      }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ImageCard: React.FC<{ config: AnalyticsImageConfig }> = ({ config }) => {
    const state = imageStates[config.id] || {
      metadata: null,
      loading: false,
      uploading: false,
      uploadProgress: 0,
      error: ''
    };

    const hasCustomImage = state.metadata !== null;
    const displayImage = hasCustomImage 
      ? getOptimizedImageUrl(state.metadata!.publicId, { width: 400, height: 200, quality: 'auto' })
      : config.defaultImage;

    return (
      <div className="image-card bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="card-header bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{config.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
        </div>

        {/* Image Display */}
        <div className="image-container relative">
          {state.loading ? (
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={displayImage}
                  alt={config.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Image Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  hasCustomImage 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {hasCustomImage ? 'Custom' : 'Default'}
                </span>
              </div>
            </>
          )}

          {/* Upload Progress */}
          {state.uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4">
                <div className="text-center mb-2">
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.uploadProgress}%` }}
                  />
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">{state.uploadProgress}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Info */}
        <div className="card-body p-4">
          {hasCustomImage && state.metadata && (
            <div className="image-details mb-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Dimensions:</span>
                <span>{state.metadata.width} × {state.metadata.height}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{formatFileSize(state.metadata.bytes || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span>{new Date(state.metadata.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <div className="usage-info mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Used in:</span> {config.usedIn}
            </p>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="error-display mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="card-actions space-y-2">
            {/* File Upload */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(config.id, file);
                  }
                }}
                className="hidden"
                id={`upload-${config.id}`}
                disabled={state.uploading || isLoading}
              />
              <label
                htmlFor={`upload-${config.id}`}
                className={`block w-full px-4 py-2 text-center text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  state.uploading || isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : hasCustomImage
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {state.uploading ? 'Uploading...' : hasCustomImage ? 'Replace Image' : 'Upload Image'}
              </label>
            </div>

            {/* Delete Button */}
            {hasCustomImage && (
              <button
                onClick={() => handleImageDelete(config.id)}
                disabled={state.loading || isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {state.loading ? 'Deleting...' : 'Delete & Use Default'}
              </button>
            )}

            {/* View Full Size */}
            {hasCustomImage && state.metadata && (
              <a
                href={state.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                View Full Size
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="image-management-section">
      <div className="section-header mb-6">
        <h2 className="text-xl font-bold text-gray-800">Analytics Image Management</h2>
        <p className="text-gray-600 text-sm mt-1">
          Customize the images used in your analytics dashboard. Only these two specific images can be uploaded.
        </p>
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            <span className="font-medium">Important:</span> These images will appear on your analytics page. 
            If no custom image is uploaded, the default image will be used automatically.
          </p>
        </div>
      </div>

      {/* Images Grid */}
      <div className="images-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ANALYTICS_IMAGES.map(config => (
          <ImageCard key={config.id} config={config} />
        ))}
      </div>


    </div>
  );
};

export default ImageManagement; 