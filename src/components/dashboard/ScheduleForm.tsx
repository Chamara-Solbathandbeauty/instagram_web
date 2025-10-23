'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Clock, Calendar, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { aiApi } from '@/lib/api';

const timeSlotSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  dayOfWeek: z.number().min(0).max(6),
  postType: z.enum(['post_with_image', 'reel', 'story']),
  isEnabled: z.boolean().default(true),
  label: z.string().optional(),
  tone: z.string().optional(),
  dimensions: z.string().optional(),
  preferredVoiceAccent: z.string().optional(),
  reelDuration: z.number().optional(),
  storyType: z.string().optional(),
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

interface ScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  initialData?: Partial<ScheduleFormData & { id?: number }>;
  isEdit?: boolean;
  accounts: IgAccount[];
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

export default function ScheduleForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isEdit = false,
  accounts 
}: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [nextGeneratableWeek, setNextGeneratableWeek] = useState<string | null>(null);
  const [showScheduleGenerationModal, setShowScheduleGenerationModal] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      accountId: accounts.length > 0 ? accounts[0].id : 0,
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
          tone: '',
          dimensions: '',
          preferredVoiceAccent: '',
          reelDuration: undefined,
        }
      ],
    },
  });

  const { fields: timeSlotFields, append: appendTimeSlot, remove: removeTimeSlot } = useFieldArray({
    control,
    name: 'timeSlots',
  });


  // Reset form with initial data when it changes
  useEffect(() => {
    if (initialData) {
      reset({
        accountId: initialData.accountId || accounts.length > 0 ? accounts[0].id : 0,
        name: initialData.name || '',
        description: initialData.description || '',
        frequency: initialData.frequency || 'daily',
        status: initialData.status || 'active',
        isEnabled: initialData.isEnabled ?? true,
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        customDays: initialData.customDays || [],
        timezone: initialData.timezone || 'UTC',
        timeSlots: initialData.timeSlots || [
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
    } else {
      reset({
        accountId: accounts.length > 0 ? accounts[0].id : 0,
        name: '',
        description: '',
        frequency: 'daily',
        status: 'active',
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
      });
    }
  }, [initialData, reset, accounts]);

  const handleFormSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting schedule data:', JSON.stringify(data, null, 2));
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

  const addTimeSlot = () => {
    appendTimeSlot({
      startTime: '09:00',
      endTime: '17:00',
      dayOfWeek: 1,
      postType: 'post_with_image' as const,
      isEnabled: true,
      label: '',
      tone: '',
      dimensions: '',
      preferredVoiceAccent: '',
      reelDuration: undefined,
      storyType: 'video', // Default to video for stories
    });
  };

  const handleGenerateWithAIClick = () => {
    const selectedAccountId = watch('accountId');
    
    if (!selectedAccountId) {
      alert('Please select an Instagram account first');
      return;
    }
    setShowScheduleGenerationModal(true);
  };

  const generateWithAI = async () => {
    const selectedAccountId = watch('accountId');
    
    if (!selectedAccountId) {
      alert('Please select an Instagram account first');
      return;
    }

    setIsGeneratingAI(true);
    setShowScheduleGenerationModal(false);
    
    try {
      const response = await aiApi.generateSchedulePost({
        accountId: selectedAccountId,
        ...(userInstructions.trim() && { userInstructions: userInstructions.trim() })
      });
      const aiSchedule = response.data.data;

      // Populate form with AI-generated data
      reset({
        accountId: selectedAccountId,
        name: aiSchedule.name,
        description: aiSchedule.description,
        frequency: aiSchedule.frequency,
        status: aiSchedule.status,
        isEnabled: aiSchedule.isEnabled,
        startDate: aiSchedule.startDate || '',
        endDate: aiSchedule.endDate || '',
        customDays: aiSchedule.frequency === 'custom' ? (aiSchedule.customDays || []) : undefined,
        timezone: aiSchedule.timezone,
        timeSlots: aiSchedule.timeSlots.map((slot: { 
          startTime: string; 
          endTime: string; 
          dayOfWeek: number; 
          postType: string; 
          isEnabled: boolean; 
          label: string;
          tone?: string;
          dimensions?: string;
          preferredVoiceAccent?: string;
          reelDuration?: number;
        }) => ({
          startTime: slot.startTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
          endTime: slot.endTime.substring(0, 5),
          dayOfWeek: slot.dayOfWeek,
          postType: slot.postType,
          isEnabled: slot.isEnabled !== undefined ? slot.isEnabled : true,
          label: slot.label || '',
          tone: slot.tone || '',
          dimensions: slot.dimensions || '',
          preferredVoiceAccent: slot.preferredVoiceAccent || '',
          reelDuration: slot.reelDuration || undefined,
        })),
      });

      // Clear instructions and show success message
      setUserInstructions('');
      alert('AI schedule generated successfully! Please review and adjust as needed.');
    } catch (error) {
      console.error('Error generating AI schedule:', error);
      alert('Failed to generate AI schedule. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleGenerationModal(false);
    setUserInstructions('');
  };

  const checkNextGeneratableWeek = useCallback(async () => {
    if (!isEdit || !initialData?.id) return;
    
    try {
      const response = await aiApi.getNextGeneratableWeek(initialData.id);
      setNextGeneratableWeek(response.data.data.nextWeek);
    } catch (error) {
      console.error('Error checking next generatable week:', error);
      setNextGeneratableWeek(null);
    }
  }, [isEdit, initialData?.id]);

  const generateContent = async () => {
    if (!isEdit || !initialData?.id) {
      alert('Content generation is only available for existing schedules');
      return;
    }

    if (!nextGeneratableWeek) {
      alert('No week available for content generation. All weeks may already have content scheduled.');
      return;
    }

    setIsGeneratingContent(true);
    try {
      const response = await aiApi.generateContent({
        scheduleId: initialData.id,
        generationWeek: nextGeneratableWeek
      });

      alert(`Successfully generated ${response.data.data.generatedContent.length} content pieces for the week of ${nextGeneratableWeek}`);
      
      // Refresh the next generatable week
      await checkNextGeneratableWeek();
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Check for next generatable week when editing
  useEffect(() => {
    if (isEdit && initialData?.id) {
      checkNextGeneratableWeek();
    }
  }, [isEdit, initialData?.id, checkNextGeneratableWeek]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black-medium">
                {isEdit ? 'Edit Posting Schedule' : 'Create Posting Schedule'}
              </h3>
              <div className="flex items-center gap-3">
                {!isEdit && (
                  <Button
                    type="button"
                    onClick={handleGenerateWithAIClick}
                    disabled={isGeneratingAI || isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                  </Button>
                )}
                {isEdit && nextGeneratableWeek && (
                  <Button
                    type="button"
                    onClick={generateContent}
                    disabled={isGeneratingContent || isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    {isGeneratingContent ? 'Generating Content...' : 'Generate Content'}
                  </Button>
                )}
                <button
                  onClick={handleClose}
                  className="text-black-muted hover:text-black-medium transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Content Generation Info */}
              {isEdit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-black-medium mb-1">
                    Instagram Account *
                  </label>
                  <select
                    id="accountId"
                    {...register('accountId', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
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
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5a29] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
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
                    className="h-4 w-4 text-[#ef5a29] focus:ring-[#ef5a29] border-gray-300 rounded"
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
                    <Clock className="h-5 w-5 text-[#ef5a29]" />
                    Time Slots
                  </h4>
                  <Button
                    type="button"
                    onClick={addTimeSlot}
                    className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
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
                          <Calendar className="h-4 w-4 text-[#ef5a29]" />
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
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
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
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                          >
                            {CONTENT_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
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

                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Tone
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., professional, casual, friendly"
                            {...register(`timeSlots.${index}.tone`)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Story Type - only show for story post type */}
                      {watch(`timeSlots.${index}.postType`) === 'story' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Story Type
                          </label>
                          <select
                            {...register(`timeSlots.${index}.storyType`)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                          >
                            <option value="video">Video Story</option>
                            <option value="image">Image Story</option>
                          </select>
                        </div>
                      )}

                      {/* Story Duration - only show for video story type */}
                      {watch(`timeSlots.${index}.postType`) === 'story' && watch(`timeSlots.${index}.storyType`) === 'video' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Story Duration (seconds)
                          </label>
                          <select
                            {...register(`timeSlots.${index}.reelDuration`, { valueAsNumber: true })}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                          >
                            <option value="">Select duration...</option>
                            <option value={8}>8 seconds - Quick</option>
                            <option value={15}>15 seconds - Standard</option>
                            <option value={30}>30 seconds - Extended</option>
                            <option value={45}>45 seconds - Long</option>
                            <option value={60}>60 seconds - Extended Long</option>
                          </select>
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Dimensions - only show for reel post type */}
                        {watch(`timeSlots.${index}.postType`) === 'reel' && (
                          <div>
                            <label className="block text-xs font-medium text-black-medium mb-1">
                              Dimensions
                            </label>
                            <select
                              {...register(`timeSlots.${index}.dimensions`)}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                            >
                              <option value="">Select dimensions...</option>
                              <option value="16:9">16:9 (Landscape)</option>
                              <option value="9:16">9:16 (Portrait)</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Voice Accent
                          </label>
                          <select
                            {...register(`timeSlots.${index}.preferredVoiceAccent`)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                          >
                            <option value="">Select accent...</option>
                            <option value="american">American</option>
                            <option value="british">British</option>
                            <option value="australian">Australian</option>
                            <option value="neutral">Neutral</option>
                            <option value="canadian">Canadian</option>
                          </select>
                        </div>
                      </div>

                      {/* Reel Duration - only show for reel post type */}
                      {watch(`timeSlots.${index}.postType`) === 'reel' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-black-medium mb-1">
                            Reel Duration
                          </label>
                          <select
                            {...register(`timeSlots.${index}.reelDuration`, { valueAsNumber: true })}
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
                          >
                            <option value="">Select duration...</option>
                            <option value={8}>8 seconds</option>
                            <option value={16}>16 seconds</option>
                            <option value={24}>24 seconds</option>
                            <option value={32}>32 seconds</option>
                          </select>
                        </div>
                      )}
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
                  {isSubmitting ? 'Saving...' : (isEdit ? 'Update Schedule' : 'Create Schedule')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Schedule Generation Modal */}
      {showScheduleGenerationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseScheduleModal} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-black-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Generate Schedule with AI
                  </h3>
                  <button
                    onClick={handleCloseScheduleModal}
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
                      placeholder="Add specific instructions for schedule generation... (e.g., 'Focus on morning posts', 'Include more reels', 'Schedule only on weekdays', 'Create a minimalist posting schedule')"
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      These instructions will be added to the AI prompt to customize your schedule generation.
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-700">
                        <strong>AI Schedule Generation:</strong> The AI will create an optimized posting schedule based on your account type, best practices, and any custom instructions you provide.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleCloseScheduleModal}
                    disabled={isGeneratingAI}
                    className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={generateWithAI}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingAI ? 'Generating...' : 'Generate Schedule'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
