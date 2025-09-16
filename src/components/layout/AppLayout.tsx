'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export default function AppLayout({ 
  children, 
  title = "Dashboard",
  allowedRoles = [],
  requireAuth = true 
}: AppLayoutProps) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && requireAuth) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Check role-based access if roles are specified
      if (allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
          router.push('/dashboard'); // Redirect to dashboard if user doesn't have required role
          return;
        }
      }
    }
  }, [isAuthenticated, isHydrated, user, router, allowedRoles, requireAuth]);

  // Show loading while checking authentication
  if (requireAuth && (!isHydrated || !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-soft">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check role-based access
  if (requireAuth && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-soft">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black-medium mb-4">Access Denied</h1>
          <p className="text-black-muted mb-4">You don&apos;t have permission to access this page.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-soft">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <Header title={title} />
          
          {/* Content Area */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
