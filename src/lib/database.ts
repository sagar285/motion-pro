// lib/database.ts
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

let connection: mysql.Connection | null = null;

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'auth-db981.hstgr.io',
  user: process.env.DB_USER || 'u925328211_server',
  password: process.env.DB_PASSWORD || 'Aman123@f24tech24',
  database: process.env.DB_NAME || 'u925328211_server',
  port: parseInt(process.env.DB_PORT || '3306'),
};

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return connection;
}

// Create notification-related tables
export async function createNotificationTables(): Promise<void> {
  const db = await getConnection();

  // Create notifications table
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      user_id INT NOT NULL,
      workspace_id VARCHAR(36),
      type ENUM(
        'workspace_created',
        'workspace_updated', 
        'workspace_deleted',
        'page_created',
        'page_updated',
        'page_deleted',
        'section_created',
        'section_updated',
        'section_deleted',
        'member_added',
        'member_removed',
        'comment_added',
        'assignment_changed'
      ) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      metadata JSON,
      is_read BOOLEAN DEFAULT FALSE,
      is_email_sent BOOLEAN DEFAULT FALSE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_workspace_id (workspace_id),
      INDEX idx_type (type),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    )
  `;
  
  await db.execute(createNotificationsTable);
  console.log('✅ Notifications table created or already exists');

  // Create notification preferences table
  const createNotificationPreferencesTable = `
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      email_notifications BOOLEAN DEFAULT TRUE,
      workspace_changes BOOLEAN DEFAULT TRUE,
      page_changes BOOLEAN DEFAULT TRUE,
      comments BOOLEAN DEFAULT TRUE,
      assignments BOOLEAN DEFAULT TRUE,
      daily_digest BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    )
  `;
  
  await db.execute(createNotificationPreferencesTable);
  console.log('✅ Notification preferences table created or already exists');

  // Create notification batches table
  const createNotificationBatchesTable = `
    CREATE TABLE IF NOT EXISTS notification_batches (
      id VARCHAR(36) PRIMARY KEY,
      workspace_id VARCHAR(36),
      batch_type ENUM('immediate', 'daily_digest', 'weekly_summary') DEFAULT 'immediate',
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      total_notifications INT DEFAULT 0,
      processed_notifications INT DEFAULT 0,
      error_message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      INDEX idx_workspace_id (workspace_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `;
  
  await db.execute(createNotificationBatchesTable);
  console.log('✅ Notification batches table created or already exists');
}

// Migration function to add missing columns to existing tables
export async function migrateExistingTables(): Promise<void> {
  const db = await getConnection();
  
  try {
    console.log('🔄 Checking for required database migrations...');
    
    // Check if parent_id column exists in pages table
    const [parentIdColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'parent_id'
    `, [dbConfig.database]) as any[];
    
    if (parentIdColumns.length === 0) {
      console.log('➕ Adding parent_id column to pages table...');
      await db.execute(`
        ALTER TABLE pages 
        ADD COLUMN parent_id VARCHAR(36) DEFAULT NULL AFTER subsection_id
      `);
      
      // Add index for parent_id
      await db.execute(`
        ALTER TABLE pages 
        ADD INDEX idx_parent_id (parent_id)
      `);
      
      // Add foreign key constraint
      await db.execute(`
        ALTER TABLE pages 
        ADD CONSTRAINT fk_pages_parent 
        FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE
      `);
      
      console.log('✅ parent_id column added successfully');
    } else {
      console.log('✅ parent_id column already exists');
    }
    
    // Check if page_order column exists in pages table
    const [orderColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'page_order'
    `, [dbConfig.database]) as any[];
    
    if (orderColumns.length === 0) {
      console.log('➕ Adding page_order column to pages table...');
      await db.execute(`
        ALTER TABLE pages 
        ADD COLUMN page_order INT NOT NULL DEFAULT 0 AFTER properties
      `);
      
      // Add index for page_order
      await db.execute(`
        ALTER TABLE pages 
        ADD INDEX idx_page_order (page_order)
      `);
      
      console.log('✅ page_order column added successfully');
    } else {
      console.log('✅ page_order column already exists');
    }
    
    // Check if page_files table exists
    const [pageFilesTables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'page_files'
    `, [dbConfig.database]) as any[];
    
    if (pageFilesTables.length === 0) {
      console.log('➕ Creating page_files table...');
      const createPageFilesTable = `
        CREATE TABLE page_files (
          id VARCHAR(36) PRIMARY KEY,
          page_id VARCHAR(36) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          stored_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_path TEXT NOT NULL,
          uploaded_by VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES workspace_members(id) ON DELETE SET NULL,
          INDEX idx_page_id (page_id),
          INDEX idx_original_name (original_name),
          INDEX idx_uploaded_by (uploaded_by)
        )
      `;
      
      await db.execute(createPageFilesTable);
      console.log('✅ page_files table created successfully');
    } else {
      console.log('✅ page_files table already exists');
    }
    
    console.log('🎉 Database migration completed successfully');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

// NEW: Migration function specifically for notification system
export async function migrateNotificationSystem(): Promise<void> {
  const db = await getConnection();
  
  try {
    console.log('🔄 Checking for notification system migrations...');
    
    // Check if notifications table exists
    const [notificationTables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [dbConfig.database]) as any[];
    
    if (notificationTables.length === 0) {
      console.log('➕ Creating notification system tables...');
      await createNotificationTables();
      console.log('✅ Notification system tables created successfully');
    } else {
      console.log('✅ Notification system tables already exist');
      
      // Check if we need to migrate existing notification table structure
      const [notificationColumns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
      `, [dbConfig.database]) as any[];
      
      const existingColumns = notificationColumns.map((col: any) => col.COLUMN_NAME);
      const requiredColumns = ['id', 'user_id', 'workspace_id', 'type', 'title', 'message', 'metadata', 'is_read', 'is_email_sent', 'created_by', 'created_at', 'read_at'];
      
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column)) {
          console.log(`➕ Adding missing column: ${column}`);
          // Add column based on type
          switch (column) {
            case 'workspace_id':
              await db.execute(`ALTER TABLE notifications ADD COLUMN workspace_id VARCHAR(36) AFTER user_id`);
              break;
            case 'metadata':
              await db.execute(`ALTER TABLE notifications ADD COLUMN metadata JSON AFTER message`);
              break;
            case 'is_email_sent':
              await db.execute(`ALTER TABLE notifications ADD COLUMN is_email_sent BOOLEAN DEFAULT FALSE AFTER is_read`);
              break;
            case 'created_by':
              await db.execute(`ALTER TABLE notifications ADD COLUMN created_by INT AFTER is_email_sent`);
              break;
            case 'read_at':
              await db.execute(`ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP NULL AFTER created_at`);
              break;
          }
        }
      }
    }
    
    console.log('🎉 Notification system migration completed successfully');
    
  } catch (error) {
    console.error('❌ Notification system migration failed:', error);
    throw error;
  }
}

// Auto-setup database and tables
export async function setupDatabase(): Promise<mysql.Connection> {
  let tempConnection: mysql.Connection | null = null;
  
  try {
    // Connect without specifying database to create it if needed
    const tempConfig = { ...dbConfig };
    delete (tempConfig as any).database;
    
    tempConnection = await mysql.createConnection(tempConfig);
    
    // Create database if not exists
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`Database ${dbConfig.database} created or already exists`);
    
    // Close temp connection and create main connection
    await tempConnection.end();
    connection = await mysql.createConnection(dbConfig);
    
    // Create all required tables
    await createAuthTables();
    await createWorkspaceTables();
    await createNotificationTables(); // Add this line
    await ensureDefaultWorkspace();
    
    console.log('✅ All tables created and default workspace ensured');
    return connection;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    if (tempConnection) {
      await tempConnection.end();
    }
    throw error;
  }
}

// Create authentication-related tables
async function createAuthTables(): Promise<void> {
  const db = await getConnection();

  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      password VARCHAR(255) NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      reset_token VARCHAR(255),
      reset_token_expires DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_reset_token (reset_token)
    )
  `;
  
  await db.execute(createUsersTable);
  console.log('✅ Users table created or already exists');
  
  // Create OTP table
  const createOtpTable = `
    CREATE TABLE IF NOT EXISTS otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      type ENUM('verification', 'password_reset') DEFAULT 'verification',
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_type (email, type),
      INDEX idx_expires (expires_at)
    )
  `;
  
  await db.execute(createOtpTable);
  console.log('✅ OTP table created or already exists');
  
  // Create sessions table
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_session_token (session_token),
      INDEX idx_user_id (user_id)
    )
  `;
  
  await db.execute(createSessionsTable);
  console.log('✅ Sessions table created or already exists');

  // Create login attempts table
  const createLoginAttemptTable = `
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      success BOOLEAN NOT NULL,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_ip_address (ip_address)
    )
  `;
  
  await db.execute(createLoginAttemptTable);
  console.log('✅ Login attempts table created or already exists');
}

// Create Motion-Pro workspace-related tables
async function createWorkspaceTables(): Promise<void> {
  const db = await getConnection();

  // Create workspaces table
  const createWorkspacesTable = `
    CREATE TABLE IF NOT EXISTS workspaces (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      owner_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_owner_id (owner_id)
    )
  `;
  
  await db.execute(createWorkspacesTable);
  console.log('✅ Workspaces table created or already exists');

  // Create workspace members table
  const createWorkspaceMembersTable = `
    CREATE TABLE IF NOT EXISTS workspace_members (
      id VARCHAR(36) PRIMARY KEY,
      workspace_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      avatar TEXT,
      role ENUM('owner', 'admin', 'member', 'guest') DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      UNIQUE KEY unique_workspace_email (workspace_id, email),
      INDEX idx_workspace_id (workspace_id),
      INDEX idx_email (email)
    )
  `;
  
  await db.execute(createWorkspaceMembersTable);
  console.log('✅ Workspace members table created or already exists');

  // Create sections table
  const createSectionsTable = `
    CREATE TABLE IF NOT EXISTS sections (
      id VARCHAR(36) PRIMARY KEY,
      workspace_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      icon VARCHAR(50) NOT NULL DEFAULT '📁',
      section_order INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      INDEX idx_workspace_id (workspace_id),
      INDEX idx_order (section_order)
    )
  `;
  
  await db.execute(createSectionsTable);
  console.log('✅ Sections table created or already exists');

  // Create subsections table
  const createSubsectionsTable = `
    CREATE TABLE IF NOT EXISTS subsections (
      id VARCHAR(36) PRIMARY KEY,
      section_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      subsection_order INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      INDEX idx_section_id (section_id),
      INDEX idx_order (subsection_order)
    )
  `;
  
  await db.execute(createSubsectionsTable);
  console.log('✅ Subsections table created or already exists');

  // Create pages table with nested page support
  const createPagesTable = `
    CREATE TABLE IF NOT EXISTS pages (
      id VARCHAR(36) PRIMARY KEY,
      workspace_id VARCHAR(36) NOT NULL,
      section_id VARCHAR(36),
      subsection_id VARCHAR(36),
      parent_id VARCHAR(36), -- For nested pages
      title VARCHAR(255) NOT NULL,
      icon VARCHAR(50) NOT NULL DEFAULT '📄',
      type ENUM('page', 'database') DEFAULT 'page',
      status ENUM('Management', 'Execution', 'Inbox'),
      assignees JSON,
      deadline VARCHAR(50),
      properties JSON,
      page_order INT NOT NULL DEFAULT 0, -- For ordering pages within same parent
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (subsection_id) REFERENCES subsections(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE, -- Self-referencing for nesting
      INDEX idx_workspace_id (workspace_id),
      INDEX idx_section_id (section_id),
      INDEX idx_subsection_id (subsection_id),
      INDEX idx_parent_id (parent_id), -- For nested page queries
      INDEX idx_page_order (page_order), -- For ordering
      INDEX idx_type (type),
      INDEX idx_status (status)
    )
  `;
  
  await db.execute(createPagesTable);
  console.log('✅ Pages table created or already exists');

  // Enhanced content blocks table with more block types
  const createContentBlocksTable = `
    CREATE TABLE IF NOT EXISTS content_blocks (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      type ENUM(
        'text', 
        'heading1', 
        'heading2', 
        'heading3', 
        'bullet', 
        'numbered', 
        'quote', 
        'code', 
        'divider', 
        'image', 
        'table', 
        'checklist',
        'advanced_table',
        'nested_list',
        'dropdown_list',
        'dropdown_table',
        'file_attachment',
        'embed',
        'callout',
        'toggle',
        'column_layout',
        'database_view'
      ) NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      metadata JSON,
      block_order INT NOT NULL DEFAULT 0,
      parent_block_id VARCHAR(36), -- For nested blocks like toggles
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_block_id) REFERENCES content_blocks(id) ON DELETE CASCADE,
      INDEX idx_page_id (page_id),
      INDEX idx_order (block_order),
      INDEX idx_type (type),
      INDEX idx_parent_block (parent_block_id)
    )
  `;
  
  await db.execute(createContentBlocksTable);
  console.log('✅ Content blocks table created or already exists');

  // Create comments table
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES workspace_members(id) ON DELETE CASCADE,
      INDEX idx_page_id (page_id),
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    )
  `;
  
  await db.execute(createCommentsTable);
  console.log('✅ Comments table created or already exists');

  // Create page_files table for tracking file attachments
  const createPageFilesTable = `
    CREATE TABLE IF NOT EXISTS page_files (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES workspace_members(id) ON DELETE SET NULL,
      INDEX idx_page_id (page_id),
      INDEX idx_original_name (original_name),
      INDEX idx_uploaded_by (uploaded_by)
    )
  `;
  
  await db.execute(createPageFilesTable);
  console.log('✅ Page files table created or already exists');

  // Create block_files table for file attachments within blocks
  const createBlockFilesTable = `
    CREATE TABLE IF NOT EXISTS block_files (
      id VARCHAR(36) PRIMARY KEY,
      block_id VARCHAR(36) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      uploaded_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (block_id) REFERENCES content_blocks(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES workspace_members(id) ON DELETE SET NULL,
      INDEX idx_block_id (block_id),
      INDEX idx_mime_type (mime_type),
      INDEX idx_uploaded_by (uploaded_by)
    )
  `;
  
  await db.execute(createBlockFilesTable);
  console.log('✅ Block files table created or already exists');
}

// Ensure default workspace exists
export async function ensureDefaultWorkspace(): Promise<void> {
  const db = await getConnection();
  
  try {
    const workspaceId = 'default-workspace';
    
    // Check if default workspace specifically exists
    const [existingWorkspace] = await db.execute(
      'SELECT id FROM workspaces WHERE id = ?',
      [workspaceId]
    ) as any[];
    
    if (existingWorkspace.length > 0) {
      console.log('📦 Default workspace already exists');
      return;
    }

    console.log('🌱 Creating default Motion-Pro workspace...');
    
    // Create default workspace with fixed ID
    await db.execute(
      'INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)',
      [workspaceId, 'Motion-Pro Workspace', 'Default workspace for Motion-Pro dashboard']
    );
    console.log('✅ Default workspace created');

    // Create workspace members
    const member1Id = generateUUID();
    const member2Id = generateUUID();
    
    await db.execute(`
      INSERT INTO workspace_members (id, workspace_id, name, email, role) VALUES 
      (?, ?, 'Allan', 'allan@motionpro.com', 'owner'),
      (?, ?, 'Sagar Gupta', 'sagar@motionpro.com', 'admin')
    `, [member1Id, workspaceId, member2Id, workspaceId]);
    console.log('✅ Default workspace members created');

    // Create sections
    const sections = [
      { id: generateUUID(), title: 'Company Overview', icon: '🏢', order: 1 },
      { id: generateUUID(), title: 'Marketing', icon: '📈', order: 2 },
      { id: generateUUID(), title: 'BD & Sales', icon: '💼', order: 3 },
      { id: generateUUID(), title: 'HR & Operation', icon: '👥', order: 4 }
    ];

    for (const section of sections) {
      await db.execute(
        'INSERT INTO sections (id, workspace_id, title, icon, section_order) VALUES (?, ?, ?, ?, ?)',
        [section.id, workspaceId, section.title, section.icon, section.order]
      );

      // Create default subsections for each section
      const subsections = [
        { id: generateUUID(), title: 'Management', order: 1 },
        { id: generateUUID(), title: 'Execution', order: 2 },
        { id: generateUUID(), title: 'Inbox', order: 3 }
      ];

      for (const subsection of subsections) {
        await db.execute(
          'INSERT INTO subsections (id, section_id, title, subsection_order) VALUES (?, ?, ?, ?)',
          [subsection.id, section.id, subsection.title, subsection.order]
        );
      }
    }
    console.log('✅ Default sections and subsections created');

    // Create sample pages
    const companyOverviewSection = sections[0];
    const marketingSection = sections[1];
    
    // Get marketing subsections
    const [marketingSubsections] = await db.execute(
      'SELECT id, title FROM subsections WHERE section_id = ? ORDER BY subsection_order',
      [marketingSection.id]
    ) as any[];

    const managementSubsection = marketingSubsections.find((sub: any) => sub.title === 'Management');

    const pages = [
      {
        id: generateUUID(),
        sectionId: companyOverviewSection.id,
        title: 'Company Overview',
        icon: '📋',
        type: 'page'
      },
      {
        id: generateUUID(),
        sectionId: marketingSection.id,
        subsectionId: managementSubsection?.id,
        title: 'Personal Branding // Allan & Sagar',
        icon: '👤',
        type: 'database',
        status: 'Management',
        assignees: JSON.stringify(['Allan', 'Sagar Gupta'])
      }
    ];

    for (const page of pages) {
      await db.execute(`
        INSERT INTO pages (id, workspace_id, section_id, subsection_id, title, icon, type, status, assignees) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        page.id,
        workspaceId,
        page.sectionId,
        page.subsectionId || null,
        page.title,
        page.icon,
        page.type,
        (page as any).status || null,
        (page as any).assignees || null
      ]);
    }
    console.log('✅ Sample pages created');

    console.log('🎉 Default workspace creation completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to create default workspace:', error);
    throw error;
  }
}

// Migration for existing databases
export async function migrateContentBlocksTable(): Promise<void> {
  const db = await getConnection();
  
  try {
    console.log('🔄 Migrating content_blocks table for enhanced types...');
    
    // Check current ENUM values
    const [enumRows] = await db.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'content_blocks' AND COLUMN_NAME = 'type'
    `, [dbConfig.database]) as any[];
    
    if (enumRows.length > 0) {
      const currentEnum = enumRows[0].COLUMN_TYPE;
      
      // Check if we need to add new enum values
      const newTypes = [
        'advanced_table',
        'nested_list', 
        'dropdown_list',
        'dropdown_table',
        'file_attachment',
        'embed',
        'callout',
        'toggle',
        'column_layout',
        'database_view'
      ];
      
      let needsUpdate = false;
      for (const type of newTypes) {
        if (!currentEnum.includes(`'${type}'`)) {
          needsUpdate = true;
          break;
        }
      }
      
      if (needsUpdate) {
        console.log('➕ Adding new block types to ENUM...');
        await db.execute(`
          ALTER TABLE content_blocks 
          MODIFY COLUMN type ENUM(
            'text', 
            'heading1', 
            'heading2', 
            'heading3', 
            'bullet', 
            'numbered', 
            'quote', 
            'code', 
            'divider', 
            'image', 
            'table', 
            'checklist',
            'advanced_table',
            'nested_list',
            'dropdown_list',
            'dropdown_table',
            'file_attachment',
            'embed',
            'callout',
            'toggle',
            'column_layout',
            'database_view'
          ) NOT NULL
        `);
      }
    }
    
    // Add parent_block_id column for nested blocks
    const [parentIdColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'content_blocks' AND COLUMN_NAME = 'parent_block_id'
    `, [dbConfig.database]) as any[];
    
    if (parentIdColumns.length === 0) {
      console.log('➕ Adding parent_block_id column...');
      await db.execute(`
        ALTER TABLE content_blocks 
        ADD COLUMN parent_block_id VARCHAR(36) DEFAULT NULL AFTER metadata,
        ADD CONSTRAINT fk_content_blocks_parent 
        FOREIGN KEY (parent_block_id) REFERENCES content_blocks(id) ON DELETE CASCADE,
        ADD INDEX idx_parent_block (parent_block_id)
      `);
    }
    
    console.log('✅ Content blocks table migration completed');
    
  } catch (error) {
    console.error('❌ Content blocks migration failed:', error);
    throw error;
  }
}

// Test notification function
export async function testNotificationSystem(): Promise<void> {
  try {
    console.log('🧪 Testing notification system...');
    
    // Import notification functions
    const { createNotification } = await import('./notifications');
    
    // Create a test notification
    const success = await createNotification({
      type: 'workspace_updated',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      workspace_id: 'default-workspace',
      metadata: { test: true }
    });
    
    if (success) {
      console.log('✅ Notification system test passed');
    } else {
      console.log('❌ Notification system test failed');
    }
  } catch (error) {
    console.error('❌ Notification system test error:', error);
  }
}

// Utility function to generate UUID (for MySQL compatibility)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Connection pool management
export async function closeConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.end();
      connection = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = await getConnection();
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Initialize database on startup
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Motion-Pro database...');
    await setupDatabase();
    await migrateExistingTables(); // Run migration after setup
    await migrateNotificationSystem(); // Add this line to initialize notifications
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}

// Cleanup expired records
export async function cleanupExpiredRecords(): Promise<void> {
  const db = await getConnection();
  
  try {
    const [otpResult] = await db.execute('DELETE FROM otps WHERE expires_at < NOW()') as any[];
    const [sessionResult] = await db.execute('DELETE FROM sessions WHERE expires_at < NOW()') as any[];
    
    console.log(`✅ Cleaned up ${otpResult.affectedRows} expired OTPs and ${sessionResult.affectedRows} expired sessions`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await closeConnection();
  process.exit(0);
});

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeDatabase();
}