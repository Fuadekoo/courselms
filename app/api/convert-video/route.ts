import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  queueHlsConversion,
  processPendingJobs,
  isFFmpegAvailable,
  getAllJobsByBaseName,
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

    // Get all jobs mapped by baseName
    const jobsMap = getAllJobsByBaseName();

    // Get all files and directories
    const files = fs.readdirSync(courseDir);
    
    // Track all video baseNames we've seen (from MP4 files and HLS directories)
    const videoMap = new Map<string, {
      filename: string;
      baseName: string;
      hasMp4: boolean;
      hasHls: boolean;
      hlsDir: string | null;
      manifestPath: string | null;
    }>();

    // First, scan for MP4 files
    files.forEach((file) => {
      const filePath = path.join(courseDir, file);
      if (
        fs.statSync(filePath).isFile() &&
        file.toLowerCase().endsWith(".mp4") &&
        !file.includes("_chunks")
      ) {
        const baseName = file.replace(/\.[^/.]+$/, "");
        const hlsDir = path.join(courseDir, baseName);
        const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);
        const hasHls = fs.existsSync(manifestPath);

        videoMap.set(baseName, {
          filename: file,
          baseName,
          hasMp4: true,
          hasHls,
          hlsDir: hasHls ? hlsDir : null,
          manifestPath: hasHls ? manifestPath : null,
        });
      }
    });

    // Then, scan for HLS directories (converted videos where MP4 was deleted)
    files.forEach((item) => {
      const itemPath = path.join(courseDir, item);
      if (fs.statSync(itemPath).isDirectory() && !item.includes("_chunks")) {
        const baseName = item;
        const manifestPath = path.join(itemPath, `${baseName}.m3u8`);
        
        // If this directory has a manifest, it's a converted video
        if (fs.existsSync(manifestPath)) {
          const existing = videoMap.get(baseName);
          if (existing) {
            // Update existing entry
            existing.hasHls = true;
            existing.hlsDir = itemPath;
            existing.manifestPath = manifestPath;
          } else {
            // New entry for converted video (MP4 was deleted)
            videoMap.set(baseName, {
              filename: `${baseName}.mp4`, // Reconstruct filename
              baseName,
              hasMp4: false,
              hasHls: true,
              hlsDir: itemPath,
              manifestPath,
            });
          }
        }
      }
    });

    // Convert map to array and process
    const mp4Files = Array.from(videoMap.values()).map((video) => {
        const isConverted = video.hasHls;

        // Get job information for this video
        const job = jobsMap.get(video.baseName);
        let status: "pending" | "queued" | "processing" | "completed" | "failed" | undefined;
        let jobId: string | undefined;

        // If converted, status is always completed
        if (isConverted) {
          status = "completed";
          if (job) {
            jobId = job.id;
          }
        } else if (job) {
          // Video not converted yet, use job status
          jobId = job.id;
          // Map job status to video status
          if (job.status === "failed") {
            status = "failed";
          } else if (job.status === "processing") {
            status = "processing";
          } else if (job.status === "pending") {
            status = "pending";
          } else if (job.status === "completed") {
            // Job says completed but manifest doesn't exist - might be in progress
            status = "processing";
          }
        } else {
          // No job and not converted - it's pending
          status = "pending";
        }

        return {
          filename: video.filename,
          baseName: video.baseName,
          isConverted,
          hlsDir: video.hlsDir,
          manifestPath: video.manifestPath,
          jobId,
          status,
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
