'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageViewer } from '@/components/workspace/PageViewer';
import { mockWorkspaceData } from '@/lib/mockData';

// Import notification components
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationSettings from '@/components/notifications/NotificationSettings';

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate?: (user: User) => void;
}

// Enhanced User Profile Modal with better error handling
const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onUserUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError('Current password is required to set new password');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setUser(result.user);
        setIsEditing(false);
        
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        if (onUserUpdate) {
          onUserUpdate(result.user);
        }
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (isEditing) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        handleCancel();
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Profile' : 'User Profile'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close profile"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isLoading && !user ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 ml-3">Loading profile...</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm" role="alert">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                  {user && !user.emailVerified && (
                    <p className="text-xs text-yellow-400 mt-1">Email not verified</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your phone number"
                  />
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-medium text-white mb-3">Change Password</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isEditing && user && (
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-medium text-white mb-3">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Member Since:</span>
                        <span className="text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="text-gray-300">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email Status:</span>
                        <span className={`font-medium ${user.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                          {user.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Icons
const UserCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 rounded-full text-gray-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// Enhanced UserProfile Component
const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState({ success: '', error: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Auto-clear notifications
  useEffect(() => {
    if (notifications.success || notifications.error) {
      const timer = setTimeout(() => {
        setNotifications({ success: '', error: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/login');
      } else {
        const data = await response.json();
        setNotifications({ success: '', error: data.error || 'Logout failed' });
      }
    } catch (error) {
      setNotifications({ success: '', error: 'Network error during logout' });
      console.error('Logout error:', error);
    } finally {
      setIsOpen(false);
    }
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleNotificationSettings = () => {
    setIsOpen(false);
    setIsNotificationSettingsOpen(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setNotifications({ success: 'Profile updated successfully', error: '' });
  };

  const handleNotificationError = (error: string) => {
    setNotifications({ success: '', error });
  };

  const handleNotificationSuccess = (message: string) => {
    setNotifications({ success: message, error: '' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 rounded-full"
          aria-label="User menu"
        >
          <UserCircleIcon />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg py-2 z-50 ring-1 ring-black ring-opacity-5">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.email || 'Loading...'}
              </p>
            </div>
            
            <div className="py-1">
              <button 
                onClick={handleViewProfile}
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <UserIcon />
                View Profile
              </button>
              <button 
                onClick={handleNotificationSettings}
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <BellIcon />
                Notification Settings
              </button>
              <button 
                onClick={handleViewProfile}
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <SettingsIcon />
                Account Settings
              </button>
            </div>
            
            <div className="py-1 border-t border-gray-700">
              <button 
                onClick={handleLogout} 
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-red-600/50 hover:text-white transition-colors"
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserUpdate={handleUserUpdate}
      />

      <NotificationSettings
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        onError={handleNotificationError}
        onSuccess={handleNotificationSuccess}
      />
    </>
  );
};

// Global notification toast component
const NotificationToast: React.FC<{ notifications: { success: string; error: string } }> = ({ notifications }) => {
  if (!notifications.success && !notifications.error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {notifications.success && (
        <div className="bg-green-900/90 border border-green-700 rounded-lg p-4 text-green-200 shadow-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{notifications.success}</span>
          </div>
        </div>
      )}
      
      {notifications.error && (
        <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 text-red-200 shadow-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{notifications.error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Header Component with notification system
const Header: React.FC = () => {
  const [globalNotifications, setGlobalNotifications] = useState({ success: '', error: '' });

  const handleNotificationError = (error: string) => {
    setGlobalNotifications({ success: '', error });
  };

  const handleNotificationSuccess = (message: string) => {
    setGlobalNotifications({ success: message, error: '' });
  };

  // Auto-clear notifications
  useEffect(() => {
    if (globalNotifications.success || globalNotifications.error) {
      const timer = setTimeout(() => {
        setGlobalNotifications({ success: '', error: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalNotifications]);

  return (
    <>
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-2 h-16">
          <div className="text-gray-500"></div>
          <div className="flex items-center space-x-3 mr-2">
            <NotificationBell 
              onError={handleNotificationError}
            />
            <UserProfile />
          </div>
        </div>
      </header>
      
      <NotificationToast notifications={globalNotifications} />
    </>
  );
};

// DashboardContent Component
const DashboardContent: React.FC = () => {
  const { state, dispatch } = useWorkspace();

  useEffect(() => {
    dispatch({ type: 'SET_WORKSPACE', payload: mockWorkspaceData });
  }, [dispatch]);

  if (!state.workspace) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Motion-Pro</h2>
          <p className="text-gray-400">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          {state.currentPage ? (
            <PageViewer page={state.currentPage} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-white">MP</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-300 mb-3">
                  Welcome to Motion-Pro
                </h2>
                <p className="text-gray-500 mb-6">
                  Select a page from the sidebar to start editing content, or create a new page to begin your work.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>💡 Tip: Click the + button next to any section to add pages</p>
                  <p>⚡ Use "/" in any text block for quick formatting</p>
                  <p>💬 Comments are available on every page</p>
                  <p>🔔 Check the notification bell for workspace updates</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Main DashboardPage Component
const DashboardPage: React.FC = () => {
  return (
    <WorkspaceProvider>
      <DashboardContent />
    </WorkspaceProvider>
  );
};

export default DashboardPage;