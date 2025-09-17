'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import InstagramConnect from './InstagramConnect';
import AccountImageUpload from '@/components/ui/AccountImageUpload';
import { igAccountsApi } from '@/lib/api';

const igAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  topics: z.string().optional(),
  tone: z.string().optional(),
  type: z.enum(['business', 'creator']).default('business'),
});

type IgAccountFormData = z.infer<typeof igAccountSchema>;

interface ActiveSchedule {
  id: number;
  name: string;
  description?: string;
  status: string;
  isEnabled: boolean;
}

interface AccountImage {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  displayOrder: number;
  createdAt: string;
}

interface IgAccount {
  id: number;
  name: string;
  description?: string;
  topics?: string;
  tone?: string;
  type: 'business' | 'creator';
  createdAt: string;
  updatedAt: string;
  activeSchedule?: ActiveSchedule;
  images?: AccountImage[];
}

interface IgAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IgAccountFormData) => Promise<void>;
  initialData?: Partial<IgAccountFormData>;
  accountData?: IgAccount | null;
  isEdit?: boolean;
}

export default function IgAccountForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  accountData,
  isEdit = false 
}: IgAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountImages, setAccountImages] = useState<AccountImage[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(igAccountSchema),
    defaultValues: {
      name: '',
      description: '',
      topics: '',
      tone: '',
      type: 'business' as const,
    },
  });

  // Reset form with initial data when it changes
  useEffect(() => {
    if (initialData) {
              reset({
          name: initialData.name || '',
          description: initialData.description || '',
          topics: initialData.topics || '',
          tone: initialData.tone || '',
          type: initialData.type || 'business',
        });
    } else {
      reset({
        name: '',
        description: '',
        topics: '',
        tone: '',
        type: 'business',
      });
    }
  }, [initialData, reset]);

  // Load existing images when in edit mode
  useEffect(() => {
    if (isEdit && accountData?.images) {
      console.log('Loading images from accountData:', accountData.images);
      setAccountImages(accountData.images);
    } else {
      setAccountImages([]);
    }
  }, [isEdit, accountData]);

  // Load images from API if not provided in accountData
  useEffect(() => {
    if (isEdit && accountData && (!accountData.images || accountData.images.length === 0)) {
      const loadImages = async () => {
        try {
          console.log('Loading images from API for account:', accountData.id);
          const response = await igAccountsApi.getImages(accountData.id);
          console.log('API response:', response.data);
          setAccountImages(response.data || []);
        } catch (error) {
          console.error('Failed to load account images:', error);
          setAccountImages([]);
        }
      };
      loadImages();
    }
  }, [isEdit, accountData]);

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black-medium">
                {isEdit ? 'Edit IG Account' : 'Create New IG Account'}
              </h3>
              <button
                onClick={handleClose}
                className="text-black-muted hover:text-black-medium transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black-medium mb-1">
                  Account Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter account name"
                  {...register('name')}
                  error={errors.name?.message}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-black-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Describe your Instagram account"
                  {...register('description')}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5a29] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="topics" className="block text-sm font-medium text-black-medium mb-1">
                  Topics/Interests
                </label>
                <Input
                  id="topics"
                  type="text"
                  placeholder="e.g., fashion, travel, food"
                  {...register('topics')}
                  error={errors.topics?.message}
                />
                {errors.topics && (
                  <p className="mt-1 text-sm text-red-500">{errors.topics.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-black-medium mb-1">
                  Tone/Personality
                </label>
                <Input
                  id="tone"
                  type="text"
                  placeholder="e.g., casual, professional, funny"
                  {...register('tone')}
                  error={errors.tone?.message}
                />
                {errors.tone && (
                  <p className="mt-1 text-sm text-red-500">{errors.tone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-black-medium mb-1">
                  Account Type
                </label>
                <select
                  id="type"
                  {...register('type')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
                >
                  <option value="business">Business</option>
                  <option value="creator">Creator</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              {/* Schedule Information - Only show in edit mode */}
              {isEdit && accountData?.activeSchedule && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-black-medium mb-3">Active Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#ef5a29]">{accountData.activeSchedule.name}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        accountData.activeSchedule.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : accountData.activeSchedule.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {accountData.activeSchedule.status}
                      </span>
                    </div>
                    {accountData.activeSchedule.description && (
                      <p className="text-sm text-black-muted">{accountData.activeSchedule.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Account Images - Only show for existing accounts */}
              {isEdit && accountData && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-black-medium">Account Images</h4>
                    {accountImages.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {accountImages.length}/3 uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Upload up to 3 images to represent your account. Supported formats: JPG, PNG, GIF, WebP (max 5MB each)
                  </p>
                  <AccountImageUpload
                    accountId={accountData.id}
                    existingImages={accountImages}
                    onImagesChange={setAccountImages}
                    maxImages={3}
                  />
                </div>
              )}

              {/* Instagram Connection - Only show for existing accounts */}
              {isEdit && accountData && (
                <div className="pt-4 border-t border-gray-200">
                  <InstagramConnect 
                    accountId={accountData.id}
                    accountName={accountData.name}
                  />
                </div>
              )}

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
                  {isSubmitting ? 'Saving...' : (isEdit ? 'Update Account' : 'Create Account')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
