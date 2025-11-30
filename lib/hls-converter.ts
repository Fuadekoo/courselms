import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Use environment variable if set, otherwise fallback to default path
// This function is called lazily to avoid executing during build time
const getVideoDirectories = () => {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || "fuad/course";
  const jobsBaseDir = process.env.VIDEO_JOBS_DIR || "fuad/jobs";

  // Always resolve relative to process.cwd() unless explicitly absolute
  const courseDir = videoBaseDir.startsWith("/")
    ? path.resolve(videoBaseDir)
    : path.resolve(process.cwd(), videoBaseDir);

  const jobsDir = jobsBaseDir.startsWith("/")
    ? path.resolve(jobsBaseDir)
    : path.resolve(process.cwd(), jobsBaseDir);

  return { courseDir, jobsDir };
};

// Lazy getters to avoid executing during build time
let _COURSE_DIR: string | null = null;
let _JOBS_DIR: string | null = null;

const getCourseDir = () => {
  if (!_COURSE_DIR) {
    _COURSE_DIR = getVideoDirectories().courseDir;
  }
  return _COURSE_DIR;
};

const getJobsDir = () => {
  if (!_JOBS_DIR) {
    _JOBS_DIR = getVideoDirectories().jobsDir;
    // Ensure directory exists only when actually needed (runtime, not build time)
    if (!fs.existsSync(_JOBS_DIR)) {
      try {
        fs.mkdirSync(_JOBS_DIR, { recursive: true });
      } catch (error: any) {
        // Only log error, don't throw - directory might be created later
        console.warn(
          `[HLS Converter] Could not create jobs directory: ${_JOBS_DIR}`,
          error.message
        );
      }
    }
  }
  return _JOBS_DIR;
};

/**
 * Find FFmpeg executable path
 * Checks system PATH and common installation locations
 * Supports FFMPEG_PATH environment variable for custom installation
 */
