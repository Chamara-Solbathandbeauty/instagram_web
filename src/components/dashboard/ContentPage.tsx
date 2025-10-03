'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, FileText, Filter, Image, Video, Calendar, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { contentApi, igAccountsApi, instagramApi } from '@/lib/api';
import ContentForm from './ContentForm';
import MediaViewer from './MediaViewer';

interface Content {
  id: number;
  accountId: number;
  caption?: string;
  hashTags?: string[];
  generatedSource: string;
  usedTopics?: string;
  tone?: string;
  type: 'reel' | 'story' | 'post_with_image';
  status: 'generated' | 'published' | 'rejected' | 'queued';
  createdAt: string;
  updatedAt: string;
  account: {
    id: number;
    name: string;
  };
  media: Array<{
    id: number;
    mediaPath: string;
    type: 'reel' | 'story' | 'image';
  }>;
}

interface IgAccount {
  id: number;
  name: string;
  type: 'business' | 'creator';
}

interface ContentFilters {
  accountId?: number;
  type?: 'reel' | 'story' | 'post_with_image';
  status?: 'generated' | 'published' | 'rejected' | 'queued';
}

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [postingId, setPostingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedContentForMedia, setSelectedContentForMedia] = useState<Content | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await contentApi.getAll({
        ...filters,
        page,
        limit: 12,
      });
      setContent(response.data.data || []);
      setTotal(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  const fetchAccounts = async () => {
    try {
      const response = await igAccountsApi.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [filters, page, fetchContent]);

  const handleCreateContent = async (data: any) => {
    try {
      const { selectedFiles, ...contentData } = data;
      const createdContent = await contentApi.create(contentData);
      
      // Add media files if any were selected during creation
      if (selectedFiles && selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file: File, index: number) => {
          formData.append('mediaFiles', file);
        });
        await contentApi.uploadMedia(createdContent.data.id, formData);
      }
      
      await fetchContent();
    } catch (error: any) {
      console.error('Failed to create content:', error);
      if (error.response?.data?.message) {
        console.error('Backend error:', error.response.data.message);
      }
      throw error;
    }
  };


  const handleDeleteContent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      setDeletingId(id);
      await contentApi.delete(id);
      await fetchContent();
    } catch (error) {
      console.error('Failed to delete content:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (content: Content) => {
    router.push(`/dashboard/content/edit/${content.id}`);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleViewMedia = (content: Content) => {
    setSelectedContentForMedia(content);
    setIsMediaViewerOpen(true);
  };

  const handleMediaViewerClose = () => {
    setIsMediaViewerOpen(false);
    setSelectedContentForMedia(null);
  };

  const handlePostToInstagram = async (content: Content) => {
    if (!confirm(`Post "${content.caption?.substring(0, 50)}..." to Instagram?`)) return;
    
    try {
      console.log('🚀 ContentPage: Starting Instagram post for content:', content.id, 'account:', content.accountId);
      setPostingId(content.id);
      const result = await instagramApi.postContent({
        contentId: content.id,
        accountId: content.accountId,
      });
      console.log('✅ ContentPage: Instagram post successful:', result.data);
      
      await fetchContent();
      alert('Content posted to Instagram successfully!');
    } catch (error: any) {
      console.error('❌ ContentPage: Failed to post to Instagram:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to post to Instagram';
      alert(errorMessage);
    } finally {
      setPostingId(null);
    }
  };

  const handleFilterChange = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reel':
        return <Video className="h-4 w-4" />;
      case 'story':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black-medium">Content Management</h1>
          <p className="text-black-muted mt-1">Manage your Instagram content and media</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md flex items-center gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">
                Account
              </label>
              <select
                value={filters.accountId || ''}
                onChange={(e) => handleFilterChange('accountId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All Types</option>
                <option value="post_with_image">Post with Image</option>
                <option value="reel">Reel</option>
                <option value="story">Story</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black-medium mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef5a29]"
              >
                <option value="">All Statuses</option>
                <option value="generated">Generated</option>
                <option value="queued">Queued</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2 rounded-md font-medium"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid */}
      {(!content || content.length === 0) ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#fef7f5] rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-[#ef5a29]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black-medium">No Content Found</h3>
              <p className="text-black-muted mt-1">Create your first piece of content to get started.</p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-[#ef5a29] text-white hover:bg-[#d4491f] px-4 py-2 rounded-md flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Your First Content
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(content || []).map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#fef7f5] rounded-full flex items-center justify-center">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black-medium">{item.account.name}</p>
                      <p className="text-xs text-black-muted">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePostToInstagram(item)}
                      disabled={postingId === item.id}
                      className="p-1 text-black-muted hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                      title="Post to Instagram"
                    >
                      {postingId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      ) : (
                        <Instagram className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="p-1 text-black-muted hover:text-[#ef5a29] hover:bg-[#fef7f5] rounded-md transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 text-black-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {item.caption && (
                  <p className="text-sm text-black-muted mb-3 line-clamp-2">
                    {item.caption}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  {item.hashTags && item.hashTags.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Hashtags</span>
                      <p className="text-xs text-black-muted">
                        {item.hashTags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                        {item.hashTags.length > 3 && ` +${item.hashTags.length - 3} more`}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black-medium uppercase tracking-wide">Media Files</span>
                    <button
                      onClick={() => handleViewMedia(item)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#fef7f5] transition-colors"
                    >
                      <div className="w-4 h-4 bg-[#fef7f5] rounded-full flex items-center justify-center">
                        <Image className="h-2 w-2 text-[#ef5a29]" />
                      </div>
                      <span className="text-xs font-medium text-[#ef5a29]">
                        {item.media ? item.media.length : 0} files
                      </span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-black-medium">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <Button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                  className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Content Form Modal - Only for Creation */}
      <ContentForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleCreateContent}
        initialData={undefined}
        isEdit={false}
        accounts={accounts}
      />

      {/* Media Viewer Modal */}
      <MediaViewer
        isOpen={isMediaViewerOpen}
        onClose={handleMediaViewerClose}
        contentId={selectedContentForMedia?.id || 0}
        contentTitle={selectedContentForMedia?.caption || `Content from ${selectedContentForMedia?.account?.name || 'Unknown Account'}`}
      />
    </div>
  );
}
