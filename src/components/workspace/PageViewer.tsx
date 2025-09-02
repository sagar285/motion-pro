'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Maximize2, Minimize2, Share, Star, MoreHorizontal, Plus, 
  Calendar, Users, Tag, FileText, ChevronRight, Home, Folder
} from 'lucide-react';
import { PageItem, ContentBlock } from '@/types';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ContentEditor } from '@/components/editor/ContentEditor';
import { BlockTypeSelector } from '@/components/editor/BlockTypeSelector';
import { CommentsPanel } from './CommentsPanel';

interface PageViewerProps {
  page: PageItem;
}

export const PageViewer: React.FC<PageViewerProps> = ({ page }) => {
  const { state, dispatch, actions } = useWorkspace();
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);

  // Helper functions for page hierarchy
  const getAllPages = (): PageItem[] => {
    if (!state.workspace) return [];
    
    const pages: PageItem[] = [];
    state.workspace.sections.forEach(section => {
      pages.push(...section.pages);
      section.subsections?.forEach(subsection => {
        pages.push(...subsection.pages);
      });
    });
    return pages;
  };

  const getParentPage = (pageId: string): PageItem | null => {
    const allPages = getAllPages();
    const currentPage = allPages.find(p => p.id === pageId);
    if (!currentPage?.parentId) return null;
    return allPages.find(p => p.id === currentPage.parentId) || null;
  };

  const getChildPages = (pageId: string): PageItem[] => {
    return getAllPages().filter(p => p.parentId === pageId);
  };

  const getBreadcrumbPath = (pageId: string): PageItem[] => {
    const path: PageItem[] = [];
    const allPages = getAllPages();
    let currentPageId: string | undefined = pageId;
    
    // Build path from current page up to root
    while (currentPageId) {
      const currentPage = allPages.find(p => p.id === currentPageId);
      if (!currentPage) break;
      
      path.unshift(currentPage);
      currentPageId = currentPage.parentId;
    }
    
    return path;
  };

  const getSectionInfo = (pageId: string): { sectionName: string; subsectionName?: string } | null => {
    if (!state.workspace) return null;

    const getAllAncestors = (targetId: string): string[] => {
      const ancestors: string[] = [];
      const allPages = getAllPages();
      let currentId: string | undefined = targetId;
      
      while (currentId) {
        ancestors.push(currentId);
        const currentPage = allPages.find(p => p.id === currentId);
        currentId = currentPage?.parentId;
      }
      
      return ancestors;
    };

    const ancestorIds = getAllAncestors(pageId);

    for (const section of state.workspace.sections) {
      const hasAncestorInSection = section.pages.some(p => ancestorIds.includes(p.id));
      if (hasAncestorInSection) {
        return { sectionName: section.title };
      }

      if (section.subsections) {
        for (const subsection of section.subsections) {
          const hasAncestorInSubsection = subsection.pages.some(p => ancestorIds.includes(p.id));
          if (hasAncestorInSubsection) {
            return { 
              sectionName: section.title, 
              subsectionName: subsection.title 
            };
          }
        }
      }
    }
    
    return null;
  };

  // Updated page management functions using MySQL API
  const updateBlockContent = async (blockId: string, content: string, metadata?: any) => {
    try {
      await actions.updateBlockContent(page.id, blockId, content, metadata);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const addNewBlock = async (type: string, options?: any) => {
    try {
      await actions.createBlock(page.id, type as ContentBlock['type'], '', options);
      setShowBlockSelector(false);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      await actions.deleteBlock(blockId);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const duplicateBlock = async (blockId: string) => {
    const blockToDuplicate = page.content?.find(block => block.id === blockId);
    if (blockToDuplicate) {
      try {
        await actions.createBlock(
          page.id,
          blockToDuplicate.type,
          blockToDuplicate.content,
          blockToDuplicate.metadata
        );
      } catch (error) {
        console.error('Failed to duplicate block:', error);
      }
    }
  };

  // Drag and Drop Functions (would need API support for reordering)
  const reorderBlocks = async (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => {
    // This would require an API endpoint to handle block reordering
    // For now, we'll handle it optimistically in the UI
    console.log('Block reordering not yet implemented in API');
    
    // Clear drag states
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragPosition(null);
  };

  const handleAddBlockClick = () => {
    setShowBlockSelector(true);
  };

  const updatePageTitle = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === page.title) return;
    
    try {
      await actions.updatePageTitle(page.id, newTitle.trim());
    } catch (error) {
      console.error('Failed to update page title:', error);
    }
  };

  const toggleFullScreen = () => {
    dispatch({ type: 'SET_FULL_SCREEN', payload: !state.isFullScreen });
  };

  const navigateToPage = (targetPage: PageItem) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: targetPage });
  };

  // Get navigation data
  const breadcrumbPath = getBreadcrumbPath(page.id);
  const parentPage = getParentPage(page.id);
  const childPages = getChildPages(page.id);
  const sectionInfo = getSectionInfo(page.id);

  return (
    <div className={`${state.isFullScreen ? 'fixed inset-0 z-50 bg-gray-900' : ''} flex flex-col h-full`}>
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {state.isFullScreen && (
            <button 
              onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: null })}
              className="p-2 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Enhanced Header with Breadcrumbs */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* Section/Subsection Info */}
            {sectionInfo && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                <Home className="w-3 h-3" />
                <span>{sectionInfo.sectionName}</span>
                {sectionInfo.subsectionName && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span>{sectionInfo.subsectionName}</span>
                  </>
                )}
                <ChevronRight className="w-3 h-3" />
              </div>
            )}

            {/* Page Breadcrumb */}
            <div className="flex items-center space-x-2 min-w-0">
              {breadcrumbPath.map((breadcrumbPage, index) => (
                <React.Fragment key={breadcrumbPage.id}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{breadcrumbPage.icon}</span>
                    {index === breadcrumbPath.length - 1 ? (
                      // Current page - editable title
                      <input
                        type="text"
                        value={breadcrumbPage.title}
                        onChange={(e) => {
                          // Optimistically update title in UI
                          const updatedPage = { ...breadcrumbPage, title: e.target.value };
                          dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
                        }}
                        onBlur={(e) => updatePageTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updatePageTitle((e.target as HTMLInputElement).value);
                          }
                        }}
                        className="text-2xl font-semibold text-white bg-transparent border-none focus:outline-none min-w-0 flex-1"
                        placeholder="Untitled"
                      />
                    ) : (
                      // Parent pages - clickable links
                      <button
                        onClick={() => navigateToPage(breadcrumbPage)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                      >
                        {breadcrumbPage.title}
                      </button>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Loading indicator */}
          {state.loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title={state.isFullScreen ? 'Exit full screen' : 'Full screen'}
          >
            {state.isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button className="p-2 hover:bg-gray-800 rounded transition-colors" title="Share">
            <Share className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded transition-colors" title="Add to favorites">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded transition-colors" title="More options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Parent Page Navigation */}
            {parentPage && (
              <div className="mb-6">
                <button
                  onClick={() => navigateToPage(parentPage)}
                  className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-lg">{parentPage.icon}</span>
                  <span>Back to {parentPage.title}</span>
                </button>
              </div>
            )}

            {/* Page Properties */}
            {(page.status || page.assignees || page.deadline) && (
              <div className="mb-8 p-4 bg-gray-850 rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Properties
                </h3>
                <div className="space-y-3">
                  {page.status && (
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 w-20 text-sm">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        page.status === 'Management' ? 'bg-gray-600 text-gray-100' :
                        page.status === 'Execution' ? 'bg-blue-600 text-blue-100' : 
                        'bg-orange-600 text-orange-100'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                  )}
                  
                  {page.assignees && page.assignees.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 w-20 text-sm">Assignees</span>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {page.assignees.map((assignee, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">{assignee[0].toUpperCase()}</span>
                            </div>
                            <span className="text-gray-300 text-sm">{assignee}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 w-20 text-sm">Deadline</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">{page.deadline || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Child Pages Navigation */}
            {childPages.length > 0 && (
              <div className="mb-8 p-4 bg-gray-850 rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                  <Folder className="w-4 h-4 mr-2" />
                  Child Pages ({childPages.length})
                </h3>
                <div className="grid gap-2">
                  {childPages.map(childPage => (
                    <button
                      key={childPage.id}
                      onClick={() => navigateToPage(childPage)}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors text-left"
                    >
                      <span className="text-lg flex-shrink-0">{childPage.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-200">{childPage.title}</div>
                        {childPage.content && childPage.content.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {childPage.content[0]?.content?.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error display for API errors */}
            {state.error && (
              <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 rounded">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-200">
                      Error: {state.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Blocks */}
            <div className="space-y-1">
              {page.content && page.content.length > 0 ? (
                page.content.map((block, index) => (
                  <ContentEditor 
                    key={block.id} 
                    block={block} 
                    pageId={page.id}
                    onUpdate={updateBlockContent}
                    onDelete={deleteBlock}
                    onDuplicate={duplicateBlock}
                    onReorder={reorderBlocks}
                    isDragOver={dragOverBlockId === block.id}
                    dragPosition={dragOverBlockId === block.id ? dragPosition : null}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>This page is empty</p>
                    <p className="text-sm mt-2">Click below to add your first block</p>
                  </div>
                </div>
              )}
              
              {/* Add New Block */}
              <div className="group py-2">
                <button
                  onClick={handleAddBlockClick}
                  className="flex items-center space-x-2 px-2 py-3 text-gray-500 hover:text-gray-300 transition-colors w-full text-left"
                  disabled={state.loading}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">
                    {state.loading ? 'Adding block...' : 'Click to add a block, or type "/" for commands'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Panel */}
        <CommentsPanel pageId={page.id} />
      </div>

      {/* Block Selector Modal */}
      {showBlockSelector && (
        <BlockTypeSelector 
          onSelect={(type, options) => addNewBlock(type, options)}
          onClose={() => setShowBlockSelector(false)}
        />
      )}
    </div>
  );
};