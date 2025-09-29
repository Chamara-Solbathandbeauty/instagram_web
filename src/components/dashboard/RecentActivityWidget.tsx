'use client';

import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'content' | 'account' | 'schedule';
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

interface RecentActivityWidgetProps {
  activities?: ActivityItem[];
}

const statusIcons = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  warning: <AlertCircle className="w-4 h-4 text-orange-500" />,
  info: <Clock className="w-4 h-4 text-blue-500" />,
};

const statusColors = {
  success: 'bg-green-50 border-green-200',
  warning: 'bg-orange-50 border-orange-200',
  info: 'bg-blue-50 border-blue-200',
};

export default function RecentActivityWidget({ activities = [] }: RecentActivityWidgetProps) {
  // Mock data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'content',
      action: 'Published',
      description: 'New post published to @glowhaven',
      timestamp: '2 hours ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'account',
      action: 'Connected',
      description: 'Instagram account @beautybrand connected',
      timestamp: '1 day ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'schedule',
      action: 'Scheduled',
      description: '5 posts scheduled for next week',
      timestamp: '2 days ago',
      status: 'info',
    },
    {
      id: '4',
      type: 'content',
      action: 'Failed',
      description: 'Content generation failed for @fashionista',
      timestamp: '3 days ago',
      status: 'warning',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {displayActivities.slice(0, 5).map((activity) => (
          <div
            key={activity.id}
            className={`p-3 rounded-lg border ${statusColors[activity.status]}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {statusIcons[activity.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {displayActivities.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}
