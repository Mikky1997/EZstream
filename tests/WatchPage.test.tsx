import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WatchPage from '@/app/watch/[type]/[id]/page';
import { getAllEmbedUrls } from '@/lib/vidsrc';

vi.mock('next/navigation', () => ({
  useParams: () => ({ type: 'tv', id: '46298' }),
  useSearchParams: () => new URLSearchParams('s=2&e=1'),
}));
const { item } = vi.hoisted(() => ({ item: {
  id: 46298, name: 'Hunter x Hunter', imdbId: 'tt2098220',
  original_language: 'ja', genres: [{ id: 16, name: 'Animation' }],
  seasons: [{ season_number: 1, episode_count: 62, name: 'Season 1' }, { season_number: 2, episode_count: 74, name: 'Season 2' }],
} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: item, isLoading: false, error: null }) }));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/app/components/MediaActions', () => ({ default: () => null }));
vi.mock('@/app/components/TVShowControls', () => ({
  TVShowControls: ({ onSelectEpisode }: { onSelectEpisode: (season: number, episode: number) => void }) =>
    <button onClick={() => onSelectEpisode(2, 2)}>Choose episode 2</button>,
}));

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function player(): HTMLElement { return screen.getByTitle('Hunter x Hunter video player'); }

describe('watch page source switching', () => {
  it('recovers a retired preference and offers a visible manual fallback', () => {
    localStorage.setItem('preferred_video_source', 'vidsrcin');
    render(<WatchPage />);
    expect(player().getAttribute('src')).toBe('https://vidsrc.sh/embed/tv/tt2098220/2/1');
    expect(localStorage.getItem('preferred_video_source')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try another source' }));
    expect(player().getAttribute('src')).toBe('https://vidlink.pro/tv/46298/2/1');
    expect(localStorage.getItem('preferred_video_source')).toBe('vidlink');
  });

  it('preserves the preferred provider while changing episodes', () => {
    localStorage.setItem('preferred_video_source', 'vidlink');
    render(<WatchPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose episode 2' }));
    expect(player().getAttribute('src')).toBe('https://vidlink.pro/tv/46298/2/2');
    expect(window.location.search).toContain('e=2');
  });

  it('tries each source once on errors without replacing the saved preference', () => {
    localStorage.setItem('preferred_video_source', 'vidlink');
    render(<WatchPage />);
    const seen = new Set<string>();
    const count = getAllEmbedUrls('tt2098220', '46298', 'tv').length;
    for (let index = 0; index < count; index++) {
      const url = player().getAttribute('src')!;
      expect(seen.has(url)).toBe(false);
      seen.add(url);
      fireEvent.error(player());
    }
    expect(screen.getByText('Failed to load video player')).toBeTruthy();
    expect(localStorage.getItem('preferred_video_source')).toBe('vidlink');
  });

  it('still opens and switches a player when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    render(<WatchPage />);
    expect(player().getAttribute('src')).toContain('vidsrc.sh');
    fireEvent.click(screen.getByRole('button', { name: 'Try another source' }));
    expect(player().getAttribute('src')).toContain('vidlink.pro/tv/46298');
  });
});
