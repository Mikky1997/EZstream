export interface EpisodeSeason {
  season_number: number;
  episode_count: number;
  name: string;
}

export interface EpisodeOption {
  season: number;
  episode: number;
  displayNumber: number;
}

// HxH (2011) is one continuous run split into three TMDB season groups.
// Do not flatten unrelated shows or anime with separate numbered seasons.
export function usesContinuousEpisodes(mediaId: number): boolean {
  return mediaId === 46298;
}

// Keep season-relative playback/history coordinates separate from UI numbering.
export function getEpisodeOptions(
  seasons: EpisodeSeason[],
  continuous: boolean,
): EpisodeOption[] {
  let offset = 0;
  return [...seasons]
    .filter(season => season.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)
    .flatMap(season => {
      const options = Array.from({ length: season.episode_count }, (_, index) => ({
        season: season.season_number,
        episode: index + 1,
        displayNumber: (continuous ? offset : 0) + index + 1,
      }));
      offset += season.episode_count;
      return options;
    });
}
