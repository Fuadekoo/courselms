import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get('file');
    const token = searchParams.get('token');

    if (!file || !token) {
      return NextResponse.json(
        { error: 'Missing file or token parameter' },
        { status: 400 }
      );
    }

    // Decode the file path (in case it's URL encoded)
    const decodedFile = decodeURIComponent(file);

    // Construct file path
    const filePath = join(process.cwd(), 'fuad', 'course', decodedFile);
    
    console.log('[Stream API] Requested file:', decodedFile);
    console.log('[Stream API] Full path:', filePath);

    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      const fileName = decodedFile.toLowerCase();
      if (fileName.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (fileName.endsWith('.ts')) {
        contentType = 'video/mp2t';
      } else if (fileName.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (fileName.endsWith('.webm')) {
        contentType = 'video/webm';
      }

      // Set CORS headers for HLS streaming
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (fileError: any) {
      console.error('[Stream API] File not found:', {
        filePath,
        decodedFile,
        error: fileError?.message,
      });
      return NextResponse.json(
        { error: 'File not found', path: decodedFile },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('[Stream API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


