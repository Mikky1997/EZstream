'use client';

import { useState, useEffect } from 'react';
import MovieCard from '@/app/components/MovieCard';
import type { TVShow } from '@/types';

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'first_air_date.desc', label: 'Newest' },
  { value: 'first_air_date.asc', label: 'Oldest' },
];

// Country/Language filter - most popular TV-producing countries
const COUNTRY_OPTIONS = [
  { value: '', label: 'All Countries', flag: '🌍' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'th', label: 'Thai', flag: '🇹🇭' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
];

export default function BrowseTV() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadShows(true);
  }, [selectedGenre, sortBy, selectedLanguage]);

  const loadShows = async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort_by: sortBy,
      });
      
      if (selectedGenre) {
        params.append('genre', selectedGenre.toString());
      }
      
      if (selectedLanguage) {
        params.append('language', selectedLanguage);
      }

      const response = await fetch(`/api/browse/tv?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setShows(data.results || []);
          setPage(1);
        } else {
          setShows(prev => [...prev, ...(data.results || [])]);
        }
        setHasMore((data.results?.length || 0) >= 20);
      }
    } catch (err) {
      console.error('Failed to load TV shows:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadShows(false);
  };

  const selectedCountry = COUNTRY_OPTIONS.find(o => o.value === selectedLanguage);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Browse TV Shows</h1>
        <p className="text-gray-400 mb-6">Discover TV series from around the world</p>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Country/Language Filter */}
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Country / Language</h3>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedLanguage(option.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                    selectedLanguage === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{option.flag}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Genre</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedGenre === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {TV_GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedGenre === genre.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Filter Info */}
        <div className="mb-4 text-sm text-gray-400">
          Showing: <span className="text-blue-400">{selectedCountry?.flag} {selectedCountry?.label}</span> TV shows
          {selectedGenre && (
            <span> in <span className="text-purple-400">{TV_GENRES.find(g => g.id === selectedGenre)?.name}</span></span>
          )}
        </div>

        {/* Results */}
        {loading && shows.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {shows.map((show) => (
                <MovieCard
                  key={show.id}
                  item={show}
                  mediaType="tv"
                />
              ))}
            </div>

            {shows.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400">
                <p className="mb-4">No TV shows found with these filters.</p>
                <p className="text-sm">Try selecting a different country or genre.</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && shows.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
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
