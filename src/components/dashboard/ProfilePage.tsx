'use client';

import { useState } from 'react';
import { Save, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
    console.log('Saving profile:', formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black-medium">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-black-muted">{user?.email}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
              user?.role === 'admin' 
                ? 'bg-primary-bg text-primary' 
                : 'bg-black-light text-white'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing ? (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                First Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              ) : (
                <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200">
                  {user?.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Last Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200">
                  {user?.lastName}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black-medium mb-2">
              Email Address
            </label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            ) : (
              <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200">
                {user?.email}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black-medium mb-2">
              Role
            </label>
            <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200">
              {user?.role}
            </p>
            <p className="text-sm text-black-muted mt-1">
              Contact an administrator to change your role
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                Account Created
              </label>
              <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200">
                N/A
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-black-medium mb-2">
                User ID
              </label>
              <p className="text-black-medium bg-white-light px-3 py-2 rounded border border-gray-200 font-mono text-sm">
                {user?.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
