import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { historyQueries } from '@/lib/db';
import { safeParseInt, sanitizeString } from '@/lib/security';

// GET - Get user's watch history
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = safeParseInt(searchParams.get('limit'), 20, 1, 100);
    
    const history = historyQueries.getForUser.all(user.id, user.id, limit);
    
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
    
    // Input validation
    if (!mediaType || !mediaId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate mediaType
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    
    // Validate and sanitize inputs
    const sanitizedTitle = sanitizeString(title, 500);
    const sanitizedPosterPath = posterPath ? sanitizeString(posterPath, 500) : null;
    const validatedMediaId = safeParseInt(String(mediaId), 0, 1, Number.MAX_SAFE_INTEGER);
    const validatedSeason: number | null = season ? (safeParseInt(String(season), undefined, 1, 1000) ?? null) : null;
    const validatedEpisode: number | null = episode ? (safeParseInt(String(episode), undefined, 1, 1000) ?? null) : null;
    const validatedProgress = safeParseInt(String(progressSeconds || 0), 0, 0, Number.MAX_SAFE_INTEGER);
    const validatedDuration = safeParseInt(String(durationSeconds || 0), 0, 0, Number.MAX_SAFE_INTEGER);
    
    if (validatedMediaId === 0) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }
    
    historyQueries.upsert.run(
      user.id,
      mediaType,
      validatedMediaId,
      sanitizedTitle,
      sanitizedPosterPath,
      validatedSeason,
      validatedEpisode,
      validatedProgress,
      validatedDuration
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
    
    // Validate mediaType
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    
    const validatedMediaId = safeParseInt(mediaId, 0, 1, Number.MAX_SAFE_INTEGER);
    if (validatedMediaId === 0) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }
    
    historyQueries.delete.run(user.id, mediaType, validatedMediaId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
