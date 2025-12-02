import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params;

    console.log("📁 File request:", { type, filename });

    // Validate type to prevent directory traversal
    const allowedTypes = ["thumbnails", "pdfs", "materials", "ai-pdfs", "announcements"];
    if (!allowedTypes.includes(type)) {
      console.error("❌ Invalid file type:", type);
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // Sanitize filename to prevent directory traversal (allow more characters for real filenames)
    // Allow: letters, numbers, dots, hyphens, underscores, parentheses, and spaces
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_() ]/g, "");

    if (sanitizedFilename !== filename) {
      console.warn("⚠️ Filename was sanitized:", {
        original: filename,
        sanitized: sanitizedFilename,
      });
    }

    const filePath = join(process.cwd(), "docs", type, sanitizedFilename);

    console.log("📂 Looking for file:", filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      const dirPath = join(process.cwd(), "docs", type);
      const filesInDir = await readdir(dirPath);
      console.error("❌ File not found. Files in directory:", filesInDir);
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const extension = sanitizedFilename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";

    switch (extension) {
      case "pdf":
        contentType = "application/pdf";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
      case "doc":
      case "docx":
        contentType = "application/msword";
        break;
      case "ppt":
      case "pptx":
        contentType = "application/vnd.ms-powerpoint";
        break;
      case "xls":
      case "xlsx":
        contentType = "application/vnd.ms-excel";
        break;
      case "txt":
        contentType = "text/plain";
        break;
      case "zip":
        contentType = "application/zip";
        break;
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${sanitizedFilename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("❌ Error serving file:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as NodeJS.ErrnoException)?.code,
    });
    return new NextResponse("File not found", { status: 404 });
  }
}
