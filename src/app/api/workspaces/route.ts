
// app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, setupDatabase, ensureDefaultWorkspace } from "@/lib/database";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// -------- Utils --------
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeParseJSON<T>(val: any, fallback: T): T {
  try {
    if (val == null) return fallback;
    if (typeof val === "string") return JSON.parse(val) as T;
    return (val as T) ?? fallback;
  } catch {
    return fallback;
  }
}
debugger

// Build full nested workspace payload
async function buildWorkspaceData(db: any, workspaceId: string) {
  // Workspace
  const [wsRows] = (await db.execute(
    "SELECT * FROM workspaces WHERE id = ?",
    [workspaceId]
  )) as [RowDataPacket[], any];

  if (wsRows.length === 0) return null;
  const workspace = wsRows[0];

  // Members
  const [memberRows] = (await db.execute(
    `SELECT id, name, email, avatar, role, created_at, updated_at
     FROM workspace_members
     WHERE workspace_id = ?
     ORDER BY created_at`,
    [workspaceId]
  )) as [RowDataPacket[], any];

  // Sections
  const [sectionRows] = (await db.execute(
    `SELECT * FROM sections
     WHERE workspace_id = ?
     ORDER BY section_order ASC`,
    [workspaceId]
  )) as [RowDataPacket[], any];

  const sections: any[] = [];

  for (const section of sectionRows) {
    // Subsections for this section
    const [subsectionRows] = (await db.execute(
      `SELECT * FROM subsections
       WHERE section_id = ?
       ORDER BY subsection_order ASC`,
      [section.id]
    )) as [RowDataPacket[], any];

    const subsections: any[] = [];

    for (const subsection of subsectionRows) {
      // Pages in this subsection
      const [subPages] = (await db.execute(
        `SELECT * FROM pages
         WHERE subsection_id = ?
         ORDER BY created_at ASC`,
        [subsection.id]
      )) as [RowDataPacket[], any];

      const subsectionPages: any[] = [];

      for (const page of subPages) {
        const [blockRows] = (await db.execute(
          `SELECT * FROM content_blocks
           WHERE page_id = ?
           ORDER BY block_order ASC`,
          [page.id]
        )) as [RowDataPacket[], any];

        subsectionPages.push({
          id: page.id,
          title: page.title,
          icon: page.icon,
          type: page.type,
          status: page.status,
          assignees: safeParseJSON<string[]>(page.assignees, []),
          deadline: page.deadline,
          properties: safeParseJSON<Record<string, any>>(page.properties, {}),
          createdAt: page.created_at,
          updatedAt: page.updated_at,
          content: blockRows.map((block: any) => ({
            id: block.id,
            type: block.type,
            content: block.content,
            metadata: safeParseJSON<Record<string, any>>(block.metadata, {}),
            createdAt: block.created_at,
            updatedAt: block.updated_at,
          })),
        });
      }

      subsections.push({
        id: subsection.id,
        title: subsection.title,
        order: subsection.subsection_order,
        pages: subsectionPages,
      });
    }

    // Direct pages under section (no subsection)
    const [directPagesRows] = (await db.execute(
      `SELECT * FROM pages
       WHERE section_id = ? AND subsection_id IS NULL
       ORDER BY created_at ASC`,
      [section.id]
    )) as [RowDataPacket[], any];

    const directPages: any[] = [];

    for (const page of directPagesRows) {
      const [blockRows] = (await db.execute(
        `SELECT * FROM content_blocks
         WHERE page_id = ?
         ORDER BY block_order ASC`,
        [page.id]
      )) as [RowDataPacket[], any];

      directPages.push({
        id: page.id,
        title: page.title,
        icon: page.icon,
        type: page.type,
        status: page.status,
        assignees: safeParseJSON<string[]>(page.assignees, []),
        deadline: page.deadline,
        properties: safeParseJSON<Record<string, any>>(page.properties, {}),
        createdAt: page.created_at,
        updatedAt: page.updated_at,
        content: blockRows.map((block: any) => ({
          id: block.id,
          type: block.type,
          content: block.content,
          metadata: safeParseJSON<Record<string, any>>(block.metadata, {}),
          createdAt: block.created_at,
          updatedAt: block.updated_at,
        })),
      });
    }

    sections.push({
      id: section.id,
      title: section.title,
      icon: section.icon,
      order: section.section_order,
      pages: directPages,
      subsections,
    });
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdAt: workspace.created_at,
    updatedAt: workspace.updated_at,
    members: memberRows.map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      role: m.role,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    })),
    sections,
  };
}

// -------- Handlers --------

