'use client';

import { useAuthStore } from '@/lib/auth';

export default function DashboardHome() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-black-medium mb-2">
          Welcome back, <span className="text-primary">{user?.firstName}</span>!
        </h1>
        <p className="text-black-muted">
          Your dashboard is ready to be customized.
        </p>
      </div>

      {/* Empty Container for Future Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-bg border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-black-medium mb-2">Ready for Your Content</h3>
          <p className="text-black-muted max-w-md mx-auto">
            This is your main dashboard area. You can add widgets, charts, or any content you need here.
          </p>
        </div>
      </div>
    </div>
  );
}
