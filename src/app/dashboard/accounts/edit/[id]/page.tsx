'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import AccountImageUpload from '@/components/ui/AccountImageUpload';
import InstagramConnect from '@/components/dashboard/InstagramConnect';
import { igAccountsApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/layout/AppLayout';

// Zod schema for form validation
const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  topics: z.string().optional(),
  tone: z.string().optional(),
  type: z.enum(['business', 'creator']),
});

type AccountFormData = z.infer<typeof accountSchema>;

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
  images?: AccountImage[];
}

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const accountId = params.id as string;

  const [account, setAccount] = useState<IgAccount | null>(null);
  const [accountImages, setAccountImages] = useState<AccountImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: 'business',
    },
  });

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      if (!accountId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load account data
        const accountResponse = await igAccountsApi.getById(parseInt(accountId));
        const accountData = accountResponse.data;
        setAccount(accountData);

        // Load account images
        const imagesResponse = await igAccountsApi.getImages(parseInt(accountId));
        setAccountImages(imagesResponse.data || []);

        // Reset form with account data
        reset({
          name: accountData.name,
          description: accountData.description || '',
          topics: accountData.topics || '',
          tone: accountData.tone || '',
          type: accountData.type,
        });

      } catch (error: any) {
        console.error('Failed to load account:', error);
        setError(error.response?.data?.message || 'Failed to load account');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, [accountId, reset]);

  // Handle created message from create page
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowCreatedMessage(true);
      // Remove the parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('created');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Hide message after 3 seconds
      setTimeout(() => setShowCreatedMessage(false), 3000);
    }
  }, [searchParams]);

  const onSubmit = async (data: AccountFormData) => {
    if (!account) return;

    try {
      setIsSaving(true);
      setError(null);

      await igAccountsApi.update(account.id, data);
      
      // Redirect back to accounts page with success message
      router.push('/dashboard/ig-accounts?updated=true');
    } catch (error: any) {
      console.error('Failed to update account:', error);
      setError(error.response?.data?.message || 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/ig-accounts');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef5a29]"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Not Found</h2>
        <p className="text-gray-600 mb-4">The account you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/dashboard/ig-accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <AppLayout title="Edit Account">
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-black-medium">Edit Account</h1>
            <p className="text-black-muted">Update your Instagram account settings</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f]"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {showCreatedMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Account created successfully! You can now upload images and connect to Instagram.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-black-medium mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Account Name *
              </label>
              <Input
                {...register('name')}
                placeholder="Enter account name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Account Type *
              </label>
              <select
                {...register('type')}
                className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:border-transparent ${errors.type ? 'border-red-500' : ''}`}
              >
                <option value="business">Business</option>
                <option value="creator">Creator</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-black-medium mb-2">
                Description
              </label>
              <Textarea
                {...register('description')}
                placeholder="Describe your account (optional)"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Topics
              </label>
              <Input
                {...register('topics')}
                placeholder="e.g., fitness, travel, food, lifestyle, wellness, technology, business, education, entertainment, sports, fashion, beauty, cooking, photography, art, music, travel, health, fitness, motivation, inspiration"
                className={errors.topics ? 'border-red-500' : ''}
              />
              {errors.topics && (
                <p className="text-red-500 text-sm mt-1">{errors.topics.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Tone
              </label>
              <Input
                {...register('tone')}
                placeholder="e.g., professional, casual, friendly, authoritative, conversational, inspiring, educational, humorous, serious, warm, confident, approachable, expert, relatable, motivational"
                className={errors.tone ? 'border-red-500' : ''}
              />
              {errors.tone && (
                <p className="text-red-500 text-sm mt-1">{errors.tone.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Account Images */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black-medium">Account Images</h2>
            {accountImages.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {accountImages.length}/3 uploaded
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload up to 3 images to represent your account. Supported formats: JPG, PNG, GIF, WebP (max 5MB each)
          </p>
          <AccountImageUpload
            accountId={account.id}
            existingImages={accountImages}
            onImagesChange={setAccountImages}
            maxImages={3}
          />
        </Card>

        {/* Instagram Connection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-black-medium mb-4">Instagram Connection</h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect your Instagram account to enable posting and content management.
          </p>
          <InstagramConnect
            accountId={account.id}
            accountName={account.name}
          />
        </Card>
      </form>
      </div>
    </AppLayout>
  );
}
