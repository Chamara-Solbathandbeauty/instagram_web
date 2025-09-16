'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Instagram, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { instagramApi } from '@/lib/api';

interface InstagramConnectProps {
  accountId: number;
  accountName: string;
  onStatusChange?: (status: any) => void;
}

interface InstagramStatus {
  isConnected: boolean;
  isTokenValid: boolean;
  username?: string;
  followersCount?: number;
  followingCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
  needsReconnection?: boolean;
}

export default function InstagramConnect({ 
  accountId, 
  accountName, 
  onStatusChange 
}: InstagramConnectProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Instagram connection status
  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await instagramApi.getStatus(accountId);
      setStatus(response.data);
      onStatusChange?.(response.data);
    } catch (error: any) {
      console.error('Failed to load Instagram status:', error);
      setError('Failed to load Instagram connection status');
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Instagram
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const response = await instagramApi.getAuthUrl(accountId);
      
      // Open Instagram OAuth in new window
      const authWindow = window.open(
        response.data.authUrl,
        'instagram-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for the auth window to close
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Reload status after auth window closes
          setTimeout(() => {
            loadStatus();
          }, 1000);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Failed to initiate Instagram connection:', error);
      setError('Failed to initiate Instagram connection');
      setIsConnecting(false);
    }
  };

  // Disconnect from Instagram
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Instagram account? This will remove all connection data.')) {
      return;
    }

    try {
      setIsDisconnecting(true);
      setError(null);
      await instagramApi.disconnect(accountId);
      await loadStatus();
    } catch (error: any) {
      console.error('Failed to disconnect Instagram:', error);
      setError('Failed to disconnect Instagram account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Test Instagram connection
  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setError(null);
      await instagramApi.testConnection(accountId);
      await loadStatus();
    } catch (error: any) {
      console.error('Failed to test Instagram connection:', error);
      setError('Instagram connection test failed. Please reconnect your account.');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Check for Instagram connection success/error from URL parameters
    const instagramConnected = searchParams.get('instagram_connected');
    const instagramError = searchParams.get('instagram_error');
    const connectedAccountId = searchParams.get('account_id');

    if (instagramConnected === 'true' && connectedAccountId && parseInt(connectedAccountId) === accountId) {
      // Instagram connection was successful, reload status
      loadStatus();
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('instagram_connected');
      url.searchParams.delete('account_id');
      window.history.replaceState({}, '', url.toString());
    } else if (instagramError) {
      // Instagram connection failed, show error
      setError(decodeURIComponent(instagramError));
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('instagram_error');
      window.history.replaceState({}, '', url.toString());
    } else {
      // Normal load
      loadStatus();
    }
  }, [accountId, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ef5a29]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Instagram className="h-5 w-5 text-[#ef5a29]" />
          <h3 className="text-lg font-semibold text-gray-900">Instagram Connection</h3>
        </div>
        
        {status?.isConnected && (
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {status?.isConnected ? (
        <div className="space-y-4">
          {/* Connection Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Username</span>
              <p className="text-sm text-gray-900">@{status.username || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Followers</span>
              <p className="text-sm text-gray-900">{status.followersCount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Following</span>
              <p className="text-sm text-gray-900">{status.followingCount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Posts</span>
              <p className="text-sm text-gray-900">{status.mediaCount?.toLocaleString() || 'N/A'}</p>
            </div>
          </div>

          {/* Profile Picture */}
          {status.profilePictureUrl && (
            <div className="flex items-center space-x-3">
              <img
                src={status.profilePictureUrl}
                alt="Instagram Profile"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">@{status.username}</p>
                <p className="text-xs text-gray-500">Instagram Profile</p>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {status.isTokenValid ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Connection is active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm">Connection needs refresh</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isTesting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ef5a29]"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </Button>
            
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDisconnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Instagram className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Connect to Instagram</h4>
          <p className="text-sm text-gray-500 mb-4">
            Connect your Instagram Business or Creator account to enable direct posting.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Requirements:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Instagram Business or Creator account</li>
                  <li>Account connected to a Facebook Page</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#ef5a29] text-white hover:bg-[#d4491f] flex items-center space-x-2 mx-auto"
          >
            {isConnecting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            <span>{isConnecting ? 'Connecting...' : 'Connect Instagram'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
