import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { queueHlsConversion } from "@/lib/hls-converter";

// Use environment variable if set, otherwise fallback to default path
// Lazy initialization to avoid executing during build time
const getVideoDirectories = () => {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || 'fuad/course';
  const cwd = process.cwd();
  
  console.log(`[Upload] process.cwd(): ${cwd}`);
  console.log(`[Upload] VIDEO_BASE_DIR: ${process.env.VIDEO_BASE_DIR || 'not set (using default)'}`);
  console.log(`[Upload] videoBaseDir: ${videoBaseDir}`);
  
  if (videoBaseDir.startsWith('/')) {
    // Absolute path - use as is
    const fullPath = path.resolve(videoBaseDir);
    console.log(`[Upload] Using absolute path: ${fullPath}`);
    return {
      uploadDir: path.dirname(fullPath),
      courseDir: fullPath
    };
  } else {
    // Relative path from process.cwd()
    // Ensure we're not at root - if cwd is /, something is wrong
    if (cwd === '/' || cwd === '') {
      console.error(`[Upload] WARNING: process.cwd() is '${cwd}'. This is likely wrong.`);
      // Try to use a more reliable path - look for package.json or .next directory
      const possiblePaths = [
        path.join(__dirname, '../../..'), // Go up from .next/server/app/api/upload-video
        path.join(process.env.PWD || '', videoBaseDir), // Use PWD if available
      ];
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(path.join(possiblePath, 'package.json')) || fs.existsSync(path.join(possiblePath, '.next'))) {
          const resolvedPath = path.resolve(possiblePath, videoBaseDir);
          console.log(`[Upload] Using fallback path resolution: ${resolvedPath}`);
          return {
            uploadDir: path.dirname(resolvedPath),
            courseDir: resolvedPath
          };
        }
      }
    }
    
    const courseDir = path.resolve(cwd, videoBaseDir);
    const uploadDir = path.dirname(courseDir);
    console.log(`[Upload] Resolved relative path: ${courseDir}`);
    return { uploadDir, courseDir };
  }
};

// Lazy getters
let _UPLOAD_DIR: string | null = null;
let _COURSE_DIR: string | null = null;

const getUploadDir = () => {
  if (!_UPLOAD_DIR) {
    _UPLOAD_DIR = getVideoDirectories().uploadDir;
  }
  return _UPLOAD_DIR;
};

const getCourseDir = () => {
  if (!_COURSE_DIR) {
    _COURSE_DIR = getVideoDirectories().courseDir;
    
    // Safety check: if path starts with /fuad (absolute from root), it's likely wrong
    // This happens when process.cwd() is / instead of project root
    if (_COURSE_DIR.startsWith('/fuad/') && !process.env.VIDEO_BASE_DIR?.startsWith('/')) {
      console.warn(`[Upload] Detected incorrect absolute path: ${_COURSE_DIR}`);
      console.warn(`[Upload] Attempting to fix by using project root detection...`);
      
      // Try to find project root by looking for .next or package.json
      let projectRoot = process.cwd();
      const maxDepth = 10;
      let depth = 0;
      
      while (depth < maxDepth && projectRoot !== '/' && projectRoot !== '') {
        if (fs.existsSync(path.join(projectRoot, '.next')) || fs.existsSync(path.join(projectRoot, 'package.json'))) {
          break;
        }
        projectRoot = path.dirname(projectRoot);
        depth++;
      }
      
      if (projectRoot && projectRoot !== '/' && fs.existsSync(path.join(projectRoot, '.next'))) {
        const correctedPath = path.resolve(projectRoot, 'fuad/course');
        console.log(`[Upload] Corrected path from ${_COURSE_DIR} to ${correctedPath}`);
        _COURSE_DIR = correctedPath;
      } else {
        console.error(`[Upload] Could not determine project root. Using: ${_COURSE_DIR}`);
      }
    }
    
    console.log(`[Upload] Final course directory: ${_COURSE_DIR}`);
    console.log(`[Upload] Directory exists: ${fs.existsSync(_COURSE_DIR)}`);
    
    // Check permissions
    try {
      fs.accessSync(_COURSE_DIR, fs.constants.R_OK | fs.constants.W_OK);
      console.log(`[Upload] Directory is readable and writable`);
    } catch (permError: any) {
      console.error(`[Upload] Permission check failed:`, {
        error: permError.message,
        code: permError.code
      });
    }
    
    // Ensure directory exists with proper error handling
    if (!fs.existsSync(_COURSE_DIR)) {
      try {
        fs.mkdirSync(_COURSE_DIR, { recursive: true });
        console.log(`[Upload] Created course directory: ${_COURSE_DIR}`);
      } catch (error: any) {
        console.error(`[Upload] Failed to create course directory: ${_COURSE_DIR}`, {
          error: error.message,
          code: error.code,
          errno: error.errno
        });
        throw new Error(`Cannot create video directory: ${_COURSE_DIR}. ${error.message}`);
      }
    } else {
      console.log(`[Upload] Using existing directory: ${_COURSE_DIR}`);
    }
  }
  return _COURSE_DIR;
};

