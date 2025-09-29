'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Calendar, Clock, Play, Pause, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { schedulesApi, igAccountsApi } from '@/lib/api';

const CONTENT_TYPES = [
  { value: 'post_with_image', label: 'Post with Image', icon: '📸' },
  { value: 'reel', label: 'Reel', icon: '🎬' },
  { value: 'story', label: 'Story', icon: '📱' },
];

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  postType: 'post_with_image' | 'reel' | 'story';
  isEnabled: boolean;
  label?: string;
}

interface PostingSchedule {
  id: number;
  accountId: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  status: 'active' | 'paused' | 'inactive';
  isEnabled: boolean;
  startDate?: string;
  endDate?: string;
  customDays?: number[];
  timezone: string;
  timeSlots: TimeSlot[];
  createdAt: string;
  updatedAt: string;
  account: {
    id: number;
    name: string;
    type: 'business' | 'creator';
  };
}

interface IgAccount {
  id: number;
  name: string;
  type: 'business' | 'creator';
}

interface ScheduleFilters {
  accountId?: number;
  status?: 'active' | 'paused' | 'inactive';
  isEnabled?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<PostingSchedule[]>([]);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await schedulesApi.getAll({
        ...filters,
        page,
        limit: 10,
      });
      setSchedules(response.data.schedules);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  const fetchAccounts = async () => {
    try {
      const response = await igAccountsApi.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [filters, page, fetchSchedules]);

  useEffect(() => {
    fetchAccounts();
  }, []);



  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      setDeletingId(id);
      await schedulesApi.delete(id);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await schedulesApi.toggleStatus(id);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule status:', error);
    }
  };

  const handleEditClick = (schedule: PostingSchedule) => {
    router.push(`/dashboard/schedules/edit/${schedule.id}`);
  };



  const handleFilterChange = (key: keyof ScheduleFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const getStatusColor = (status: string, isEnabled: boolean) => {
    if (!isEnabled) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string, customDays?: number[]) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'custom':
        return customDays ? customDays.map(day => DAYS_OF_WEEK[day]).join(', ') : 'Custom';
      default:
        return frequency;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef5a29]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black-medium">Posting Schedules</h1>
          <p className="text-black-muted mt-1">Manage automated posting schedules for your Instagram accounts</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/schedules/create')} 
          className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-black-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-[#ef5a29] hover:text-[#d4491f] font-medium"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Account</label>
              <select
                value={filters.accountId || ''}
                onChange={(e) => handleFilterChange('accountId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Enabled</label>
              <select
                value={filters.isEnabled === undefined ? '' : filters.isEnabled.toString()}
                onChange={(e) => handleFilterChange('isEnabled', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All</option>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        )}

        {Object.keys(filters).length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-black-muted">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => (
              <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#fef7f5] text-[#ef5a29]">
                {key}: {value?.toString()}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black-medium mb-2">No Schedules Found</h3>
          <p className="text-black-muted mb-4">Create your first posting schedule to get started with automated content posting.</p>
          <Button 
            onClick={() => router.push('/dashboard/schedules/create')} 
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md font-medium"
          >
            Create Schedule
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black-medium mb-1">{schedule.name}</h3>
                  <p className="text-sm text-black-muted">{schedule.account.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status, schedule.isEnabled)}`}>
                    {schedule.isEnabled ? schedule.status : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(schedule.id)}
                    className="p-1 text-black-muted hover:text-[#ef5a29] transition-colors"
                    title={schedule.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {schedule.isEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {schedule.description && (
                <p className="text-sm text-black-muted mb-4 line-clamp-2">{schedule.description}</p>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[#ef5a29]" />
                  <span className="text-black-medium">Frequency:</span>
                  <span className="text-black-muted">{getFrequencyLabel(schedule.frequency, schedule.customDays)}</span>
                </div>

                

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#ef5a29]" />
                  <span className="text-black-medium">Time Slots:</span>
                  <span className="text-black-muted">{schedule.timeSlots.length} slots</span>
                </div>
              </div>

              {/* Time Slots Preview */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-black-medium uppercase tracking-wide mb-2">Time Slots</h4>
                <div className="space-y-1">
                  {schedule.timeSlots.slice(0, 2).map((slot, index) => {
                    const contentTypeInfo = CONTENT_TYPES.find((ct: { value: string; label: string; icon: string }) => ct.value === slot.postType);
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-black-muted">
                          {DAYS_OF_WEEK[slot.dayOfWeek]} {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                        <span className="text-black-medium flex items-center gap-1">
                          {contentTypeInfo?.icon} {contentTypeInfo?.label}
                        </span>
                      </div>
                    );
                  })}
                  {schedule.timeSlots.length > 2 && (
                    <div className="text-xs text-black-muted">
                      +{schedule.timeSlots.length - 2} more slots
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`/dashboard/schedule-content?scheduleId=${schedule.id}`, '_blank')}
                    className="p-2 text-black-muted hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="View Scheduled Content"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(schedule)}
                    className="p-2 text-black-muted hover:text-[#ef5a29] hover:bg-[#fef7f5] rounded-md transition-colors"
                    title="Edit Schedule"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    disabled={deletingId === schedule.id}
                    className="p-2 text-black-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Delete Schedule"
                  >
                    {deletingId === schedule.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <span className="text-xs text-black-muted">
                  Created {new Date(schedule.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-black-muted">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} schedules
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-sm text-black-medium">Page {page}</span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page * 10 >= total}
              className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
