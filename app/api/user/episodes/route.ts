import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { historyQueries } from '@/lib/db';
import { safeParseInt, sanitizeString } from '@/lib/security';

// GET - Get watched episodes for a TV show
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    
    if (!mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
    }
    
    const validatedMediaId = safeParseInt(mediaId, 0, 1, Number.MAX_SAFE_INTEGER);
    if (validatedMediaId === 0) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }
    
    const episodes = historyQueries.getWatchedEpisodes.all(user.id, validatedMediaId);
    
    // Convert to a map for easy lookup: { "1-1": true, "1-2": true, ... }
    const watchedMap: Record<string, boolean> = {};
    episodes.forEach(ep => {
      if (ep.season !== null && ep.episode !== null) {
        watchedMap[`${ep.season}-${ep.episode}`] = ep.progress_seconds > 60;
      }
    });
    
    return NextResponse.json({ watched: watchedMap });
  } catch (error) {
    console.error('Get episodes error:', error);
    return NextResponse.json({ error: 'Failed to get episodes' }, { status: 500 });
  }
}

// POST - Mark episode as watched
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { mediaId, season, episode, title, posterPath } = body;
    
    if (!mediaId || !season || !episode || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate and sanitize inputs
    const validatedMediaId = safeParseInt(String(mediaId), 0, 1, Number.MAX_SAFE_INTEGER);
    const validatedSeason = safeParseInt(String(season), 0, 1, 1000);
    const validatedEpisode = safeParseInt(String(episode), 0, 1, 1000);
    const sanitizedTitle = sanitizeString(title, 500);
    const sanitizedPosterPath = posterPath ? sanitizeString(posterPath, 500) : null;
    
    if (validatedMediaId === 0 || validatedSeason === 0 || validatedEpisode === 0) {
      return NextResponse.json({ error: 'Invalid input values' }, { status: 400 });
    }
    
    historyQueries.markEpisodeWatched.run(
      user.id,
      validatedMediaId,
      validatedSeason,
      validatedEpisode,
      sanitizedTitle,
      sanitizedPosterPath
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark episode error:', error);
    return NextResponse.json({ error: 'Failed to mark episode' }, { status: 500 });
  }
}
