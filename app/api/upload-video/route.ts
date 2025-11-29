import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { queueHlsConversion } from "@/lib/hls-converter";

// Use environment variable if set, otherwise fallback to default path
const getVideoDirectories = () => {
  const videoBaseDir = process.env.VIDEO_BASE_DIR || 'fuad/course';
  if (videoBaseDir.startsWith('/')) {
    // Absolute path
    const fullPath = path.resolve(videoBaseDir);
    return {
      uploadDir: path.dirname(fullPath),
      courseDir: fullPath
    };
  } else {
    // Relative path from process.cwd()
    const parts = videoBaseDir.split('/');
    const uploadDir = path.join(process.cwd(), ...parts.slice(0, -1));
    const courseDir = path.join(process.cwd(), ...parts);
    return { uploadDir, courseDir };
  }
};

const { uploadDir: UPLOAD_DIR, courseDir: COURSE_DIR } = getVideoDirectories();

function getTimestampUUID(ext: string) {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
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
    
    if (!fs.existsSync(chunkFolder)) {
      fs.mkdirSync(chunkFolder, { recursive: true });
    }

    const chunkPath = path.join(chunkFolder, `chunk_${chunkIndex}`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    fs.writeFileSync(chunkPath, chunkBuffer);

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
      } catch (err) {
        console.error("Error joining chunks:", err);
        return NextResponse.json(
          { error: "Error joining chunks" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, filename: finalFilename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
