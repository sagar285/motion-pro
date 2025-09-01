'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, MoreVertical, Edit, Trash2, Reply } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Comment } from '@/types';

interface CommentsPanelProps {
  pageId: string;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ pageId }) => {
  const { state, dispatch } = useWorkspace();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const comments = state.comments[pageId] || [];

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

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

    dispatch({ type: 'ADD_COMMENT', payload: { pageId, comment } });
    setNewComment('');
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const saveEdit = () => {
    // In a real app, you'd dispatch an UPDATE_COMMENT action
    setEditingComment(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const deleteComment = (commentId: string) => {
    if (confirm('Delete this comment?')) {
      // In a real app, you'd dispatch a DELETE_COMMENT action
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

  return (
    <div className="w-80 border-l border-gray-700 bg-gray-850 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="font-medium text-white">Comments</h3>
          {comments.length > 0 && (
            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No comments yet</p>
            <p className="text-gray-600 text-xs">Start the conversation</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="group">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {comment.userName[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-300 text-sm font-medium truncate">
                      {comment.userName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
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
                    <div className="bg-gray-800 rounded px-3 py-2">
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Comment Actions */}
                  <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-gray-500 hover:text-gray-300 text-xs flex items-center space-x-1"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                    {comment.userName === 'You' && (
                      <>
                        <button 
                          onClick={() => startEdit(comment)}
                          className="text-gray-500 hover:text-gray-300 text-xs flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => deleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-400 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* New Comment Input */}
      <div className="border-t border-gray-700 p-4">
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
        
        {replyingTo && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
            Replying to comment... (feature coming soon)
            <button 
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};