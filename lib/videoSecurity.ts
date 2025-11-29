import crypto from "crypto";

/**
 * Generate a secure token for video streaming
 * Token is valid for 30 minutes (longer for HLS streaming sessions)
 */
export function generateVideoToken(file: string): string {
  const timestamp = Date.now().toString();
  const secret = process.env.VIDEO_SECRET_KEY || "your-secret-key-change-this";
  
  const hash = crypto
    .createHash('sha256')
    .update(file + timestamp + secret)
    .digest('hex')
    .substring(0, 16);
  
  const token = `${timestamp}|${hash}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Verify video token
 * Supports HLS variant playlists by checking both the requested file and the master playlist
 */
export function verifyVideoToken(token: string, file: string): boolean {
  try {
    const secret = process.env.VIDEO_SECRET_KEY || "your-secret-key-change-this";
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, hash] = decoded.split('|');
    
    if (!timestamp || !hash) {
      return false;
    }
    
    // Check if token expired (30 minutes validity for HLS streaming)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 30 * 60 * 1000) {
      console.warn('[Video Security] Token expired:', { tokenAge, maxAge: 30 * 60 * 1000 });
      return false;
    }
    
    // For HLS variant playlists (e.g., video_0.m3u8, video_1.m3u8), also check master playlist
    // This allows a token generated for the master playlist to work for variant playlists
    const filesToCheck = [file];
    
    // Check if this is an HLS variant playlist (contains _0.m3u8, _1.m3u8, etc.)
    // Pattern: directory/baseName_variant.m3u8
    // Master playlist could be: directory/baseName/baseName.m3u8 OR directory/baseName.m3u8
    const variantMatch = file.match(/^(.+\/)?([^\/]+)_(\d+)\.m3u8$/);
    if (variantMatch) {
      const [, dir = '', baseName] = variantMatch;
      // Try both possible master playlist locations:
      // 1. Same directory: dir/baseName.m3u8
      // 2. Subdirectory: dir/baseName/baseName.m3u8
      if (dir) {
        filesToCheck.push(`${dir}${baseName}.m3u8`);
        filesToCheck.push(`${dir}${baseName}/${baseName}.m3u8`);
      } else {
        filesToCheck.push(`${baseName}.m3u8`);
        filesToCheck.push(`${baseName}/${baseName}.m3u8`);
      }
    }
    
    // Also check if it's a TS segment file (video_0_0001.ts)
    // Pattern: directory/baseName_variant_segment.ts
    // Master playlist could be: directory/baseName/baseName.m3u8 OR directory/baseName.m3u8
    const tsSegmentMatch = file.match(/^(.+\/)?([^\/]+)_(\d+)_(\d+)\.ts$/);
    if (tsSegmentMatch) {
      const [, dir = '', baseName] = tsSegmentMatch;
      // Try both possible master playlist locations:
      // 1. Same directory: dir/baseName.m3u8
      // 2. Subdirectory: dir/baseName/baseName.m3u8
      if (dir) {
        filesToCheck.push(`${dir}${baseName}.m3u8`);
        filesToCheck.push(`${dir}${baseName}/${baseName}.m3u8`);
      } else {
        filesToCheck.push(`${baseName}.m3u8`);
        filesToCheck.push(`${baseName}/${baseName}.m3u8`);
      }
    }
    
    // Try to verify against any of the possible file paths
    for (const fileToCheck of filesToCheck) {
      const expectedHash = crypto
        .createHash('sha256')
        .update(fileToCheck + timestamp + secret)
        .digest('hex')
        .substring(0, 16);
      
      if (hash === expectedHash) {
        return true;
      }
    }
    
    // If none matched, log the mismatch
    console.warn('[Video Security] Token hash mismatch for file:', file, {
      checkedFiles: filesToCheck,
      tokenTimestamp: timestamp
    });
    
    return false;
  } catch (error) {
    console.error('[Video Security] Token verification error:', error);
    return false;
  }
}

/**
 * Generate secure video URL with token
 */
export function generateSecureVideoUrl(file: string): string {
  const token = generateVideoToken(file);
  return `/api/stream?file=${encodeURIComponent(file)}&token=${token}`;
}

/**
 * Check if user agent is a download manager
 */
export function isDownloadManager(userAgent: string | undefined): boolean {
  if (!userAgent) return true;
  
  const blockedAgents = [
    'fdm', 'free download manager', 'internet download manager', 'idm',
    'wget', 'curl', 'aria2', 'axel', 'download', 'downloader',
    'getright', 'flashget', 'jdownloader', 'thunder', 'orbit',
    'go!zilla', 'utorrent', 'bittorrent', 'mass downloader',
  ];
  
  const ua = userAgent.toLowerCase();
  return blockedAgents.some(blocked => ua.includes(blocked));
}

