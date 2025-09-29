'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Image } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { contentApi } from '@/lib/api';
import MediaPreview from '@/components/ui/MediaPreview';

interface MediaFile {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'image' | 'video';
  createdAt: string;
}

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number;
  contentTitle: string;
}

export default function MediaViewer({ 
  isOpen, 
  onClose, 
  contentId, 
  contentTitle 
}: MediaViewerProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMediaFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await contentApi.getMedia(contentId);
      setMediaFiles(response.data);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    if (isOpen && contentId) {
      loadMediaFiles();
    }
  }, [isOpen, contentId, loadMediaFiles]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-black-medium">Media Files</h3>
                <p className="text-sm text-black-muted mt-1">{contentTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-black-muted hover:text-black-medium transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef5a29]"></div>
              </div>
            ) : mediaFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#fef7f5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="h-8 w-8 text-[#ef5a29]" />
                </div>
                <h4 className="text-lg font-semibold text-black-medium mb-2">No Media Files</h4>
                <p className="text-black-muted">This content doesn&apos;t have any media files attached yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mediaFiles.map((media) => (
                  <MediaPreview
                    key={media.id}
                    media={media}
                    showActions={true}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={onClose}
                className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
