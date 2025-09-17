'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import InstagramConnect from './InstagramConnect';
import { igAccountsApi } from '@/lib/api';

interface ActiveSchedule {
  id: number;
  name: string;
  description?: string;
  status: string;
  isEnabled: boolean;
}

interface AccountImage {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  displayOrder: number;
  createdAt: string;
}

interface IgAccount {
  id: number;
  name: string;
  description?: string;
  topics?: string;
  tone?: string;
  type: 'business' | 'creator';
  createdAt: string;
  updatedAt: string;
  activeSchedule?: ActiveSchedule;
  images?: AccountImage[];
}


export default function IgAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await igAccountsApi.getAll();
      const accountsData = response.data;

      // Load images for each account
      const accountsWithImages = await Promise.all(
        accountsData.map(async (account: any) => {
          try {
            console.log(`Loading images for account ${account.id} (${account.name})`);
            const imagesResponse = await igAccountsApi.getImages(account.id);
            console.log(`Images for account ${account.id}:`, imagesResponse.data);
            return {
              ...account,
              images: imagesResponse.data || [],
            };
          } catch (error) {
            console.error(`Failed to load images for account ${account.id}:`, error);
            return {
              ...account,
              images: [],
            };
          }
        })
      );

      setAccounts(accountsWithImages);
    } catch (error) {
      console.error('Failed to fetch IG accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Handle success message from edit page
  useEffect(() => {
    if (searchParams.get('updated') === 'true') {
      setShowSuccessMessage(true);
      // Remove the parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('updated');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Hide message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [searchParams]);



  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this IG account?')) return;
    
    try {
      setDeletingId(id);
      await igAccountsApi.delete(id);
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to delete IG account:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (account: IgAccount) => {
    router.push(`/dashboard/accounts/edit/${account.id}`);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Account updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black-medium">IG Accounts</h1>
          <p className="text-black-muted mt-1">Manage your Instagram account configurations</p>
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => router.push('/dashboard/accounts/create')}
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md flex items-center gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add IG Account
          </Button>
        </div>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#fef7f5] rounded-full flex items-center justify-center">
              <Instagram className="h-8 w-8 text-[#ef5a29]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black-medium">No IG Accounts Yet</h3>
              <p className="text-black-muted mt-1">Create your first Instagram account configuration to get started.</p>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/accounts/create')}
              className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Your First Account
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#fef7f5] rounded-full flex items-center justify-center">
                    <Instagram className="h-5 w-5 text-[#ef5a29]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black-medium">{account.name}</h3>
                    <p className="text-sm text-black-muted">Created {formatDate(account.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditClick(account)}
                    className="p-2 text-black-muted hover:text-[#ef5a29] hover:bg-[#fef7f5] rounded-md transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    disabled={deletingId === account.id}
                    className="p-2 text-black-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingId === account.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {account.description && (
                <p className="text-sm text-black-muted mb-4 line-clamp-3">
                  {account.description}
                </p>
              )}

              {/* Account Images Preview */}
              {account.images && account.images.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Images</span>
                  <div className="flex space-x-2 mt-1">
                    {account.images.slice(0, 3).map((image, index) => (
                      <div
                        key={image.id}
                        className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"
                      >
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/account-images/${image.filePath}`}
                          alt={`Account image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                    {account.images.length > 3 && (
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{account.images.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Type</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      account.type === 'business' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {account.type === 'business' ? '🏢 Business' : '🎨 Creator'}
                    </span>
                  </div>
                </div>
                {account.topics && (
                  <div>
                    <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Topics</span>
                    <p className="text-sm text-black-muted">{account.topics}</p>
                  </div>
                )}
                {account.tone && (
                  <div>
                    <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Tone</span>
                    <p className="text-sm text-black-muted">{account.tone}</p>
                  </div>
                )}
                {account.activeSchedule && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Active Schedule</span>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[#ef5a29]">{account.activeSchedule.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          account.activeSchedule.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : account.activeSchedule.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.activeSchedule.status}
                        </span>
                      </div>
                      {account.activeSchedule.description && (
                        <p className="text-xs text-black-muted line-clamp-2">{account.activeSchedule.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram Connection */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <InstagramConnect 
                  accountId={account.id}
                  accountName={account.name}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
