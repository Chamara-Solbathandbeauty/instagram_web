'use client';

import { useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Settings } from 'lucide-react';

export default function QuickActionsWidget() {
  const router = useRouter();

  const actions = [
    {
      title: 'Create Content',
      description: 'Generate new content for your accounts',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => router.push('/dashboard/content'),
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      title: 'Add Account',
      description: 'Connect a new Instagram account',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => router.push('/dashboard/accounts/create'),
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
    },
    {
      title: 'Create Schedule',
      description: 'Set up automated posting schedule',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => router.push('/dashboard/schedules'),
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    },
    {
      title: 'Manage Accounts',
      description: 'View and edit your accounts',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => router.push('/dashboard/ig-accounts'),
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left ${action.color}`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs opacity-75 mt-1">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
