import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { watchlistQueries } from '@/lib/db';
import { safeParseInt, sanitizeString } from '@/lib/security';

// GET - Get user's watchlist
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = safeParseInt(searchParams.get('limit'), 50, 1, 100);
    
    // Check if we're just checking a specific item
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    
    if (mediaType && mediaId) {
      if (mediaType !== 'movie' && mediaType !== 'tv') {
        return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
      }
      const validatedMediaId = safeParseInt(mediaId, 0, 1, Number.MAX_SAFE_INTEGER);
      if (validatedMediaId === 0) {
        return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
      }
      const result = watchlistQueries.check.get(user.id, mediaType, validatedMediaId);
      return NextResponse.json({ inWatchlist: (result?.count || 0) > 0 });
    }
    
    const watchlist = watchlistQueries.getForUser.all(user.id, limit);
    
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
    
    // Validate mediaType
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    
    // Validate and sanitize inputs
    const validatedMediaId = safeParseInt(String(mediaId), 0, 1, Number.MAX_SAFE_INTEGER);
    if (validatedMediaId === 0) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }
    
    const sanitizedTitle = sanitizeString(title, 500);
    const sanitizedPosterPath = posterPath ? sanitizeString(posterPath, 500) : null;
    
    watchlistQueries.add.run(user.id, mediaType, validatedMediaId, sanitizedTitle, sanitizedPosterPath);
    
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
    
    // Validate mediaType
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    
    const validatedMediaId = safeParseInt(mediaId, 0, 1, Number.MAX_SAFE_INTEGER);
    if (validatedMediaId === 0) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }
    
    watchlistQueries.remove.run(user.id, mediaType, validatedMediaId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