// GET /api/workspaces
// - With ?id=... -> returns full workspace tree
// - Without id   -> returns list of all workspaces (basic info)
export async function GET(request: NextRequest) {
  try {
    // Always ensure database is set up
    await setupDatabase();
    debugger
    const db = await getConnection();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("id");

    if (workspaceId) {
      // For default workspace, ensure it exists
      if (workspaceId === "default-workspace") {
        await ensureDefaultWorkspace();
      }

      const data = await buildWorkspaceData(db, workspaceId);
      if (!data) {
        console.error(`❌ Workspace not found: ${workspaceId}`);
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      
      console.log(`✅ Successfully fetched workspace: ${workspaceId}`);
      return NextResponse.json(data, { status: 200 });
    }

    // List all workspaces (basic info)
    const [rows] = (await db.execute(
      `SELECT id, name, description, created_at, updated_at
       FROM workspaces
       ORDER BY created_at DESC`
    )) as [RowDataPacket[], any];

    const list = rows.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));

    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching workspaces:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces
// Body: { name: string, description?: string, ownerName?: string, ownerEmail?: string }
export async function POST(request: NextRequest) {
  const db = await getConnection();
  const body = await request.json();
  const { name, description, ownerName, ownerEmail } = body || {};

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const workspaceId = generateUUID();

  try {
    await db.beginTransaction();

    // Create workspace
    await db.execute(
      `INSERT INTO workspaces (id, name, description)
       VALUES (?, ?, ?)`,
      [workspaceId, String(name).trim(), description || null]
    );

    // Owner member (optional)
    if (ownerName && ownerEmail) {
      const ownerId = generateUUID();
      await db.execute(
        `INSERT INTO workspace_members (id, workspace_id, name, email, role)
         VALUES (?, ?, ?, ?, 'owner')`,
        [ownerId, workspaceId, String(ownerName).trim(), String(ownerEmail).trim()]
      );
    }

    // Default sections + subsections
    const defaultSections = [
      { title: "Company Overview", icon: "🏢", order: 1 },
      { title: "Marketing",        icon: "📈", order: 2 },
      { title: "BD & Sales",       icon: "💼", order: 3 },
      { title: "HR & Operation",   icon: "👥", order: 4 },
    ];

    for (const s of defaultSections) {
      const sectionId = generateUUID();
      await db.execute(
        `INSERT INTO sections (id, workspace_id, title, icon, section_order)
         VALUES (?, ?, ?, ?, ?)`,
        [sectionId, workspaceId, s.title, s.icon, s.order]
      );

      const defaultSubsections = [
        { title: "Management", order: 1 },
        { title: "Execution",  order: 2 },
        { title: "Inbox",      order: 3 },
      ];

      for (const sub of defaultSubsections) {
        const subsectionId = generateUUID();
        await db.execute(
          `INSERT INTO subsections (id, section_id, title, subsection_order)
           VALUES (?, ?, ?, ?)`,
          [subsectionId, sectionId, sub.title, sub.order]
        );
      }
    }

    await db.commit();

    const created = await buildWorkspaceData(db, workspaceId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    await db.rollback();
    console.error("❌ Error creating workspace:", error);
    return NextResponse.json(
      {
        error: "Failed to create workspace",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces
// Body: { id: string, name: string, description?: string }
export async function PUT(request: NextRequest) {
  const db = await getConnection();
  const body = await request.json();
  const { id, name, description } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
  }
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  try {
    const [existing] = (await db.execute(
      `SELECT id FROM workspaces WHERE id = ?`,
      [id]
    )) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const [result] = (await db.execute(
      `UPDATE workspaces
       SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [String(name).trim(), description || null, id]
    )) as [ResultSetHeader, any];

    if ((result as ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
    }

    const updated = await buildWorkspaceData(db, id);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating workspace:", error);
    return NextResponse.json(
      {
        error: "Failed to update workspace",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces?id=...
export async function DELETE(request: NextRequest) {
  const db = await getConnection();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("id");

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
  }

  try {
    const [existing] = (await db.execute(
      `SELECT id, name FROM workspaces WHERE id = ?`,
      [workspaceId]
    )) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Stats before deletion
    const [[{ count: sectionsCount }]] = (await db.execute(
      `SELECT COUNT(*) AS count FROM sections WHERE workspace_id = ?`,
      [workspaceId]
    )) as any;

    const [[{ count: pagesCount }]] = (await db.execute(
      `SELECT COUNT(*) AS count FROM pages WHERE workspace_id = ?`,
      [workspaceId]
    )) as any;

    const [res] = (await db.execute(
      `DELETE FROM workspaces WHERE id = ?`,
      [workspaceId]
    )) as [ResultSetHeader, any];

    if ((res as ResultSetHeader).affectedRows === 0) {
      return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Workspace "${existing[0].name}" and related data deleted`,
        deletedCounts: { sections: sectionsCount, pages: pagesCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting workspace:", error);
    return NextResponse.json(
      {
        error: "Failed to delete workspace",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}