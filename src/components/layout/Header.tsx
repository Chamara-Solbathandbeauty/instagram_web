'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Dashboard" }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-black-medium">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-sm rounded-md p-2 hover:bg-white-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ef5a29]"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-black-medium font-medium">{user?.firstName} {user?.lastName}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 text-sm text-black-muted border-b border-gray-200">
                Signed in as <br />
                <span className="font-medium text-black-medium">{user?.email}</span>
              </div>

              <a
                href="/dashboard/profile"
                className="flex items-center px-4 py-2 text-sm text-black-medium hover:bg-primary-bg hover:text-primary transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </a>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-black-medium hover:bg-primary-bg hover:text-primary transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </header>
  );
}
