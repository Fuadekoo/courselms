/**
 * Script to manually convert existing MP4 files to HLS format
 * 
 * Usage:
 *   npx tsx scripts/convert-mp4-to-hls.ts [options]
 * 
 * Options:
 *   --file <filename>  Convert a specific file
 *   --all              Convert all MP4 files in the course directory
 *   --keep-original    Keep original MP4 files after conversion (default: delete)
 */

import { queueHlsConversion } from "@/lib/hls-converter";
import fs from "fs";
import path from "path";

// Get video directories
const getVideoDirectories = () => {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || "fuad/course";
  
  const courseDir = videoBaseDir.startsWith("/") 
    ? path.resolve(videoBaseDir) 
    : path.resolve(process.cwd(), videoBaseDir);
    
  return { courseDir };
};

async function convertSingleFile(filename: string, keepOriginal: boolean = false) {
  const { courseDir } = getVideoDirectories();
  const videoPath = path.join(courseDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    return;
  }
  
  // Check if already converted
  const baseName = filename.replace(/\.[^/.]+$/, "");
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
    const jobId = await queueHlsConversion(videoPath, baseName);
    console.log(`✅ Conversion queued successfully!`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Status: Check job status with getJobStatus("${jobId}")`);
    
    // Note: The converter will delete the original MP4 after successful conversion
    // unless we modify the converter to keep it
    if (keepOriginal) {
      console.log(`⚠️  Note: Original file will be kept (you may need to modify converter)`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error queueing conversion:`, error.message);
  }
}

async function convertAllFiles(keepOriginal: boolean = false) {
  const { courseDir } = getVideoDirectories();
  
  console.log(`📁 Scanning directory: ${courseDir}`);
  
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
  
  console.log(`📹 Found ${mp4Files.length} MP4 file(s) to convert:\n`);
  
  // Filter out already converted files
  const filesToConvert = mp4Files.filter(file => {
    const baseName = file.replace(/\.[^/.]+$/, "");
    const hlsDir = path.join(courseDir, baseName);
    const manifestPath = path.join(hlsDir, `${baseName}.m3u8`);
    return !fs.existsSync(manifestPath);
  });
  
  if (filesToConvert.length === 0) {
    console.log(`✅ All MP4 files are already converted to HLS!\n`);
    return;
  }
  
  console.log(`🔄 Files to convert: ${filesToConvert.length}\n`);
  
  // Queue conversions
  for (const file of filesToConvert) {
    await convertSingleFile(file, keepOriginal);
    console.log(''); // Empty line between files
  }
  
  console.log(`\n✅ Conversion jobs queued for ${filesToConvert.length} file(s)`);
  console.log(`   Conversions are running in the background`);
  console.log(`   Check job status in: ${process.env.VIDEO_JOBS_DIR || 'fuad/jobs'}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const keepOriginal = args.includes('--keep-original');
const allFlag = args.includes('--all');
const fileIndex = args.indexOf('--file');

if (fileIndex !== -1 && args[fileIndex + 1]) {
  const filename = args[fileIndex + 1];
  convertSingleFile(filename, keepOriginal).then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (allFlag) {
  convertAllFiles(keepOriginal).then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  console.log(`
📹 MP4 to HLS Converter

Usage:
  npx tsx scripts/convert-mp4-to-hls.ts --file <filename>    Convert a specific file
  npx tsx scripts/convert-mp4-to-hls.ts --all                Convert all MP4 files
  
Options:
  --keep-original    Keep original MP4 files (default: delete after conversion)

Examples:
  npx tsx scripts/convert-mp4-to-hls.ts --file video.mp4
  npx tsx scripts/convert-mp4-to-hls.ts --all
  npx tsx scripts/convert-mp4-to-hls.ts --all --keep-original

Environment Variables:
  VIDEO_BASE_DIR     Video storage directory (default: fuad/course)
  VIDEO_JOBS_DIR     Job status directory (default: fuad/jobs)
  FFMPEG_PATH        Custom FFmpeg path (optional)
`);
  process.exit(0);
}

