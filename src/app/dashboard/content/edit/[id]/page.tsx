'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentApi, igAccountsApi, schedulesApi, scheduleContentApi } from '@/lib/api';
import MediaPreview from '@/components/ui/MediaPreview';
import FileUpload from '@/components/ui/FileUpload';
import AppLayout from '@/components/layout/AppLayout';

const contentSchema = z.object({
  accountId: z.number().min(1, 'Please select an account'),
  caption: z.string().max(2200, 'Caption must be less than 2200 characters').optional(),
  hashTags: z.string().optional(),
  generatedSource: z.string().min(1, 'Generated source is required'),
  usedTopics: z.string().optional(),
  tone: z.string().optional(),
  type: z.enum(['reel', 'story', 'post_with_image']),
  status: z.enum(['generated', 'published', 'rejected', 'queued']),
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
  prompt?: string;
}

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = parseInt(params.id as string);

  const [content, setContent] = useState<any>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
  // Schedule assignment state
  const [showScheduleAssignment, setShowScheduleAssignment] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [publishedMedia, setPublishedMedia] = useState<any[]>([]);
  const [isLoadingPublishedMedia, setIsLoadingPublishedMedia] = useState(false);

  // Check if content is published (read-only)
  const isPublished = content?.status === 'published';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
  });

  // Load media files
  const loadMediaFiles = useCallback(async () => {
    try {
      setIsLoadingMedia(true);
      const response = await contentApi.getMedia(contentId);
      setMediaFiles(response.data);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  }, [contentId]);

  // Load published media details
  const loadPublishedMedia = useCallback(async () => {
    if (!isPublished) return;
    
    try {
      console.log('🔍 Loading published media for content:', contentId);
      setIsLoadingPublishedMedia(true);
      const response = await contentApi.getPublishedMedia(contentId);
      console.log('📊 Published media response:', response.data);
      setPublishedMedia(response.data);
    } catch (error: any) {
      console.error('❌ Failed to load published media details:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoadingPublishedMedia(false);
    }
  }, [contentId, isPublished]);

  // Load content data
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const [contentResponse, accountsResponse] = await Promise.all([
          contentApi.getById(contentId),
          igAccountsApi.getAll(),
        ]);
        
        setContent(contentResponse.data);
        setAccounts(accountsResponse.data);
        
        // Transform data for form
        const formData = {
          ...contentResponse.data,
          hashTags: contentResponse.data.hashTags ? contentResponse.data.hashTags.join(' ') : '',
        };
        reset(formData);
        
        // Load media files
        await loadMediaFiles();
        
        // Load published media details if content is published
        if (contentResponse.data.status === 'published') {
          await loadPublishedMedia();
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (contentId) {
      loadContent();
    }
  }, [contentId, reset, loadMediaFiles]);

  // Handle form submission
  const onSubmit = async (data: ContentFormData) => {
    try {
      setIsSaving(true);
      
      // Transform data for API
      const updateData = {
        ...data,
        hashTags: data.hashTags ? data.hashTags.split(' ').filter(tag => tag.trim()) : [],
      };
      
      await contentApi.update(contentId, updateData);
      router.push('/dashboard/content');
    } catch (error) {
      console.error('Failed to update content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle media deletion
  const handleDeleteMedia = async (mediaId: number) => {
    try {
      await contentApi.deleteMedia(mediaId);
      await loadMediaFiles();
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  // Handle media regeneration
  const handleRegenerateMedia = async (mediaId: number, prompt: string) => {
    try {
      await contentApi.regenerateMedia(mediaId, prompt);
      await loadMediaFiles(); // Reload media files to show the new one
    } catch (error) {
      console.error('Failed to regenerate media:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Handle file upload (replaces existing media)
  const handleFileUpload = async (files: File[], prompt?: string) => {
    try {
      setIsUploadingMedia(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach((file: File, index: number) => {
        formData.append('mediaFiles', file);
      });
      
      if (prompt) {
        formData.append('prompt', prompt);
      }

      // Replace existing media with new files
      await contentApi.replaceMedia(contentId, formData);
      
      // Reload media files
      await loadMediaFiles();
    } catch (error) {
      console.error('Failed to replace media:', error);
      throw error;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Handle content deletion
  const handleDeleteContent = async () => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.delete(contentId);
      router.push('/dashboard/content');
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  // Schedule assignment functions
  const handleScheduleAssignment = async () => {
    if (!selectedSchedule || !selectedTimeSlot || !selectedDate) {
      alert('Please select a schedule, date, and time slot');
      return;
    }

    try {
      setIsAssigning(true);
      await scheduleContentApi.assignToTimeSlot({
        scheduleId: selectedSchedule,
        timeSlotId: selectedTimeSlot,
        contentId: contentId,
        scheduledDate: selectedDate,
      });
      
      alert('Content successfully assigned to schedule!');
      setShowScheduleAssignment(false);
      // Reset selections
      setSelectedSchedule(null);
      setSelectedDate('');
      setSelectedTimeSlot(null);
      setAvailableTimeSlots([]);
      // Reload content to show updated schedule information
      window.location.reload();
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
    
    fetchSchedules();
  }, []);

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ef5a29]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!content) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
          <p className="text-gray-600 mb-6">The content you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Button onClick={() => router.push('/dashboard/content')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/content')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isPublished ? 'View Content' : 'Edit Content'}
            </h1>
            {isPublished && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Published
              </span>
            )}
          </div>
          {!isPublished && (
            <Button
              variant="outline"
              onClick={handleDeleteContent}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {/* Published Content Notice */}
        {isPublished && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Published Media Details
            </h3>
            
            {isLoadingPublishedMedia ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-700">Loading published details...</span>
              </div>
            ) : publishedMedia.length > 0 ? (
              <div className="space-y-4">
                {publishedMedia.map((media, index) => (
                  <div key={media.id || index} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Instagram Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Media ID:</span>
                            <span className="text-sm font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                              {media.instagramMediaId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Published:</span>
                            <span className="text-sm text-blue-800">
                              {new Date(media.publishedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              media.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {media.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Links</h4>
                        <div className="space-y-2">
                          {media.instagramUrl && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Media URL:</span>
                              <a 
                                href={media.instagramUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {media.instagramUrl}
                              </a>
                            </div>
                          )}
                          {media.instagramPermalink && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Permalink:</span>
                              <a 
                                href={media.instagramPermalink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {media.instagramPermalink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {media.metadata && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Additional Details</h4>
                        <div className="text-sm text-gray-600">
                          <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">
                            {JSON.stringify(media.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No published media details found.</p>
              </div>
            )}
          </div>
        )}

        {/* Schedule Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Information
          </h3>
          
          {content.scheduleContent && content.scheduleContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.scheduleContent.map((scheduleContent: any, index: number) => (
                <div key={index} className="bg-white rounded-md p-4 border border-blue-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Schedule:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {scheduleContent.schedule?.name || 'Unknown Schedule'}
                      </span>
                    </div>
                    
                    {scheduleContent.timeSlot && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Time Slot:</span>
                        <span className="text-sm text-blue-800">
                          {scheduleContent.timeSlot.startTime} - {scheduleContent.timeSlot.endTime}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Scheduled Date:</span>
                      <span className="text-sm text-blue-800">
                        {new Date(scheduleContent.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {scheduleContent.scheduledTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Scheduled Time:</span>
                        <span className="text-sm text-blue-800">
                          {scheduleContent.scheduledTime}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scheduleContent.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        scheduleContent.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                        scheduleContent.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {scheduleContent.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-md p-4 border border-blue-100">
              <p className="text-sm text-gray-600 text-center">
                This content is not currently scheduled for any posting schedule.
              </p>
            </div>
          )}
          
          {/* Schedule Assignment Section */}
          {!isPublished && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-blue-900">
                  Assign to Schedule
                </h4>
                <Button
                  type="button"
                  onClick={() => setShowScheduleAssignment(!showScheduleAssignment)}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {showScheduleAssignment ? 'Hide Assignment' : 'Assign to Schedule'}
                </Button>
              </div>

            {showScheduleAssignment && (
              <div className="space-y-4">
                {/* Schedule Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      {isAssigning ? 'Assigning...' : 'Assign to Schedule'}
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                      Account
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
                      <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type
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

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      {...register('status')}
                      disabled={isPublished}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="generated">Generated</option>
                      <option value="queued">Queued</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="generatedSource" className="block text-sm font-medium text-gray-700 mb-1">
                      Generated Source
                    </label>
                    <Input
                      id="generatedSource"
                      {...register('generatedSource')}
                      placeholder="AI Agent"
                      disabled={isPublished}
                    />
                    {errors.generatedSource && (
                      <p className="text-red-500 text-sm mt-1">{errors.generatedSource.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    {...register('caption')}
                    rows={4}
                    disabled={isPublished}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your caption..."
                  />
                  {errors.caption && (
                    <p className="text-red-500 text-sm mt-1">{errors.caption.message}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="hashTags" className="block text-sm font-medium text-gray-700 mb-1">
                    Hashtags
                  </label>
                  <Input
                    id="hashTags"
                    {...register('hashTags')}
                    placeholder="#hashtag1 #hashtag2"
                    disabled={isPublished}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="usedTopics" className="block text-sm font-medium text-gray-700 mb-1">
                      Used Topics
                    </label>
                    <Input
                      id="usedTopics"
                      {...register('usedTopics')}
                      placeholder="Topics used for generation"
                      disabled={isPublished}
                    />
                  </div>

                  <div>
                    <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                      Tone
                    </label>
                    <Input
                      id="tone"
                      {...register('tone')}
                      placeholder="Professional, Casual, etc."
                      disabled={isPublished}
                    />
                  </div>
                </div>

                {!isPublished && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-[#ef5a29] text-white hover:bg-[#d4491f]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Media Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Media Files</h2>
              
              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ef5a29]"></div>
                </div>
              ) : mediaFiles.length > 0 ? (
                <div className="space-y-4">
                  {mediaFiles.map((media) => (
                    <MediaPreview
                      key={media.id}
                      media={media}
                      onDelete={handleDeleteMedia}
                      onRegenerate={handleRegenerateMedia}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No media files attached</p>
              )}

              {/* File Upload Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-2">Replace Media Files</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Uploading new media will replace all existing media files for this content.
                </p>
                <FileUpload
                  onFilesSelected={() => {}} // Not needed for edit page
                  onUpload={handleFileUpload}
                  multiple={true}
                  maxFiles={10}
                  maxSize={50}
                  disabled={isSaving}
                  isUploading={isUploadingMedia}
                  contentType={content?.type}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
