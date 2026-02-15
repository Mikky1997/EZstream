"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  /** Whether infinite scroll is enabled */
  enabled: boolean;
  /** Intersection threshold (0-1), default 0.1 */
  threshold?: number;
  /** Root margin for earlier triggering, e.g. "100px" */
  rootMargin?: string;
}

/**
 * Hook for infinite scroll using IntersectionObserver
 * Returns a ref to attach to the sentinel element
 *
 * @param onLoadMore - Callback to load more data
 * @param options - Configuration options
 * @returns ref to attach to sentinel element
 *
 * @example
 * ```tsx
 * const loadMoreRef = useInfiniteScroll(
 *   () => fetchNextPage(),
 *   { enabled: hasNextPage && !isFetching }
 * );
 *
 * return (
 *   <>
 *     <MediaGrid items={items} />
 *     <div ref={loadMoreRef} />
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions
) {
  const { enabled, threshold = 0.1, rootMargin = "0px 0px 800px 0px" } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Stable callback ref to avoid recreating observer
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && enabled) {
        onLoadMoreRef.current();
      }
    },
    [enabled]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, handleIntersection]);

  return sentinelRef;
}
