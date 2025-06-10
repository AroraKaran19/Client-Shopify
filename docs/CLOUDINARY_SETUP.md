# Cloudinary Integration Setup

This document explains how to set up Cloudinary integration for image storage in your Shopify Client application.

## Overview

The application uses Cloudinary as a cloud-based image storage solution with the following structure:
```
images/
  stores/
    default/
      default-device-session.png
      default-rate-breakdown.png
    store-id-1/
      default-device-session.png
      default-rate-breakdown.png
      store-logo.png
      banner.png
    store-id-2/
      ...
```

## Prerequisites

1. A Cloudinary account (free tier available at [cloudinary.com](https://cloudinary.com))
2. Access to your Cloudinary Dashboard

## Setup Steps

### 1. Get Cloudinary Credentials

1. Log in to your [Cloudinary Dashboard](https://cloudinary.com/console)
2. Note down your **Cloud Name** from the dashboard
3. You'll need to create an upload preset (see step 2)

### 2. Create Upload Preset

1. In your Cloudinary Dashboard, go to **Settings** > **Upload**
2. Click **Add upload preset**
3. Configure the preset:
   - **Preset name**: `shopify-client-uploads` (or any name you prefer)
   - **Signing Mode**: **Unsigned** (important for client-side uploads)
   - **Folder**: Leave empty (we'll set this dynamically)
   - **Access Control**: Public (or as needed)
   - **Allowed formats**: `jpg,png,gif,webp`
   - **Max file size**: `10485760` (10MB)
   - **Auto backup**: Enable if desired
   - **Overwrite**: Enable (allows replacing existing images)

4. Save the preset

### 3. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=shopify-client-uploads
```

Replace:
- `your_cloudinary_cloud_name` with your actual Cloud Name from the dashboard
- `shopify-client-uploads` with the name of the upload preset you created

### 4. Folder Structure

The application automatically creates the following folder structure in Cloudinary:

- **Default Store**: `images/stores/default/`
- **Custom Stores**: `images/stores/{storeId}/`

### 5. Supported Image Types

The application supports the following predefined image types:
- `default-device-session` - Device session analytics image
- `default-rate-breakdown` - Rate breakdown analytics image  
- `store-logo` - Store logo
- `banner` - Store banner
- Custom types can be defined when uploading

## Features

### Image Upload
- Drag & drop or file selection
- File validation (type, size)
- Upload progress tracking
- Automatic metadata storage in Firestore

### Image Management
- View all uploaded images per store
- Delete images (removes metadata from database)
- Optimized image URLs with Cloudinary transformations
- Image preview with size information

### Database Integration
Images are stored in Firestore with the following structure:
```
images/
  stores/
    {storeId}/
      {imageType}: {
        url: string,
        publicId: string,
        imageType: string,
        width: number,
        height: number,
        format: string,
        bytes: number,
        uploadedAt: string,
        storeId: string,
        updatedAt: string
      }
```

## Security Considerations

1. **Unsigned Uploads**: Using unsigned upload presets for client-side uploads
2. **File Validation**: Client-side validation for file type and size
3. **Upload Preset**: Configured with appropriate restrictions
4. **No API Secrets**: API secrets are not exposed to the client

## Image Optimization

The application automatically generates optimized URLs using Cloudinary's transformation API:
- Width/height resizing
- Quality optimization
- Format conversion (WebP when supported)
- Lazy loading support

## Admin Panel Access

Images can only be uploaded and managed through the admin panel (`/admin` route) under the Settings tab. This ensures proper access control for image management.

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check that your upload preset is set to "Unsigned"
2. **Environment Variables**: Ensure variables are properly set and start with `VITE_`
3. **File Size**: Maximum file size is 10MB by default
4. **File Types**: Only image files (JPEG, PNG, WebP, GIF) are supported

### Error Messages

- "Cloudinary cloud name not configured" - Check `VITE_CLOUDINARY_CLOUD_NAME`
- "Cloudinary upload preset not configured" - Check `VITE_CLOUDINARY_UPLOAD_PRESET`
- "Please select a valid image file" - File type not supported
- "Image file size must be less than 10MB" - File too large

## Cost Considerations

Cloudinary offers a generous free tier:
- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 monthly transformations

Monitor your usage in the Cloudinary Dashboard to stay within limits or upgrade as needed. 