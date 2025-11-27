import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { verifyVideoToken, isDownloadManager } from "@/lib/videoSecurity";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { file, token } = req.query;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'];

    // 1. Block download managers
    if (isDownloadManager(userAgent)) {
      res.status(404).send("Not Found");
      return;
    }

    // 2. Check referer (must come from your domain)
    if (!referer || !referer.includes(req.headers.host || '')) {
      res.status(403).send("Forbidden");
      return;
    }

    // 3. Validate file parameter
    if (!file || typeof file !== "string") {
      res.status(404).send("Not Found");
      return;
    }

    // 4. Verify token
    if (!verifyVideoToken(token as string, file)) {
      res.status(404).send("Not Found"); // Return 404 instead of 403 to confuse attackers
      return;
    }

    const safeFile = path.basename(file);
    const videoPath = path.resolve("./fuad/course", safeFile);

    if (!fs.existsSync(videoPath)) {
      res.status(404).send("File not found");
      return;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine content type based on file extension
    const fileExtension = safeFile.split('.').pop()?.toLowerCase() || '';
    let contentType = "video/mp4"; // Default
    
    if (fileExtension === "m3u8") {
      contentType = "application/vnd.apple.mpegurl";
    } else if (fileExtension === "ts") {
      contentType = "video/mp2t";
    } else if (fileExtension === "webm") {
      contentType = "video/webm";
    } else if (fileExtension === "avi") {
      contentType = "video/x-msvideo";
    } else if (fileExtension === "mov") {
      contentType = "video/quicktime";
    }

    // Add security headers
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // For HLS manifest files (.m3u8), don't use range requests
    if (fileExtension === "m3u8") {
      const content = fs.readFileSync(videoPath, "utf-8");
      res.writeHead(200, {
        "Content-Length": Buffer.byteLength(content, "utf-8"),
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*", // HLS.js needs CORS
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range",
      });
      res.end(content);
      return;
    }

    // ✅ Safari fix — handle both range and full requests for video files
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      file.pipe(res);
    } else {
      // ✅ Safari fallback — send entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).send("Internal server error");
  }
}
