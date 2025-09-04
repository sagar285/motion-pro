'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Workspace, PageItem, Section, Subsection, Comment, ContentBlock } from '@/types';

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
  | { type: 'MOVE_PAGE'; payload: { pageId: string; newParentId?: string; newSectionId?: string; newSubsectionId?: string } }
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

// Helper functions for nested pages
const getAllPages = (workspace: Workspace): PageItem[] => {
  const pages: PageItem[] = [];
  
  const addPagesRecursively = (pageList: PageItem[]) => {
    pageList.forEach(page => {
      pages.push(page);
      if (page.children && page.children.length > 0) {
        addPagesRecursively(page.children);
      }
    });
  };
  
  workspace.sections.forEach(section => {
    addPagesRecursively(section.pages);
    section.subsections?.forEach(subsection => {
      addPagesRecursively(subsection.pages);
    });
  });
  
  return pages;
};

const getAllChildPageIds = (parentId: string, allPages: PageItem[]): string[] => {
  const parentPage = allPages.find(page => page.id === parentId);
  if (!parentPage || !parentPage.children) return [];
  
  const childIds: string[] = [];
  
  const addChildrenRecursively = (children: PageItem[]) => {
    children.forEach(child => {
      childIds.push(child.id);
      if (child.children && child.children.length > 0) {
        addChildrenRecursively(child.children);
      }
    });
  };
  
  addChildrenRecursively(parentPage.children);
  return childIds;
};

const validatePageHierarchy = (pageId: string, newParentId: string | undefined, allPages: PageItem[]): boolean => {
  if (!newParentId) return true;
  if (pageId === newParentId) return false;
  
  const descendants = getAllChildPageIds(pageId, allPages);
  return !descendants.includes(newParentId);
};

const findPageLocation = (workspace: Workspace, pageId: string): {
  sectionId: string;
  subsectionId?: string;
  section: Section;
  subsection?: Subsection;
} | null => {
  for (const section of workspace.sections) {
    if (section.pages.some(page => page.id === pageId)) {
      return { sectionId: section.id, section };
    }
    
    if (section.subsections) {
      for (const subsection of section.subsections) {
        if (subsection.pages.some(page => page.id === pageId)) {
          return { 
            sectionId: section.id, 
            subsectionId: subsection.id, 
            section, 
            subsection 
          };
        }
      }
    }
  }
  return null;
};

const insertPageInLocation = (
  workspace: Workspace, 
  page: PageItem, 
  sectionId: string, 
  subsectionId?: string
): Workspace => {
  return {
    ...workspace,
    sections: workspace.sections.map(section => {
      if (section.id === sectionId) {
        if (subsectionId) {
          return {
            ...section,
            subsections: section.subsections?.map(subsection => 
              subsection.id === subsectionId
                ? { ...subsection, pages: [...subsection.pages, page] }
                : subsection
            )
          };
        } else {
          return { ...section, pages: [...section.pages, page] };
        }
      }
      return section;
    })
  };
};

const removePageFromLocation = (workspace: Workspace, pageId: string): Workspace => {
  return {
    ...workspace,
    sections: workspace.sections.map(section => ({
      ...section,
      pages: section.pages.filter(page => page.id !== pageId),
      subsections: section.subsections?.map(subsection => ({
        ...subsection,
        pages: subsection.pages.filter(page => page.id !== pageId)
      }))
    }))
  };
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
        workspace: insertPageInLocation(
          state.workspace,
          action.payload.page,
          action.payload.sectionId,
          action.payload.subsectionId
        )
      };
    
    case 'DELETE_PAGE':
      if (!state.workspace) return state;
      
      const allPages = getAllPages(state.workspace);
      const pageIdsToDelete = [action.payload.pageId, ...getAllChildPageIds(action.payload.pageId, allPages)];
      
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

      const newCurrentPage = pageIdsToDelete.includes(state.currentPage?.id || '') 
        ? null 
        : state.currentPage;

      return {
        ...state,
        workspace: updatedWorkspace,
        currentPage: newCurrentPage
      };

    case 'MOVE_PAGE':
      if (!state.workspace) return state;
      
      const { pageId, newParentId, newSectionId, newSubsectionId } = action.payload;
      const allPagesForMove = getAllPages(state.workspace);
      
      const pageToMove = allPagesForMove.find(page => page.id === pageId);
      if (!pageToMove) return state;
      
      if (!validatePageHierarchy(pageId, newParentId, allPagesForMove)) {
        console.warn('Cannot move page: would create circular reference');
        return state;
      }
      
      const updatedPage = { ...pageToMove, parentId: newParentId };
      let workspaceAfterRemoval = removePageFromLocation(state.workspace, pageId);
      
      let targetSectionId = newSectionId;
      let targetSubsectionId = newSubsectionId;
      
      if (!targetSectionId && newParentId) {
        const parentLocation = findPageLocation(workspaceAfterRemoval, newParentId);
        if (parentLocation) {
          targetSectionId = parentLocation.sectionId;
          targetSubsectionId = parentLocation.subsectionId;
        }
      }
      
      if (!targetSectionId) {
        const originalLocation = findPageLocation(state.workspace, pageId);
        if (originalLocation) {
          targetSectionId = originalLocation.sectionId;
          targetSubsectionId = originalLocation.subsectionId;
        }
      }
      
      if (targetSectionId) {
        workspaceAfterRemoval = insertPageInLocation(
          workspaceAfterRemoval,
          updatedPage,
          targetSectionId,
          targetSubsectionId
        );
      }
      
      return {
        ...state,
        workspace: workspaceAfterRemoval,
        currentPage: state.currentPage?.id === pageId ? updatedPage : state.currentPage
      };
    
    default:
      return state;
  }
};

