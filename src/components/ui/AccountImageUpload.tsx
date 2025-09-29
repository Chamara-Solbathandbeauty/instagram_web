'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, GripVertical } from 'lucide-react';
import { Button } from './Button';

interface AccountImage {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  displayOrder: number;
  createdAt: string;
}

interface AccountImageUploadProps {
  accountId: number;
  existingImages?: AccountImage[];
  onImagesChange?: (images: AccountImage[]) => void;
  maxImages?: number;
  className?: string;
}

export default function AccountImageUpload({
  accountId,
  existingImages = [],
  onImagesChange,
  maxImages = 3,
  className = ''
}: AccountImageUploadProps) {
  const [images, setImages] = useState<AccountImage[]>(existingImages);

  // Update images when existingImages prop changes
  useEffect(() => {
    console.log('AccountImageUpload: existingImages changed:', existingImages);
    setImages(existingImages);
  }, [existingImages]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in to upload images.');
        // Redirect to login page or show login modal
        window.location.href = '/login';
        return;
      }

      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('images', file);
      });

      console.log('Uploading files:', filesToUpload.map(f => ({ name: f.name, size: f.size, type: f.type })));
      console.log('Account ID:', accountId);
      console.log('Backend URL:', `${backendUrl}/users/ig-accounts/${accountId}/images`);

      const response = await fetch(`${backendUrl}/users/ig-accounts/${accountId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload error response:', errorData);
        throw new Error(`Failed to upload images: ${response.status} ${response.statusText}`);
      }

      const uploadedImages = await response.json();
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload images. Please try again.';
      
      if (error.message?.includes('No authentication token')) {
        errorMessage = 'Please log in again to upload images.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'You do not have permission to upload images to this account.';
      } else if (error.message?.includes('413')) {
        errorMessage = 'File size too large. Please select smaller images (max 5MB each).';
      } else if (error.message?.includes('415')) {
        errorMessage = 'Invalid file type. Please select only image files (JPG, PNG, GIF, WebP).';
      } else if (error.message?.includes('Maximum')) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to delete images.');
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/users/ig-accounts/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const newImages = images.filter(img => img.id !== imageId);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Existing Images Section */}
      {images.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Current Images ({images.length}/{maxImages})</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={`${backendUrl}/uploads/account-images/${image.filePath}`}
                    alt={`Account image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Image not found</p>
                    </div>
                  </div>
                </div>

                {/* Overlay Actions */}
                {isAuthenticated && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-white text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image Info */}
                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatFileSize(image.fileSize)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-1" title={image.fileName}>
                    {image.fileName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            !isAuthenticated 
              ? 'border-gray-200 bg-gray-50'
              : dragOver
              ? 'border-[#ef5a29] bg-[#fef7f5]'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={isAuthenticated ? handleDragOver : undefined}
          onDragLeave={isAuthenticated ? handleDragLeave : undefined}
          onDrop={isAuthenticated ? handleDrop : undefined}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !isAuthenticated ? 'bg-gray-200' : 'bg-gray-100'
            }`}>
              <Upload className={`h-6 w-6 ${!isAuthenticated ? 'text-gray-300' : 'text-gray-400'}`} />
            </div>
            <div>
              {!isAuthenticated ? (
                <>
                  <p className="text-sm font-medium text-gray-500">
                    Please log in to upload images
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You need to be logged in to upload account images
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {isUploading ? 'Uploading...' : 'Upload Account Images'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Drag and drop images here, or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max {maxImages} images • JPG, PNG, GIF, WebP • Up to 5MB each
                  </p>
                </>
              )}
            </div>
            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/login'}
                className="mt-2"
              >
                Log In
              </Button>
            )}
          </div>
          {isAuthenticated && (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Maximum images reached
              </p>
              <p className="text-xs text-gray-400 mt-1">
                You have reached the maximum of {maxImages} images. Delete an existing image to upload a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {images.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {images.length} of {maxImages} images uploaded
          </p>
        </div>
      )}
    </div>
  );
}
