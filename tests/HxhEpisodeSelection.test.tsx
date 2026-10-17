import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WatchPage from '@/app/watch/[type]/[id]/page';

const { fixture } = vi.hoisted(() => ({ fixture: {
  id: '46298', query: 's=1&e=1',
  item: {
    id: 46298, name: 'Hunter x Hunter', imdbId: 'tt2098220',
    original_language: 'ja', genres: [{ id: 16, name: 'Animation' }],
    seasons: [
      { season_number: 1, episode_count: 62, name: 'Season 1' },
      { season_number: 2, episode_count: 74, name: 'Season 2' },
      { season_number: 3, episode_count: 12, name: 'Season 3' },
    ],
  },
} }));

vi.mock('next/navigation', () => ({
  useParams: () => ({ type: 'tv', id: fixture.id }),
  useSearchParams: () => new URLSearchParams(fixture.query),
}));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: fixture.item, isLoading: false, error: null }) }));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/app/components/MediaActions', () => ({ default: () => null }));

beforeEach(() => {
  fixture.id = '46298';
  fixture.query = 's=1&e=1';
  localStorage.clear();
  localStorage.setItem('preferred_video_source', 'vidlink');
});
afterEach(cleanup);

describe('HxH continuous episode selection', () => {
  it('selects episode 135 from season 1 without requiring season arithmetic', () => {
    render(<WatchPage />);
    expect(screen.queryByRole('button', { name: 'S1' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Select episode, current episode 1' }));
    expect(screen.getByRole('button', { name: 'E148' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'E135' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hunter x HunterE135');
    expect(screen.getByTitle('Hunter x Hunter video player').getAttribute('src')).toBe('https://vidlink.pro/tv/46298/2/73');
    expect(new URLSearchParams(window.location.search).get('s')).toBe('2');
    expect(new URLSearchParams(window.location.search).get('e')).toBe('73');
  });

  it.each([
    ['s=1&e=62', 63, '/2/1'],
    ['s=2&e=74', 137, '/3/1'],
  ])('advances continuously across season boundaries from %s', (query, next, path) => {
    fixture.query = query;
    render(<WatchPage />);
    fireEvent.click(screen.getByTitle(`Next: E${next}`));
    expect(screen.getByRole('button', { name: `Select episode, current episode ${next}` })).toBeTruthy();
    expect(screen.getByTitle('Hunter x Hunter video player').getAttribute('src')).toBe(`https://vidlink.pro/tv/46298${path}`);
  });

  it('shows episode 135 when reopening an existing season-relative history link', () => {
    fixture.query = 's=2&e=73';
    render(<WatchPage />);
    expect(screen.getByRole('button', { name: 'Select episode, current episode 135' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('E135');
  });

  it('stops at episode 148', () => {
    fixture.query = 's=3&e=12';
    render(<WatchPage />);
    expect(screen.getByRole('button', { name: 'Select episode, current episode 148' })).toBeTruthy();
    expect(screen.queryByTitle(/^Next: E/)).toBeNull();
  });

  it('keeps season-based numbering for other shows', () => {
    fixture.id = '1399';
    fixture.query = 's=2&e=1';
    render(<WatchPage />);
    expect(screen.getByRole('button', { name: 'S2' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Select episode, current episode 1' }));
    expect(screen.getByRole('button', { name: 'E1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'E135' })).toBeNull();
  });
});
