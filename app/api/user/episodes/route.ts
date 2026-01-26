import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { historyQueries } from '@/lib/db';

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
    
    const episodes = historyQueries.getWatchedEpisodes.all(user.id, parseInt(mediaId));
    
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
    
    historyQueries.markEpisodeWatched.run(
      user.id,
      mediaId,
      season,
      episode,
      title,
      posterPath || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark episode error:', error);
    return NextResponse.json({ error: 'Failed to mark episode' }, { status: 500 });
  }
}
