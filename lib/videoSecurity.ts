import crypto from "crypto";

/**
 * Generate a secure token for video streaming
 * Token is valid for 5 minutes
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
 */
export function verifyVideoToken(token: string, file: string): boolean {
  try {
    const secret = process.env.VIDEO_SECRET_KEY || "your-secret-key-change-this";
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, hash] = decoded.split('|');
    
    // Check if token expired (5 minutes validity)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 5 * 60 * 1000) return false;
    
    // Verify hash
    const expectedHash = crypto
      .createHash('sha256')
      .update(file + timestamp + secret)
      .digest('hex')
      .substring(0, 16);
    
    return hash === expectedHash;
  } catch {
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

