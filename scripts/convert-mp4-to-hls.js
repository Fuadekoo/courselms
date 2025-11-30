/**
 * Script to manually convert existing MP4 files to HLS format
 * 
 * Usage:
 *   node scripts/convert-mp4-to-hls.js --file <filename>
 *   node scripts/convert-mp4-to-hls.js --all
 * 
 * Options:
 *   --file <filename>  Convert a specific file
 *   --all              Convert all MP4 files in the course directory
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Get video directories
function getVideoDirectories() {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || 'fuad/course';
  
  const courseDir = videoBaseDir.startsWith('/') 
    ? path.resolve(videoBaseDir) 
    : path.resolve(process.cwd(), videoBaseDir);
    
  return { courseDir };
}

// Find FFmpeg (similar to hls-converter.ts)
async function findFFmpeg() {
  if (process.env.FFMPEG_PATH) {
    if (fs.existsSync(process.env.FFMPEG_PATH)) {
      return process.env.FFMPEG_PATH;
    }
  }
  
  try {
    await execAsync('ffmpeg -version');
    return 'ffmpeg';
  } catch {
    throw new Error('FFmpeg is not installed. Please install FFmpeg first.');
  }
}

// Convert single MP4 to HLS
async function convertToHLS(videoPath, outputDir, baseName) {
  const ffmpegPath = await findFFmpeg();
  
  console.log(`   Using FFmpeg: ${ffmpegPath}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const manifestPath = path.join(outputDir, `${baseName}.m3u8`);
  const variantPlaylistPattern = path.join(outputDir, `${baseName}_%v.m3u8`);
  
  // FFmpeg command for HLS conversion (same as in hls-converter.ts)
  const ffmpegCommand =
    `"${ffmpegPath}" -i "${videoPath}" ` +
    `-c:v libx264 -c:a aac -hls_time 4 -hls_playlist_type vod ` +
    // Stream 0: 1080p (HD) @ ~5Mbps
    `-map 0:v:0 -map 0:a:0 -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 10000k -s:v:0 1920x1080 -g:v:0 48 -x264-params:v:0 keyint=48:min-keyint=48:scenecut=0 -c:a:0 aac -b:a:0 128k ` +
    // Stream 1: 360p @ ~800kbps
    `-map 0:v:0 -map 0:a:0 -c:v:1 libx264 -b:v:1 800k -maxrate:v:1 900k -bufsize:v:1 1600k -s:v:1 640x360 -g:v:1 48 -x264-params:v:1 keyint=48:min-keyint=48:scenecut=0 -c:a:1 aac -b:a:1 96k ` +
    // Stream 2: 144p @ ~250kbps
    `-map 0:v:0 -map 0:a:0 -c:v:2 libx264 -b:v:2 250k -maxrate:v:2 300k -bufsize:v:2 600k -s:v:2 256x144 -g:v:2 48 -x264-params:v:2 keyint=48:min-keyint=48:scenecut=0 -c:a:2 aac -b:a:2 64k ` +
    `-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" ` +
    `-master_pl_name "${path.basename(manifestPath)}" ` +
    `-hls_segment_filename "${outputDir}/${baseName}_%v_%04d.ts" ` +
    `-hls_flags independent_segments+program_date_time ` +
    `-f hls "${variantPlaylistPattern}"`;
  
  console.log(`   Starting conversion...`);
  
  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 3600000, // 1 hour timeout
    });
    
    if (stderr) {
      // FFmpeg writes progress to stderr, which is normal
      console.log(`   Conversion progress logged...`);
    }
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('HLS manifest file was not created');
    }
    
    console.log(`   ✅ Conversion completed!`);
    console.log(`   Manifest: ${manifestPath}`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Conversion failed:`, error.message);
    throw error;
  }
}

async function convertSingleFile(filename, keepOriginal = false) {
  const { courseDir } = getVideoDirectories();
  const videoPath = path.join(courseDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    return;
  }
  
  // Check if already converted
  const baseName = filename.replace(/\.[^/.]+$/, '');
  const hlsDir = path.join(courseDir, baseName);
  const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);
  
  if (fs.existsSync(manifestPath)) {
    console.log(`⏭️  Already converted: ${filename}`);
    console.log(`   HLS directory: ${hlsDir}`);
    return;
  }
  
  console.log(`🔄 Converting: ${filename}`);
  console.log(`   Input: ${videoPath}`);
  console.log(`   Output directory: ${hlsDir}`);
  
  try {
    await convertToHLS(videoPath, hlsDir, baseName);
    
    // Delete original MP4 if conversion succeeded and keepOriginal is false
    if (!keepOriginal && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      console.log(`   🗑️  Deleted original MP4 file`);
    } else if (keepOriginal) {
      console.log(`   📦 Original MP4 file kept`);
    }
    
    console.log(`   ✨ Done!\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
}

async function convertAllFiles(keepOriginal = false) {
  const { courseDir } = getVideoDirectories();
  
  console.log(`📁 Scanning directory: ${courseDir}\n`);
  
  if (!fs.existsSync(courseDir)) {
    console.error(`❌ Course directory not found: ${courseDir}`);
    console.error(`   Set VIDEO_BASE_DIR environment variable if using a different path`);
    return;
  }
  
  // Get all MP4 files
  const files = fs.readdirSync(courseDir);
  const mp4Files = files.filter(file => {
    const filePath = path.join(courseDir, file);
    return fs.statSync(filePath).isFile() && 
           file.toLowerCase().endsWith('.mp4') &&
           !file.includes('_chunks'); // Skip chunk folders
  });
  
  if (mp4Files.length === 0) {
    console.log(`ℹ️  No MP4 files found in ${courseDir}`);
    return;
  }
  
  // Filter out already converted files
  const filesToConvert = mp4Files.filter(file => {
    const baseName = file.replace(/\.[^/.]+$/, '');
    const hlsDir = path.join(courseDir, baseName);
    const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);
    return !fs.existsSync(manifestPath);
  });
  
  if (filesToConvert.length === 0) {
    console.log(`✅ All MP4 files are already converted to HLS!\n`);
    return;
  }
  
  console.log(`📹 Found ${mp4Files.length} MP4 file(s), ${filesToConvert.length} need conversion:\n`);
  
  // Convert files one by one
  for (let i = 0; i < filesToConvert.length; i++) {
    const file = filesToConvert[i];
    console.log(`[${i + 1}/${filesToConvert.length}] ${file}`);
    await convertSingleFile(file, keepOriginal);
  }
  
  console.log(`\n✨ All conversions completed!`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const keepOriginal = args.includes('--keep-original');
const allFlag = args.includes('--all');
const fileIndex = args.indexOf('--file');

if (fileIndex !== -1 && args[fileIndex + 1]) {
  const filename = args[fileIndex + 1];
  convertSingleFile(filename, keepOriginal).then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (allFlag) {
  convertAllFiles(keepOriginal).then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  console.log(`
📹 MP4 to HLS Converter

Usage:
  node scripts/convert-mp4-to-hls.js --file <filename>       Convert a specific file
  node scripts/convert-mp4-to-hls.js --all                   Convert all MP4 files
  
Options:
  --keep-original    Keep original MP4 files (default: delete after conversion)

Examples:
  node scripts/convert-mp4-to-hls.js --file video.mp4
  node scripts/convert-mp4-to-hls.js --all
  node scripts/convert-mp4-to-hls.js --all --keep-original

Environment Variables:
  VIDEO_BASE_DIR     Video storage directory (default: fuad/course)
  FFMPEG_PATH        Custom FFmpeg path (optional)

Note: FFmpeg must be installed and accessible in your PATH
`);
  process.exit(0);
}

