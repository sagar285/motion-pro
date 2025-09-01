'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Workspace, PageItem, Section, Subsection, Comment, ContentBlock } from '@/types';
import { workspaceAPI, sectionsAPI, pagesAPI, blocksAPI, commentsAPI, handleAPIError } from '@/lib/api-service';

interface WorkspaceState {
  workspace: Workspace | null;
  currentPage: PageItem | null;
  comments: Record<string, Comment[]>;
  isFullScreen: boolean;
  editingBlockId: string | null;
  expandedSections: string[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

type WorkspaceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKSPACE'; payload: Workspace }
  | { type: 'SET_CURRENT_PAGE'; payload: PageItem | null }
  | { type: 'UPDATE_PAGE'; payload: PageItem }
  | { type: 'ADD_COMMENT'; payload: { pageId: string; comment: Comment } }
  | { type: 'SET_FULL_SCREEN'; payload: boolean }
  | { type: 'SET_EDITING_BLOCK'; payload: string | null }
  | { type: 'ADD_SECTION'; payload: Section }
  | { type: 'UPDATE_SECTION'; payload: Section }
  | { type: 'DELETE_SECTION'; payload: string }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'ADD_SUBSECTION'; payload: { sectionId: string; subsection: Subsection } }
  | { type: 'UPDATE_SUBSECTION'; payload: { sectionId: string; subsection: Subsection } }
  | { type: 'DELETE_SUBSECTION'; payload: { sectionId: string; subsectionId: string } }
  | { type: 'ADD_PAGE'; payload: { sectionId: string; subsectionId?: string; page: PageItem } }
  | { type: 'DELETE_PAGE'; payload: { pageId: string } }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: WorkspaceState = {
  workspace: null,
  currentPage: null,
  comments: {},
  isFullScreen: false,
  editingBlockId: null,
  expandedSections: [],
  loading: false,
  error: null,
  isInitialized: false,
};

// Helper function to get all child page IDs recursively
const getAllChildPageIds = (parentId: string, allPages: PageItem[]): string[] => {
  const childIds: string[] = [];
  const directChildren = allPages.filter(page => page.parentId === parentId);
  
  directChildren.forEach(child => {
    childIds.push(child.id);
    childIds.push(...getAllChildPageIds(child.id, allPages));
  });
  
  return childIds;
};

// Helper function to get all pages from workspace
const getAllPages = (workspace: Workspace): PageItem[] => {
  const pages: PageItem[] = [];
  workspace.sections.forEach(section => {
    pages.push(...section.pages);
    section.subsections?.forEach(subsection => {
      pages.push(...subsection.pages);
    });
  });
  return pages;
};

const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_WORKSPACE':
      return { 
        ...state, 
        workspace: action.payload, 
        loading: false, 
        error: null,
        isInitialized: true,
        // Auto-expand first few sections
        expandedSections: action.payload.sections.slice(0, 3).map(s => s.id)
      };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'UPDATE_PAGE':
      if (!state.workspace) return state;
      
      const updatePageInSection = (section: Section): Section => ({
        ...section,
        pages: section.pages.map(page => 
          page.id === action.payload.id ? action.payload : page
        ),
        subsections: section.subsections?.map(sub => ({
          ...sub,
          pages: sub.pages.map(page => 
            page.id === action.payload.id ? action.payload : page
          )
        }))
      });

      const updatedSections = state.workspace.sections.map(updatePageInSection);
      
