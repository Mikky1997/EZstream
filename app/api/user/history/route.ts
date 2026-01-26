import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { historyQueries } from '@/lib/db';

// GET - Get user's watch history
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const history = historyQueries.getForUser.all(user.id, user.id, Math.min(limit, 100));
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 });
  }
}

// POST - Update watch progress
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      mediaType, 
      mediaId, 
      title, 
      posterPath, 
      season, 
      episode, 
      progressSeconds, 
      durationSeconds 
    } = body;
    
    if (!mediaType || !mediaId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    historyQueries.upsert.run(
      user.id,
      mediaType,
      mediaId,
      title,
      posterPath || null,
      season || null,
      episode || null,
      progressSeconds || 0,
      durationSeconds || 0
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update history error:', error);
    return NextResponse.json({ error: 'Failed to update history' }, { status: 500 });
  }
}

// DELETE - Remove from history
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    
    if (!mediaType || !mediaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    historyQueries.delete.run(user.id, mediaType, parseInt(mediaId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
