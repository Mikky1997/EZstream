'use client';

import { useState, useEffect } from 'react';
import MovieCard from '@/app/components/MovieCard';
import type { TVShow } from '@/types';

const ANIME_CATEGORIES = [
  { id: 'popular', name: 'Popular', sortBy: 'popularity.desc' },
  { id: 'top_rated', name: 'Top Rated', sortBy: 'vote_average.desc' },
  { id: 'new', name: 'New Releases', sortBy: 'first_air_date.desc' },
];

export default function BrowseAnime() {
  const [anime, setAnime] = useState<TVShow[]>([]);
  const [movies, setMovies] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [activeTab, setActiveTab] = useState<'tv' | 'movies'>('tv');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadAnime(true);
  }, [selectedCategory, activeTab]);

  const loadAnime = async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const category = ANIME_CATEGORIES.find(c => c.id === selectedCategory);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort_by: category?.sortBy || 'popularity.desc',
        language: 'ja',
        genre: '16', // Animation
      });

      const endpoint = activeTab === 'tv' ? '/api/browse/tv' : '/api/browse/movies';
      const response = await fetch(`${endpoint}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          if (activeTab === 'tv') {
            setAnime(data.results || []);
          } else {
            setMovies(data.results || []);
          }
          setPage(1);
        } else {
          if (activeTab === 'tv') {
            setAnime(prev => [...prev, ...(data.results || [])]);
          } else {
            setMovies(prev => [...prev, ...(data.results || [])]);
          }
        }
        setHasMore((data.results?.length || 0) >= 20);
      }
    } catch (err) {
      console.error('Failed to load anime:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadAnime(false);
  };

  const currentItems = activeTab === 'tv' ? anime : movies;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Anime</h1>
        <p className="text-gray-400 mb-6">Japanese animation series and movies</p>

        {/* Tab Selector */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('tv')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'tv'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📺 Anime Series
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'movies'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🎬 Anime Movies
          </button>
        </div>

        {/* Audio Info Box */}
        <div className="mb-6 bg-purple-900/30 border border-purple-500 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-2">Sub vs Dub</h3>
          <p className="text-purple-100 text-sm">
            When watching anime, you can choose between audio options on the watch page:
          </p>
          <ul className="text-purple-100 text-sm mt-2 list-disc list-inside">
            <li><strong>SUB</strong> - Japanese audio with English subtitles (original)</li>
            <li><strong>DUB</strong> - English dubbed audio</li>
            <li><strong>MULTI</strong> - Has both options, switch in the player</li>
          </ul>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-gray-400 text-sm mb-2">Sort by</h3>
          <div className="flex flex-wrap gap-2">
            {ANIME_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Filter Info */}
        <div className="mb-4 text-sm text-gray-400">
          Showing: <span className="text-purple-400">{ANIME_CATEGORIES.find(c => c.id === selectedCategory)?.name}</span> {activeTab === 'tv' ? 'anime series' : 'anime movies'}
        </div>

        {/* Results */}
        {loading && currentItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentItems.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  mediaType={activeTab === 'tv' ? 'tv' : 'movie'}
                />
              ))}
            </div>

            {currentItems.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400">
                <p className="mb-4">No anime found in this category.</p>
                <p className="text-sm">Try selecting a different sort option.</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && currentItems.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