      return {
        ...state,
        workspace: { ...state.workspace, sections: updatedSections },
        currentPage: state.currentPage?.id === action.payload.id ? action.payload : state.currentPage
      };
    
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.pageId]: [
            ...(state.comments[action.payload.pageId] || []),
            action.payload.comment
          ]
        }
      };
    
    case 'SET_FULL_SCREEN':
      return { ...state, isFullScreen: action.payload };
    
    case 'SET_EDITING_BLOCK':
      return { ...state, editingBlockId: action.payload };
    
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: state.expandedSections.includes(action.payload)
          ? state.expandedSections.filter(id => id !== action.payload)
          : [...state.expandedSections, action.payload]
      };
    
    case 'ADD_SECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: [...state.workspace.sections, action.payload]
        },
        // Auto-expand the new section
        expandedSections: [...state.expandedSections, action.payload.id]
      };
    
    case 'UPDATE_SECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.map(section =>
            section.id === action.payload.id ? action.payload : section
          )
        }
      };
    
    case 'DELETE_SECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.filter(section => section.id !== action.payload)
        },
        expandedSections: state.expandedSections.filter(id => id !== action.payload)
      };

    case 'ADD_SUBSECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.map(section => {
            if (section.id === action.payload.sectionId) {
              return {
                ...section,
                subsections: [...(section.subsections || []), action.payload.subsection]
              };
            }
            return section;
          })
        }
      };

    case 'UPDATE_SUBSECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.map(section => {
            if (section.id === action.payload.sectionId) {
              return {
                ...section,
                subsections: section.subsections?.map(sub =>
                  sub.id === action.payload.subsection.id ? action.payload.subsection : sub
                )
              };
            }
            return section;
          })
        }
      };

    case 'DELETE_SUBSECTION':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.map(section => {
            if (section.id === action.payload.sectionId) {
              return {
                ...section,
                subsections: section.subsections?.filter(sub => sub.id !== action.payload.subsectionId)
              };
            }
            return section;
          })
        }
      };
    
    case 'ADD_PAGE':
      if (!state.workspace) return state;
      return {
        ...state,
        workspace: {
          ...state.workspace,
          sections: state.workspace.sections.map(section => {
            if (section.id === action.payload.sectionId) {
              if (action.payload.subsectionId) {
                // Add to subsection
                return {
                  ...section,
                  subsections: section.subsections?.map(sub =>
                    sub.id === action.payload.subsectionId
                      ? { ...sub, pages: [...sub.pages, action.payload.page] }
                      : sub
                  )
                };
              } else {
                // Add to section
                return { ...section, pages: [...section.pages, action.payload.page] };
              }
            }
            return section;
          })
        }
      };
    
    case 'DELETE_PAGE':
      if (!state.workspace) return state;
      
      // Get all pages to find child pages
      const allPages = getAllPages(state.workspace);
      const pageIdsToDelete = [action.payload.pageId, ...getAllChildPageIds(action.payload.pageId, allPages)];
      
      // Filter out all pages that should be deleted (parent and all children)
      const filterPages = (pages: PageItem[]): PageItem[] => 
        pages.filter(page => !pageIdsToDelete.includes(page.id));

      const updatedWorkspace = {
        ...state.workspace,
        sections: state.workspace.sections.map(section => ({
          ...section,
          pages: filterPages(section.pages),
          subsections: section.subsections?.map(sub => ({
            ...sub,
            pages: filterPages(sub.pages)
          }))
        }))
      };

      // Clear current page if it was deleted
      const newCurrentPage = pageIdsToDelete.includes(state.currentPage?.id || '') 
        ? null 
        : state.currentPage;

      return {
        ...state,
        workspace: updatedWorkspace,
        currentPage: newCurrentPage
      };
    
    default:
      return state;
  }
};

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
  actions: {
    loadWorkspace: (workspaceId?: string) => Promise<void>;
    createSection: (title: string, icon?: string) => Promise<void>;
    updateSection: (sectionId: string, title: string) => Promise<void>;
    deleteSection: (sectionId: string) => Promise<void>;
    createPage: (sectionId: string, subsectionId?: string, parentPageId?: string, title?: string) => Promise<void>;
    updatePageTitle: (pageId: string, title: string) => Promise<void>;
    deletePage: (pageId: string) => Promise<void>;
    updateBlockContent: (pageId: string, blockId: string, content: string, metadata?: any) => Promise<void>;
    createBlock: (pageId: string, type: ContentBlock['type'], content?: string, metadata?: any) => Promise<void>;
    deleteBlock: (blockId: string) => Promise<void>;
  };
} | null>(null);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  // Default workspace ID - you can change this to load different workspaces
  const DEFAULT_WORKSPACE_ID = 'default-workspace';

  // Load workspace on mount
  const loadWorkspace = useCallback(async (workspaceId: string = DEFAULT_WORKSPACE_ID) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('📚 Loading workspace from MySQL...');
      const workspace = await workspaceAPI.getWorkspace(workspaceId);
      console.log('✅ Workspace loaded successfully:', workspace.name);
      
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to load workspace:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Don't throw error to prevent app crash
      // Instead, show error state in UI
    }
  }, []);

  // Initialize workspace on mount
  useEffect(() => {
    if (!state.isInitialized) {
      loadWorkspace();
    }
  }, [loadWorkspace, state.isInitialized]);

  // Create section action
  const createSection = useCallback(async (title: string, icon: string = '📁') => {
    if (!state.workspace) return;

    try {
      console.log(`📝 Creating section: ${title}`);
      const newSection = await sectionsAPI.createSection({
        workspaceId: state.workspace.id,
        title,
        icon,
      });
      
      dispatch({ type: 'ADD_SECTION', payload: newSection });
      console.log('✅ Section created successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to create section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.workspace]);

  // Update section action
  const updateSection = useCallback(async (sectionId: string, title: string) => {
    try {
      console.log(`📝 Updating section: ${sectionId}`);
      const updatedSection = await sectionsAPI.updateSection({ id: sectionId, title });
      dispatch({ type: 'UPDATE_SECTION', payload: updatedSection });
      console.log('✅ Section updated successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to update section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Delete section action
  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      console.log(`🗑️ Deleting section: ${sectionId}`);
      await sectionsAPI.deleteSection(sectionId);
      dispatch({ type: 'DELETE_SECTION', payload: sectionId });
      console.log('✅ Section deleted successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to delete section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Create page action
  const createPage = useCallback(async (
    sectionId: string, 
    subsectionId?: string, 
    parentPageId?: string, 
    title: string = 'Untitled'
  ) => {
    if (!state.workspace) return;

    try {
      console.log(`📄 Creating page: ${title}`);
      const newPage = await pagesAPI.createPage({
        workspaceId: state.workspace.id,
        sectionId,
        subsectionId,
        title,
        icon: '📄',
        type: 'page',
        // Note: MySQL doesn't support parentId directly, you'd need to implement this separately
      });

      dispatch({ 
        type: 'ADD_PAGE', 
        payload: { sectionId, subsectionId, page: newPage }
      });

      // Set as current page
      dispatch({ type: 'SET_CURRENT_PAGE', payload: newPage });
      console.log('✅ Page created successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to create page:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.workspace]);

  // Update page title action
  const updatePageTitle = useCallback(async (pageId: string, title: string) => {
    try {
      console.log(`📝 Updating page title: ${pageId}`);
      const updatedPage = await pagesAPI.updatePage({ id: pageId, title });
      dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      console.log('✅ Page title updated successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to update page title:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Delete page action
  const deletePage = useCallback(async (pageId: string) => {
    try {
      console.log(`🗑️ Deleting page: ${pageId}`);
      await pagesAPI.deletePage(pageId);
      dispatch({ type: 'DELETE_PAGE', payload: { pageId } });
      console.log('✅ Page deleted successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to delete page:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Update block content action
  const updateBlockContent = useCallback(async (
    pageId: string, 
    blockId: string, 
    content: string, 
    metadata?: any
  ) => {
    try {
      console.log(`📝 Updating block: ${blockId}`);
      const updatedBlock = await blocksAPI.updateBlock({ 
        id: blockId, 
        content, 
        metadata 
      });

      // Update the page with the updated block
      if (state.currentPage && state.currentPage.id === pageId) {
        const updatedContent = state.currentPage.content?.map(block =>
          block.id === blockId ? updatedBlock : block
        ) || [];

        const updatedPage = {
          ...state.currentPage,
          content: updatedContent,
          updatedAt: new Date(),
        };

        dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      }
      console.log('✅ Block updated successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to update block:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentPage]);

  // Create block action
  const createBlock = useCallback(async (
    pageId: string, 
    type: ContentBlock['type'], 
    content: string = '', 
    metadata: any = {}
  ) => {
    try {
      console.log(`📄 Creating block: ${type}`);
      const newBlock = await blocksAPI.createBlock({
        pageId,
        type,
        content,
        metadata,
      });

      // Update the current page with the new block
      if (state.currentPage && state.currentPage.id === pageId) {
        const updatedContent = [...(state.currentPage.content || []), newBlock];
        const updatedPage = {
          ...state.currentPage,
          content: updatedContent,
          updatedAt: new Date(),
        };

        dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      }

      // Set editing for new block
      dispatch({ type: 'SET_EDITING_BLOCK', payload: newBlock.id });
      console.log('✅ Block created successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to create block:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentPage]);

  // Delete block action
  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      console.log(`🗑️ Deleting block: ${blockId}`);
      await blocksAPI.deleteBlock(blockId);

      // Update the current page by removing the block
      if (state.currentPage) {
        const updatedContent = state.currentPage.content?.filter(block => 
          block.id !== blockId
        ) || [];

        const updatedPage = {
          ...state.currentPage,
          content: updatedContent,
          updatedAt: new Date(),
        };

        dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      }
      console.log('✅ Block deleted successfully');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Failed to delete block:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentPage]);

  const actions = {
    loadWorkspace,
    createSection,
    updateSection,
    deleteSection,
    createPage,
    updatePageTitle,
    deletePage,
    updateBlockContent,
    createBlock,
    deleteBlock,
  };

  return (
    <WorkspaceContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

