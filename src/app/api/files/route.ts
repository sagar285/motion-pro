// // app/api/files/route.ts - File upload and management API
// import { NextRequest, NextResponse } from 'next/server';
// import { getConnection } from '@/lib/database';
// import { RowDataPacket, ResultSetHeader } from 'mysql2';
// import { writeFile, mkdir } from 'fs/promises';
// import { join } from 'path';
// import { existsSync } from 'fs';

// // POST /api/files - Upload files for blocks
// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const files = formData.getAll('files') as File[];
//     const blockId = formData.get('blockId') as string;
//     const uploadedBy = formData.get('uploadedBy') as string;

//     if (!files.length) {
//       return NextResponse.json(
//         { error: 'No files provided' },
//         { status: 400 }
//       );
//     }

//     if (!blockId) {
//       return NextResponse.json(
//         { error: 'Block ID is required' },
//         { status: 400 }
//       );
//     }

//     const db = await getConnection();
//     const uploadedFiles = [];

//     // Ensure upload directory exists
//     const uploadDir = join(process.cwd(), 'public', 'uploads');
//     if (!existsSync(uploadDir)) {
//       await mkdir(uploadDir, { recursive: true });
//     }

//     for (const file of files) {
//       // Generate unique filename
//       const timestamp = Date.now();
//       const randomSuffix = Math.random().toString(36).substring(2, 15);
//       const fileExtension = file.name.split('.').pop();
//       const storedName = `${timestamp}_${randomSuffix}.${fileExtension}`;
//       const filePath = join(uploadDir, storedName);

//       // Convert file to buffer and save
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);
//       await writeFile(filePath, buffer);

//       // Generate thumbnail for images
//       let thumbnailPath = null;
//       if (file.type.startsWith('image/')) {
//         // Here you would integrate with an image processing library like sharp
//         // For now, we'll use the original image as thumbnail
//         thumbnailPath = `/uploads/${storedName}`;
//       }

//       // Save file record to database
//       const fileId = generateUUID();
//       await db.execute(`
//         INSERT INTO block_files (id, block_id, original_name, stored_name, file_size, mime_type, file_path, thumbnail_path, uploaded_by)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `, [
//         fileId,
//         blockId,
//         file.name,
//         storedName,
//         file.size,
//         file.type,
//         `/uploads/${storedName}`,
//         thumbnailPath,
//         uploadedBy || null
//       ]);

//       uploadedFiles.push({
//         id: fileId,
//         original_name: file.name,
//         stored_name: storedName,
//         file_size: file.size,
//         mime_type: file.type,
//         url: `/uploads/${storedName}`,
//         thumbnail_path: thumbnailPath
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       files: uploadedFiles
//     }, { status: 201 });

//   } catch (error) {
//     console.error('File upload error:', error);
//     return NextResponse.json(
//       { error: 'File upload failed' },
//       { status: 500 }
//     );
//   }
// }

// // GET /api/files/[filename] - Serve uploaded files
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { filename: string } }
// ) {
//   try {
//     const filename = params.filename;
//     const filePath = join(process.cwd(), 'public', 'uploads', filename);

//     if (!existsSync(filePath)) {
//       return NextResponse.json(
//         { error: 'File not found' },
//         { status: 404 }
//       );
//     }

//     // Get file info from database for access control
//     const db = await getConnection();
//     const [fileRows] = await db.execute(
//       'SELECT * FROM block_files WHERE stored_name = ?',
//       [filename]
//     ) as [RowDataPacket[], any];

//     if (fileRows.length === 0) {
//       return NextResponse.json(
//         { error: 'File record not found' },
//         { status: 404 }
//       );
//     }

//     const fileInfo = fileRows[0];

//     // For now, we'll allow access to all files
//     // In a production app, you'd implement proper access control here
    
//     return NextResponse.redirect(new URL(`/uploads/${filename}`, request.url));

//   } catch (error) {
//     console.error('File serve error:', error);
//     return NextResponse.json(
//       { error: 'Failed to serve file' },
//       { status: 500 }
//     );
//   }
// }

// // DELETE /api/files - Delete files
// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const fileId = searchParams.get('id');

//     if (!fileId) {
//       return NextResponse.json(
//         { error: 'File ID is required' },
//         { status: 400 }
//       );
//     }

//     const db = await getConnection();

//     // Get file info before deletion
//     const [fileRows] = await db.execute(
//       'SELECT stored_name FROM block_files WHERE id = ?',
//       [fileId]
//     ) as [RowDataPacket[], any];

//     if (fileRows.length === 0) {
//       return NextResponse.json(
//         { error: 'File not found' },
//         { status: 404 }
//       );
//     }

//     const storedName = fileRows[0].stored_name;

//     // Delete file record from database
//     await db.execute('DELETE FROM block_files WHERE id = ?', [fileId]);

//     // Delete physical file (optional - you might want to keep files for recovery)
//     try {
//       const filePath = join(process.cwd(), 'public', 'uploads', storedName);
//       if (existsSync(filePath)) {
//         const fs = require('fs').promises;
//         await fs.unlink(filePath);
//       }
//     } catch (fileError) {
//       console.warn('Failed to delete physical file:', fileError);
//       // Don't fail the request if file deletion fails
//     }

//     return NextResponse.json({ success: true });

//   } catch (error) {
//     console.error('File delete error:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete file' },
//       { status: 500 }
//     );
//   }
// }

// // Utility function to generate UUID
// function generateUUID(): string {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }

// // app/api/files/[filename]/route.ts - Dynamic route for file serving
// import { NextRequest, NextResponse } from 'next/server';
// import { join } from 'path';
// import { existsSync } from 'fs';
// import { readFile } from 'fs/promises';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { filename: string } }
// ) {
//   try {
//     const filename = params.filename;
//     const filePath = join(process.cwd(), 'public', 'uploads', filename);

//     if (!existsSync(filePath)) {
//       return NextResponse.json(
//         { error: 'File not found' },
//         { status: 404 }
//       );
//     }

//     const fileBuffer = await readFile(filePath);
    
//     // Determine content type based on file extension
//     const ext = filename.split('.').pop()?.toLowerCase();
//     let contentType = 'application/octet-stream';
    
//     switch (ext) {
//       case 'jpg':
//       case 'jpeg':
//         contentType = 'image/jpeg';
//         break;
//       case 'png':
//         contentType = 'image/png';
//         break;
//       case 'gif':
//         contentType = 'image/gif';
//         break;
//       case 'webp':
//         contentType = 'image/webp';
//         break;
//       case 'svg':
//         contentType = 'image/svg+xml';
//         break;
//       case 'pdf':
//         contentType = 'application/pdf';
//         break;
//       case 'txt':
//         contentType = 'text/plain';
//         break;
//       case 'json':
//         contentType = 'application/json';
//         break;
//       case 'csv':
//         contentType = 'text/csv';
//         break;
//       case 'xlsx':
//         contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
//         break;
//       case 'docx':
//         contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
//         break;
//     }

//     return new NextResponse(fileBuffer, {
//       headers: {
//         'Content-Type': contentType,
//         'Cache-Control': 'public, max-age=31536000, immutable',
//       },
//     });

//   } catch (error) {
//     console.error('File serve error:', error);
//     return NextResponse.json(
//       { error: 'Failed to serve file' },
//       { status: 500 }
//     );
//   }
// }