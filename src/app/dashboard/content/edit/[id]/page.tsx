'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentApi, igAccountsApi } from '@/lib/api';
import MediaPreview from '@/components/ui/MediaPreview';
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Content</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleDeleteContent}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
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
                    />
                  </div>
                </div>

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
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
