import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { watchlistQueries } from '@/lib/db';

// GET - Get user's watchlist
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Check if we're just checking a specific item
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    
    if (mediaType && mediaId) {
      const result = watchlistQueries.check.get(user.id, mediaType, parseInt(mediaId));
      return NextResponse.json({ inWatchlist: (result?.count || 0) > 0 });
    }
    
    const watchlist = watchlistQueries.getForUser.all(user.id, Math.min(limit, 100));
    
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json({ error: 'Failed to get watchlist' }, { status: 500 });
  }
}

// POST - Add to watchlist
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { mediaType, mediaId, title, posterPath } = body;
    
    if (!mediaType || !mediaId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    watchlistQueries.add.run(user.id, mediaType, mediaId, title, posterPath || null);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE - Remove from watchlist
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
    
    watchlistQueries.remove.run(user.id, mediaType, parseInt(mediaId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
