import { describe, expect, it } from 'vitest';
import { getAllEmbedUrls, getVidSrcEmbedUrl } from '@/lib/vidsrc';

describe('provider URL contracts', () => {
  it.each([
    ['tv', 'tt2098220', '46298', '/tv/46298/2/1'],
    ['movie', 'tt1375666', '27205', '/movie/27205'],
  ] as const)('uses TMDB IDs for VidLink %s even when IMDb is available', (type, imdb, tmdb, path) => {
    const source = getAllEmbedUrls(imdb, tmdb, type, 2, 1).find(s => s.source === 'vidlink');
    expect(source?.url).toBe(`https://vidlink.pro${path}`);
  });

  it.each(['movie', 'tv'] as const)('does not label SuperEmbed IMDb IDs as TMDB for %s', type => {
    const url = getAllEmbedUrls('tt2098220', '46298', type, 2, 5).find(s => s.source === 'superembed')!.url;
    const params = new URL(url).searchParams;
    expect(params.get('video_id')).toBe('tt2098220');
    expect(params.has('tmdb')).toBe(false);
    if (type === 'tv') {
      expect(params.get('s')).toBe('2');
      expect(params.get('e')).toBe('5');
    }
  });

  it('sets the TMDB flag when SuperEmbed has no IMDb ID', () => {
    const url = getAllEmbedUrls('', '46298', 'tv').find(s => s.source === 'superembed')!.url;
    expect(new URL(url).searchParams.get('tmdb')).toBe('1');
    expect(new URL(url).searchParams.get('video_id')).toBe('46298');
  });

  it.each([false, true])('uses the new default domain and omits retired sources (anime: %s)', anime => {
    const sources = getAllEmbedUrls('tt2098220', '46298', 'tv', 3, 12, anime);
    expect(sources[0].url).toBe('https://vidsrc.sh/embed/tv/tt2098220/3/12');
    expect(sources.slice(0, 3).map(s => s.source)).toEqual(['vidsrcme', 'vidlink', 'twoembed']);
    expect(sources.some(s => ['vidsrcin', 'moviesapi', 'autoembed', 'vidsrcicu', 'vidsrcrip'].includes(s.source))).toBe(false);
    expect(new Set(sources.map(s => s.source)).size).toBe(sources.length);
  });

  it('keeps the legacy URL helper on the current domain', () => {
    expect(getVidSrcEmbedUrl('27205', 'movie')).toBe('https://vidsrc.sh/embed/movie/27205');
  });

  it('preserves specials and normalizes invalid episode numbers', () => {
    const sources = getAllEmbedUrls('', '46298', 'tv', 0, Number.NaN);
    expect(sources.find(s => s.source === 'vidlink')?.url).toBe('https://vidlink.pro/tv/46298/0/1');
  });
});
