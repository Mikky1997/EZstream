"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path?: string;
  vote_average?: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showNavSearch, setShowNavSearch] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navSearchRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/login");
  };

  // Focus search input when opened - use timeout to ensure DOM is ready
  useEffect(() => {
    if (showNavSearch && navSearchRef.current) {
      // Small delay to ensure the input is visible and ready
      const timer = setTimeout(() => {
        navSearchRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showNavSearch]);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (navSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(navSearchQuery)}`,
        );
        if (response.ok) {
          const data = await response.json();
          const filtered = (data.results || [])
            .filter(
              (item: SearchResult) =>
                item.media_type === "movie" || item.media_type === "tv",
            )
            .slice(0, 8);
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [navSearchQuery]);

  // Close search dropdown when clicking outside (check both desktop and mobile refs)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      const isOutsideDesktop =
        searchWrapperRef.current && !searchWrapperRef.current.contains(target);
      const isOutsideMobile =
        mobileSearchRef.current && !mobileSearchRef.current.contains(target);

      // Only close if clicking outside BOTH refs (or if ref doesn't exist)
      const shouldClose =
        (!searchWrapperRef.current || isOutsideDesktop) &&
        (!mobileSearchRef.current || isOutsideMobile);

      if (shouldClose && showNavSearch) {
        setShowNavSearch(false);
        setNavSearchQuery("");
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showNavSearch]);

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNavSearch(false);
        setNavSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Handle selecting a result from dropdown
  const handleSelectResult = (result: SearchResult) => {
    router.push(`/watch/${result.media_type}/${result.id}`);
    setShowNavSearch(false);
    setNavSearchQuery("");
    setSearchResults([]);
  };

  // Handle Enter key - select first result if available
  const handleEnterKey = () => {
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  };

  const getTitle = (item: SearchResult) => item.title || item.name || "Unknown";

  // Don't show navbar on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Home Icon - Left */}
          <Link
            href="/"
            className="group p-2 rounded-lg hover:bg-gray-800 transition-all flex-shrink-0"
            title="Home"
          >
            <svg
              className="w-8 h-8 text-blue-500 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/browse/movies"
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                pathname.startsWith("/browse/movies")
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:text-white hover:bg-accent/20"
              }`}
            >
              Movies
            </Link>
            <Link
              href="/browse/tv"
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                pathname.startsWith("/browse/tv")
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:text-white hover:bg-accent/20"
              }`}
            >
              TV Shows
            </Link>
            <Link
              href="/browse/anime"
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                pathname.startsWith("/browse/anime")
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:text-white hover:bg-accent/20"
              }`}
            >
              Anime
            </Link>
          </div>

          {/* Search + User - Right (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {/* Search */}
            <div ref={searchWrapperRef} className="relative">
              {showNavSearch ? (
                <div className="flex items-center">
                  <input
                    ref={navSearchRef}
                    type="text"
                    value={navSearchQuery}
                    onChange={(e) => setNavSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEnterKey();
                      }
                    }}
                    placeholder="Search..."
                    className="w-48 lg:w-64 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 outline-none focus:outline-none focus:border-accent text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNavSearch(false);
                      setNavSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="ml-2 p-2 text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* Dropdown with search results */}
                  {(searchResults.length > 0 ||
                    isSearching ||
                    (navSearchQuery.trim().length >= 2 &&
                      !isSearching &&
                      searchResults.length === 0)) && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                      {isSearching && (
                        <div className="p-4 text-center text-gray-400">
                          <div className="inline-block w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Searching...</p>
                        </div>
                      )}
                      {!isSearching &&
                        navSearchQuery.trim().length >= 2 &&
                        searchResults.length === 0 && (
                          <div className="p-4 text-center text-gray-400">
                            <p className="text-sm">
                              No results found for &quot;{navSearchQuery}&quot;
                            </p>
                          </div>
                        )}
                      {searchResults.map((item) => (
                        <button
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => handleSelectResult(item)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 text-left"
                        >
                          {item.poster_path ? (
                            <div className="relative w-10 h-14 flex-shrink-0">
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                alt={getTitle(item)}
                                fill
                                className="object-cover rounded"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                              No img
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {getTitle(item)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  item.media_type === "movie"
                                    ? "bg-blue-900 text-blue-300"
                                    : "bg-purple-900 text-purple-300"
                                }`}
                              >
                                {item.media_type === "movie" ? "Movie" : "TV"}
                              </span>
                              {item.vote_average && item.vote_average > 0 && (
                                <span className="text-yellow-400">
                                  ★ {item.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowNavSearch(true)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Search"
                  aria-label="Open search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* User Menu */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.displayName}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white font-medium">
                        {user.displayName}
                      </p>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors rounded-b-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile - Theme + Search + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowNavSearch(!showNavSearch)}
              className="p-2 text-gray-300 hover:text-white"
              title="Search"
              aria-label="Toggle search"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showNavSearch && (
          <div
            ref={mobileSearchRef}
            className="md:hidden px-4 py-3 border-t border-gray-800 bg-gray-900 relative"
          >
            <div className="flex items-center gap-2">
              <input
                ref={navSearchRef}
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEnterKey();
                  }
                }}
                placeholder="Search..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 outline-none focus:outline-none focus:border-accent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowNavSearch(false);
                  setNavSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 text-gray-400"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Dropdown with search results */}
            {(searchResults.length > 0 ||
              isSearching ||
              (navSearchQuery.trim().length >= 2 &&
                !isSearching &&
                searchResults.length === 0)) && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {isSearching && (
                  <div className="p-4 text-center text-gray-400">
                    <div className="inline-block w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mb-2"></div>
                    <p className="text-sm">Searching...</p>
                  </div>
                )}
                {!isSearching &&
                  navSearchQuery.trim().length >= 2 &&
                  searchResults.length === 0 && (
                    <div className="p-4 text-center text-gray-400">
                      <p className="text-sm">
                        No results found for &quot;{navSearchQuery}&quot;
                      </p>
                    </div>
                  )}
                {searchResults.map((item) => (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 text-left"
                  >
                    {item.poster_path ? (
                      <div className="relative w-10 h-14 flex-shrink-0">
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={getTitle(item)}
                          fill
                          className="object-cover rounded"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                        No img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {getTitle(item)}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          item.media_type === "movie"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-purple-900 text-purple-300"
                        }`}
                      >
                        {item.media_type === "movie" ? "Movie" : "TV"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-2">
              <Link
                href="/browse/movies"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/browse/movies")
                    ? "bg-accent text-white"
                    : "text-gray-300 hover:text-white hover:bg-accent/20"
                }`}
              >
                Movies
              </Link>
              <Link
                href="/browse/tv"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/browse/tv")
                    ? "bg-accent text-white"
                    : "text-gray-300 hover:text-white hover:bg-accent/20"
                }`}
              >
                TV Shows
              </Link>
              <Link
                href="/browse/anime"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  pathname.startsWith("/browse/anime")
                    ? "bg-accent text-white"
                    : "text-gray-300 hover:text-white hover:bg-accent/20"
                }`}
              >
                Anime
              </Link>

              {/* User section in mobile menu */}
              <div className="border-t border-gray-700 mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg font-bold text-white">
                        {user.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {user.displayName}
                        </p>
                        <p className="text-gray-400 text-sm">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-800 transition-colors rounded-lg"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-blue-400 hover:bg-gray-800 transition-colors rounded-lg"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </nav>
  );
}
