'use client';

import { useEffect, useRef, useState } from 'react';
import type { StreamingSource } from '@/types';

interface VideoPlayerProps {
  source: StreamingSource;
  title: string;
}

export default function VideoPlayer({ source, title }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source.type === 'vidsrc' && source.url) {
      setLoading(true);
      setError(null);
    }
  }, [source]);

  if (source.type === 'vidsrc' && source.url) {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          ref={iframeRef}
          src={source.url}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-to-picture"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load video player');
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
