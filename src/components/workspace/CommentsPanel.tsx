'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, MoreVertical, Edit, Trash2, Reply, X } from 'lucide-react';

interface Comment {
  id: string;
  pageId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

interface CommentsPanelProps {
  pageId: string;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ pageId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320); // 320px = w-80
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(250, Math.min(500, window.innerWidth - event.clientX));
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId,
      userId: 'current-user',
      userName: 'You',
      content: newComment.trim(),
      createdAt: new Date()
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setReplyingTo(null);
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowDropdown(null);
  };

  const saveEdit = () => {
    if (!editContent.trim()) return;
    
    setComments(prev => 
      prev.map(comment => 
        comment.id === editingComment 
          ? { ...comment, content: editContent.trim() }
          : comment
      )
    );
    setEditingComment(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const deleteComment = (commentId: string) => {
    if (confirm('Delete this comment?')) {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setShowDropdown(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addComment();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isVisible) {
    return (
      <div className="w-12 border-l border-gray-700 bg-gray-850 flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <button
            onClick={() => setIsVisible(true)}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Show comments"
          >
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border-l border-gray-700 bg-gray-850 flex flex-col max-h-full relative"
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
        onMouseDown={() => setIsResizing(true)}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-850 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="font-medium text-white">Comments</h3>
          {comments.length > 0 && (
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          title="Hide comments"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      {/* Comments List - Fixed scrolling with proper background */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-850">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No comments yet</p>
            <p className="text-gray-600 text-xs">Start the conversation</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="group relative">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {comment.userName[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-gray-300 text-sm font-medium truncate">
                        {comment.userName}
                      </span>
                      <span className="text-gray-500 text-xs flex-shrink-0">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    
                    {/* Options Menu */}
                    {comment.userName === 'You' && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === comment.id ? null : comment.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-all"
                        >
                          <MoreVertical className="w-3 h-3 text-gray-400" />
                        </button>
                        
                        {showDropdown === comment.id && (
                          <div 
                            ref={dropdownRef}
                            className="absolute right-0 top-6 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 py-1 min-w-[120px]"
                          >
                            <button
                              onClick={() => startEdit(comment)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-800 rounded px-3 py-2">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      
                      {/* Comment Actions - Only show reply for now */}
                      <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-gray-500 hover:text-gray-300 text-xs flex items-center space-x-1"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Reply Section */}
              {replyingTo === comment.id && (
                <div className="ml-10 mt-3 p-3 bg-gray-800 rounded border-l-2 border-blue-500">
                  <div className="text-xs text-gray-400 mb-2">
                    Replying to {comment.userName}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                    rows={2}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* New Comment Input - Fixed positioning */}
      <div className="border-t border-gray-700 p-4 bg-gray-850 flex-shrink-0">
        {!replyingTo && (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span>Ctrl+Enter to send</span>
              </div>
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};