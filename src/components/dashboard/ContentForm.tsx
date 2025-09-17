'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Trash2, Image, Video, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentApi } from '@/lib/api';
import MediaPreview from '@/components/ui/MediaPreview';

const contentSchema = z.object({
  accountId: z.number().min(1, 'Please select an account'),
  caption: z.string().max(2200, 'Caption must be less than 2200 characters').optional(),
  hashTags: z.string().optional(),
  generatedSource: z.string().min(1, 'Generated source is required').default('Manual Creation'),
  usedTopics: z.string().optional(),
  tone: z.string().optional(),
  type: z.enum(['reel', 'story', 'post_with_image']).default('post_with_image'),
  status: z.enum(['generated', 'published', 'rejected', 'queued']).default('generated'),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface IgAccount {
  id: number;
  name: string;
  type: 'business' | 'creator';
}

interface MediaFile {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'image' | 'video';
  createdAt: string;
}

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Partial<ContentFormData & { id?: number }>;
  isEdit?: boolean;
  accounts: IgAccount[];
}

export default function ContentForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isEdit = false,
  accounts 
}: ContentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [newMediaPath, setNewMediaPath] = useState('');
  const [newMediaType, setNewMediaType] = useState<'reel' | 'story' | 'image'>('image');
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      accountId: 0,
      caption: '',
      hashTags: '',
      generatedSource: '',
      usedTopics: '',
      tone: '',
      type: 'post_with_image' as const,
      status: 'generated' as const,
    },
  });

  // Load media files for existing content
  const loadMediaFiles = async (contentId: number) => {
    try {
      setIsLoadingMedia(true);
      const response = await contentApi.getMedia(contentId);
      setMediaFiles(response.data);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Reset form with initial data when it changes
  useEffect(() => {
    if (initialData) {
      reset({
        accountId: initialData.accountId || 0,
        caption: initialData.caption || '',
        hashTags: Array.isArray(initialData.hashTags) ? initialData.hashTags.join(', ') : '',
        generatedSource: initialData.generatedSource || '',
        usedTopics: initialData.usedTopics || '',
        tone: initialData.tone || '',
        type: initialData.type || 'post_with_image',
        status: initialData.status || 'generated',
      });
      
      // Load media files if editing existing content
      if (initialData.id && isEdit) {
        loadMediaFiles(initialData.id);
      } else {
        setMediaFiles([]);
      }
    } else {
      reset({
        accountId: accounts.length > 0 ? accounts[0].id : 0,
        caption: '',
        hashTags: '',
        generatedSource: '',
        usedTopics: '',
        tone: '',
        type: 'post_with_image',
        status: 'generated',
      });
      setMediaFiles([]);
    }
  }, [initialData, reset, accounts, isEdit]);

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Convert hashTags string to array
      const formattedData = {
        ...data,
        hashTags: data.hashTags ? data.hashTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [],
        // Include media files for new content
        mediaFiles: !initialData?.id ? mediaFiles : undefined,
      };
      await onSubmit(formattedData);
      reset();
      setMediaFiles([]);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMedia = async () => {
    if (!newMediaPath.trim()) return;
    
    // For new content, just add to local state
    if (!initialData?.id) {
      const newMedia: MediaFile = {
        id: Date.now(), // Temporary ID for new media
        fileName: newMediaPath.trim().split('/').pop() || 'new-media',
        filePath: newMediaPath.trim(),
        fileSize: 0,
        mimeType: newMediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        mediaType: newMediaType === 'image' ? 'image' : 'video',
        createdAt: new Date().toISOString(),
      };
      setMediaFiles(prev => [...prev, newMedia]);
      setNewMediaPath('');
      return;
    }
    
    // For existing content, save to backend
    try {
      await contentApi.addMedia(initialData.id, {
        fileName: newMediaPath.trim().split('/').pop() || 'new-media',
        filePath: newMediaPath.trim(),
        fileSize: 0,
        mimeType: newMediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        mediaType: newMediaType === 'image' ? 'image' : 'video',
      });
      
      // Reload media files
      loadMediaFiles(initialData.id);
      setNewMediaPath('');
    } catch (error) {
      console.error('Failed to add media:', error);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      await contentApi.deleteMedia(mediaId);
      
      // Reload media files
      if (initialData?.id) {
        loadMediaFiles(initialData.id);
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'reel':
        return <Video className="h-4 w-4" />;
      case 'story':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const handleClose = () => {
    reset();
    setMediaFiles([]);
    setNewMediaPath('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black-medium">
                {isEdit ? 'Edit Content' : 'Create New Content'}
              </h3>
              <button
                onClick={handleClose}
                className="text-black-muted hover:text-black-medium transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-black-medium mb-1">
                    IG Account *
                  </label>
                  <select
                    id="accountId"
                    {...register('accountId', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                  >
                    <option value={0}>Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-red-500">{errors.accountId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-black-medium mb-1">
                    Content Type
                  </label>
                  <select
                    id="type"
                    {...register('type')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                  >
                    <option value="post_with_image">Post with Image</option>
                    <option value="reel">Reel</option>
                    <option value="story">Story</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="generatedSource" className="block text-sm font-medium text-black-medium mb-1">
                  Generated Source *
                </label>
                <Input
                  id="generatedSource"
                  type="text"
                  placeholder="e.g., AI Generator, Manual Creation, Template"
                  defaultValue="Manual Creation"
                  {...register('generatedSource')}
                  error={errors.generatedSource?.message}
                />
                {errors.generatedSource && (
                  <p className="mt-1 text-sm text-red-500">{errors.generatedSource.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-black-medium mb-1">
                  Caption
                </label>
                <textarea
                  id="caption"
                  rows={4}
                  placeholder="Write your Instagram caption here..."
                  {...register('caption')}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5a29] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {errors.caption && (
                  <p className="mt-1 text-sm text-red-500">{errors.caption.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="hashTags" className="block text-sm font-medium text-black-medium mb-1">
                  Hashtags
                </label>
                <Input
                  id="hashTags"
                  type="text"
                  placeholder="fashion, style, ootd (comma separated)"
                  {...register('hashTags')}
                  error={errors.hashTags?.message}
                />
                <p className="mt-1 text-xs text-black-muted">Separate hashtags with commas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="usedTopics" className="block text-sm font-medium text-black-medium mb-1">
                    Used Topics
                  </label>
                  <Input
                    id="usedTopics"
                    type="text"
                    placeholder="Topics used for content generation"
                    {...register('usedTopics')}
                    error={errors.usedTopics?.message}
                  />
                </div>

                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-black-medium mb-1">
                    Tone
                  </label>
                  <Input
                    id="tone"
                    type="text"
                    placeholder="e.g., casual, professional, funny"
                    {...register('tone')}
                    error={errors.tone?.message}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-black-medium mb-1">
                  Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                >
                  <option value="generated">Generated</option>
                  <option value="queued">Queued</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Media Management Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-black-medium">Media Files</h4>
                  <span className="text-sm text-black-muted">{mediaFiles.length} files</span>
                </div>

                  {/* Media Files List - Show existing files when editing, preview when creating */}
                  {isEdit && initialData?.id ? (
                    // Existing media files for editing
                    <>
                      {isLoadingMedia ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ef5a29]"></div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          {mediaFiles.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {mediaFiles.map((media) => (
                                <MediaPreview
                                  key={media.id}
                                  media={media}
                                  onDelete={handleDeleteMedia}
                                  showActions={true}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-black-muted text-center py-4">No media files attached</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    // Preview of media files to be created
                    mediaFiles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-black-medium mb-2">Media files to be created:</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {mediaFiles.map((media, index) => (
                            <div key={media.id} className="border border-[#ef5a29]/20 rounded-lg p-4 bg-[#fef7f5]">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {media.mediaType === 'image' && <Image className="h-4 w-4 text-[#ef5a29]" />}
                                  {media.mediaType === 'video' && <Video className="h-4 w-4 text-[#ef5a29]" />}
                                  <span className="text-sm font-medium text-black-medium capitalize">
                                    {media.mediaType}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                                  className="p-1 text-black-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="text-sm">
                                <p className="text-black-medium font-medium truncate" title={media.fileName}>
                                  {media.fileName}
                                </p>
                                <p className="text-black-muted text-xs">
                                  {media.filePath}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* Add New Media - Show for both create and edit */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h5 className="text-sm font-medium text-black-medium mb-3">
                      {isEdit ? 'Add New Media' : 'Add Media Files'}
                    </h5>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Enter media path or URL"
                        value={newMediaPath}
                        onChange={(e) => setNewMediaPath(e.target.value)}
                      />
                      <div className="flex items-center space-x-3">
                        <select
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value as 'reel' | 'story' | 'image')}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                        >
                          <option value="image">Image</option>
                          <option value="reel">Reel</option>
                          <option value="story">Story</option>
                        </select>
                        <Button
                          type="button"
                          onClick={handleAddMedia}
                          disabled={!newMediaPath.trim()}
                          className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isEdit ? 'Add Media' : 'Add Media'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (isEdit ? 'Update Content' : 'Create Content')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
