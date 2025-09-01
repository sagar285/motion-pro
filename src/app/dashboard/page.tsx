'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageViewer } from '@/components/workspace/PageViewer';
import { mockWorkspaceData } from '@/lib/mockData';

// Import the UserProfileModal component
// import UserProfileModal from '@/components/modals/UserProfileModal';

// For demo purposes, I'll include the UserProfileModal here
// In your actual app, move this to a separate file
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
        headers: {
          'x-user-id': '1'
        }
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
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      setError('Error loading profile');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

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
          'x-user-id': '1'
        },
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
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Profile' : 'User Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
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
                          placeholder="Enter new password"
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
                      onClick={onClose}
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
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

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

// Updated UserProfile Component
const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('Logout successful');
        router.push('/login');
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
    } finally {
      setIsOpen(false);
    }
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
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
        >
          <UserCircleIcon />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg py-2 z-50 ring-1 ring-black ring-opacity-5">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.email || 'user@motion-pro.com'}
              </p>
            </div>
            
            <div className="py-1">
              <button 
                onClick={handleViewProfile}
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <UserIcon />
                View Profile
              </button>
              <button 
                onClick={handleViewProfile}
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <SettingsIcon />
                Account Settings
              </button>
            </div>
            
            <div className="py-1 border-t border-gray-700">
              <button 
                onClick={handleLogout} 
                className="group flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-red-600/50 hover:text-white"
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserUpdate={handleUserUpdate}
      />
    </>
  );
};

// Notifications Component
const Notifications: React.FC = () => {
  return (
    <button className="relative p-2 rounded-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
      <BellIcon />
      <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-900"></span>
    </button>
  );
};

// Header Component
const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700/50">
      <div className="flex items-center justify-between p-2 h-16">
        <div className="text-gray-500"></div>
        <div className="flex items-center space-x-3 mr-2">
          <Notifications />
          <UserProfile />
        </div>
      </div>
    </header>
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