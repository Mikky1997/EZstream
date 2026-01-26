'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/login');
  };

  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Home */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white font-bold text-xl hover:text-blue-400 transition-colors"
          >
            <span className="text-2xl">🎬</span>
            <span className="hidden sm:inline">StreamFlix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            <Link
              href="/browse/movies"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/browse/movies')
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Movies
            </Link>
            <Link
              href="/browse/tv"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/browse/tv')
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              TV Shows
            </Link>
            <Link
              href="/browse/anime"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/browse/anime')
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Anime
            </Link>
          </div>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.displayName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white font-medium">{user.displayName}</p>
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                Home
              </Link>
              <Link
                href="/browse/movies"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  pathname.startsWith('/browse/movies')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                Movies
              </Link>
              <Link
                href="/browse/tv"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  pathname.startsWith('/browse/tv')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                TV Shows
              </Link>
              <Link
                href="/browse/anime"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  pathname.startsWith('/browse/anime')
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                Anime
              </Link>
              
              {/* User section in mobile menu */}
              <div className="border-t border-gray-700 mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
                        {user.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.displayName}</p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
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
