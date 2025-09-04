'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, MoreHorizontal, Star, Share2, Clock, Users, 
  ChevronDown, ChevronRight, FileText, FolderPlus,
  Copy, Trash2, Edit3
} from 'lucide-react';
import { useWorkspace, useNestedPages } from '@/context/WorkspaceContext';
import { BreadcrumbNavigation, PageDepthIndicator } from './BreadcrumbNavigation';
import { PageItem } from '@/types';

interface PageHeaderProps {
  page: PageItem;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  page,
  className = ""
}) => {
  const { state, dispatch, actions } = useWorkspace();
  const { getChildPages, getPageDepth, getPageBreadcrumbs } = useNestedPages();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showChildPages, setShowChildPages] = useState(true); // Default to open
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // --- Close actions menu when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const childPages = getChildPages(page.id);
  const pageDepth = getPageDepth(page.id);
  const hasChildren = childPages.length > 0;

  // --- Refactored Action Handlers to use Workspace Actions (API calls) ---

  const handleTitleUpdate = (newTitle: string) => {
    setIsEditingTitle(false);
    if (newTitle.trim() && newTitle !== page.title) {
      // FIX: Call the context action to update the page via API
      actions.updatePageTitle(page.id, newTitle.trim());
    }
  };

  const createChildPage = () => {
    // FIX: Use the efficient getPageBreadcrumbs to find location
    const breadcrumbs = getPageBreadcrumbs(page.id);
    const section = breadcrumbs.find(b => b.type === 'section');
    const subsection = breadcrumbs.find(b => b.type === 'subsection');

    if (!section) {
        console.error("Could not find section to create child page in.");
        return;
    }
    
    // FIX: Call the context action to create the page via API
    actions.createPage(section.id, subsection?.id, page.id, 'Untitled');
  };

  const duplicatePage = () => {
    // NOTE: This assumes a `duplicatePage` action exists in your context.
    // You would need to add this action to WorkspaceContext.tsx and a corresponding
    // API endpoint (/api/pages/duplicate) for it to work.
    console.log("Duplicate page action triggered. Implement in WorkspaceContext.");
    // actions.duplicatePage(page.id); 
  };

  const deletePage = () => {
    const confirmMessage = hasChildren 
      ? `Delete "${page.title}" and its ${childPages.length} child page(s)?`
      : `Delete "${page.title}"?`;
      
    // Using confirm for simplicity, but a custom modal is recommended.
    if (confirm(confirmMessage)) {
      // FIX: Call the context action to delete the page via API
      actions.deletePage(page.id);
    }
  };

  // --- Child Components ---

  const ChildPagesList = () => {
    if (!hasChildren || !showChildPages) return null;

    return (
      <div className="mt-4 border-t border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">
            Child Pages ({childPages.length})
          </h3>
          <button
            onClick={createChildPage}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Child</span>
          </button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {childPages.map(childPage => (
            <div
              key={childPage.id}
              className="flex items-center justify-between p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <button
                onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: childPage })}
                className="flex items-center space-x-2 flex-1 text-left min-w-0"
              >
                <span className="text-sm">{childPage.icon}</span>
                <span className="text-sm text-gray-300 truncate">{childPage.title}</span>
                <PageDepthIndicator pageId={childPage.id} className="ml-2" />
              </button>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); createChildPage(); }}
                    className="p-1 text-gray-500 hover:text-gray-300 rounded"
                    title="Add child page"
                >
                    <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PageActionsMenu = () => {
    if (!isActionsMenuOpen) return null;

    return (
      <div ref={actionsMenuRef} className="absolute right-0 top-12 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-48">
        <button
          onClick={() => { createChildPage(); setIsActionsMenuOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Add Child Page</span>
        </button>
        
        <button
          onClick={() => { duplicatePage(); setIsActionsMenuOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate Page</span>
        </button>
        
        <button
          onClick={() => { setIsEditingTitle(true); setIsActionsMenuOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>Rename Page</span>
        </button>
        
        <hr className="border-gray-600 my-1" />
        
        <button
          onClick={() => { deletePage(); setIsActionsMenuOpen(false); }}
          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Page</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 border-b border-gray-700 ${className}`}>
      <div className="px-6 pt-4 pb-2">
        <BreadcrumbNavigation currentPageId={page.id} />
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl flex-shrink-0">{page.icon}</span>
              
              {isEditingTitle ? (
                <input
                  type="text"
                  defaultValue={page.title}
                  className="flex-1 bg-transparent border-b border-gray-600 text-2xl font-bold text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleUpdate((e.target as HTMLInputElement).value);
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  onBlur={(e) => handleTitleUpdate(e.target.value)}
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-white truncate cursor-pointer hover:bg-gray-800 px-2 py-1 rounded-md"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit title"
                >
                  {page.title}
                </h1>
              )}
              
              <PageDepthIndicator pageId={page.id} />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {page.status && (
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    page.status === 'Management' ? 'bg-gray-500' :
                    page.status === 'Execution' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <span>{page.status}</span>
                </div>
              )}
              
              {page.assignees && page.assignees.length > 0 && (
                <div className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4" />
                  <span>{page.assignees.join(', ')}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Favorite">
              <Star className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <PageActionsMenu />
            </div>
          </div>
        </div>
        
        {hasChildren && (
          <div className="mt-4">
            <button
              onClick={() => setShowChildPages(!showChildPages)}
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showChildPages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span>
                {childPages.length} child page{childPages.length !== 1 ? 's' : ''}
              </span>
            </button>
          </div>
        )}
        
        <ChildPagesList />
      </div>
    </div>
  );
};