async function findFFmpeg(): Promise<string> {
  // First, check if FFMPEG_PATH environment variable is set
  if (process.env.FFMPEG_PATH) {
    let customPath = process.env.FFMPEG_PATH;

    // Convert Unix-style paths (/c/...) to Windows paths (C:\...)
    if (os.platform() === "win32" && customPath.startsWith("/")) {
      // Handle Git Bash/MSYS2 style paths: /c/Users/... -> C:\Users\...
      if (customPath.match(/^\/[a-zA-Z]\//)) {
        const driveLetter = customPath[1].toUpperCase();
        const restOfPath = customPath.slice(3).replace(/\//g, "\\");
        customPath = `${driveLetter}:\\${restOfPath}`;
        console.log(
          `[FFmpeg] Converted Unix-style path to Windows path: ${customPath}`
        );
      }
    }

    if (fs.existsSync(customPath)) {
      console.log(`[FFmpeg] Using custom path from FFMPEG_PATH: ${customPath}`);
      return customPath;
    } else {
      console.warn(
        `[FFmpeg] FFMPEG_PATH set but file not found: ${customPath}`
      );
    }
  }

  const platform = os.platform();

  // Get system PATH dynamically on Windows
  let systemPath = process.env.Path || process.env.PATH || "";

  if (platform === "win32") {
    // Try to get fresh PATH from system registry
    try {
      const { stdout } = await execAsync(
        "powershell -Command \"[Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')\"",
        { timeout: 5000 }
      );
      if (stdout && stdout.trim()) {
        systemPath = stdout.trim();
      }
    } catch (error) {
      // Fallback to process.env if PowerShell command fails
      console.log(
        "[FFmpeg] Could not refresh PATH from registry, using process.env"
      );
    }
  }

  // Common Windows installation paths (including WinGet installation)
  const localAppData = process.env["LOCALAPPDATA"] || "";
  const windowsPaths = [
    // WinGet installation location
    path.join(
      localAppData,
      "Microsoft",
      "WinGet",
      "Packages",
      "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "ffmpeg-8.0.1-full_build",
      "bin",
      "ffmpeg.exe"
    ),
    // Other common WinGet paths (version-agnostic)
    path.join(
      localAppData,
      "Microsoft",
      "WinGet",
      "Packages",
      "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "**",
      "bin",
      "ffmpeg.exe"
    ),
    // WindowsApps
    path.join(localAppData, "Microsoft", "WindowsApps", "ffmpeg.exe"),
    // Standard installation paths
    path.join(
      process.env["ProgramFiles"] || "C:\\Program Files",
      "ffmpeg",
      "bin",
      "ffmpeg.exe"
    ),
    path.join(
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "ffmpeg",
      "bin",
      "ffmpeg.exe"
    ),
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
  ];

  // Try to find FFmpeg using 'where' on Windows or 'which' on Unix
  try {
    const findCommand = platform === "win32" ? "where ffmpeg" : "which ffmpeg";
    const { stdout } = await execAsync(findCommand, {
      env: { ...process.env, Path: systemPath, PATH: systemPath },
    });
    const ffmpegPath = stdout.trim().split("\n")[0].trim();
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      return ffmpegPath;
    }
  } catch {
    // Continue to check common paths
  }

  // Check common Windows paths
  if (platform === "win32") {
    for (const testPath of windowsPaths) {
      try {
        // Skip wildcard paths (handle separately if needed)
        if (testPath.includes("**")) {
          continue;
        }

        if (fs.existsSync(testPath)) {
          console.log(`[FFmpeg] Found at: ${testPath}`);
          return testPath;
        }
        // Try without .exe extension
        const pathWithoutExt = testPath.replace(/\.exe$/, "");
        if (fs.existsSync(pathWithoutExt)) {
          console.log(`[FFmpeg] Found at: ${pathWithoutExt}`);
          return pathWithoutExt;
        }
      } catch {
        continue;
      }
    }

    // Try to find WinGet FFmpeg installation dynamically
    try {
      const appData = process.env["LOCALAPPDATA"] || "";
      const winGetBase = path.join(
        appData,
        "Microsoft",
        "WinGet",
        "Packages",
        "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
      );
      if (fs.existsSync(winGetBase)) {
        const dirs = fs.readdirSync(winGetBase);
        for (const dir of dirs) {
          const ffmpegPath = path.join(winGetBase, dir, "bin", "ffmpeg.exe");
          if (fs.existsSync(ffmpegPath)) {
            console.log(`[FFmpeg] Found WinGet installation at: ${ffmpegPath}`);
            return ffmpegPath;
          }
        }
      }
    } catch {
      // Continue to next method
    }
  }

  // Fallback: try direct execution
  try {
    await execAsync("ffmpeg -version", {
      env: { ...process.env, Path: systemPath, PATH: systemPath },
    });
    return "ffmpeg"; // It's in PATH
  } catch {
    throw new Error(
      "FFmpeg is not installed. Please install FFmpeg to enable HLS conversion."
    );
  }
}

// Directory creation is now lazy - happens only when needed at runtime

export interface HlsConversionJob {
  id: string;
  videoPath: string;
  outputDir: string;
  manifestPath: string;
  baseName: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  createdAt: number;
}

/**
 * Check if FFmpeg is available and can actually execute (without throwing an error)
 */
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    const ffmpegPath = await findFFmpeg();
    // Actually try to execute FFmpeg to verify it works
    try {
      await execAsync(`"${ffmpegPath}" -version`, {
        env: { ...process.env },
        timeout: 5000,
      });
      return true;
    } catch {
      // FFmpeg found but cannot execute
      console.warn(`[FFmpeg] Found at ${ffmpegPath} but cannot execute`);
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Export function to check FFmpeg availability
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  return checkFFmpegAvailable();
}

/**
 * Add a job to the conversion queue
 */
export async function queueHlsConversion(
  videoPath: string,
  baseName: string
): Promise<string> {
  // Check if FFmpeg is available before queuing
  const isFFmpegAvailable = await checkFFmpegAvailable();

  if (!isFFmpegAvailable) {
    console.warn(
      `[HLS Conversion] FFmpeg is not available. Skipping HLS conversion for ${baseName}.`
    );
    console.warn(
      `[HLS Conversion] To enable HLS conversion, please install FFmpeg:`
    );
    console.warn(
      `[HLS Conversion]   - Windows: winget install ffmpeg or download from https://ffmpeg.org`
    );
    console.warn(
      `[HLS Conversion]   - Or set FFMPEG_PATH environment variable to point to ffmpeg executable`
    );

    // Return a special job ID indicating FFmpeg is not available
    // This allows the upload to succeed but the conversion won't happen
    const jobId = `${baseName}-ffmpeg-unavailable-${Date.now()}`;
    const outputDir = path.join(getCourseDir(), baseName);
    const manifestPath = path.join(outputDir, `${baseName}.m3u8`);

    const job: HlsConversionJob = {
      id: jobId,
      videoPath,
      outputDir,
      manifestPath,
      baseName,
      status: "failed",
      error:
        "FFmpeg is not installed or not accessible. Please install FFmpeg to enable HLS conversion.",
      createdAt: Date.now(),
    };

    const jobFilePath = path.join(getJobsDir(), `${jobId}.json`);
    fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

    return jobId;
  }

  const jobId = `${baseName}-${Date.now()}`;
  const outputDir = path.join(getCourseDir(), baseName);
  const manifestPath = path.join(outputDir, `${baseName}.m3u8`);

  const job: HlsConversionJob = {
    id: jobId,
    videoPath,
    outputDir,
    manifestPath,
    baseName,
    status: "pending",
    createdAt: Date.now(),
  };

  const jobFilePath = path.join(getJobsDir(), `${jobId}.json`);
  fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

  // Trigger background processing (non-blocking)
  processHlsConversion(jobId).catch((error) => {
    console.error(`Error processing job ${jobId}:`, error);
  });

  return jobId;
}

/**
 * Process HLS conversion in the background
 */
async function processHlsConversion(jobId: string): Promise<void> {
  const jobFilePath = path.join(getJobsDir(), `${jobId}.json`);

  if (!fs.existsSync(jobFilePath)) {
    console.error(`Job file not found: ${jobFilePath}`);
    return;
  }

  let job: HlsConversionJob;
  try {
    const jobData = fs.readFileSync(jobFilePath, "utf-8");
    job = JSON.parse(jobData);
  } catch (error) {
    console.error(`Error reading job file:`, error);
    return;
  }

  // Skip if job is already marked as failed (e.g., FFmpeg unavailable)
  if (job.status === "failed" || jobId.includes("ffmpeg-unavailable")) {
    console.log(
      `[HLS Conversion] Skipping job ${jobId} - already marked as failed`
    );
    return;
  }

  // Update status to processing
  job.status = "processing";
  fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

  try {
    // Check if FFmpeg is available before attempting conversion
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error(
        "FFmpeg is not installed or cannot be executed. Please install FFmpeg to enable HLS conversion."
      );
    }

    // Find FFmpeg executable
    const ffmpegPath = await findFFmpeg();
    console.log(`[HLS Conversion] Using FFmpeg at: ${ffmpegPath}`);

    // Verify FFmpeg works
    try {
      await execAsync(`"${ffmpegPath}" -version`, {
        env: { ...process.env },
      });
    } catch (error: any) {
      throw new Error(
        `FFmpeg found but cannot execute: ${error.message}. Please ensure FFmpeg is properly installed.`
      );
    }

    // Create output directory
    if (!fs.existsSync(job.outputDir)) {
      fs.mkdirSync(job.outputDir, { recursive: true });
    }

    // Detect hardware acceleration support
    const detectHardwareAccel = async (): Promise<{
      encoder: string;
      extraArgs: string;
    }> => {
      const platform = os.platform();

      try {
        // Get list of available encoders
        const { stdout } = await execAsync(
          `"${ffmpegPath}" -hide_banner -encoders`,
          {
            timeout: 5000,
          }
        );
        const encoderList = stdout.toLowerCase();

        // Test NVIDIA NVENC (Windows/Linux) - 5-10x faster than software
        if (encoderList.includes("h264_nvenc")) {
          console.log(
            "[HLS Conversion] ✅ Using NVIDIA NVENC hardware acceleration (5-10x faster)"
          );
          return {
            encoder: "h264_nvenc",
            extraArgs: "-preset p4 -tune ll", // p4 = fast, ll = low latency
          };
        }

        // Test Intel QuickSync (Windows/Linux) - 3-5x faster than software
        if (encoderList.includes("h264_qsv")) {
          console.log(
            "[HLS Conversion] ✅ Using Intel QuickSync hardware acceleration (3-5x faster)"
          );
          return {
            encoder: "h264_qsv",
            extraArgs: "-preset veryfast",
          };
        }

        // Test Apple VideoToolbox (macOS) - 3-5x faster than software
        if (encoderList.includes("h264_videotoolbox")) {
          console.log(
            "[HLS Conversion] ✅ Using Apple VideoToolbox hardware acceleration (3-5x faster)"
          );
          return {
            encoder: "h264_videotoolbox",
            extraArgs: "-allow_sw 1 -realtime 1",
          };
        }

        // Test AMD VCE (Windows/Linux) - 3-5x faster than software
        if (encoderList.includes("h264_amf")) {
          console.log(
            "[HLS Conversion] ✅ Using AMD AMF hardware acceleration (3-5x faster)"
          );
          return {
            encoder: "h264_amf",
            extraArgs: "-quality speed -rc cqp",
          };
        }
      } catch (error) {
        // Fallback to software encoding
        console.log(
          "[HLS Conversion] Could not detect hardware encoders, using software encoding"
        );
      }

      // Fallback to software encoding with veryfast preset (2-3x faster than default)
      console.log(
        "[HLS Conversion] Using software encoding (libx264) with 'veryfast' preset"
      );
      return {
        encoder: "libx264",
        extraArgs: "-preset veryfast -tune fastdecode -threads 0", // veryfast preset, auto threads
      };
    };

    // Try hardware acceleration first, but fallback to software if it fails
    let hwAccel = await detectHardwareAccel();
    let useHardware = true;

    // FFmpeg command optimized for speed
    // Creates adaptive bitrate streaming with 3 quality levels: 1080p (5Mbps), 360p (800kbps), 144p (250kbps)
    // Using HLS variant streams for proper adaptive bitrate streaming
    const variantPlaylistPattern = path.join(
      job.outputDir,
      `${job.baseName}_%v.m3u8`
    );

    // Base arguments for speed optimization
    const baseArgs = `-i "${job.videoPath}" -c:a aac -hls_time 4 -hls_playlist_type vod`;

    // Function to build encoder arguments
    const buildEncoderArgs = (encoderType: string): string => {
      if (encoderType === "h264_nvenc") {
        // NVIDIA NVENC - very fast hardware encoding
        return (
          // Stream 0: 1080p (HD) @ ~5Mbps
          `-map 0:v:0 -map 0:a:0 -c:v:0 h264_nvenc -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -preset p4 -tune ll -c:a:0 aac -b:a:0 128k ` +
          // Stream 1: 360p @ ~800kbps
          `-map 0:v:0 -map 0:a:0 -c:v:1 h264_nvenc -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -preset p4 -tune ll -c:a:1 aac -b:a:1 96k ` +
          // Stream 2: 144p @ ~250kbps
          `-map 0:v:0 -map 0:a:0 -c:v:2 h264_nvenc -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -preset p4 -tune ll -c:a:2 aac -b:a:2 64k`
        );
      } else if (encoderType === "h264_qsv") {
        // Intel QuickSync - fast hardware encoding
        return (
          // Stream 0: 1080p (HD) @ ~5Mbps
          `-map 0:v:0 -map 0:a:0 -c:v:0 h264_qsv -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -preset veryfast -c:a:0 aac -b:a:0 128k ` +
          // Stream 1: 360p @ ~800kbps
          `-map 0:v:0 -map 0:a:0 -c:v:1 h264_qsv -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -preset veryfast -c:a:1 aac -b:a:1 96k ` +
          // Stream 2: 144p @ ~250kbps
          `-map 0:v:0 -map 0:a:0 -c:v:2 h264_qsv -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -preset veryfast -c:a:2 aac -b:a:2 64k`
        );
      } else if (encoderType === "h264_videotoolbox") {
        // Apple VideoToolbox - fast hardware encoding
        return (
          // Stream 0: 1080p (HD) @ ~5Mbps
          `-map 0:v:0 -map 0:a:0 -c:v:0 h264_videotoolbox -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -allow_sw 1 -realtime 1 -c:a:0 aac -b:a:0 128k ` +
          // Stream 1: 360p @ ~800kbps
          `-map 0:v:0 -map 0:a:0 -c:v:1 h264_videotoolbox -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -allow_sw 1 -realtime 1 -c:a:1 aac -b:a:1 96k ` +
          // Stream 2: 144p @ ~250kbps
          `-map 0:v:0 -map 0:a:0 -c:v:2 h264_videotoolbox -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -allow_sw 1 -realtime 1 -c:a:2 aac -b:a:2 64k`
        );
      } else if (encoderType === "h264_amf") {
        // AMD AMF - fast hardware encoding
        return (
          // Stream 0: 1080p (HD) @ ~5Mbps
          `-map 0:v:0 -map 0:a:0 -c:v:0 h264_amf -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -quality speed -rc cqp -c:a:0 aac -b:a:0 128k ` +
          // Stream 1: 360p @ ~800kbps
          `-map 0:v:0 -map 0:a:0 -c:v:1 h264_amf -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -quality speed -rc cqp -c:a:1 aac -b:a:1 96k ` +
          // Stream 2: 144p @ ~250kbps
          `-map 0:v:0 -map 0:a:0 -c:v:2 h264_amf -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -quality speed -rc cqp -c:a:2 aac -b:a:2 64k`
        );
      } else {
        // Software encoding (libx264) with fast preset
        return (
          // Stream 0: 1080p (HD) @ ~5Mbps
          `-map 0:v:0 -map 0:a:0 -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -preset veryfast -tune fastdecode -threads 0 -x264-params:v:0 keyint=48:min-keyint=48:scenecut=0 -c:a:0 aac -b:a:0 128k ` +
          // Stream 1: 360p @ ~800kbps
          `-map 0:v:0 -map 0:a:0 -c:v:1 libx264 -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -preset veryfast -tune fastdecode -threads 0 -x264-params:v:1 keyint=48:min-keyint=48:scenecut=0 -c:a:1 aac -b:a:1 96k ` +
          // Stream 2: 144p @ ~250kbps
          `-map 0:v:0 -map 0:a:0 -c:v:2 libx264 -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -preset veryfast -tune fastdecode -threads 0 -x264-params:v:2 keyint=48:min-keyint=48:scenecut=0 -c:a:2 aac -b:a:2 64k`
        );
      }
    };

    // Build initial encoder arguments
    let encoderArgs = buildEncoderArgs(hwAccel.encoder);

    // Function to execute conversion with automatic fallback
    const executeConversion = async (): Promise<void> => {
      const ffmpegCommand =
        `"${ffmpegPath}" ${baseArgs} ` +
        `${encoderArgs} ` +
        `-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" ` +
        `-master_pl_name "${path.basename(job.manifestPath)}" ` +
        `-hls_segment_filename "${job.outputDir}/${job.baseName}_%v_%04d.ts" ` +
        `-hls_flags independent_segments+program_date_time ` +
        `-f hls "${variantPlaylistPattern}"`;

      console.log(`[HLS Conversion] Starting conversion for job ${jobId}`);
      if (useHardware) {
        console.log(`[HLS Conversion] Using encoder: ${hwAccel.encoder}`);
      } else {
        console.log(`[HLS Conversion] Using software encoding (fallback)`);
      }

      try {
        const { stdout, stderr } = await execAsync(ffmpegCommand, {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          timeout: 3600000, // 1 hour timeout for large videos
          env: { ...process.env }, // Pass environment variables
        });

        // Check stderr for hardware encoding errors
        if (stderr) {
          // Check for hardware encoding errors
          if (
            stderr.includes("Cannot load nvEncodeAPI64.dll") ||
            stderr.includes("minimum required Nvidia driver") ||
            stderr.includes("Error while opening encoder") ||
            stderr.includes("Nothing was written into output file")
          ) {
            throw new Error(
              `Hardware encoding failed: ${stderr.substring(0, 500)}`
            );
          }
        }

        // Verify manifest file was created
        if (!fs.existsSync(job.manifestPath)) {
          throw new Error("HLS manifest file was not created");
        }

        if (useHardware) {
          console.log(
            `[HLS Conversion] ✅ Successfully converted with ${hwAccel.encoder}`
          );
        } else {
          console.log(
            `[HLS Conversion] ✅ Successfully converted with software encoding`
          );
        }
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || "";
        const errorOutput = error?.stderr || error?.stdout || "";

        // Check if this is a hardware encoding error
        if (
          useHardware &&
          (errorMessage.includes("nvEncodeAPI64.dll") ||
            errorMessage.includes("Nvidia driver") ||
            errorMessage.includes("Error while opening encoder") ||
            errorOutput.includes("Cannot load nvEncodeAPI64.dll") ||
            errorOutput.includes("minimum required Nvidia driver") ||
            errorOutput.includes("Error while opening encoder") ||
            errorOutput.includes("Nothing was written into output file"))
        ) {
          console.warn(
            `[HLS Conversion] ⚠️ Hardware encoding (${hwAccel.encoder}) failed. Falling back to software encoding...`
          );
          console.warn(
            `[HLS Conversion] Reason: ${errorMessage.substring(0, 200)}`
          );

          // Switch to software encoding
          useHardware = false;
          hwAccel = {
            encoder: "libx264",
            extraArgs: "-preset veryfast -tune fastdecode -threads 0",
          };
          encoderArgs = buildEncoderArgs("libx264");

          // Retry with software encoding
          return executeConversion();
        }

        // If it's not a hardware encoding error, or we're already using software, throw
        throw error;
      }
    };

    // Execute conversion (with automatic fallback)
    await executeConversion();

    // Delete original MP4 file after successful conversion
    if (fs.existsSync(job.videoPath)) {
      fs.unlinkSync(job.videoPath);
      console.log(`[HLS Conversion] Deleted original MP4: ${job.videoPath}`);
    }

    // Update job status to completed
    job.status = "completed";
    fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

    console.log(`[HLS Conversion] Successfully converted ${jobId} to HLS`);
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const errorStack = error?.stack || "";

    console.error(`[HLS Conversion] Error converting ${jobId}:`, {
      message: errorMessage,
      stack: errorStack,
      videoPath: job.videoPath,
      outputDir: job.outputDir,
    });

    // Update job status to failed with detailed error
    job.status = "failed";
    job.error = errorMessage;
    fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

    // Keep original MP4 file if conversion fails
    console.log(
      `[HLS Conversion] Keeping original MP4 file due to conversion failure: ${job.videoPath}`
    );

    // Log specific common issues with helpful guidance
    if (
      errorMessage.includes("FFmpeg") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("not installed") ||
      errorMessage.includes("cannot be executed")
    ) {
      console.warn(
        `[HLS Conversion] ⚠️ FFmpeg is not available. HLS conversion skipped.`
      );
      console.info(
        `[HLS Conversion] 💡 To enable HLS conversion, install FFmpeg:`
      );
      console.info(`[HLS Conversion]    Windows: winget install ffmpeg`);
      console.info(
        `[HLS Conversion]    Or set FFMPEG_PATH environment variable`
      );
      console.info(
        `[HLS Conversion] ✅ Original MP4 file is preserved and can still be played.`
      );
    }
    if (
      errorMessage.includes("ENOENT") ||
      errorMessage.includes("No such file")
    ) {
      console.error(
        `[HLS Conversion] File path issue detected. Check that video file exists: ${job.videoPath}`
      );
      console.error(
        `[HLS Conversion] Make sure VIDEO_BASE_DIR environment variable is set correctly.`
      );
    }
  }
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): HlsConversionJob | null {
  const jobFilePath = path.join(getJobsDir(), `${jobId}.json`);

  if (!fs.existsSync(jobFilePath)) {
    return null;
  }

  try {
    const jobData = fs.readFileSync(jobFilePath, "utf-8");
    return JSON.parse(jobData);
  } catch {
    return null;
  }
}

