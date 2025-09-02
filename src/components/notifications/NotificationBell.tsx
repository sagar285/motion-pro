// components/notifications/NotificationBell.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
}

interface NotificationBellProps {
  className?: string;
  onError?: (error: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className = '', 
  onError = () => {} 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (immediate = false) => {
        clearTimeout(timeoutId);
        if (immediate) {
          fetchNotifications();
        } else {
          timeoutId = setTimeout(fetchNotifications, 300);
        }
      };
    })(),
    []
  );

  // Fetch notifications with error handling and retry logic
  const fetchNotifications = useCallback(async (retryCount = 0) => {
    const now = Date.now();
    // Prevent too frequent calls (min 5 seconds between calls)
    if (now - lastFetchTime < 5000 && retryCount === 0) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    
    try {
      const response = await fetch('/api/notifications?limit=15', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: NotificationResponse = await response.json();
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLastFetchTime(now);
      setHasError(false);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setHasError(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
      onError(errorMessage);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        retryTimeoutRef.current = setTimeout(() => {
          fetchNotifications(retryCount + 1);
        }, retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime, onError]);

  // Mark notification as read with optimistic updates
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
      );
      setUnreadCount(prev => prev + 1);
      onError('Failed to mark notification as read');
    }
  }, [onError]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true })
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      onError('Failed to mark all notifications as read');
    }
  }, [notifications, unreadCount, onError]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications (every 30 seconds)
    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        debouncedFetch();
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchNotifications, debouncedFetch]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedFetch(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedFetch]);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type: string) => {
    const iconMap: Record<string, string> = {
      'workspace_created': '🏢',
      'workspace_updated': '📝',
      'workspace_deleted': '🗑️',
      'page_created': '📄',
      'page_updated': '✏️',
      'page_deleted': '🗑️',
      'section_created': '📁',
      'section_updated': '📝',
      'section_deleted': '🗑️',
      'member_added': '👋',
      'member_removed': '👋',
      'comment_added': '💬',
      'assignment_changed': '📋'
    };
    return iconMap[type] || '📢';
  }, []);

  // Format time ago with better precision
  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // For older notifications, show actual date
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // You can add navigation logic here based on notification type
    // For example, redirect to specific workspace/page
    if (notification.metadata?.workspaceId) {
      // router.push(`/workspace/${notification.metadata.workspaceId}`);
    }
  }, [markAsRead]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        // Fetch fresh data when opening
        debouncedFetch(true);
      }
      return !prev;
    });
  }, [debouncedFetch]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        disabled={isLoading && notifications.length === 0}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 transition-colors ${
            hasError ? 'text-red-400' : 'text-gray-400 group-hover:text-white'
          }`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px]"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {isLoading && notifications.length === 0 && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3">
            <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl py-1 z-50 ring-1 ring-black ring-opacity-5 max-h-96 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-lg">
            <h3 className="text-lg font-medium text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                  disabled={isLoading}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => debouncedFetch(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-gray-500 rounded"
                disabled={isLoading}
                aria-label="Refresh notifications"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {hasError ? (
              <div className="px-4 py-6 text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm mb-2">Failed to load notifications</p>
                <button
                  onClick={() => fetchNotifications()}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  disabled={isLoading}
                >
                  Try again
                </button>
              </div>
            ) : isLoading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1">You'll see updates about your workspaces here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-gray-750/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium break-words ${
                              notification.is_read ? 'text-gray-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 break-words ${
                              notification.is_read ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 ml-2" aria-hidden="true"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;