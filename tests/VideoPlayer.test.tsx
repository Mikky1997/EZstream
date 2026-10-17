import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import VideoPlayer from '@/app/components/VideoPlayer';

afterEach(cleanup);

describe('VideoPlayer', () => {
  it('loads the current provider and remounts the iframe for another episode', () => {
    const { rerender } = render(<VideoPlayer title="HxH" source={{ type: 'vidsrc', url: 'https://vidsrc.sh/embed/tv/46298/1/1' }} />);
    const first = screen.getByTitle('HxH video player');
    fireEvent.load(first);
    expect(screen.queryByText('Loading player...')).toBeNull();
    rerender(<VideoPlayer title="HxH" source={{ type: 'vidsrc', url: 'https://vidsrc.sh/embed/tv/46298/2/1' }} />);
    expect(screen.getByTitle('HxH video player')).not.toBe(first);
    expect(screen.getByTitle('HxH video player').getAttribute('src')).toContain('/2/1');
    expect(screen.getByText('Loading player...')).toBeTruthy();
  });

  it('reports observable iframe failures to the source fallback handler', () => {
    const onSourceError = vi.fn();
    render(<VideoPlayer title="HxH" onSourceError={onSourceError} source={{ type: 'vidsrc', url: 'https://vidlink.pro/tv/46298/1/1' }} />);
    fireEvent.error(screen.getByTitle('HxH video player'));
    expect(onSourceError).toHaveBeenCalledOnce();
    expect(screen.getByText('Failed to load video player')).toBeTruthy();
  });

  it.each(['https://vidsrc.sh.evil.example/embed', 'http://vidsrc.sh/embed', 'javascript:alert(1)'])('blocks invalid player URL %s', url => {
    render(<VideoPlayer title="HxH" source={{ type: 'vidsrc', url }} />);
    expect(screen.queryByTitle('HxH video player')).toBeNull();
    expect(screen.getByText('Invalid video source domain')).toBeTruthy();
  });
});
