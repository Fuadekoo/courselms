import { NextRequest, NextResponse } from 'next/server';
import { generateVideoToken } from '@/lib/videoSecurity';

export async function POST(request: NextRequest) {
  try {
    const { file } = await request.json();
    
    if (!file || typeof file !== 'string') {
      return NextResponse.json(
        { error: 'Invalid file parameter' },
        { status: 400 }
      );
    }
    
    // Reject external URLs (http/https) - tokens are only for local files
    if (file.startsWith('http://') || file.startsWith('https://')) {
      console.error('[Video Token] External URL rejected:', file);
      return NextResponse.json(
        { error: 'External URLs are not supported. Tokens are only generated for local files.' },
        { status: 400 }
      );
    }
    
    // Reject blob URLs - they don't need tokens
    if (file.startsWith('blob:')) {
      console.error('[Video Token] Blob URL rejected:', file);
      return NextResponse.json(
        { error: 'Blob URLs are not supported. Use the blob URL directly.' },
        { status: 400 }
      );
    }
    
    // TODO: Add authentication check here
    // Verify user has access to this video
    // const session = await getServerSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const token = generateVideoToken(file);
    const secureUrl = `/api/stream?file=${encodeURIComponent(file)}&token=${token}`;
    
    return NextResponse.json({
      token,
      url: secureUrl,
      expiresIn: 300, // 5 minutes
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

