"use client";

import { memo, useState } from "react";
import Image from "next/image";

// Tiny blurred placeholder - instant display
const shimmerPlaceholder =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTg1IiBoZWlnaHQ9IjI3OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFmMjkzNyIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMzc0MTUxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWYyOTM3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+";

interface ImageWithLoadingProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image sizes for responsive loading */
  sizes?: string;
  /** Fill parent container */
  fill?: boolean;
  /** Width (required if not using fill) */
  width?: number;
  /** Height (required if not using fill) */
  height?: number;
  /** Additional CSS classes for the image */
  className?: string;
  /** Fallback content when image fails to load */
  fallback?: React.ReactNode;
  /** Priority loading */
  priority?: boolean;
}

/**
 * Image component with loading state and error handling
 * Extracts common pattern from MovieCard and PersonCard
 *
 * @example
 * ```tsx
 * <ImageWithLoading
 *   src={posterUrl}
 *   alt={title}
 *   fill
 *   sizes="(max-width: 640px) 45vw, 185px"
 *   fallback={<span className="text-gray-500">No Image</span>}
 * />
 * ```
 */
export const ImageWithLoading = memo(function ImageWithLoading({
  src,
  alt,
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 185px",
  fill = true,
  width,
  height,
  className = "",
  fallback,
  priority = false,
}: ImageWithLoadingProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        {fallback || <span className="text-gray-500 text-sm">No Image</span>}
      </div>
    );
  }

  return (
    <>
      {/* Animated shimmer placeholder - shows while loading */}
      <div
        className={`absolute inset-0 bg-gray-800 ${!isLoaded ? "animate-shimmer" : "hidden"}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
        </div>
      </div>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`object-cover transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        sizes={sizes}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        placeholder="blur"
        blurDataURL={shimmerPlaceholder}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        unoptimized
      />
    </>
  );
});