/**
 * Process pending jobs (can be called periodically)
 * @param maxConcurrent - Maximum number of conversions to run in parallel (default: 2)
 */
export async function processPendingJobs(
  maxConcurrent: number = 2
): Promise<void> {
  const jobsDir = getJobsDir();
  if (!fs.existsSync(jobsDir)) {
    return;
  }

  const files = fs.readdirSync(jobsDir);
  const jobFiles = files.filter((f) => f.endsWith(".json"));

  const pendingJobs: string[] = [];
  for (const file of jobFiles) {
    const jobFilePath = path.join(jobsDir, file);
    try {
      const jobData = fs.readFileSync(jobFilePath, "utf-8");
      const job: HlsConversionJob = JSON.parse(jobData);

      if (job.status === "pending") {
        pendingJobs.push(job.id);
      }
    } catch (error) {
      console.error(`[HLS Worker] Error reading job file ${file}:`, error);
    }
  }

  if (pendingJobs.length === 0) {
    return;
  }

  console.log(
    `[HLS Worker] Found ${pendingJobs.length} pending job(s), processing with max ${maxConcurrent} concurrent`
  );

  // Process jobs in parallel batches
  for (let i = 0; i < pendingJobs.length; i += maxConcurrent) {
    const batch = pendingJobs.slice(i, i + maxConcurrent);
    await Promise.all(
      batch.map((jobId) =>
        processHlsConversion(jobId).catch((error) => {
          console.error(`[HLS Worker] Error processing job ${jobId}:`, error);
        })
      )
    );
  }
}
