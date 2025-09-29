'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { scheduleContentApi, contentApi, schedulesApi } from '@/lib/api';

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  postType: 'reel' | 'story' | 'post_with_image';
  label: string;
  isAvailable: boolean;
}

interface Content {
  id: number;
  caption?: string;
  type: 'reel' | 'story' | 'post_with_image';
  status: 'generated' | 'published' | 'rejected' | 'queued';
}

interface Schedule {
  id: number;
  name: string;
  account: {
    id: number;
    name: string;
  };
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CONTENT_TYPE_LABELS = {
  post_with_image: 'Post',
  reel: 'Reel',
  story: 'Story',
};

export default function ManualContentAssignment() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchContent();
  }, []);

  const fetchAvailableTimeSlots = useCallback(async () => {
    if (!selectedSchedule || !selectedDate) return;
    
    try {
      setIsLoading(true);
      const response = await scheduleContentApi.getAvailableTimeSlots(selectedSchedule, selectedDate);
      setAvailableTimeSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch available time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSchedule, selectedDate]);

  useEffect(() => {
    if (selectedSchedule && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [selectedSchedule, selectedDate, fetchAvailableTimeSlots]);

  const fetchSchedules = async () => {
    try {
      const response = await schedulesApi.getAll();
      setSchedules(response.data.schedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await contentApi.getAll({ page: 1, limit: 100 });
      setContent(response.data.content);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedSchedule || !selectedDate || !selectedContent || !selectedTimeSlot) {
      alert('Please select all required fields');
      return;
    }

    try {
      setIsAssigning(true);
      await scheduleContentApi.assignToTimeSlot({
        scheduleId: selectedSchedule,
        timeSlotId: selectedTimeSlot,
        contentId: selectedContent,
        scheduledDate: selectedDate,
      });
      
      alert('Content assigned successfully!');
      
      // Reset form
      setSelectedContent(null);
      setSelectedTimeSlot(null);
      fetchAvailableTimeSlots();
    } catch (error) {
      console.error('Failed to assign content:', error);
      alert('Failed to assign content. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK[dayOfWeek];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black-medium">Manual Content Assignment</h2>
        <p className="text-black-muted mt-1">Assign content to specific schedule time slots for specific dates</p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedule Selection */}
          <div>
            <label className="block text-sm font-medium text-black-medium mb-2">
              Select Schedule
            </label>
            <select
              value={selectedSchedule || ''}
              onChange={(e) => setSelectedSchedule(parseInt(e.target.value) || null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
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
          <div>
            <label className="block text-sm font-medium text-black-medium mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Available Time Slots */}
        {selectedSchedule && selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-black-medium mb-4">
              Available Time Slots for {selectedDate}
            </h3>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ef5a29] mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading available time slots...</p>
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No available time slots for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTimeSlots.map((timeSlot) => (
                  <div
                    key={timeSlot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTimeSlot === timeSlot.id
                        ? 'border-[#ef5a29] bg-[#fef7f5]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTimeSlot(timeSlot.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-black-medium">
                        {getDayName(timeSlot.dayOfWeek)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {CONTENT_TYPE_LABELS[timeSlot.postType]}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                    </div>
                    {timeSlot.label && (
                      <div className="text-xs text-gray-500 mt-1">{timeSlot.label}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Selection */}
        {selectedTimeSlot && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-black-medium mb-4">
              Select Content to Assign
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedContent === item.id
                      ? 'border-[#ef5a29] bg-[#fef7f5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedContent(item.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black-medium">
                      {CONTENT_TYPE_LABELS[item.type]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'generated' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'published' ? 'bg-green-100 text-green-800' :
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  {item.caption && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Button */}
        {selectedSchedule && selectedDate && selectedTimeSlot && selectedContent && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={isAssigning}
              className="bg-[#ef5a29] text-white hover:bg-[#d4491f] disabled:opacity-50"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Content
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
