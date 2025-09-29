'use client';

import { useAuthStore } from '@/lib/auth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { 
  AccountStatsWidget, 
  ContentStatsWidget, 
  ScheduleStatsWidget, 
  RecentContentWidget 
} from './StatsWidget';
import QuickActionsWidget from './QuickActionsWidget';
import RecentActivityWidget from './RecentActivityWidget';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-black-medium mb-2">
            Welcome back, <span className="text-primary">{user?.firstName}</span>!
          </h1>
          <p className="text-black-muted">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-black-medium mb-2">
            Welcome back, <span className="text-primary">{user?.firstName}</span>!
          </h1>
          <p className="text-red-600">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-black-medium mb-2">
          Welcome back, <span className="text-primary">{user?.firstName}</span>!
        </h1>
        <p className="text-black-muted">
          Here's an overview of your Instagram management dashboard.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AccountStatsWidget 
          total={stats?.accounts.total || 0} 
          connected={stats?.accounts.connected || 0} 
        />
        <ContentStatsWidget 
          total={stats?.content.total || 0} 
          published={stats?.content.published || 0} 
        />
        <ScheduleStatsWidget 
          total={stats?.schedules.total || 0} 
          active={stats?.schedules.active || 0} 
        />
        <RecentContentWidget count={stats?.content.recent || 0} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActionsWidget />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityWidget />
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Published</span>
              <span className="text-sm font-medium text-green-600">
                {stats?.content.published || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Queued</span>
              <span className="text-sm font-medium text-orange-600">
                {stats?.content.queued || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.content.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connected</span>
              <span className="text-sm font-medium text-green-600">
                {stats?.accounts.connected || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disconnected</span>
              <span className="text-sm font-medium text-red-600">
                {stats?.accounts.disconnected || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.accounts.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Content</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Schedules</span>
              <span className="text-sm font-medium text-green-600">
                {stats?.schedules.active || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Scheduled Posts</span>
              <span className="text-sm font-medium text-blue-600">
                {stats?.schedules.scheduledContent || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Schedules</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.schedules.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
