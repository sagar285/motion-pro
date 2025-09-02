// components/notifications/NotificationSettings.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface NotificationPreferences {
  email_notifications: boolean;
  workspace_changes: boolean;
  page_changes: boolean;
  comments: boolean;
  assignments: boolean;
  daily_digest: boolean;
}

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  isOpen, 
  onClose, 
  onError = () => {}, 
  onSuccess = () => {} 
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    workspace_changes: true,
    page_changes: true,
    comments: true,
    assignments: true,
    daily_digest: false
  });
  
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Clear message after timeout
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Check if preferences have changed
  useEffect(() => {
    if (originalPreferences) {
      const changed = Object.keys(preferences).some(key => {
        const prefKey = key as keyof NotificationPreferences;
        return preferences[prefKey] !== originalPreferences[prefKey];
      });
      setHasChanges(changed);
    }
  }, [preferences, originalPreferences]);

  // Fetch current preferences
  const fetchPreferences = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch preferences`);
      }
      
      const data = await response.json();
      
      if (data) {
        setPreferences(data);
        setOriginalPreferences(data);
      }
      
    } catch (error) {
      console.error('Error fetching preferences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notification preferences';
      setMessage({ type: 'error', text: errorMessage });
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, onError]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to save preferences`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOriginalPreferences(preferences);
        setHasChanges(false);
        const successMessage = 'Notification preferences saved successfully!';
        setMessage({ type: 'success', text: successMessage });
        onSuccess(successMessage);
      } else {
        throw new Error(result.message || 'Failed to save preferences');
      }
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save notification preferences';
      setMessage({ type: 'error', text: errorMessage });
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [preferences, onError, onSuccess]);

  // Handle preference change
  const handleChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle close with unsaved changes
  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        // Reset to original preferences
        if (originalPreferences) {
          setPreferences(originalPreferences);
        }
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, originalPreferences, onClose]);

  // Reset to original preferences
  const handleReset = useCallback(() => {
    if (originalPreferences) {
      setPreferences(originalPreferences);
      setHasChanges(false);
      setMessage({ type: '', text: '' });
    }
  }, [originalPreferences]);

  // Fetch preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen, fetchPreferences]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (hasChanges && !isSaving) {
          savePreferences();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, hasChanges, isSaving, savePreferences]);

  if (!isOpen) return null;

  const preferenceOptions = [
    {
      key: 'email_notifications' as const,
      title: 'Enable Email Notifications',
      description: 'Receive notifications via email',
      icon: '📧'
    },
    {
      key: 'workspace_changes' as const,
      title: 'Workspace Changes',
      description: 'New workspaces, updates, deletions',
      icon: '🏢',
      disabled: !preferences.email_notifications
    },
    {
      key: 'page_changes' as const,
      title: 'Page Changes',
      description: 'New pages, updates, deletions',
      icon: '📄',
      disabled: !preferences.email_notifications
    },
    {
      key: 'comments' as const,
      title: 'Comments',
      description: 'New comments on pages',
      icon: '💬',
      disabled: !preferences.email_notifications
    },
    {
      key: 'assignments' as const,
      title: 'Assignments',
      description: 'Task assignments and changes',
      icon: '📋',
      disabled: !preferences.email_notifications
    },
    {
      key: 'daily_digest' as const,
      title: 'Daily Digest',
      description: 'Summary of daily activities (instead of individual emails)',
      icon: '📊',
      disabled: !preferences.email_notifications
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your notification preferences</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-400 text-sm ml-3">Loading preferences...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Message */}
              {message.text && (
                <div className={`p-4 rounded-lg text-sm border ${
                  message.type === 'success' 
                    ? 'bg-green-900/50 border-green-700 text-green-200'
                    : 'bg-red-900/50 border-red-700 text-red-200'
                }`} role="alert">
                  <div className="flex items-center">
                    <span className="mr-2">
                      {message.type === 'success' ? '✅' : '❌'}
                    </span>
                    {message.text}
                  </div>
                </div>
              )}

              {/* Preference Options */}
              <div className="space-y-4">
                {preferenceOptions.map((option, index) => (
                  <div 
                    key={option.key}
                    className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                      option.disabled 
                        ? 'bg-gray-900/50 border-gray-700 opacity-50' 
                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
                        {option.icon}
                      </span>
                      <div className="flex-1">
                        <label 
                          htmlFor={option.key}
                          className={`text-sm font-medium cursor-pointer ${
                            option.disabled ? 'text-gray-500' : 'text-gray-300'
                          }`}
                        >
                          {option.title}
                        </label>
                        <p className={`text-xs mt-1 ${
                          option.disabled ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <input
                        id={option.key}
                        type="checkbox"
                        checked={preferences[option.key]}
                        onChange={(e) => handleChange(option.key, e.target.checked)}
                        disabled={option.disabled || isLoading}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Help Text */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-200 font-medium">About notifications</p>
                    <p className="text-xs text-blue-300 mt-1">
                      You'll always receive in-app notifications. Email settings only control whether you also receive email copies.
                      Daily digest combines all notifications into a single daily email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1"
              >
                Reset
              </button>
            )}
            
            <div className={`flex space-x-3 ${hasChanges ? '' : 'ml-auto'}`}>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              >
                {hasChanges ? 'Cancel' : 'Close'}
              </button>
              <button
                onClick={savePreferences}
                disabled={!hasChanges || isSaving || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Save Changes
              </button>
            </div>
          </div>
          
          {/* Keyboard shortcuts hint */}
          <div className="mt-2 text-xs text-gray-600 text-center">
            Press Esc to close • Ctrl+Enter to save
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;