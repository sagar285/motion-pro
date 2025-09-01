// lib/fileUtils.ts
import { getConnection } from "@/lib/database";
import type { RowDataPacket } from "mysql2";

export interface FileMetadata {
  id: string;
  originalName: string;
  storedName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  uploadedBy?: string;
  pageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileUpdateResult {
  success: boolean;
  updatedFiles: number;
  errors: string[];
}

// Sanitize filename for safe storage
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // Allow dots for extensions
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase()
    .substring(0, 100); // Reasonable length limit
}

// Generate unique filename with timestamp
export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const nameParts = sanitized.split('.');
  const extension = nameParts.pop();
  const nameWithoutExt = nameParts.join('.');
  
  const finalName = prefix 
    ? `${sanitizeFileName(prefix)}_${nameWithoutExt}_${timestamp}_${random}`
    : `${nameWithoutExt}_${timestamp}_${random}`;
    
  return extension ? `${finalName}.${extension}` : finalName;
}

// Update all filenames related to a page when title changes
export async function updatePageFilenames(pageId: string, newPageTitle: string): Promise<FileUpdateResult> {
  const db = await getConnection();
  const errors: string[] = [];
  let updatedFiles = 0;

  try {
    const sanitizedPageName = sanitizeFileName(newPageTitle);

    // Update content blocks with file references
    const [blockRows] = (await db.execute(
      `SELECT id, type, metadata FROM content_blocks 
       WHERE page_id = ? AND type IN ('image', 'file', 'attachment')`,
      [pageId]
    )) as [RowDataPacket[], any];

    for (const block of blockRows) {
      try {
        const metadata = JSON.parse(block.metadata || '{}');
        
        if (metadata.originalFileName) {
          const extension = metadata.originalFileName.split('.').pop();
          metadata.suggestedFileName = `${sanitizedPageName}.${extension}`;
          metadata.lastTitleUpdate = new Date().toISOString();
          metadata.pageTitle = newPageTitle;

          await db.execute(
            `UPDATE content_blocks SET metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [JSON.stringify(metadata), block.id]
          );
          
          updatedFiles++;
        }
      } catch (error) {
        errors.push(`Failed to update content block ${block.id}: ${error}`);
      }
    }

    // Update page_files table
    const [fileRows] = (await db.execute(
      'SELECT * FROM page_files WHERE page_id = ?',
      [pageId]
    )) as [RowDataPacket[], any];

    for (const file of fileRows) {
      try {
        const newStoredName = generateUniqueFileName(file.original_name, sanitizedPageName);
        
        await db.execute(
          'UPDATE page_files SET stored_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStoredName, file.id]
        );
        
        updatedFiles++;
      } catch (error) {
        errors.push(`Failed to update file ${file.id}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      updatedFiles,
      errors
    };
  } catch (error) {
    errors.push(`Database error: ${error}`);
    return {
      success: false,
      updatedFiles,
      errors
    };
  }
}

// Get all files associated with a page and its nested pages
export async function getPageFilesRecursively(pageId: string): Promise<FileMetadata[]> {
  const db = await getConnection();
  const files: FileMetadata[] = [];

  try {
    // Get files for current page
    const [fileRows] = (await db.execute(
      'SELECT * FROM page_files WHERE page_id = ? ORDER BY created_at DESC',
      [pageId]
    )) as [RowDataPacket[], any];

    files.push(...fileRows.map((file: any) => ({
      id: file.id,
      originalName: file.original_name,
      storedName: file.stored_name,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      filePath: file.file_path,
      uploadedBy: file.uploaded_by,
      pageId: file.page_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    })));

    // Get files from nested pages
    const [childPages] = (await db.execute(
      'SELECT id FROM pages WHERE parent_id = ?',
      [pageId]
    )) as [RowDataPacket[], any];

    for (const child of childPages) {
      const childFiles = await getPageFilesRecursively(child.id);
      files.push(...childFiles);
    }

    return files;
  } catch (error) {
    console.error('Error getting page files:', error);
    return [];
  }
}

// Clean up orphaned files (files not referenced by any pages)
export async function cleanupOrphanedFiles(): Promise<{ deletedFiles: number; errors: string[] }> {
  const db = await getConnection();
  const errors: string[] = [];

  try {
    // Find files not referenced by any existing pages
    const [orphanedFiles] = (await db.execute(
      `SELECT pf.* FROM page_files pf
       LEFT JOIN pages p ON pf.page_id = p.id
       WHERE p.id IS NULL`
    )) as [RowDataPacket[], any];

    let deletedCount = 0;

    for (const file of orphanedFiles) {
      try {
        // Delete from database
        await db.execute('DELETE FROM page_files WHERE id = ?', [file.id]);
        deletedCount++;
        
        // TODO: Also delete actual file from storage system
        // This would depend on your file storage implementation
      } catch (error) {
        errors.push(`Failed to delete orphaned file ${file.id}: ${error}`);
      }
    }

    return {
      deletedFiles: deletedCount,
      errors
    };
  } catch (error) {
    errors.push(`Database error during cleanup: ${error}`);
    return {
      deletedFiles: 0,
      errors
    };
  }
}

// Validate file type and size
export function validateFile(file: File, maxSizeBytes: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`
    };
  }

  // Check for potentially dangerous file types
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'com', 'pif', 'vbs', 'js', 'jar', 'app'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension && dangerousExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed for security reasons`
    };
  }

  return { valid: true };
}

// Get file statistics for a workspace
export async function getWorkspaceFileStats(workspaceId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  recentFiles: FileMetadata[];
}> {
  const db = await getConnection();

  try {
    // Get all files in workspace
    const [fileRows] = (await db.execute(
      `SELECT pf.*, p.title as page_title
       FROM page_files pf
       JOIN pages p ON pf.page_id = p.id
       WHERE p.workspace_id = ?
       ORDER BY pf.created_at DESC`,
      [workspaceId]
    )) as [RowDataPacket[], any];

    const totalFiles = fileRows.length;
    const totalSize = fileRows.reduce((sum: number, file: any) => sum + file.file_size, 0);
    
    // Count file types
    const fileTypes: Record<string, number> = {};
    fileRows.forEach((file: any) => {
      const extension = file.original_name.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    });

    // Get recent files (last 10)
    const recentFiles: FileMetadata[] = fileRows.slice(0, 10).map((file: any) => ({
      id: file.id,
      originalName: file.original_name,
      storedName: file.stored_name,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      filePath: file.file_path,
      uploadedBy: file.uploaded_by,
      pageId: file.page_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    }));

    return {
      totalFiles,
      totalSize,
      fileTypes,
      recentFiles
    };
  } catch (error) {
    console.error('Error getting workspace file stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      recentFiles: []
    };
  }
}