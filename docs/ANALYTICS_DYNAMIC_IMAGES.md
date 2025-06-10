# Dynamic Analytics Images

This document explains how the analytics page now dynamically displays images based on the current store.

## Overview

The analytics page now supports store-specific images for:
- **Conversion Rate Breakdown** (`default-rate-breakdown`)
- **Sessions by Device Type** (`default-device-session`)

Images are fetched from Cloudinary based on the current store ID and automatically fall back to default images if custom ones aren't available.

## How It Works

### 1. **Service Layer** (`src/services/analyticsImageService.ts`)
- `getAnalyticsImages(storeId)` - Fetches both image types for a store
- `getAnalyticsImage(storeId, imageType)` - Fetches a single image type
- `preloadAnalyticsImages(images)` - Preloads images for better performance

### 2. **React Hook** (`src/hooks/useAnalyticsImages.ts`)
- `useAnalyticsImages(storeId)` - React hook that manages image loading state
- Returns: `{ images, loading, error, imageStatus, refetch }`
- `imageStatus` indicates whether each image is 'default', 'custom', or 'error'
- Automatically refetches when `storeId` changes
- Handles partial availability - some images can be custom while others remain default

### 3. **Component Integration**
- **GraphContent component** uses the hook to fetch and display dynamic images
- **Automatic fallback** to default images if store-specific ones don't exist
- **Optimized URLs** generated using Cloudinary transformations

## Image Resolution Priority

Each image type is handled independently:

1. **Store-specific Cloudinary images** (if uploaded via admin panel) → Status: `custom`
2. **Default static images** (`/default-rate-breakdown.png`, `/default-device-sessions.png`) → Status: `default`
3. **Error fallback** (if fetch fails) → Status: `error` (still shows default image)

**Mixed scenarios supported:**
- Store has only conversion rate image → One custom, one default
- Store has only device session image → One default, one custom  
- Store has neither → Both default
- Store has both → Both custom

## Usage

### For Developers

```typescript
import { useAnalyticsImages } from '@/hooks/useAnalyticsImages';

const MyComponent = ({ storeId }: { storeId?: string }) => {
  const { images, loading, error, imageStatus } = useAnalyticsImages(storeId);
  
  return (
    <div>
      <img 
        src={images.conversionRateBreakdown} 
        alt="Conversion Rate Breakdown" 
      />
      {imageStatus.conversionRateBreakdown === 'custom' && (
        <span>✨ Custom image</span>
      )}
      {imageStatus.sessionByDeviceType === 'default' && (
        <span>📋 Using default image</span>
      )}
    </div>
  );
};
```

### For Administrators

1. Navigate to **Admin Panel** (`/admin/{storeId}`)
2. Go to **Settings** tab
3. Use **Image Management** section
4. Upload images with types:
   - `default-rate-breakdown` - For conversion rate breakdown chart
   - `default-device-session` - For device sessions chart

## Image Optimization

Images are automatically optimized using Cloudinary:
- **Width**: 400px
- **Height**: 300px  
- **Quality**: Auto
- **Format**: Auto (WebP when supported)

## Database Structure

Images are stored in Firestore under:
```
images/
  stores/
    {storeId}/
      default-rate-breakdown: { url, publicId, metadata... }
      default-device-session: { url, publicId, metadata... }
```

## URL Patterns

- **Analytics with default store**: `/analytics` 
- **Analytics with specific store**: `/analytics/{storeId}`
- Images automatically match the current store context

## Performance Considerations

- **Lazy loading** - Images load when component mounts
- **Caching** - Browser caches optimized Cloudinary URLs
- **Fallback** - Immediate fallback to local defaults on error
- **Preloading** - Optional preloading for better UX

## Error Handling

- **Network errors** - Falls back to default images
- **Missing images** - Uses default images  
- **Invalid store IDs** - Uses default images
- **Cloudinary errors** - Falls back to original URLs, then defaults

## Testing

Visit different store analytics pages to see dynamic images:
- `/analytics` - Default store images
- `/analytics/store-1` - Store 1 specific images (if uploaded)
- `/analytics/store-2` - Store 2 specific images (if uploaded)

Upload custom images via admin panel to see them reflected on analytics pages. 