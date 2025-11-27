import { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, token } = req.query;

    if (!file || !token) {
      return res.status(400).json({ error: 'Missing file or token parameter' });
    }

    // Skip token validation for now
    // if (typeof token !== 'string' || !token.includes('|')) {
    //   return res.status(401).json({ error: 'Invalid token format' });
    // }

    // Construct file path
    const filePath = join(process.cwd(), 'fuad', 'course', file as string);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      const fileName = file as string;
      if (fileName.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (fileName.endsWith('.ts')) {
        contentType = 'video/mp2t';
      } else if (fileName.endsWith('.mp4')) {
        contentType = 'video/mp4';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(fileBuffer);
    } catch {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Stream API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}