interface NestedPageOperations {
  getAllPages: () => PageItem[];
  getPageHierarchy: (pageId: string) => PageItem[];
  getChildPages: (parentId: string) => PageItem[];
  getRootPages: (pages: PageItem[]) => PageItem[];
  getPageDepth: (pageId: string) => number;
  canMovePage: (pageId: string, newParentId?: string) => boolean;
  movePage: (pageId: string, newParentId?: string, newSectionId?: string, newSubsectionId?: string) => Promise<void>;
  getPageBreadcrumbs: (pageId: string) => { id: string; title: string; type: 'section' | 'subsection' | 'page' }[];
}

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
  nestedPages: NestedPageOperations;
} | null>(null);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const DEFAULT_WORKSPACE_ID = 'default-workspace';

  const loadWorkspace = useCallback(async (workspaceId: string = DEFAULT_WORKSPACE_ID) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Loading workspace from database...');
      
      const response = await fetch(`/api/workspaces?id=${workspaceId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load workspace`);
      }
      
      const workspace = await response.json();
      console.log('Workspace loaded successfully:', workspace.name);
      
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to load workspace:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  useEffect(() => {
    if (!state.isInitialized) {
      loadWorkspace();
    }
  }, [loadWorkspace, state.isInitialized]);

  const createSection = useCallback(async (title: string, icon: string = '📁') => {
    if (!state.workspace) {
      console.error('No workspace available for section creation');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log(`Creating section: ${title}`);
      
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: state.workspace.id,
          title: title.trim(),
          icon,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create section');
      }

      const newSection = await response.json();
      dispatch({ type: 'ADD_SECTION', payload: newSection });
      console.log('Section created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create section';
      console.error('Failed to create section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.workspace]);

  const updateSection = useCallback(async (sectionId: string, title: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log(`Updating section: ${sectionId}`);
      
      const response = await fetch('/api/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sectionId, title: title.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update section');
      }

      const updatedSection = await response.json();
      dispatch({ type: 'UPDATE_SECTION', payload: updatedSection });
      console.log('Section updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update section';
      console.error('Failed to update section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log(`Deleting section: ${sectionId}`);
      
      const response = await fetch(`/api/sections?id=${sectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete section');
      }

      dispatch({ type: 'DELETE_SECTION', payload: sectionId });
      console.log('Section deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete section';
      console.error('Failed to delete section:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createPage = useCallback(async (
    sectionId: string, 
    subsectionId?: string, 
    parentPageId?: string, 
    title: string = 'Untitled'
  ) => {
    if (!state.workspace) {
      console.error('No workspace available for page creation');
      throw new Error('No workspace available');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Creating page:', { sectionId, subsectionId, parentPageId, title });
      
      const newPageData = {
        workspaceId: state.workspace.id,
        sectionId,
        subsectionId,
        parentId: parentPageId,
        title: title.trim(),
        icon: '📄',
        type: 'page' as const,
      };

      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const newPage = await response.json();
      console.log('Page created successfully:', newPage);

      // Transform the response to ensure proper format
      const transformedPage = {
        ...newPage,
        parentId: newPage.parentId || newPage.parent_id,
        sectionId: newPage.sectionId || newPage.section_id,
        subsectionId: newPage.subsectionId || newPage.subsection_id,
        workspaceId: newPage.workspaceId || newPage.workspace_id,
        createdAt: new Date(newPage.createdAt || newPage.created_at),
        updatedAt: new Date(newPage.updatedAt || newPage.updated_at),
        content: newPage.content || [],
        children: newPage.children || []
      };

      dispatch({ 
        type: 'ADD_PAGE', 
        payload: { sectionId, subsectionId, page: transformedPage }
      });

      dispatch({ type: 'SET_CURRENT_PAGE', payload: transformedPage });
      console.log('Page creation completed successfully');
    } catch (error) {
      console.error('Failed to create page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create page';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.workspace]);

  const updatePageTitle = useCallback(async (pageId: string, title: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Updating page title:', { pageId, title });
      
      if (!title.trim()) {
        throw new Error('Page title cannot be empty');
      }

      const response = await fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId, title: title.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedPage = await response.json();
      console.log('Page updated successfully:', updatedPage);

      // Transform the response
      const transformedPage = {
        ...updatedPage,
        parentId: updatedPage.parentId || updatedPage.parent_id,
        sectionId: updatedPage.sectionId || updatedPage.section_id,
        subsectionId: updatedPage.subsectionId || updatedPage.subsection_id,
        workspaceId: updatedPage.workspaceId || updatedPage.workspace_id,
        createdAt: new Date(updatedPage.createdAt || updatedPage.created_at),
        updatedAt: new Date(updatedPage.updatedAt || updatedPage.updated_at),
        children: updatedPage.children || []
      };
      
      dispatch({ type: 'UPDATE_PAGE', payload: transformedPage });
      console.log('Page title update completed successfully');
    } catch (error) {
      console.error('Failed to update page title:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update page title';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deletePage = useCallback(async (pageId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Deleting page:', pageId);

      const response = await fetch(`/api/pages?id=${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Page deleted successfully:', result);

      dispatch({ type: 'DELETE_PAGE', payload: { pageId } });
      
      // Clear current page if it was deleted
      if (state.currentPage?.id === pageId) {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: null });
      }
      
      console.log('Page deletion completed successfully');
    } catch (error) {
      console.error('Failed to delete page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete page';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage]);

  const updateBlockContent = useCallback(async (
    pageId: string, 
    blockId: string, 
    content: string, 
    metadata?: any
  ) => {
    try {
      console.log('Updating block:', { blockId, content });
      
      if (!blockId || !pageId) {
        throw new Error('Block ID and Page ID are required');
      }

      const response = await fetch('/api/blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId, content, metadata }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update block');
      }

      const updatedBlock = await response.json();

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
      console.log('Block updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update block';
      console.error('Failed to update block:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.currentPage]);

  const createBlock = useCallback(async (
    pageId: string, 
    type: ContentBlock['type'], 
    content: string = '', 
    metadata: any = {}
  ) => {
    try {
      console.log('Creating block:', { pageId, type });
      
      if (!pageId) {
        throw new Error('Page ID is required');
      }

      if (!state.currentPage || state.currentPage.id !== pageId) {
        throw new Error('Page must be loaded to create blocks');
      }

      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, type, content, metadata }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create block');
      }

      const newBlock = await response.json();

      const updatedContent = [...(state.currentPage.content || []), newBlock];
      const updatedPage = {
        ...state.currentPage,
        content: updatedContent,
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_PAGE', payload: updatedPage });
      dispatch({ type: 'SET_EDITING_BLOCK', payload: newBlock.id });
      console.log('Block created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create block';
      console.error('Failed to create block:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.currentPage]);

  const deleteBlock = useCallback(async (blockId: string) => {
 try {
   console.log('Deleting block:', blockId);
   
   if (!blockId) {
     throw new Error('Block ID is required');
   }

   const response = await fetch(`/api/blocks?id=${blockId}`, {
     method: 'DELETE',
   });

   if (!response.ok) {
     const errorData = await response.json();
     throw new Error(errorData.error || 'Failed to delete block');
   }

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
   
   if (state.editingBlockId === blockId) {
     dispatch({ type: 'SET_EDITING_BLOCK', payload: null });
   }
   
   console.log('Block deleted successfully');
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Failed to delete block';
   console.error('Failed to delete block:', errorMessage);
   dispatch({ type: 'SET_ERROR', payload: errorMessage });
   throw error;
 }
}, [state.currentPage, state.editingBlockId]);

// Nested page operations with enhanced functionality
const nestedPages: NestedPageOperations = {
 getAllPages: () => {
   if (!state.workspace) return [];
   return getAllPages(state.workspace);
 },

 getPageHierarchy: (pageId: string): PageItem[] => {
   const hierarchy: PageItem[] = [];
   
   const findPageInHierarchy = (pages: PageItem[] = [], targetId: string, currentHierarchy: PageItem[]): boolean => {
     for (const page of pages) {
       const newHierarchy = [...currentHierarchy, page];
       
       if (page.id === targetId) {
         hierarchy.push(...newHierarchy);
         return true;
       }
       
       if (page.children && Array.isArray(page.children) && page.children.length > 0) {
         if (findPageInHierarchy(page.children, targetId, newHierarchy)) {
           return true;
         }
       }
     }
     return false;
   };
   
   if (state.workspace) {
     state.workspace.sections.forEach(section => {
       if (section.pages && Array.isArray(section.pages)) {
         findPageInHierarchy(section.pages, pageId, []);
       }
       section.subsections?.forEach(subsection => {
         if (subsection.pages && Array.isArray(subsection.pages)) {
           findPageInHierarchy(subsection.pages, pageId, []);
         }
       });
     });
   }
   
   return hierarchy;
 },

 getChildPages: (parentId: string): PageItem[] => {
   const allPages = nestedPages.getAllPages();
   const parentPage = allPages.find(page => page.id === parentId);
   return (parentPage?.children && Array.isArray(parentPage.children)) ? parentPage.children : [];
 },

 getRootPages: (pages: PageItem[] = []): PageItem[] => {
   return pages.filter(page => !page.parentId);
 },

 getPageDepth: (pageId: string): number => {
   return nestedPages.getPageHierarchy(pageId).length - 1;
 },

 canMovePage: (pageId: string, newParentId?: string): boolean => {
   const allPages = nestedPages.getAllPages();
   return validatePageHierarchy(pageId, newParentId, allPages);
 },

 movePage: async (pageId: string, newParentId?: string, newSectionId?: string, newSubsectionId?: string) => {
   try {
     console.log(`Moving page ${pageId} to parent ${newParentId}`);
     
     if (!nestedPages.canMovePage(pageId, newParentId)) {
       throw new Error('Cannot move page: would create circular reference');
     }

     const response = await fetch('/api/pages', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         id: pageId,
         parentId: newParentId,
         ...(newSectionId && { sectionId: newSectionId }),
         ...(newSubsectionId && { subsectionId: newSubsectionId })
       }),
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.error || 'Failed to move page');
     }

     const updatedPage = await response.json();
     
     // Transform the response
     const transformedPage = {
       ...updatedPage,
       parentId: updatedPage.parentId || updatedPage.parent_id,
       sectionId: updatedPage.sectionId || updatedPage.section_id,
       subsectionId: updatedPage.subsectionId || updatedPage.subsection_id,
       workspaceId: updatedPage.workspaceId || updatedPage.workspace_id,
       createdAt: new Date(updatedPage.createdAt || updatedPage.created_at),
       updatedAt: new Date(updatedPage.updatedAt || updatedPage.updated_at),
       children: (updatedPage.children && Array.isArray(updatedPage.children)) ? updatedPage.children : []
     };

     dispatch({ type: 'UPDATE_PAGE', payload: transformedPage });
     console.log('Page moved successfully');
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Failed to move page';
     console.error('Failed to move page:', errorMessage);
     dispatch({ type: 'SET_ERROR', payload: errorMessage });
     throw error;
   }
 },

 getPageBreadcrumbs: (pageId: string): { id: string; title: string; type: 'section' | 'subsection' | 'page' }[] => {
   if (!state.workspace) return [];
   
   const breadcrumbs: { id: string; title: string; type: 'section' | 'subsection' | 'page' }[] = [];
   const pageLocation = findPageLocation(state.workspace, pageId);
   
   if (pageLocation) {
     breadcrumbs.push({
       id: pageLocation.section.id,
       title: pageLocation.section.title,
       type: 'section'
     });
     
     if (pageLocation.subsection) {
       breadcrumbs.push({
         id: pageLocation.subsection.id,
         title: pageLocation.subsection.title,
         type: 'subsection'
       });
     }
     
     const pageHierarchy = nestedPages.getPageHierarchy(pageId);
     pageHierarchy.forEach(page => {
       breadcrumbs.push({
         id: page.id,
         title: page.title,
         type: 'page'
       });
     });
   }
   
   return breadcrumbs;
 }
};

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
 <WorkspaceContext.Provider value={{ state, dispatch, actions, nestedPages }}>
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

export const useNestedPages = () => {
const context = useContext(WorkspaceContext);
if (!context) {
 throw new Error('useNestedPages must be used within WorkspaceProvider');
}
return context.nestedPages;
};