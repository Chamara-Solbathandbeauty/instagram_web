'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentApi, schedulesApi, scheduleContentApi } from '@/lib/api';
import MediaPreview from '@/components/ui/MediaPreview';
import FileUpload from '@/components/ui/FileUpload';

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

interface Schedule {
  id: number;
  name: string;
  account: {
    id: number;
    name: string;
  };
}

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  postType: 'reel' | 'story' | 'post_with_image';
  label: string;
  isAvailable: boolean;
}

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContentFormData) => Promise<void>;
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
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Schedule assignment state
  const [showScheduleAssignment, setShowScheduleAssignment] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [publishedMedia, setPublishedMedia] = useState<any[]>([]);
  const [isLoadingPublishedMedia, setIsLoadingPublishedMedia] = useState(false);

  // Check if content is published (read-only)
  const isPublished = initialData?.status === 'published';
  console.log('🔍 ContentForm: initialData:', initialData);
  console.log('🔍 ContentForm: isPublished:', isPublished);

  // Load published media details
  const loadPublishedMedia = useCallback(async () => {
    if (!initialData?.id) return;
    
    try {
      console.log('🔍 Loading published media for content:', initialData.id);
      setIsLoadingPublishedMedia(true);
      const response = await contentApi.getPublishedMedia(initialData.id);
      console.log('📊 Published media response:', response.data);
      setPublishedMedia(response.data);
    } catch (error: any) {
      console.error('❌ Failed to load published media details:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoadingPublishedMedia(false);
    }
  }, [initialData?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
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

  // Fetch schedules when component mounts
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await schedulesApi.getAll();
        setSchedules(response.data.schedules);
      } catch (error) {
        console.error('Failed to fetch schedules:', error);
      }
    };
    
    if (isOpen) {
      fetchSchedules();
    }
  }, [isOpen]);

  // Fetch available time slots when schedule and date are selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedSchedule || !selectedDate) return;
      
      try {
        setIsLoadingTimeSlots(true);
        const response = await scheduleContentApi.getAvailableTimeSlots(selectedSchedule, selectedDate);
        setAvailableTimeSlots(response.data);
      } catch (error) {
        console.error('Failed to fetch available time slots:', error);
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };
    
    if (selectedSchedule && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [selectedSchedule, selectedDate]);

  // Load published media details when component mounts
  useEffect(() => {
    console.log('🔍 ContentForm useEffect: isPublished:', isPublished, 'initialData?.id:', initialData?.id);
    if (isPublished && initialData?.id) {
      console.log('🔍 ContentForm useEffect: Calling loadPublishedMedia');
      loadPublishedMedia();
    } else {
      console.log('🔍 ContentForm useEffect: Not calling loadPublishedMedia - conditions not met');
    }
  }, [isPublished, initialData?.id, loadPublishedMedia]);

  const handleFormSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    try {
      // Keep hashTags as string for the API
      const formattedData = {
        ...data,
        // Include selected files for new content
        selectedFiles: !initialData?.id ? selectedFiles : undefined,
      };
      await onSubmit(formattedData);
      reset();
      setMediaFiles([]);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleFileUpload = async (files: File[], prompt?: string) => {
    if (!initialData?.id) {
      // For new content, just store files for later upload
      setSelectedFiles(files);
      return;
    }

    try {
      setIsUploadingMedia(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('mediaFiles', file);
      });
      
      if (prompt) {
        formData.append('prompt', prompt);
      }

      // Upload files to existing content
      await contentApi.uploadMedia(initialData.id, formData);
      
      // Reload media files
      await loadMediaFiles(initialData.id);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    } finally {
      setIsUploadingMedia(false);
    }
  };


  const handleClose = () => {
    reset();
    setMediaFiles([]);
    onClose();
  };

  // Schedule assignment functions
  const handleScheduleAssignment = async () => {
    if (!selectedSchedule || !selectedTimeSlot || !selectedDate) {
      alert('Please select a schedule, date, and time slot');
      return;
    }

    // For new content, we need to create it first
    if (!isEdit || !initialData?.id) {
      alert('Please save the content first before assigning it to a schedule');
      return;
    }

    try {
      setIsAssigning(true);
      await scheduleContentApi.assignToTimeSlot({
        scheduleId: selectedSchedule,
        timeSlotId: selectedTimeSlot,
        contentId: initialData.id,
        scheduledDate: selectedDate,
      });
      
      alert('Content successfully assigned to schedule!');
      setShowScheduleAssignment(false);
      // Reset selections
      setSelectedSchedule(null);
      setSelectedDate('');
      setSelectedTimeSlot(null);
      setAvailableTimeSlots([]);
    } catch (error) {
      console.error('Failed to assign content to schedule:', error);
      alert('Failed to assign content to schedule. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleScheduleChange = (scheduleId: number) => {
    setSelectedSchedule(scheduleId);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setAvailableTimeSlots([]);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotChange = (timeSlotId: number) => {
    setSelectedTimeSlot(timeSlotId);
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

            {/* Published Content Notice */}
            {isPublished && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      This content has been published
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>This content is read-only because it has been published to Instagram. You can view the details but cannot make changes.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Published Media Details */}
            {isPublished && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Published Media Details
                </h3>
                
                {isLoadingPublishedMedia ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-blue-700 text-sm">Loading...</span>
                  </div>
                ) : publishedMedia.length > 0 ? (
                  <div className="space-y-3">
                    {publishedMedia.map((media, index) => (
                      <div key={media.id || index} className="bg-white rounded p-3 border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Instagram Media ID:</div>
                            <div className="text-xs font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                              {media.instagramMediaId}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Published:</div>
                            <div className="text-xs text-blue-800">
                              {new Date(media.publishedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {(media.instagramUrl || media.instagramPermalink) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">Links:</div>
                            <div className="space-y-1">
                              {media.instagramUrl && (
                                <div>
                                  <a 
                                    href={media.instagramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                  >
                                    Media URL
                                  </a>
                                </div>
                              )}
                              {media.instagramPermalink && (
                                <div>
                                  <a 
                                    href={media.instagramPermalink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                  >
                                    View on Instagram
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">No published media details found.</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-black-medium mb-1">
                    IG Account *
                  </label>
                  <select
                    id="accountId"
                    {...register('accountId', { valueAsNumber: true })}
                    disabled={isPublished}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={isPublished}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isPublished}
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
                  disabled={isPublished}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5a29] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 resize-none"
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
                  disabled={isPublished}
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
                    disabled={isPublished}
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
                    disabled={isPublished}
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
                  disabled={initialData?.status === 'published'}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                          {mediaFiles.map((media) => (
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
                                  onClick={() => setMediaFiles(prev => prev.filter(m => m.id !== media.id))}
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

                  {/* File Upload Component */}
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h5 className="text-sm font-medium text-black-medium mb-3">
                      {isEdit ? 'Add New Media Files' : 'Upload Media Files'}
                    </h5>
                    <FileUpload
                      onFilesSelected={handleFilesSelected}
                      onUpload={handleFileUpload}
                      multiple={true}
                      maxFiles={10}
                      maxSize={50}
                      disabled={isSubmitting}
                      isUploading={isUploadingMedia}
                      contentType={watch('type')}
                    />
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
                {!isPublished && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (isEdit ? 'Update Content' : 'Create Content')}
                  </Button>
                )}
              </div>

              {/* Schedule Assignment Section - Available for all content */}
              {!isPublished && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-black-medium">
                        Schedule Assignment
                      </h4>
                      {!isEdit && (
                        <p className="text-sm text-gray-600 mt-1">
                          Save the content first, then assign it to a schedule
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowScheduleAssignment(!showScheduleAssignment)}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium"
                    >
                      {showScheduleAssignment ? 'Hide Assignment' : 'Assign to Schedule'}
                    </Button>
                  </div>

                  {showScheduleAssignment && (
                    <div className="space-y-4">
                      {/* Schedule Selection */}
                      <div>
                        <label className="block text-sm font-medium text-black-medium mb-2">
                          Select Schedule
                        </label>
                        <select
                          value={selectedSchedule || ''}
                          onChange={(e) => handleScheduleChange(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a schedule...</option>
                          {schedules.map((schedule) => (
                            <option key={schedule.id} value={schedule.id}>
                              {schedule.name} ({schedule.account.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Selection */}
                      {selectedSchedule && (
                        <div>
                          <label className="block text-sm font-medium text-black-medium mb-2">
                            Select Date
                          </label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Time Slot Selection */}
                      {selectedSchedule && selectedDate && (
                        <div>
                          <label className="block text-sm font-medium text-black-medium mb-2">
                            Available Time Slots
                          </label>
                          {isLoadingTimeSlots ? (
                            <div className="text-center py-4">
                              <div className="text-gray-500">Loading available time slots...</div>
                            </div>
                          ) : availableTimeSlots.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                              {availableTimeSlots.map((slot) => (
                                <label
                                  key={slot.id}
                                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                                    selectedTimeSlot === slot.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="timeSlot"
                                    value={slot.id}
                                    checked={selectedTimeSlot === slot.id}
                                    onChange={() => handleTimeSlotChange(slot.id)}
                                    className="mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {slot.startTime} - {slot.endTime}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {slot.label} • {slot.postType}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No available time slots for this date
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assignment Button */}
                      {selectedSchedule && selectedDate && selectedTimeSlot && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={handleScheduleAssignment}
                            disabled={isAssigning}
                            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md font-medium disabled:opacity-50"
                          >
                            {isAssigning ? 'Assigning...' : (isEdit ? 'Assign to Schedule' : 'Save Content First')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
