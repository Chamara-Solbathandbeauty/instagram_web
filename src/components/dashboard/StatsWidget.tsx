'use client';

import { Users, FileText, Calendar, TrendingUp } from 'lucide-react';

interface StatsWidgetProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  green: 'bg-green-50 border-green-200 text-green-600',
  orange: 'bg-orange-50 border-orange-200 text-orange-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
};

const iconClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
};

export default function StatsWidget({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend 
}: StatsWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp 
                className={`w-4 h-4 mr-1 ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`} 
              />
              <span 
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <div className={iconClasses[color]}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pre-configured widgets for common use cases
export function AccountStatsWidget({ total, connected }: { total: number; connected: number }) {
  return (
    <StatsWidget
      title="Instagram Accounts"
      value={total}
      subtitle={`${connected} connected`}
      icon={<Users className="w-6 h-6" />}
      color="blue"
    />
  );
}

export function ContentStatsWidget({ total, published }: { total: number; published: number }) {
  return (
    <StatsWidget
      title="Total Content"
      value={total}
      subtitle={`${published} published`}
      icon={<FileText className="w-6 h-6" />}
      color="green"
    />
  );
}

export function ScheduleStatsWidget({ total, active }: { total: number; active: number }) {
  return (
    <StatsWidget
      title="Schedules"
      value={total}
      subtitle={`${active} active`}
      icon={<Calendar className="w-6 h-6" />}
      color="orange"
    />
  );
}

export function RecentContentWidget({ count }: { count: number }) {
  return (
    <StatsWidget
      title="Recent Content"
      value={count}
      subtitle="Last 7 days"
      icon={<TrendingUp className="w-6 h-6" />}
      color="purple"
    />
  );
}
