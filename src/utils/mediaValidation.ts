// Media validation utilities for content types

export type ContentType = 'reel' | 'story' | 'post_with_image';
export type MediaType = 'image' | 'video';

// Define allowed media types for each content type
export const CONTENT_TYPE_MEDIA_RULES = {
  reel: {
    allowedMediaTypes: ['video'] as MediaType[],
    allowedMimeTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
    description: 'Reels require video files'
  },
  story: {
    allowedMediaTypes: ['video'] as MediaType[],
    allowedMimeTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
    description: 'Stories require video files'
  },
  post_with_image: {
    allowedMediaTypes: ['image'] as MediaType[],
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    description: 'Image posts require image files'
  }
} as const;

/**
 * Validates if a file is allowed for the given content type
 */
export function validateMediaForContentType(
  file: File,
  contentType: ContentType
): { isValid: boolean; error?: string } {
  const rules = CONTENT_TYPE_MEDIA_RULES[contentType];
  
  // Check MIME type
  if (!(rules.allowedMimeTypes as readonly string[]).includes(file.type)) {
    return {
      isValid: false,
      error: `${rules.description}. Allowed types: ${rules.allowedMimeTypes.join(', ')}`
    };
  }
  
  // Additional file size validation for videos
  if (contentType === 'reel' || contentType === 'story') {
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxVideoSize) {
      return {
        isValid: false,
        error: 'Video files must be smaller than 100MB'
      };
    }
  }
  
  // Additional file size validation for images
  if (contentType === 'post_with_image') {
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxImageSize) {
      return {
        isValid: false,
        error: 'Image files must be smaller than 10MB'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validates multiple files for a content type
 */
export function validateMultipleMediaForContentType(
  files: File[],
  contentType: ContentType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const file of files) {
    const validation = validateMediaForContentType(file, contentType);
    if (!validation.isValid && validation.error) {
      errors.push(`${file.name}: ${validation.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets the appropriate accept attribute for file input based on content type
 */
export function getAcceptAttributeForContentType(contentType: ContentType): string {
  const rules = CONTENT_TYPE_MEDIA_RULES[contentType];
  return rules?.allowedMimeTypes?.join(',') || 'image/*,video/*';
}

/**
 * Gets user-friendly description of allowed media types
 */
export function getMediaTypeDescription(contentType: ContentType): string {
  return CONTENT_TYPE_MEDIA_RULES[contentType]?.description || 'Please select appropriate media files';
}
