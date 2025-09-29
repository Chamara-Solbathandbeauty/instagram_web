'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardStats {
  accounts: {
    total: number;
    connected: number;
    disconnected: number;
  };
  content: {
    total: number;
    published: number;
    queued: number;
    recent: number;
  };
  schedules: {
    total: number;
    active: number;
    scheduledContent: number;
  };
  summary: {
    totalAccounts: number;
    totalContent: number;
    totalSchedules: number;
    connectedAccounts: number;
    publishedContent: number;
    activeSchedules: number;
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
