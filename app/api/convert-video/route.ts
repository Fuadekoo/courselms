import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  queueHlsConversion,
  processPendingJobs,
  isFFmpegAvailable,
} from "@/lib/hls-converter";

// Get video directories
const getVideoDirectories = () => {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || "fuad/course";
  const courseDir = videoBaseDir.startsWith("/")
    ? path.resolve(videoBaseDir)
    : path.resolve(process.cwd(), videoBaseDir);
  return { courseDir };
};

/**
 * GET - List all MP4 files and their conversion status
 */
export async function GET(request: NextRequest) {
  try {
    const { courseDir } = getVideoDirectories();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "pending", "completed", "failed", or null for all

    if (!fs.existsSync(courseDir)) {
      return NextResponse.json(
        { error: "Course directory not found" },
        { status: 404 }
      );
    }

    // Get all MP4 files
    const files = fs.readdirSync(courseDir);
    const mp4Files = files
      .filter((file) => {
        const filePath = path.join(courseDir, file);
        return (
          fs.statSync(filePath).isFile() &&
          file.toLowerCase().endsWith(".mp4") &&
          !file.includes("_chunks")
        );
      })
      .map((file) => {
        const baseName = file.replace(/\.[^/.]+$/, "");
        const hlsDir = path.join(courseDir, baseName);
        const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);
        const isConverted = fs.existsSync(manifestPath);

        return {
          filename: file,
          baseName,
          isConverted,
          hlsDir: isConverted ? hlsDir : null,
          manifestPath: isConverted ? manifestPath : null,
        };
      });

    // Filter by status if provided
    let filteredFiles = mp4Files;
    if (status === "converted") {
      filteredFiles = mp4Files.filter((f) => f.isConverted);
    } else if (status === "pending") {
      filteredFiles = mp4Files.filter((f) => !f.isConverted);
    }

    return NextResponse.json({
      success: true,
      total: mp4Files.length,
      converted: mp4Files.filter((f) => f.isConverted).length,
      pending: mp4Files.filter((f) => !f.isConverted).length,
      files: filteredFiles,
    });
  } catch (error: any) {
    console.error("Error listing videos:", error);
    return NextResponse.json(
      { error: "Failed to list videos", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Convert MP4 file(s) to HLS
 */
export async function POST(request: NextRequest) {
  try {
    // Check if FFmpeg is available first
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        {
          error: "FFmpeg is not installed or not accessible",
          message:
            "Please install FFmpeg to enable HLS conversion. On Windows, you can use: winget install ffmpeg. Alternatively, set the FFMPEG_PATH environment variable to point to your FFmpeg executable.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { filename, convertAll } = body;

    const { courseDir } = getVideoDirectories();

    if (!fs.existsSync(courseDir)) {
      return NextResponse.json(
        { error: "Course directory not found" },
        { status: 404 }
      );
    }

    if (convertAll) {
      // Convert all pending MP4 files
      const files = fs.readdirSync(courseDir);
      const mp4Files = files.filter((file) => {
        const filePath = path.join(courseDir, file);
        return (
          fs.statSync(filePath).isFile() &&
          file.toLowerCase().endsWith(".mp4") &&
          !file.includes("_chunks")
        );
      });

      const jobs: Array<{ filename: string; jobId: string; status: string }> =
        [];

      for (const file of mp4Files) {
        const baseName = file.replace(/\.[^/.]+$/, "");
        const hlsDir = path.join(courseDir, baseName);
        const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);

        // Skip if already converted
        if (fs.existsSync(manifestPath)) {
          continue;
        }

        const videoPath = path.join(courseDir, file);
        if (fs.existsSync(videoPath)) {
          try {
            const jobId = await queueHlsConversion(videoPath, baseName);
            jobs.push({
              filename: file,
              jobId,
              status: "queued",
            });
          } catch (error: any) {
            jobs.push({
              filename: file,
              jobId: "",
              status: `error: ${error.message}`,
            });
          }
        }
      }

      // Process pending jobs
      processPendingJobs().catch((error) => {
        console.error("Error processing pending jobs:", error);
      });

      return NextResponse.json({
        success: true,
        message: `Queued ${jobs.length} file(s) for conversion`,
        jobs,
      });
    } else if (filename) {
      // Convert single file
      const videoPath = path.join(courseDir, filename);

      if (!fs.existsSync(videoPath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Check if already converted
      const baseName = filename.replace(/\.[^/.]+$/, "");
      const hlsDir = path.join(courseDir, baseName);
      const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);

      if (fs.existsSync(manifestPath)) {
        return NextResponse.json({
          success: true,
          message: "File already converted",
          filename,
          isConverted: true,
        });
      }

      const jobId = await queueHlsConversion(videoPath, baseName);

      return NextResponse.json({
        success: true,
        message: "Conversion queued successfully",
        filename,
        jobId,
        status: "queued",
      });
    } else {
      return NextResponse.json(
        { error: "Please provide filename or set convertAll to true" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error queueing conversion:", error);
    return NextResponse.json(
      { error: "Failed to queue conversion", details: error.message },
      { status: 500 }
    );
  }
}
