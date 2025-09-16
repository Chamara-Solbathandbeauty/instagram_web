'use client';

import { useState } from 'react';
import { Image, Video, File, Play, Download, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface MediaPreviewProps {
  media: {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    mediaType: 'image' | 'video';
    createdAt: string;
  };
  onDelete?: (mediaId: number) => void;
  showActions?: boolean;
  className?: string;
}

export default function MediaPreview({ 
  media, 
  onDelete, 
  showActions = true,
  className = '' 
}: MediaPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Construct the full URL for the media file
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const mediaUrl = `${backendUrl}/uploads/${media.filePath}`;
  
  const isImage = media.mediaType === 'image' || media.mimeType.startsWith('image/');
  const isVideo = media.mediaType === 'video' || media.mimeType.startsWith('video/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = media.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this media file?')) {
      onDelete(media.id);
    }
  };

  const handleVideoModalOpen = () => {
    setShowVideoModal(true);
  };

  const handleVideoModalClose = () => {
    setShowVideoModal(false);
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isImage && <Image className="h-4 w-4 text-[#ef5a29]" />}
          {isVideo && <Video className="h-4 w-4 text-[#ef5a29]" />}
          {!isImage && !isVideo && <File className="h-4 w-4 text-[#ef5a29]" />}
          <span className="text-sm font-medium text-black-medium capitalize">
            {media.mediaType}
          </span>
        </div>
        <span className="text-xs text-black-muted bg-gray-100 px-2 py-1 rounded">
          {media.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
        </span>
      </div>

      {/* Media Preview */}
      <div className="mb-3 bg-gray-50 rounded-md overflow-hidden">
        {isImage && !imageError ? (
          <img
            src={mediaUrl}
            alt="Media preview"
            className="w-full h-32 object-cover cursor-pointer"
            onError={() => setImageError(true)}
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        ) : isVideo ? (
          <div className="w-full h-32 flex items-center justify-center bg-gray-100 relative group">
            <Video className="h-8 w-8 text-gray-400" />
            <button
              onClick={handleVideoModalOpen}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="h-8 w-8 text-white" />
            </button>
          </div>
        ) : (
          <div className="w-full h-32 flex items-center justify-center">
            <div className="text-center">
              <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-black-muted">Preview not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Media Info */}
      <div className="space-y-2">
        <div className="text-sm">
          <p className="text-black-medium font-medium truncate" title={media.fileName}>
            {media.fileName}
          </p>
          <p className="text-black-muted text-xs">
            {formatFileSize(media.fileSize)} • {formatDate(media.createdAt)}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Video Modal - Simple approach */}
      {showVideoModal && isVideo && (
        <div 
          className="fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={handleVideoModalClose}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black-medium">Video Preview</h3>
              <button
                onClick={handleVideoModalClose}
                className="text-black-muted hover:text-black-medium text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <video
              src={mediaUrl}
              controls
              className="w-full max-h-96"
              onError={() => {
                alert('Error loading video');
                handleVideoModalClose();
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
