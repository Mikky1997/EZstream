import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { favoritesQueries } from '@/lib/db';

// GET - Get user's favorites
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
      const result = favoritesQueries.check.get(user.id, mediaType, parseInt(mediaId));
      return NextResponse.json({ isFavorite: (result?.count || 0) > 0 });
    }
    
    const favorites = favoritesQueries.getForUser.all(user.id, Math.min(limit, 100));
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Failed to get favorites' }, { status: 500 });
  }
}

// POST - Add to favorites
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
    
    favoritesQueries.add.run(user.id, mediaType, mediaId, title, posterPath || null);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add to favorites error:', error);
    return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 });
  }
}

// DELETE - Remove from favorites
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
    
    favoritesQueries.remove.run(user.id, mediaType, parseInt(mediaId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return NextResponse.json({ error: 'Failed to remove from favorites' }, { status: 500 });
  }
}
