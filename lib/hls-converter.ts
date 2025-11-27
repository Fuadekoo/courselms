import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);
const COURSE_DIR = path.join(process.cwd(), "fuad", "course");
const JOBS_DIR = path.join(process.cwd(), "fuad", "jobs");

/**
 * Find FFmpeg executable path
 * Checks system PATH and common installation locations
 */
async function findFFmpeg(): Promise<string> {
  const platform = os.platform();
  
  // Get system PATH dynamically on Windows
  let systemPath = process.env.Path || process.env.PATH || '';
  
  if (platform === 'win32') {
    // Try to get fresh PATH from system registry
    try {
      const { stdout } = await execAsync(
        'powershell -Command "[Environment]::GetEnvironmentVariable(\'Path\', \'Machine\') + \';\' + [Environment]::GetEnvironmentVariable(\'Path\', \'User\')"',
        { timeout: 5000 }
      );
      if (stdout && stdout.trim()) {
        systemPath = stdout.trim();
      }
    } catch (error) {
      // Fallback to process.env if PowerShell command fails
      console.log('[FFmpeg] Could not refresh PATH from registry, using process.env');
    }
  }

  // Common Windows installation paths (including WinGet installation)
  const localAppData = process.env['LOCALAPPDATA'] || '';
  const windowsPaths = [
    // WinGet installation location
    path.join(localAppData, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-8.0.1-full_build', 'bin', 'ffmpeg.exe'),
    // Other common WinGet paths (version-agnostic)
    path.join(localAppData, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', '**', 'bin', 'ffmpeg.exe'),
    // WindowsApps
    path.join(localAppData, 'Microsoft', 'WindowsApps', 'ffmpeg.exe'),
    // Standard installation paths
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
  ];

  // Try to find FFmpeg using 'where' on Windows or 'which' on Unix
  try {
    const findCommand = platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    const { stdout } = await execAsync(findCommand, {
      env: { ...process.env, Path: systemPath, PATH: systemPath },
    });
    const ffmpegPath = stdout.trim().split('\n')[0].trim();
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      return ffmpegPath;
    }
  } catch (error) {
    // Continue to check common paths
  }

  // Check common Windows paths
  if (platform === 'win32') {
    for (const testPath of windowsPaths) {
      try {
        // Skip wildcard paths (handle separately if needed)
        if (testPath.includes('**')) {
          continue;
        }
        
        if (fs.existsSync(testPath)) {
          console.log(`[FFmpeg] Found at: ${testPath}`);
          return testPath;
        }
        // Try without .exe extension
        const pathWithoutExt = testPath.replace(/\.exe$/, '');
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
      const appData = process.env['LOCALAPPDATA'] || '';
      const winGetBase = path.join(appData, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe');
      if (fs.existsSync(winGetBase)) {
        const dirs = fs.readdirSync(winGetBase);
        for (const dir of dirs) {
          const ffmpegPath = path.join(winGetBase, dir, 'bin', 'ffmpeg.exe');
          if (fs.existsSync(ffmpegPath)) {
            console.log(`[FFmpeg] Found WinGet installation at: ${ffmpegPath}`);
            return ffmpegPath;
          }
        }
      }
    } catch (error) {
      // Continue to next method
    }
  }

  // Fallback: try direct execution
  try {
    await execAsync('ffmpeg -version', {
      env: { ...process.env, Path: systemPath, PATH: systemPath },
    });
    return 'ffmpeg'; // It's in PATH
  } catch {
    throw new Error('FFmpeg is not installed. Please install FFmpeg to enable HLS conversion.');
  }
}

// Ensure jobs directory exists
if (!fs.existsSync(JOBS_DIR)) {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}

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
 * Add a job to the conversion queue
 */
export async function queueHlsConversion(
  videoPath: string,
  baseName: string
): Promise<string> {
  const jobId = `${baseName}-${Date.now()}`;
  const outputDir = path.join(COURSE_DIR, baseName);
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

  const jobFilePath = path.join(JOBS_DIR, `${jobId}.json`);
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
  const jobFilePath = path.join(JOBS_DIR, `${jobId}.json`);

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

  // Update status to processing
  job.status = "processing";
  fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

  try {
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

    // FFmpeg command to convert MP4 to adaptive HLS with multiple quality levels
    // Creates adaptive bitrate streaming with 3 quality levels: 1080p (5Mbps), 360p (800kbps), 144p (250kbps)
    // Using HLS variant streams for proper adaptive bitrate streaming
    const variantPlaylistPattern = path.join(
      job.outputDir,
      `${job.baseName}_%v.m3u8`
    );
    const ffmpegCommand =
      `"${ffmpegPath}" -i "${job.videoPath}" ` +
      `-c:v libx264 -c:a aac -hls_time 4 -hls_playlist_type vod ` +
      // Stream 0: 1080p (HD) @ ~5Mbps
      `-map 0:v:0 -map 0:a:0 -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -x264-params:v:0 keyint=48:min-keyint=48:scenecut=0 -c:a:0 aac -b:a:0 128k ` +
      // Stream 1: 360p @ ~800kbps
      `-map 0:v:0 -map 0:a:0 -c:v:1 libx264 -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -x264-params:v:1 keyint=48:min-keyint=48:scenecut=0 -c:a:1 aac -b:a:1 96k ` +
      // Stream 2: 144p @ ~250kbps
      `-map 0:v:0 -map 0:a:0 -c:v:2 libx264 -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -x264-params:v:2 keyint=48:min-keyint=48:scenecut=0 -c:a:2 aac -b:a:2 64k ` +
      `-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" ` +
      `-master_pl_name "${path.basename(job.manifestPath)}" ` +
      `-hls_segment_filename "${job.outputDir}/${job.baseName}_%v_%04d.ts" ` +
      `-hls_flags independent_segments+program_date_time ` +
      `-f hls "${variantPlaylistPattern}"`;

    console.log(`[HLS Conversion] Starting conversion for job ${jobId}`);
    console.log(`[HLS Conversion] Command: ${ffmpegCommand}`);

    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 3600000, // 1 hour timeout for large videos
      env: { ...process.env }, // Pass environment variables
    });

    if (stderr) {
      console.log(`[HLS Conversion] FFmpeg stderr: ${stderr}`);
    }

    // Verify manifest file was created
    if (!fs.existsSync(job.manifestPath)) {
      throw new Error("HLS manifest file was not created");
    }

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
    console.error(`[HLS Conversion] Error converting ${jobId}:`, error);

    // Update job status to failed
    job.status = "failed";
    job.error = error.message || "Unknown error";
    fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

    // Keep original MP4 file if conversion fails
    console.log(
      `[HLS Conversion] Keeping original MP4 file due to conversion failure`
    );
  }
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): HlsConversionJob | null {
  const jobFilePath = path.join(JOBS_DIR, `${jobId}.json`);

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
 */
export async function processPendingJobs(): Promise<void> {
  if (!fs.existsSync(JOBS_DIR)) {
    return;
  }

  const files = fs.readdirSync(JOBS_DIR);
  const jobFiles = files.filter((f) => f.endsWith(".json"));

  for (const file of jobFiles) {
    const jobFilePath = path.join(JOBS_DIR, file);
    try {
      const jobData = fs.readFileSync(jobFilePath, "utf-8");
      const job: HlsConversionJob = JSON.parse(jobData);

      if (job.status === "pending") {
        console.log(`[HLS Worker] Processing pending job: ${job.id}`);
        await processHlsConversion(job.id);
      }
    } catch (error) {
      console.error(`[HLS Worker] Error processing job file ${file}:`, error);
    }
  }
}