function getTimestampUUID(ext: string) {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Get course directory (lazy initialization)
    const COURSE_DIR = getCourseDir();
    
    const formData = await req.formData();
    const chunk = formData.get("chunk") as File;
    const filename = formData.get("filename") as string;
    const chunkIndex = formData.get("chunkIndex") as string;
    const totalChunks = formData.get("totalChunks") as string;

    if (!chunk) {
      return NextResponse.json(
        { error: "Chunk file missing" },
        { status: 400 }
      );
    }

    let finalFilename = filename;
    if (!finalFilename || finalFilename === "") {
      const ext = chunk.name.split('.').pop() || "mp4";
      finalFilename = getTimestampUUID(ext);
    }

    const chunkFolder = path.join(
      COURSE_DIR,
      finalFilename.replace(/\.[^/.]+$/, "") + "_chunks"
    );
    
    try {
      if (!fs.existsSync(chunkFolder)) {
        fs.mkdirSync(chunkFolder, { recursive: true });
      }
    } catch (dirError: any) {
      console.error(`[Upload] Failed to create chunk folder: ${chunkFolder}`, {
        error: dirError.message,
        code: dirError.code,
        courseDir: COURSE_DIR
      });
      return NextResponse.json(
        { 
          error: "Failed to create upload directory",
          details: dirError.message,
          path: chunkFolder
        },
        { status: 500 }
      );
    }

    const chunkPath = path.join(chunkFolder, `chunk_${chunkIndex}`);
    try {
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
      fs.writeFileSync(chunkPath, chunkBuffer);
    } catch (writeError: any) {
      console.error(`[Upload] Failed to write chunk: ${chunkPath}`, {
        error: writeError.message,
        code: writeError.code,
        chunkIndex,
        totalChunks
      });
      return NextResponse.json(
        { 
          error: "Failed to write chunk file",
          details: writeError.message,
          chunkIndex
        },
        { status: 500 }
      );
    }

    if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
      // Preserve original file extension (support HLS .m3u8 and other formats)
      const fileExtension = finalFilename.split('.').pop() || 'mp4';
      const baseName = finalFilename.replace(/\.[^/.]+$/, "");
      const videoPath = path.join(COURSE_DIR, `${baseName}.${fileExtension}`);
      
      try {
        const chunks = [];
        for (let i = 0; i < parseInt(totalChunks); i++) {
          const chunkFilePath = path.join(chunkFolder, `chunk_${i}`);
          if (fs.existsSync(chunkFilePath)) {
            chunks.push(fs.readFileSync(chunkFilePath));
          }
        }
        
        const finalBuffer = Buffer.concat(chunks);
        fs.writeFileSync(videoPath, finalBuffer);
        fs.rmSync(chunkFolder, { recursive: true, force: true });
        
        // If uploaded file is MP4, queue it for HLS conversion in background
        if (fileExtension.toLowerCase() === 'mp4') {
          try {
            const jobId = await queueHlsConversion(videoPath, baseName);
            console.log(`[Upload] Queued HLS conversion job: ${jobId}`);
            
            // Return immediately with job ID and original filename
            // The conversion will happen in the background
            return NextResponse.json({ 
              success: true, 
              filename: `${baseName}.${fileExtension}`, // Keep original for now
              jobId: jobId,
              converting: true,
              message: "Video uploaded. HLS conversion in progress..."
            });
          } catch (conversionError: any) {
            console.error("Error queueing HLS conversion:", conversionError);
            // If queueing fails, return original file
            return NextResponse.json({ 
              success: true, 
              filename: `${baseName}.${fileExtension}`,
              converting: false,
              error: conversionError.message || "Failed to queue HLS conversion"
            });
          }
        }
        
        return NextResponse.json({ success: true, filename: `${baseName}.${fileExtension}` });
      } catch (err: any) {
        console.error("[Upload] Error joining chunks:", {
          error: err.message,
          stack: err.stack,
          code: err.code,
          videoPath,
          chunkFolder,
          totalChunks
        });
        return NextResponse.json(
          { 
            error: "Error joining chunks",
            details: err.message,
            code: err.code
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, filename: finalFilename });
  } catch (error: any) {
    console.error("[Upload] Upload error:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error.message || "Unknown error",
        code: error.code
      },
      { status: 500 }
    );
  }
}
