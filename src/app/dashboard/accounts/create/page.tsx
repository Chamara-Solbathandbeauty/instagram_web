'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
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

export default function CreateAccountPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: 'business',
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await igAccountsApi.create(data);
      
      // Redirect to edit page for the newly created account
      router.push(`/dashboard/accounts/edit/${response.data.id}?created=true`);
    } catch (error: any) {
      console.error('Failed to create account:', error);
      setError(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/ig-accounts');
  };

  return (
    <AppLayout title="Create Account">
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
            <h1 className="text-2xl font-bold text-black-medium">Create New Account</h1>
            <p className="text-black-muted">Set up a new Instagram account configuration</p>
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
                Creating...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </div>
      </div>

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

        {/* Next Steps Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h2>
          <p className="text-blue-800 text-sm">
            After creating your account, you'll be able to:
          </p>
          <ul className="text-blue-800 text-sm mt-2 space-y-1">
            <li>• Upload up to 3 images to represent your account</li>
            <li>• Connect your Instagram account for posting</li>
            <li>• Set up content schedules and automation</li>
            <li>• Generate AI-powered content</li>
          </ul>
        </Card>
      </form>
      </div>
    </AppLayout>
  );
}
