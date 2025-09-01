// hooks/useNestedPages.ts
import { useState, useCallback } from 'react';

export interface NestedPage {
  id: string;
  title: string;
  icon: string;
  type: 'page' | 'database';
  status?: 'Management' | 'Execution' | 'Inbox';
  assignees: string[];
  deadline?: string;
  properties: Record<string, any>;
  parentId?: string;
  pageOrder: number;
  workspaceId: string;
  sectionId?: string;
  subsectionId?: string;
  createdAt: string;
  updatedAt: string;
  content: ContentBlock[];
  files: FileAttachment[];
  nestedPages: NestedPage[];
}

export interface ContentBlock {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, any>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  originalName: string;
  storedName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseNestedPagesReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Page operations
  createNestedPage: (pageData: Partial<NestedPage>) => Promise<NestedPage | null>;
  updatePage: (pageId: string, updates: Partial<NestedPage>, updateFilenames?: boolean) => Promise<NestedPage | null>;
  deletePage: (pageId: string) => Promise<boolean>;
  duplicatePage: (pageId: string, newTitle?: string, newParentId?: string) => Promise<NestedPage | null>;
  
  // Bulk operations
  reorderPages: (pageIds: string[], parentId?: string) => Promise<boolean>;
  movePages: (pageIds: string[], newParentId?: string, newSectionId?: string, newSubsectionId?: string) => Promise<boolean>;
  bulkUpdateFilenames: (updates: Array<{ pageId: string; newTitle: string }>) => Promise<boolean>;
  
  // Utility functions
  getPagePath: (page: NestedPage, allPages: NestedPage[]) => string[];
  flattenPages: (pages: NestedPage[]) => NestedPage[];
  findPageById: (pages: NestedPage[], pageId: string) => NestedPage | null;
}

export function useNestedPages(): UseNestedPagesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, operation: string) => {
    const message = err?.message || `Failed to ${operation}`;
    setError(message);
    console.error(`❌ ${operation} failed:`, err);
  }, []);

  const createNestedPage = useCallback(async (pageData: Partial<NestedPage>): Promise<NestedPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Created nested page:', result.title);
      return result;
    } catch (err) {
      handleError(err, 'create page');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updatePage = useCallback(async (
    pageId: string, 
    updates: Partial<NestedPage>, 
    updateFilenames: boolean = true
  ): Promise<NestedPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId, ...updates, updateFilenames }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Updated page:', result.title);
      return result;
    } catch (err) {
      handleError(err, 'update page');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deletePage = useCallback(async (pageId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/workspaces/pages?id=${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Deleted page and nested pages:', result.message);
      return true;
    } catch (err) {
      handleError(err, 'delete page');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const duplicatePage = useCallback(async (
    pageId: string, 
    newTitle?: string, 
    newParentId?: string
  ): Promise<NestedPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'duplicate',
          data: { pageId, newTitle, newParentId }
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Duplicated page:', result.duplicatedPage);
      return result.duplicatedPage;
    } catch (err) {
      handleError(err, 'duplicate page');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const reorderPages = useCallback(async (pageIds: string[], parentId?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'reorder',
          data: { pageIds, parentId }
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Reordered pages:', result.message);
      return true;
    } catch (err) {
      handleError(err, 'reorder pages');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const movePages = useCallback(async (
    pageIds: string[], 
    newParentId?: string, 
    newSectionId?: string, 
    newSubsectionId?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'move',
          data: { pageIds, newParentId, newSectionId, newSubsectionId }
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Moved pages:', result.message);
      return true;
    } catch (err) {
      handleError(err, 'move pages');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const bulkUpdateFilenames = useCallback(async (
    updates: Array<{ pageId: string; newTitle: string }>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/pages/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'bulk_update_filenames',
          data: { updates }
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      console.log('✅ Bulk updated filenames:', result.message);
      return true;
    } catch (err) {
      handleError(err, 'bulk update filenames');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Utility function to get page path (breadcrumb)
  const getPagePath = useCallback((page: NestedPage, allPages: NestedPage[]): string[] => {
    const path: string[] = [];
    let currentPage: NestedPage | null = page;
    
    while (currentPage) {
      path.unshift(currentPage.title);
      currentPage = currentPage.parentId 
        ? findPageById(allPages, currentPage.parentId) 
        : null;
    }
    
    return path;
  }, []);

  // Utility function to flatten nested pages
  const flattenPages = useCallback((pages: NestedPage[]): NestedPage[] => {
    const flattened: NestedPage[] = [];
    
    function traverse(pageList: NestedPage[]) {
      for (const page of pageList) {
        flattened.push(page);
        if (page.nestedPages && page.nestedPages.length > 0) {
          traverse(page.nestedPages);
        }
      }
    }
    
    traverse(pages);
    return flattened;
  }, []);

  // Utility function to find page by ID
  const findPageById = useCallback((pages: NestedPage[], pageId: string): NestedPage | null => {
    for (const page of pages) {
      if (page.id === pageId) return page;
      
      if (page.nestedPages && page.nestedPages.length > 0) {
        const found = findPageById(page.nestedPages, pageId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  return {
    loading,
    error,
    createNestedPage,
    updatePage,
    deletePage,
    duplicatePage,
    reorderPages,
    movePages,
    bulkUpdateFilenames,
    getPagePath,
    flattenPages,
    findPageById,
  };
}