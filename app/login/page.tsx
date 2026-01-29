"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, checkAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.error || "Login failed");
        setLoading(false);
        return;
      }

      // Small delay to ensure cookie is set, then full page reload
      // This ensures all contexts (Auth, Watchlist, etc.) refresh properly
      setTimeout(() => {
        window.location.href = "/";
      }, 50);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(to bottom, #1a0000 0%, #0d0000 30%, #000000 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            EZstream
          </h1>
          <p className="text-gray-400">Sign in to continue watching</p>
        </div>

        {/* Login Form */}
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Private streaming for friends and family
        </p>
      </div>
    </div>
  );
}
