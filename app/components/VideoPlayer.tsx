"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { StreamingSource } from "@/types";

// Allowed video source domains for security
const ALLOWED_VIDEO_DOMAINS = [
  // VidSrc.me domains (primary + new domains from their announcement)
  "vidsrc.me",
  "vidsrc-embed.me",
  "vidsrcme.ru",
  "vidsrcme.su",
  "vidsrc-embed.ru",
  "vidsrc-embed.su",
  "vsrc.su",
  "vidsrc.to",
  // Other sources
  "vidsrc.cc",
  "vidsrc.pro",
  "moviesapi.club",
  "embed.su",
  "autoembed.cc",
  "multiembed.mov",
  "2embed.cc",
  "streamsrc.cc",
];

// Validate that URL is from an allowed domain
function isAllowedVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check exact match or subdomain match
    return ALLOWED_VIDEO_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain),
    );
  } catch {
    return false;
  }
}

interface VideoPlayerProps {
  source: StreamingSource;
  title: string;
}

export default function VideoPlayer({ source, title }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate URL on every source change
  const isValidUrl = useMemo(() => {
    if (!source.url) return false;
    return isAllowedVideoUrl(source.url);
  }, [source.url]);

  useEffect(() => {
    if (source.type === "vidsrc" && source.url) {
      setLoading(true);
      if (!isValidUrl) {
        setError("Invalid video source");
        setLoading(false);
      } else {
        setError(null);
      }
    }
  }, [source, isValidUrl]);

  // Mobile Safari fallback: Hide loading spinner after timeout
  // Mobile Safari sometimes doesn't fire onLoad for iframes properly
  useEffect(() => {
    if (loading && isValidUrl && source.url) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 second timeout for mobile Safari

      return () => clearTimeout(timeout);
    }
  }, [loading, isValidUrl, source.url]);

  if (source.type === "vidsrc" && source.url) {
    // Block rendering of iframe if URL is not from allowed domain
    if (!isValidUrl) {
      return (
        <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
          <p className="text-red-400">Invalid video source domain</p>
        </div>
      );
    }

    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframeRef}
          src={source.url}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allowFullScreen
          // iOS Safari requires webkitallowfullscreen for fullscreen to work
          {...({ webkitallowfullscreen: "true" } as any)}
          // Extended permissions for video playback across all browsers
          allow="accelerometer; autoplay *; clipboard-write; encrypted-media; gyroscope; picture-in-picture *; fullscreen *"
          // Note: Do NOT use sandbox attribute - it breaks video embed functionality
          onLoad={() => setLoading(false)}
          onError={() => {
            setError("Failed to load video player");
            setLoading(false);
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="mt-4 text-gray-400">Loading player...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
      <p className="text-gray-400">No video source available</p>
    </div>
  );
}
