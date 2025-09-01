import { Workspace, PageItem, ContentBlock, Comment, Section } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL 
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

// Pages API
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

  async createPage(data: {
    workspaceId: string;
    sectionId?: string;
    subsectionId?: string;
    title: string;
    icon?: string;
    type?: 'page' | 'database';
    status?: 'Management' | 'Execution' | 'Inbox';
    assignees?: string[];
    deadline?: string;
    properties?: Record<string, any>;
    parentId?: string;
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
  }): Promise<PageItem> {
    return fetchAPI<PageItem>('/pages', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePage(id: string): Promise<{ success: boolean }> {
    return fetchAPI<{ success: boolean }>(`/pages?id=${id}`, {
      method: 'DELETE',
    });
  },
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
  }): Promise<ContentBlock> {
    return fetchAPI<ContentBlock>('/blocks', {
      method: 'PUT',
      body: JSON.stringify(data),
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

// Utility function to handle API errors gracefully
export function handleAPIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}