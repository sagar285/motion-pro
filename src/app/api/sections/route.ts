// // app/api/sections/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { executeQuery, executeTransaction } from "@/lib/database";
// import type { RowDataPacket, ResultSetHeader } from "mysql2";

// // Generate UUID utility
// function generateUUID(): string {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

// // GET /api/sections - Fetch sections
// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const workspaceId = searchParams.get("workspaceId");
//     const sectionId = searchParams.get("id");

//     if (sectionId) {
//       // Fetch single section with subsections
//       const [sectionRows] = await executeQuery(
//         `SELECT * FROM sections WHERE id = ?`,
//         [sectionId]
//       );

//       if ((sectionRows as RowDataPacket[]).length === 0) {
//         return NextResponse.json({ error: "Section not found" }, { status: 404 });
//       }

//       const section = (sectionRows as RowDataPacket[])[0];

//       // Fetch subsections for this section
//       const [subsectionRows] = await executeQuery(
//         `SELECT * FROM subsections WHERE section_id = ? ORDER BY subsection_order ASC`,
//         [sectionId]
//       );

//       const sectionWithSubsections = {
//         id: section.id,
//         workspaceId: section.workspace_id,
//         title: section.title,
//         icon: section.icon,
//         order: section.section_order,
//         subsections: (subsectionRows as RowDataPacket[]).map((subsection: any) => ({
//           id: subsection.id,
//           title: subsection.title,
//           order: subsection.subsection_order,
//           createdAt: subsection.created_at,
//           updatedAt: subsection.updated_at,
//         })),
//         createdAt: section.created_at,
//         updatedAt: section.updated_at,
//       };

//       return NextResponse.json(sectionWithSubsections, { status: 200 });
//     }

//     if (!workspaceId) {
//       return NextResponse.json(
//         { error: "Workspace ID is required" },
//         { status: 400 }
//       );
//     }

//     // List sections for workspace
//     const [rows] = await executeQuery(
//       `SELECT * FROM sections WHERE workspace_id = ? ORDER BY section_order ASC`,
//       [workspaceId]
//     );

//     const sections = (rows as RowDataPacket[]).map((section: any) => ({
//       id: section.id,
//       workspaceId: section.workspace_id,
//       title: section.title,
//       icon: section.icon,
//       order: section.section_order,
//       createdAt: section.created_at,
//       updatedAt: section.updated_at,
//     }));

//     return NextResponse.json(sections, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching sections:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to fetch sections",
//         details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// // POST /api/sections - Create new section
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { workspaceId, title, icon = "📁" } = body;

//     // Validation
//     if (!workspaceId || !title?.trim()) {
//       return NextResponse.json(
//         { error: "Workspace ID and title are required" },
//         { status: 400 }
//       );
//     }

//     // Get next section order
//     const [orderResult] = await executeQuery(
//       `SELECT COALESCE(MAX(section_order), 0) + 1 as next_order FROM sections WHERE workspace_id = ?`,
//       [workspaceId]
//     );
//     const nextOrder = (orderResult as any[])[0]?.next_order || 1;

//     const sectionId = generateUUID();

//     await executeQuery(
//       `INSERT INTO sections (id, workspace_id, title, icon, section_order) VALUES (?, ?, ?, ?, ?)`,
//       [sectionId, workspaceId, title.trim(), icon, nextOrder]
//     );

//     // Fetch the created section
//     const [createdRows] = await executeQuery(
//       `SELECT * FROM sections WHERE id = ?`,
//       [sectionId]
//     );

//     const createdSection = (createdRows as RowDataPacket[])[0];

//     const responseData = {
//       id: createdSection.id,
//       workspaceId: createdSection.workspace_id,
//       title: createdSection.title,
//       icon: createdSection.icon,
//       order: createdSection.section_order,
//       createdAt: createdSection.created_at,
//       updatedAt: createdSection.updated_at,
//     };

//     console.log(`✅ Section created successfully: ${title}`);
//     return NextResponse.json(responseData, { status: 201 });
//   } catch (error) {
//     console.error("Error creating section:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to create section",
//         details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// // PUT /api/sections - Update section
// export async function PUT(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { id, title, icon, order } = body;

//     if (!id) {
//       return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
//     }

//     // Check if section exists
//     const [existing] = await executeQuery(
//       `SELECT * FROM sections WHERE id = ?`,
//       [id]
//     );

//     if ((existing as RowDataPacket[]).length === 0) {
//       return NextResponse.json({ error: "Section not found" }, { status: 404 });
//     }

//     // Build update query
//     const updateFields: string[] = [];
//     const updateValues: any[] = [];

//     if (title !== undefined) {
//       updateFields.push("title = ?");
//       updateValues.push(title.trim());
//     }

//     if (icon !== undefined) {
//       updateFields.push("icon = ?");
//       updateValues.push(icon);
//     }

//     if (order !== undefined) {
//       updateFields.push("section_order = ?");
//       updateValues.push(order);
//     }

//     if (updateFields.length === 0) {
//       return NextResponse.json({ error: "No fields to update" }, { status: 400 });
//     }

//     updateFields.push("updated_at = CURRENT_TIMESTAMP");
//     updateValues.push(id);

//     await executeQuery(
//       `UPDATE sections SET ${updateFields.join(", ")} WHERE id = ?`,
//       updateValues
//     );

//     // Fetch updated section
//     const [updatedRows] = await executeQuery(
//       `SELECT * FROM sections WHERE id = ?`,
//       [id]
//     );

//     const updatedSection = (updatedRows as RowDataPacket[])[0];

//     const responseData = {
//       id: updatedSection.id,
//       workspaceId: updatedSection.workspace_id,
//       title: updatedSection.title,
//       icon: updatedSection.icon,
//       order: updatedSection.section_order,
//       createdAt: updatedSection.created_at,
//       updatedAt: updatedSection.updated_at,
//     };

//     console.log(`✅ Section updated successfully: ${updatedSection.title}`);
//     return NextResponse.json(responseData, { status: 200 });
//   } catch (error) {
//     console.error("Error updating section:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to update section",
//         details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// // DELETE /api/sections - Delete section
// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const sectionId = searchParams.get("id");

//     if (!sectionId) {
//       return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
//     }

//     // Check if section exists
//     const [existing] = await executeQuery(
//       `SELECT id, title FROM sections WHERE id = ?`,
//       [sectionId]
//     );

//     if ((existing as RowDataPacket[]).length === 0) {
//       return NextResponse.json({ error: "Section not found" }, { status: 404 });
//     }

//     const sectionTitle = (existing as RowDataPacket[])[0].title;

//     // Delete section (CASCADE will handle subsections and pages)
//     await executeQuery(
//       `DELETE FROM sections WHERE id = ?`,
//       [sectionId]
//     );

//     console.log(`✅ Section "${sectionTitle}" deleted successfully`);
//     return NextResponse.json(
//       {
//         success: true,
//         message: `Section "${sectionTitle}" deleted successfully`,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting section:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to delete section",
//         details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }