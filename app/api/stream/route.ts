import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, resolve } from "path";
import { existsSync } from "fs";
import { verifyVideoToken } from "@/lib/videoSecurity";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get("file");
    const token = searchParams.get("token");

    if (!file || !token) {
      console.error("[Stream API] Missing parameters:", {
        hasFile: !!file,
        hasToken: !!token,
      });
      return NextResponse.json(
        { error: "Missing file or token parameter" },
        { status: 400 }
      );
    }

    // Decode the file path (in case it's URL encoded)
    const decodedFile = decodeURIComponent(file);

    // Reject external URLs (http/https) - this API only serves local files
    if (
      decodedFile.startsWith("http://") ||
      decodedFile.startsWith("https://")
    ) {
      console.error("[Stream API] External URL rejected:", decodedFile);
      return NextResponse.json(
        {
          error:
            "External URLs are not supported. This API only serves local files.",
        },
        { status: 400 }
      );
    }

    // Verify token
    try {
      const isValid = verifyVideoToken(token, decodedFile);
      if (!isValid) {
        console.error("[Stream API] Invalid token for file:", decodedFile);
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 403 }
        );
      }
    } catch (tokenError: unknown) {
      console.error(
        "[Stream API] Token verification error:",
        tokenError instanceof Error ? tokenError.message : String(tokenError)
      );
      return NextResponse.json(
        { error: "Token verification failed" },
        { status: 403 }
      );
    }

    // Construct file path - handle both absolute and relative paths
    // Use environment variable if set, otherwise fallback to default path
    const videoBaseDir = process.env.VIDEO_BASE_DIR || "fuad/course";
    const basePath = videoBaseDir.startsWith("/")
      ? resolve(videoBaseDir)
      : resolve(process.cwd(), videoBaseDir);
    let filePath: string;

    if (decodedFile.startsWith("/")) {
      // Remove leading slash and join
      filePath = join(basePath, decodedFile.slice(1));
    } else {
      // Relative path
      filePath = join(basePath, decodedFile);
    }

    // Normalize and resolve path to prevent directory traversal
    const normalizedPath = normalize(resolve(filePath));

    // Ensure the resolved path is within the base directory
    if (!normalizedPath.startsWith(basePath)) {
      console.error("[Stream API] Path traversal detected:", {
        requestedFile: decodedFile,
        filePath,
        normalizedPath,
        basePath,
      });
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    console.log("[Stream API] Requested file:", decodedFile);
    console.log("[Stream API] Full path:", normalizedPath);
    console.log("[Stream API] File exists:", existsSync(normalizedPath));

    // Check if file exists before trying to read
    if (!existsSync(normalizedPath)) {
      console.error("[Stream API] File not found:", {
        requestedFile: decodedFile,
        fullPath: normalizedPath,
        basePath,
        cwd: process.cwd(),
      });
      return NextResponse.json(
        {
          error: "File not found",
          path: decodedFile,
          fullPath: normalizedPath,
        },
        { status: 404 }
      );
    }

    try {
      const fileBuffer = await readFile(normalizedPath);

      // Determine content type based on file extension
      let contentType = "application/octet-stream";
      const fileName = decodedFile.toLowerCase();
      if (fileName.endsWith(".m3u8")) {
        contentType = "application/vnd.apple.mpegurl";
      } else if (fileName.endsWith(".ts")) {
        contentType = "video/mp2t";
      } else if (fileName.endsWith(".mp4")) {
        contentType = "video/mp4";
      } else if (fileName.endsWith(".webm")) {
        contentType = "video/webm";
      }

      // Set CORS headers for HLS streaming
      const headers = new Headers();
      headers.set("Content-Type", contentType);
      headers.set("Cache-Control", "public, max-age=3600");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers,
      });
    } catch (fileError) {
      console.error("[Stream API] File read error:", {
        filePath: normalizedPath,
        decodedFile,
        error:
          fileError instanceof Error ? fileError.message : String(fileError),
        code:
          fileError instanceof Error
            ? (fileError as NodeJS.ErrnoException).code
            : undefined,
      });
      return NextResponse.json(
        {
          error: "File read error",
          path: decodedFile,
          message:
            fileError instanceof Error ? fileError.message : String(fileError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Stream API] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
