'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Plus, 
  MoreHorizontal, Edit3, Trash2, X, Check, FileText,
  Folder, FolderOpen, File, FilePlus, Loader2
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Section, Subsection, PageItem } from '@/types';

export const Sidebar: React.FC = () => {
  const { state, dispatch, actions } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([]);
  const [expandedPages, setExpandedPages] = useState<string[]>([]);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ 
    type: 'section' | 'subsection' | 'page'; 
    id: string; 
    sectionId?: string;
    subsectionId?: string;
    x: number; 
    y: number;
  } | null>(null);

  // Resizable functionality
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const minWidth = 240;
  const maxWidth = 600;

  // Handle resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Helper functions
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

  const getChildPages = (parentId: string): PageItem[] => {
    return getAllPages().filter(page => page.parentId === parentId);
  };

  const getRootPages = (pages: PageItem[]): PageItem[] => {
    return pages.filter(page => !page.parentId);
  };

  const hasChildPages = (pageId: string): boolean => {
    return getChildPages(pageId).length > 0;
  };

  const filteredPages = (pages: PageItem[]): PageItem[] => {
    if (!searchQuery.trim()) return pages;
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content?.some(block => 
        block.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  // Section management
  const toggleSection = (sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', payload: sectionId });
  };

  const createNewSection = async () => {
    if (!newSectionTitle.trim()) return;
    
    try {
      setOperationLoading('create-section');
      await actions.createSection(newSectionTitle.trim());
      setNewSectionTitle('');
      setShowNewSectionForm(false);
    } catch (error) {
      console.error('Failed to create section:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const updateSection = async (sectionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      setOperationLoading(`update-section-${sectionId}`);
      await actions.updateSection(sectionId, newTitle.trim());
      setEditingSection(null);
    } catch (error) {
      console.error('Failed to update section:', error);
      setEditingSection(null);
    } finally {
      setOperationLoading(null);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its content?')) return;
    
    try {
      setOperationLoading(`delete-section-${sectionId}`);
      await actions.deleteSection(sectionId);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  // Page management
  const openPage = (page: PageItem) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_FULL_SCREEN', payload: false });
  };

  const createNewPage = async (sectionId: string, subsectionId?: string, parentPageId?: string) => {
    try {
      const operationId = `create-page-${sectionId}-${subsectionId || 'root'}`;
      setOperationLoading(operationId);
      
      await actions.createPage(sectionId, subsectionId, parentPageId);
      
      // Auto-expand relevant sections
      if (parentPageId && !expandedPages.includes(parentPageId)) {
        setExpandedPages(prev => [...prev, parentPageId]);
      }
      if (subsectionId && !expandedSubsections.includes(subsectionId)) {
        setExpandedSubsections(prev => [...prev, subsectionId]);
      }
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const updatePageTitle = async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      setOperationLoading(`update-page-${pageId}`);
      await actions.updatePageTitle(pageId, newTitle.trim());
      setEditingPage(null);
    } catch (error) {
      console.error('Failed to update page title:', error);
      setEditingPage(null);
    } finally {
      setOperationLoading(null);
    }
  };

  const deletePage = async (pageId: string) => {
    const childPages = getChildPages(pageId);
    const confirmMessage = childPages.length > 0 
      ? `Delete this page and its ${childPages.length} child page(s)?`
      : 'Delete this page?';
      
    if (!confirm(confirmMessage)) return;
    
    try {
      setOperationLoading(`delete-page-${pageId}`);
      await actions.deletePage(pageId);
      setExpandedPages(prev => prev.filter(id => id !== pageId));
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to delete page:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  // UI state management
  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections(prev => 
      prev.includes(subsectionId) 
        ? prev.filter(id => id !== subsectionId)
        : [...prev, subsectionId]
    );
  };

  const togglePage = (pageId: string) => {
    setExpandedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handleRightClick = (
    e: React.MouseEvent, 
    type: 'section' | 'subsection' | 'page', 
    id: string, 
    sectionId?: string, 
    subsectionId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type,
      id,
      sectionId,
      subsectionId,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Context Menu Component
  const ContextMenu = () => {
    if (!contextMenu) return null;

    return (
      <div 
        className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px]"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextMenu.type === 'section' && (
          <>
            <button
              onClick={() => {
                setEditingSection(contextMenu.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename Section</span>
            </button>
            <button
              onClick={() => deleteSection(contextMenu.id)}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Section</span>
            </button>
          </>
        )}
        
        {contextMenu.type === 'subsection' && (
          <>
            <button
              onClick={() => {
                if (contextMenu.sectionId) {
                  createNewPage(contextMenu.sectionId, contextMenu.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Page</span>
            </button>
          </>
        )}

        {contextMenu.type === 'page' && (
          <>
            <button
              onClick={() => {
                if (contextMenu.sectionId) {
                  createNewPage(contextMenu.sectionId, contextMenu.subsectionId, contextMenu.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
            >
              <FilePlus className="w-4 h-4" />
              <span>Add Child Page</span>
            </button>
            <button
              onClick={() => {
                setEditingPage(contextMenu.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename Page</span>
            </button>
            <button
              onClick={() => deletePage(contextMenu.id)}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Page</span>
            </button>
          </>
        )}
      </div>
    );
  };

  // Page Tree Item Component
  const PageTreeItem: React.FC<{ 
    page: PageItem; 
    sectionId: string; 
    subsectionId?: string; 
    depth?: number;
  }> = ({ page, sectionId, subsectionId, depth = 0 }) => {
    const childPages = getChildPages(page.id);
    const isExpanded = expandedPages.includes(page.id);
    const hasChildren = childPages.length > 0;
    const indentStyle = { marginLeft: `${depth * 16}px` };
    const isLoading = operationLoading === `update-page-${page.id}` || 
                     operationLoading === `delete-page-${page.id}`;

    return (
      <div>
        <div className="group relative" style={indentStyle}>
          {editingPage === page.id ? (
            <div className="flex items-center space-x-2 py-1">
              <input
                type="text"
                defaultValue={page.title}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updatePageTitle(page.id, (e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') setEditingPage(null);
                }}
                onBlur={(e) => updatePageTitle(page.id, e.target.value)}
              />
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>
          ) : (
            <div
              onClick={() => hasChildren ? togglePage(page.id) : openPage(page)}
              onDoubleClick={() => openPage(page)}
              onContextMenu={(e) => handleRightClick(e, 'page', page.id, sectionId, subsectionId)}
              className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                state.currentPage?.id === page.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-1 min-w-0 flex-1">
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePage(page.id);
                    }}
                    className="p-0.5 hover:bg-gray-700 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-4" />}
                
                <span className="text-sm flex-shrink-0">{page.icon}</span>
                <span className="truncate flex-1 text-left">{page.title}</span>
                
                {hasChildren && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({childPages.length})
                  </span>
                )}
                
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewPage(sectionId, subsectionId, page.id);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-all"
                  title="Add child page"
                  disabled={isLoading}
                >
                  <Plus className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRightClick(e, 'page', page.id, sectionId, subsectionId);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-all"
                  title="More options"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                </button>
              </div>
              
              {page.status && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  page.status === 'Management' ? 'bg-gray-500' :
                  page.status === 'Execution' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></span>
              )}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {childPages.map(childPage => (
              <PageTreeItem
                key={childPage.id}
                page={childPage}
                sectionId={sectionId}
                subsectionId={subsectionId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Loading state while workspace is being fetched
  if (state.loading && !state.workspace) {
    return (
      <div 
        className="bg-gray-900 border-r border-gray-700 flex flex-col h-full" 
        style={{ width: sidebarWidth }}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse w-20"></div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <div className="w-full h-10 bg-gray-800 border border-gray-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-10 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="ml-6 space-y-2">
                  <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-800 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if workspace is not loaded
  if (!state.workspace) return null;

  return (
    <>
      <div 
        ref={sidebarRef}
        className="bg-gray-900 border-r border-gray-700 flex flex-col h-full relative"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white truncate">{state.workspace.name}</h2>
              <p className="text-xs text-gray-400 truncate">
                {state.workspace.members?.length || 0} members
              </p>
            </div>
            {state.loading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-200">{state.error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Add New Section */}
            {showNewSectionForm ? (
              <div className="mb-4 bg-gray-800 border border-gray-600 rounded-lg p-3 space-y-3">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Section name..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  disabled={operationLoading === 'create-section'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createNewSection();
                    if (e.key === 'Escape') {
                      setShowNewSectionForm(false);
                      setNewSectionTitle('');
                    }
                  }}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={createNewSection}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                    disabled={!newSectionTitle.trim() || operationLoading === 'create-section'}
                  >
                    {operationLoading === 'create-section' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create Section</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewSectionForm(false);
                      setNewSectionTitle('');
                    }}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-1"
                    disabled={operationLoading === 'create-section'}
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewSectionForm(true)}
                className="w-full mb-4 flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-dashed border-gray-600"
                disabled={state.loading}
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            )}

            {/* Sections */}
            <div className="space-y-2">
              {state.workspace.sections.map(section => {
                const sectionLoading = operationLoading === `update-section-${section.id}` || 
                                     operationLoading === `delete-section-${section.id}`;
                
                return (
                  <div key={section.id} className="space-y-1">
                    <div className="group">
                      {editingSection === section.id ? (
                        <div className="flex items-center space-x-2 py-2">
                          <input
                            type="text"
                            defaultValue={section.title}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            disabled={sectionLoading}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSection(section.id, (e.target as HTMLInputElement).value);
                              }
                              if (e.key === 'Escape') setEditingSection(null);
                            }}
                            onBlur={(e) => updateSection(section.id, e.target.value)}
                          />
                          {sectionLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleSection(section.id)}
                          onContextMenu={(e) => handleRightClick(e, 'section', section.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer ${
                            sectionLoading ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {state.expandedSections.includes(section.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="text-base">{section.icon}</span>
                            <span className="font-medium">{section.title}</span>
                            {sectionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                createNewPage(section.id);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Add page"
                              disabled={sectionLoading}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRightClick(e, 'section', section.id);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="More options"
                              disabled={sectionLoading}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {state.expandedSections.includes(section.id) && (
                      <div className="ml-6 space-y-1">
                        {/* Direct section pages */}
                        {filteredPages(getRootPages(section.pages)).map(page => (
                          <PageTreeItem
                            key={page.id}
                            page={page}
                            sectionId={section.id}
                          />
                        ))}

                        {/* Subsections */}
                        {section.subsections?.map(subsection => (
                          <div key={subsection.id} className="space-y-1">
                            <div className="group relative">
                              <button
                                onClick={() => toggleSubsection(subsection.id)}
                                onContextMenu={(e) => handleRightClick(e, 'subsection', subsection.id, section.id)}
                                className="w-full flex items-center justify-between py-2 px-2 group hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  {expandedSubsections.includes(subsection.id) ? (
                                    <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  )}
                                  {expandedSubsections.includes(subsection.id) ? (
                                    <FolderOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <Folder className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className="text-xs text-gray-300 font-medium truncate">
                                    {subsection.title}
                                  </span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    ({subsection.pages.length})
                                  </span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createNewPage(section.id, subsection.id);
                                    }}
                                    className="p-1 hover:bg-gray-700 rounded transition-all"
                                    title="Add page"
                                  >
                                    <Plus className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                                  </div>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRightClick(e, 'subsection', subsection.id, section.id);
                                    }}
                                    className="p-1 hover:bg-gray-700 rounded transition-all"
                                    title="More options"
                                  >
                                    <MoreHorizontal className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                                  </div>
                                </div>
                              </button>
                            </div>
                            
                            {/* Subsection Pages */}
                            {expandedSubsections.includes(subsection.id) && (
                              <div className="ml-6 space-y-1">
                                {filteredPages(getRootPages(subsection.pages)).length === 0 ? (
                                  <div className="py-2 px-3 text-xs text-gray-500 italic bg-gray-800/50 rounded border-dashed border border-gray-700">
                                    No pages yet. Click + to add one.
                                  </div>
                                ) : (
                                  filteredPages(getRootPages(subsection.pages)).map(page => (
                                    <PageTreeItem
                                      key={page.id}
                                      page={page}
                                      sectionId={section.id}
                                      subsectionId={subsection.id}
                                    />
                                  ))
                                )}
                                
                                {/* Quick Add Page Button */}
                                <button
                                  onClick={() => createNewPage(section.id, subsection.id)}
                                  className="w-full flex items-center space-x-2 px-3 py-1 rounded text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors border border-dashed border-gray-700"
                                  disabled={operationLoading?.includes(`create-page-${section.id}-${subsection.id}`)}
                                >
                                  {operationLoading?.includes(`create-page-${section.id}-${subsection.id}`) ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Creating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Add page</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Add page button for section level */}
                        <button
                          onClick={() => createNewPage(section.id)}
                          className="w-full flex items-center space-x-2 px-3 py-1 rounded text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors border border-dashed border-gray-700"
                          disabled={operationLoading?.includes(`create-page-${section.id}-root`)}
                        >
                          {operationLoading?.includes(`create-page-${section.id}-root`) ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add page to section</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Search Results
                </h3>
                <div className="space-y-1">
                  {(() => {
                    const allPages = getAllPages();
                    const searchResults = allPages.filter(page => 
                      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      page.content?.some(block => 
                        block.content.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    );

                    if (searchResults.length === 0) {
                      return (
                        <div className="py-4 px-3 text-center text-gray-500 text-sm">
                          No pages found matching "{searchQuery}"
                        </div>
                      );
                    }

                    return searchResults.map(page => {
                      const sectionInfo = (() => {
                        for (const section of state.workspace!.sections) {
                          if (section.pages.find(p => p.id === page.id)) {
                            return { sectionName: section.title };
                          }
                          for (const subsection of section.subsections || []) {
                            if (subsection.pages.find(p => p.id === page.id)) {
                              return { 
                                sectionName: section.title, 
                                subsectionName: subsection.title 
                              };
                            }
                          }
                        }
                        return null;
                      })();

                      return (
                        <button
                          key={page.id}
                          onClick={() => openPage(page)}
                          className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-colors text-left ${
                            state.currentPage?.id === page.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <span className="text-sm flex-shrink-0">{page.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{page.title}</div>
                            {sectionInfo && (
                              <div className="text-xs text-gray-500 truncate">
                                {sectionInfo.sectionName}
                                {sectionInfo.subsectionName && ` • ${sectionInfo.subsectionName}`}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              Status: {state.loading ? 'Syncing...' : 'Connected'}
            </span>
            <span>
              {state.workspace.sections.length} sections
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="flex-1 text-blue-400 hover:text-blue-300 text-sm transition-colors text-left"
              onClick={() => actions.loadWorkspace()}
              disabled={state.loading}
            >
              {state.loading ? 'Refreshing...' : 'Refresh workspace'}
            </button>
            {state.loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-transparent'
          }`}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu />
    </>
  );
};