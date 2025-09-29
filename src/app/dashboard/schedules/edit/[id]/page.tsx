'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Clock, Calendar, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { schedulesApi, igAccountsApi, aiApi } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

const timeSlotSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  dayOfWeek: z.number().min(0).max(6),
  postType: z.enum(['post_with_image', 'reel', 'story']),
  isEnabled: z.boolean().default(true),
  label: z.string().optional(),
});

const scheduleSchema = z.object({
  accountId: z.number().min(1, 'Please select an account'),
  name: z.string().min(1, 'Schedule name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  status: z.enum(['active', 'paused', 'inactive']).default('active'),
  isEnabled: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customDays: z.array(z.number()).optional(),
  timezone: z.string().default('UTC'),
  timeSlots: z.array(timeSlotSchema).min(1, 'At least one time slot is required'),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface IgAccount {
  id: number;
  name: string;
  type: 'business' | 'creator';
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const CONTENT_TYPES = [
  { value: 'post_with_image', label: 'Post with Image', icon: '📸' },
  { value: 'reel', label: 'Reel', icon: '🎬' },
  { value: 'story', label: 'Story', icon: '📱' },
];

export default function EditSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [nextGeneratableWeek, setNextGeneratableWeek] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContentGenerationModal, setShowContentGenerationModal] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      accountId: 0,
      name: '',
      description: '',
      frequency: 'daily' as const,
      status: 'active' as const,
      isEnabled: true,
      startDate: '',
      endDate: '',
      customDays: [],
      timezone: 'UTC',
      timeSlots: [
        {
          startTime: '09:00',
          endTime: '17:00',
          dayOfWeek: 1,
          postType: 'post_with_image' as const,
          isEnabled: true,
          label: 'Business Hours',
        }
      ],
    },
  });

  const { fields: timeSlotFields, append: appendTimeSlot, remove: removeTimeSlot } = useFieldArray({
    control,
    name: 'timeSlots',
  });

  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await schedulesApi.getById(parseInt(scheduleId));
      const schedule = response.data;
      
      reset({
        accountId: schedule.accountId,
        name: schedule.name,
        description: schedule.description || '',
        frequency: schedule.frequency,
        status: schedule.status,
        isEnabled: schedule.isEnabled,
        startDate: schedule.startDate || '',
        endDate: schedule.endDate || '',
        customDays: schedule.customDays || [],
        timezone: schedule.timezone,
        timeSlots: schedule.timeSlots || [
          {
            startTime: '09:00',
            endTime: '17:00',
            dayOfWeek: 1,
            postType: 'post_with_image' as const,
            isEnabled: true,
            label: 'Business Hours',
          }
        ],
      });
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      router.push('/dashboard/schedules');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId, reset, router]);

  const fetchAccounts = async () => {
    try {
      const response = await igAccountsApi.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const checkNextGeneratableWeek = useCallback(async () => {
    try {
      const response = await aiApi.getNextGeneratableWeek(parseInt(scheduleId));
      setNextGeneratableWeek(response.data.data.nextWeek);
    } catch (error) {
      console.error('Error checking next generatable week:', error);
      setNextGeneratableWeek(null);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchSchedule();
    fetchAccounts();
    checkNextGeneratableWeek();
  }, [fetchSchedule, checkNextGeneratableWeek]);

  const handleFormSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    try {
      await schedulesApi.update(parseInt(scheduleId), data);
      router.push('/dashboard/schedules');
    } catch (error) {
      console.error('Error updating schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTimeSlot = () => {
    appendTimeSlot({
      startTime: '09:00',
      endTime: '17:00',
      dayOfWeek: 1,
      postType: 'post_with_image' as const,
      isEnabled: true,
      label: '',
    });
  };

  const handleGenerateContentClick = () => {
    if (!nextGeneratableWeek) {
      alert('No week available for content generation. All weeks may already have content scheduled.');
      return;
    }
    setShowContentGenerationModal(true);
  };

  const generateContent = async () => {
    if (!nextGeneratableWeek) {
      alert('No week available for content generation. All weeks may already have content scheduled.');
      return;
    }

    setIsGeneratingContent(true);
    setShowContentGenerationModal(false);
    
    try {
      const response = await aiApi.generateContent({
        scheduleId: parseInt(scheduleId),
        generationWeek: nextGeneratableWeek,
        ...(userInstructions.trim() && { userInstructions: userInstructions.trim() })
      });

      alert(`Successfully generated ${response.data.data.generatedContent.length} content pieces for the week of ${nextGeneratableWeek}`);
      
      // Clear instructions and refresh the next generatable week
      setUserInstructions('');
      await checkNextGeneratableWeek();
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleCloseModal = () => {
    setShowContentGenerationModal(false);
    setUserInstructions('');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF014F] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
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
              onClick={() => router.push('/dashboard/schedules')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schedules
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Posting Schedule</h1>
          </div>
          <div className="flex items-center gap-3">
            {nextGeneratableWeek && (
              <Button
                type="button"
                onClick={handleGenerateContentClick}
                disabled={isGeneratingContent || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                {isGeneratingContent ? 'Generating Content...' : 'Generate Content'}
              </Button>
            )}
          </div>
        </div>

        {/* Content Generation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Wand2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">AI Content Generation</h4>
              {nextGeneratableWeek ? (
                <p className="text-sm text-blue-700">
                  Content can be generated for the week starting <strong>{new Date(nextGeneratableWeek).toLocaleDateString()}</strong>. 
                  Click "Generate Content" to create AI-generated posts, reels, and stories for this schedule.
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  All available weeks have content scheduled. No content generation needed at this time.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-black-medium mb-1">
                    Instagram Account *
                  </label>
                  <select
                    id="accountId"
                    {...register('accountId', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F] focus:ring-offset-2"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-red-500">{errors.accountId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black-medium mb-1">
                    Schedule Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Daily Business Posts"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-black-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Describe this posting schedule..."
                  {...register('description')}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF014F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Schedule Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-black-medium mb-1">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    {...register('frequency')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F] focus:ring-offset-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-black-medium mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register('status')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F] focus:ring-offset-2"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    {...register('isEnabled')}
                    className="h-4 w-4 text-[#FF014F] focus:ring-[#FF014F] border-gray-300 rounded"
                  />
                  <label htmlFor="isEnabled" className="ml-2 text-sm font-medium text-black-medium">
                    Enable Schedule
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-black-medium mb-1">
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                    error={errors.startDate?.message}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-black-medium mb-1">
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                    error={errors.endDate?.message}
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-black-medium flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#FF014F]" />
                    Time Slots
                  </h4>
                  <Button
                    type="button"
                    onClick={addTimeSlot}
                    className="bg-[#FF014F] text-white hover:bg-[#d4491f] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Time Slot
                  </Button>
                </div>

                <div className="space-y-4">
                  {timeSlotFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#FF014F]" />
                          <span className="text-sm font-medium text-black-medium">
                            Time Slot {index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Day of Week
                          </label>
                          <select
                            {...register(`timeSlots.${index}.dayOfWeek`, { valueAsNumber: true })}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F]"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Start Time
                          </label>
                          <Input
                            type="time"
                            {...register(`timeSlots.${index}.startTime`)}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            End Time
                          </label>
                          <Input
                            type="time"
                            {...register(`timeSlots.${index}.endTime`)}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Post Type
                          </label>
                          <select
                            {...register(`timeSlots.${index}.postType`)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F]"
                          >
                            {CONTENT_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-black-medium mb-1">
                          Label (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., Morning Posts, Evening Stories"
                          {...register(`timeSlots.${index}.label`)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.timeSlots && (
                  <p className="mt-2 text-sm text-red-500">{errors.timeSlots.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard/schedules')}
                  disabled={isSubmitting}
                  className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#FF014F] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Content Generation Modal */}
      {showContentGenerationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseModal} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-black-medium flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-blue-600" />
                    Generate Content
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-black-muted hover:text-black-medium transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="userInstructions" className="block text-sm font-medium text-black-medium mb-2">
                      Custom Instructions (Optional)
                    </label>
                    <textarea
                      id="userInstructions"
                      rows={4}
                      placeholder="Add specific instructions for content generation... (e.g., 'Focus on eco-friendly topics', 'Use a professional tone', 'Include trending hashtags')"
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF014F] focus:ring-offset-2 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      These instructions will be added to the AI prompt to customize your content generation.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Wand2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <strong>Week:</strong> {nextGeneratableWeek ? new Date(nextGeneratableWeek).toLocaleDateString() : 'N/A'}
                        <br />
                        <strong>Content:</strong> Posts, Reels, and Stories will be generated based on your schedule settings.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isGeneratingContent}
                    className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={generateContent}
                    disabled={isGeneratingContent}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    {isGeneratingContent ? 'Generating...' : 'Generate Content'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
