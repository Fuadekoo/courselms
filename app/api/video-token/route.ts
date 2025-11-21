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

