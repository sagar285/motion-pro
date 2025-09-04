import { Workspace, PageItem, ContentBlock, Comment, Section } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : '/api';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Workspace API
export const workspaceAPI = {
  async getWorkspace(id: string = 'default'): Promise<Workspace> {
    console.log(`🔍 Fetching workspace: ${id}`);
    return fetchAPI<Workspace>(`/workspaces?id=${id}`);
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    return fetchAPI<Workspace[]>('/workspaces');
  },

  async createWorkspace(data: { 
    name: string; 
    description?: string;
    ownerName?: string;
    ownerEmail?: string;
  }): Promise<Workspace> {
    return fetchAPI<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWorkspace(data: { id: string; name: string; description?: string }): Promise<Workspace> {
    return fetchAPI<Workspace>('/workspaces', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/workspaces?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Sections API
export const sectionsAPI = {
  async getSections(workspaceId: string): Promise<Section[]> {
    return fetchAPI<Section[]>(`/sections?workspaceId=${workspaceId}`);
  },

  async getSection(id: string): Promise<Section> {
    return fetchAPI<Section>(`/sections?id=${id}`);
  },

  async createSection(data: {
    workspaceId: string;
    title: string;
    icon?: string;
    order?: number;
  }): Promise<Section> {
    return fetchAPI<Section>('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSection(data: {
    id: string;
    title?: string;
    icon?: string;
    order?: number;
  }): Promise<Section> {
    return fetchAPI<Section>('/sections', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSection(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/sections?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Enhanced Pages API with full nested page support
export const pagesAPI = {
  async getPage(id: string): Promise<PageItem> {
    return fetchAPI<PageItem>(`/pages?id=${id}`);
  },

  async getPagesBySection(sectionId: string): Promise<PageItem[]> {
    return fetchAPI<PageItem[]>(`/pages?sectionId=${sectionId}`);
  },

  async getPagesBySubsection(subsectionId: string): Promise<PageItem[]> {
    return fetchAPI<PageItem[]>(`/pages?subsectionId=${subsectionId}`);
  },

  async getChildPages(parentId: string): Promise<PageItem[]> {
    return fetchAPI<PageItem[]>(`/pages?parentId=${parentId}`);
  },

  async createPage(data: {
    workspaceId: string;
    sectionId?: string;
    subsectionId?: string;
    parentId?: string; // Support for nested pages
    title: string;
    icon?: string;
    type?: 'page' | 'database';
    status?: 'Management' | 'Execution' | 'Inbox';
    assignees?: string[];
    deadline?: string;
    properties?: Record<string, any>;
    order?: number; // Page order within parent/section
  }): Promise<PageItem> {
    return fetchAPI<PageItem>('/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePage(data: {
    id: string;
    title?: string;
    icon?: string;
    type?: 'page' | 'database';
    status?: 'Management' | 'Execution' | 'Inbox';
    assignees?: string[];
    deadline?: string;
    properties?: Record<string, any>;
    parentId?: string; // Allow changing parent
    order?: number; // Allow reordering
  }): Promise<PageItem> {
    return fetchAPI<PageItem>('/pages', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async movePage(data: {
    pageId: string;
    newParentId?: string;
    newSectionId?: string;
    newSubsectionId?: string;
    newOrder?: number;
  }): Promise<PageItem> {
    return fetchAPI<PageItem>('/pages/move', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePage(id: string, options?: {
    deleteChildren?: boolean; // Default true - delete all child pages
  }): Promise<{ success: boolean; deletedCount: number }> {
    const params = new URLSearchParams({ id });
    if (options?.deleteChildren !== undefined) {
      params.append('deleteChildren', options.deleteChildren.toString());
    }
    
    return fetchAPI<{ success: boolean; deletedCount: number }>(`/pages?${params}`, {
      method: 'DELETE',
    });
  },

  async duplicatePage(id: string, options?: {
    includeChildren?: boolean; // Default false
    newParentId?: string;
    newTitle?: string;
  }): Promise<PageItem> {
    return fetchAPI<PageItem>('/pages/duplicate', {
      method: 'POST',
      body: JSON.stringify({
        pageId: id,
        ...options
      }),
    });
  },

  async getPageHierarchy(pageId: string): Promise<{
    ancestors: PageItem[];
    page: PageItem;
    children: PageItem[];
    siblings: PageItem[];
  }> {
    return fetchAPI(`/pages/${pageId}/hierarchy`);
  },

  async reorderPages(data: {
    parentId?: string; // null for root pages
    sectionId?: string;
    subsectionId?: string;
    pageIds: string[]; // Array of page IDs in new order
  }): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>('/pages/reorder', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

// Content Blocks API
export const blocksAPI = {
  async getBlocks(pageId: string): Promise<ContentBlock[]> {
    return fetchAPI<ContentBlock[]>(`/blocks?pageId=${pageId}`);
  },

  async getBlock(id: string): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>(`/blocks?id=${id}`);
  },

  async createBlock(data: {
    pageId: string;
    type: ContentBlock['type'];
    content?: string;
    metadata?: Record<string, any>;
    order?: number;
    insertAfter?: string;
    parentBlockId?: string; // For nested blocks
  }): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>('/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBlock(data: {
    id: string;
    content?: string;
    type?: ContentBlock['type'];
    metadata?: Record<string, any>;
    order?: number;
    parentBlockId?: string;
  }): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>('/blocks', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async moveBlock(data: {
    blockId: string;
    newPageId?: string;
    newParentBlockId?: string;
    newOrder: number;
  }): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>('/blocks/move', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateBlock(id: string, options?: {
    newPageId?: string;
    insertAfter?: string;
  }): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>('/blocks/duplicate', {
      method: 'POST',
      body: JSON.stringify({
        blockId: id,
        ...options
      }),
    });
  },

  async deleteBlock(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/blocks?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Comments API  
export const commentsAPI = {
  async getComments(pageId: string): Promise<Comment[]> {
    return fetchAPI<Comment[]>(`/comments?pageId=${pageId}`);
  },

  async getComment(id: string): Promise<Comment> {
    return fetchAPI<Comment>(`/comments?id=${id}`);
  },

  async createComment(data: {
    pageId: string;
    userId: string;
    content: string;
    parentCommentId?: string; // For reply threads
  }): Promise<Comment> {
    return fetchAPI<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateComment(data: {
    id: string;
    content: string;
  }): Promise<Comment> {
    return fetchAPI<Comment>('/comments', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteComment(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/comments?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// File Upload API for pages and blocks
export const filesAPI = {
  async uploadPageFile(pageId: string, file: File): Promise<{
    id: string;
    originalName: string;
    storedName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageId', pageId);

    const response = await fetch(`${API_BASE_URL}/files/pages`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  },

  async uploadBlockFile(blockId: string, file: File): Promise<{
    id: string;
    originalName: string;
    storedName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('blockId', blockId);

    const response = await fetch(`${API_BASE_URL}/files/blocks`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  },

  async deleteFile(fileId: string, type: 'page' | 'block'): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/files/${type}s?id=${fileId}`, {
      method: 'DELETE',
    });
  },

  async getFileUrl(fileId: string, type: 'page' | 'block'): Promise<{ url: string }> {
    return fetchAPI<{ url: string }>(`/files/${type}s/${fileId}/url`);
  }
};

// Search API for pages and content
export const searchAPI = {
  async searchPages(query: string, options?: {
    workspaceId?: string;
    sectionId?: string;
    subsectionId?: string;
    parentId?: string;
    includeContent?: boolean;
    limit?: number;
  }): Promise<{
    pages: (PageItem & { 
      relevanceScore: number;
      matchedContent?: string[];
      breadcrumbs: { id: string; title: string; type: string }[];
    })[];
    totalCount: number;
  }> {
    const params = new URLSearchParams({
      q: query,
      ...options && Object.entries(options)
        .filter(([_, value]) => value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})
    });

    return fetchAPI(`/search/pages?${params}`);
  },

  async searchContent(query: string, options?: {
    workspaceId?: string;
    blockTypes?: ContentBlock['type'][];
    limit?: number;
  }): Promise<{
    results: {
      blockId: string;
      pageId: string;
      pageTitle: string;
      blockType: string;
      content: string;
      relevanceScore: number;
      context: string;
    }[];
    totalCount: number;
  }> {
    return fetchAPI('/search/content', {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...options
      }),
    });
  }
};

// Analytics API for usage tracking
export const analyticsAPI = {
  async getPageViews(pageId: string, timeRange?: string): Promise<{
    views: { date: string; count: number }[];
    totalViews: number;
  }> {
    const params = new URLSearchParams({ pageId });
    if (timeRange) params.append('timeRange', timeRange);
    
    return fetchAPI(`/analytics/page-views?${params}`);
  },

  async getWorkspaceActivity(workspaceId: string, timeRange?: string): Promise<{
    activity: {
      date: string;
      pagesCreated: number;
      pagesEdited: number;
      blocksCreated: number;
      comments: number;
    }[];
  }> {
    const params = new URLSearchParams({ workspaceId });
    if (timeRange) params.append('timeRange', timeRange);
    
    return fetchAPI(`/analytics/workspace-activity?${params}`);
  }
};

// Utility function to handle API errors gracefully
export function handleAPIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Helper functions for nested page operations
export const nestedPageHelpers = {
  // Validate if a page can be moved to a new parent (prevents circular references)
  canMovePage: async (pageId: string, newParentId?: string): Promise<boolean> => {
    if (!newParentId) return true; // Root pages are always valid
    if (pageId === newParentId) return false; // Can't be parent of itself
    
    try {
      const hierarchy = await pagesAPI.getPageHierarchy(pageId);
      const childrenIds = getAllChildrenIds(hierarchy.children);
      return !childrenIds.includes(newParentId);
    } catch {
      return false;
    }
  },

  // Get all descendant page IDs
  getAllDescendantIds: (pages: PageItem[]): string[] => {
    const ids: string[] = [];
    pages.forEach(page => {
      ids.push(page.id);
      // This would need to be implemented recursively in the actual use case
      // For now, we'll assume children are provided
    });
    return ids;
  },

  // Calculate page depth in hierarchy
  calculatePageDepth: (ancestors: PageItem[]): number => {
    return ancestors.length;
  },

  // Generate breadcrumb path for a page
  generateBreadcrumbs: (
    sectionTitle: string, 
    subsectionTitle: string | undefined,
    ancestors: PageItem[]
  ): string => {
    const parts = [sectionTitle];
    if (subsectionTitle) parts.push(subsectionTitle);
    parts.push(...ancestors.map(page => page.title));
    return parts.join(' / ');
  }
};

// Helper to get all children IDs recursively
function getAllChildrenIds(pages: PageItem[]): string[] {
  const ids: string[] = [];
  pages.forEach(page => {
    ids.push(page.id);
    // In a real implementation, this would recursively get children
    // For now, assuming the hierarchy is already flattened
  });
  return ids;
}