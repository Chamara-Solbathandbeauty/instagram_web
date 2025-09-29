'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, Filter, Trash2, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { scheduleContentApi, schedulesApi, contentApi, igAccountsApi } from '@/lib/api';

interface ScheduleContent {
  id: number;
  scheduleId: number;
  contentId: number;
  timeSlotId?: number;
  scheduledDate: string;
  scheduledTime?: string;
  status: 'queued' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  priority: number;
  notes?: string;
  publishedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  schedule: {
    id: number;
    name: string;
    description?: string;
    account: {
      id: number;
      name: string;
    };
  };
  content: {
    id: number;
    caption?: string;
    type: 'post_with_image' | 'reel' | 'story';
    status: 'generated' | 'published' | 'rejected' | 'queued';
  };
  timeSlot?: {
    id: number;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    label?: string;
  };
}

interface Schedule {
  id: number;
  name: string;
  description?: string;
  accountId: number;
  account: {
    id: number;
    name: string;
  };
}

interface Content {
  id: number;
  caption?: string;
  type: 'post_with_image' | 'reel' | 'story';
  status: 'generated' | 'published' | 'rejected' | 'queued';
}

interface IgAccount {
  id: number;
  name: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CONTENT_TYPE_ICONS = {
  post_with_image: '📸',
  reel: '🎬',
  story: '📱',
};

const CONTENT_TYPE_LABELS = {
  post_with_image: 'Post',
  reel: 'Reel',
  story: 'Story',
};

const STATUS_COLORS = {
  queued: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS = {
  queued: Clock,
  scheduled: Calendar,
  published: CheckCircle,
  failed: XCircle,
  cancelled: XCircle,
};

export default function ScheduleContentPage() {
  const searchParams = useSearchParams();
  const [scheduleContent, setScheduleContent] = useState<ScheduleContent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [, setContent] = useState<Content[]>([]);
  const [, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    scheduleId: searchParams.get('scheduleId') || '',
    accountId: '',
    status: '',
    scheduledDateFrom: '',
    scheduledDateTo: '',
  });

  const fetchScheduleContent = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Starting to fetch schedule content...');
      
      const apiFilters: Record<string, string | number> = {
        page: page || 1,
        limit: 10,
      };
      
      // Only add filters if they have valid values
      if (filters.scheduleId && filters.scheduleId !== '') {
        const scheduleId = parseInt(filters.scheduleId);
        if (!isNaN(scheduleId) && scheduleId > 0) {
          apiFilters.scheduleId = scheduleId;
        }
      }
      if (filters.accountId && filters.accountId !== '') {
        const accountId = parseInt(filters.accountId);
        if (!isNaN(accountId) && accountId > 0) {
          apiFilters.accountId = accountId;
        }
      }
      if (filters.status && filters.status !== '') {
        apiFilters.status = filters.status;
      }
      if (filters.scheduledDateFrom && filters.scheduledDateFrom !== '') {
        apiFilters.scheduledDateFrom = filters.scheduledDateFrom;
      }
      if (filters.scheduledDateTo && filters.scheduledDateTo !== '') {
        apiFilters.scheduledDateTo = filters.scheduledDateTo;
      }
      
      console.log('Fetching schedule content with filters:', apiFilters);
      const response = await scheduleContentApi.getAll(apiFilters);
      console.log('Schedule Content API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      if (response.data && response.data.data && response.data.data.scheduleContent) {
        console.log('Schedule content found:', response.data.data.scheduleContent.length, 'items');
        setScheduleContent(response.data.data.scheduleContent);
        setTotal(response.data.data.total || 0);
      } else {
        console.log('No schedule content in response, setting empty array');
        console.log('Response structure:', response.data);
        setScheduleContent([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch schedule content:', error);
      setScheduleContent([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  const fetchSchedules = async () => {
    try {
      console.log('Fetching schedules...');
      const response = await schedulesApi.getAll();
      console.log('Schedules API Response:', response);
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

  const fetchAccounts = async () => {
    try {
      const response = await igAccountsApi.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  useEffect(() => {
    fetchScheduleContent();
  }, [filters, page, fetchScheduleContent]);

  useEffect(() => {
    fetchSchedules();
    fetchContent();
    fetchAccounts();
  }, []);

  // Add test function to window for debugging
  useEffect(() => {
    (window as any).testScheduleContentAPI = async () => {
      try {
        console.log('Testing schedule content API...');
        const response = await scheduleContentApi.getAll({ page: 1, limit: 10 });
        console.log('Test API Response:', response);
        console.log('Test API Response Data:', response.data);
        console.log('Test API Response Data Data:', response.data?.data);
        return response;
      } catch (error) {
        console.error('Test API Error:', error);
        return error;
      }
    };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled content?')) return;
    
    try {
      setDeletingId(id);
      await scheduleContentApi.delete(id);
      await fetchScheduleContent();
    } catch (error) {
      console.error('Failed to delete scheduled content:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await scheduleContentApi.update(id, { status: newStatus as 'queued' | 'scheduled' | 'published' | 'failed' | 'cancelled' });
      await fetchScheduleContent();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK[dayOfWeek];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef5a29]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black-medium">Schedule Content</h1>
          <p className="text-black-muted mt-1">Manage content scheduled for posting</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter button moved to summary section */}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Showing {scheduleContent?.length || 0} of {total} scheduled content items
              {filters.scheduleId && ` for selected schedule`}
              {filters.accountId && ` for selected account`}
              {filters.status && ` with status "${filters.status}"`}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
              >
                <option value="">All Accounts</option>
                {schedules.map((schedule) => (
                  <option key={schedule.account.id} value={schedule.account.id}>
                    {schedule.account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Schedule</label>
              <select
                value={filters.scheduleId}
                onChange={(e) => setFilters({ ...filters, scheduleId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
              >
                <option value="">All Schedules</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name} ({schedule.account.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
              >
                <option value="">All Statuses</option>
                <option value="queued">Queued</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">From Date</label>
              <input
                type="date"
                value={filters.scheduledDateFrom}
                onChange={(e) => setFilters({ ...filters, scheduledDateFrom: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.scheduledDateTo}
                onChange={(e) => setFilters({ ...filters, scheduledDateTo: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29] focus:ring-offset-2"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => setFilters({
                scheduleId: searchParams.get('scheduleId') || '',
                accountId: '',
                status: '',
                scheduledDateFrom: '',
                scheduledDateTo: '',
              })}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Content List */}
      {(!scheduleContent || scheduleContent.length === 0) ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#fef7f5] rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-[#ef5a29]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black-medium">No Scheduled Content</h3>
              <p className="text-black-muted mt-1">
                {isLoading ? 'Loading scheduled content...' : 'No content has been scheduled for posting yet.'}
              </p>
              {!isLoading && (
                <div className="text-sm text-gray-500 mt-2 space-y-2">
                  <p>No scheduled content found. To get started:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Create a posting schedule in the Schedules page</li>
                    <li>Edit the schedule and click "Generate Content" to create AI-generated content</li>
                    <li>Or manually create content and assign it to schedules</li>
                  </ol>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button
                      onClick={() => window.open('/dashboard/schedules', '_blank')}
                      size="sm"
                      className="bg-[#ef5a29] text-white hover:bg-[#d4491f]"
                    >
                      Go to Schedules
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(scheduleContent || []).map((item) => {
                  const StatusIcon = STATUS_ICONS[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{CONTENT_TYPE_ICONS[item.content.type]}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {CONTENT_TYPE_LABELS[item.content.type]}
                            </div>
                            {item.content.caption && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {item.content.caption}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.schedule.account.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {item.schedule.account.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {item.status}
                        </span>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {item.notes}
                          </div>
                        )}
                        {item.failureReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                            {item.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-1">
                          {item.status === 'queued' && (
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'scheduled')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-md transition-colors"
                              title="Mark as Scheduled"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          {item.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'queued')}
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 p-2 rounded-md transition-colors"
                              title="Mark as Queued"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm text-black-muted">
              Page {page} of {Math.ceil(total / 10)}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 10)}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
