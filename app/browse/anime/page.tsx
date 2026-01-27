'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadAnime = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
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
          setPage(2);
        } else {
          if (activeTab === 'tv') {
            setAnime(prev => [...prev, ...(data.results || [])]);
          } else {
            setMovies(prev => [...prev, ...(data.results || [])]);
          }
          setPage(prev => prev + 1);
        }
        setHasMore((data.results?.length || 0) >= 20);
      }
    } catch (err) {
      console.error('Failed to load anime:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, selectedCategory, activeTab]);

  useEffect(() => {
    loadAnime(true);
  }, [selectedCategory, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadAnime(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loading, loadAnime]);

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

            {/* Infinite scroll trigger */}
            {hasMore && currentItems.length > 0 && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {loadingMore && (
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
