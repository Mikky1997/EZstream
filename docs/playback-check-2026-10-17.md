# Playback check — 17 October 2026

The reported failures involve both app bugs and external provider availability.

## Fixed

- VidLink received IMDb IDs even though its documented movie/TV endpoints require TMDB IDs. The old HxH link returned HTTP 500; the corrected link returned 200. A browser played HxH S1 E2, with playback time advancing and no media error.
- SuperEmbed incorrectly combined IMDb IDs with `tmdb=1`. The flag now matches the identifier.
- The default `vidsrcme.ru` address was unreachable from the server. Updated it to the domain announced by the provider, `vidsrc.sh`, and allowed that domain in the player and both production/development CSP headers.
- Removed VidSrc.in, MoviesAPI, AutoEmbed, VidSrc.icu and VidSrc.rip from selectable sources. The first four failed DNS resolution; VidSrc.rip failed TLS certificate verification. Providers behind browser challenges remain available as later alternatives.
- Obsolete saved source preferences now fall back to the current default. Unavailable browser storage no longer interrupts source selection.
- Added a visible “Try another source” control on mobile and desktop. Observable native iframe errors try remaining sources once without changing the saved preference. Errors rendered inside third-party players cannot generally be detected by the parent app, so manual switching remains necessary.
- Episode/source changes remount the iframe. Source menu options support click/keyboard activation.

## Validation

- 18 Vitest/React Testing Library regression tests pass (`npm test`).
- Lint, TypeScript and an isolated production build pass. The build was deployed with PM2; the mobile/API checks also pass against the running production server. The previous build is retained in `backups/next-before-playback-20261017-045623.tar.gz`.
- A mobile Chromium check covers retired preferences, source switching, episode selection, saved preference/episode restoration and the new CSP domain. The check stubs the authenticated-user response and does not write user history.
- HxH, Inception and Game of Thrones metadata endpoints, trending and search return HTTP 200.
- VidLink initializes videos for HxH S1 E1, E2, E26 and E62, Inception, and Game of Thrones S1 E1. Actual playback advancement was verified for HxH S1 E2.

## Remaining provider limitations

- VidLink reports HxH S2 E1 and S3 E1 unavailable. Alternate continuous numbering also failed; no speculative episode remapping was added.
- VidSrc's updated embed opens the requested later HxH episode but automated playback is stopped by its verification challenge. Playback of those episodes is not verified.
- VidSrc also emits a cross-origin frame-access error from its own script during browser testing; the app cannot repair provider scripts.
- 2Embed opens the requested episode; its selected nested provider returned Forbidden during the check.
- VidSrc.cc, VidSrc.to and SuperEmbed's downstream player returned browser challenges to server requests. HTTP status or a loaded iframe alone does not establish playable content.

Provider availability can vary by episode, browser and region. This check does not establish that every title works on every provider.

Provider references: [VidLink endpoint documentation](https://vidlink.pro/), [VidSrc domain announcement](https://vidsrc.me/), [SuperEmbed documentation](https://www.superembed.stream/).


## Follow-up: The Studio S1 E1 (TMDB 247767)

- Checked the public `https://mikky.vip/watch/tv/247767?s=1&e=1` page, not just localhost. Public CSP headers match the deployed app and permit VidLink.
- VidLink loaded the episode inside the live page and played past five seconds, with a duration of 44:31, ready state 4 and no media error. Browser checks use a temporary synthetic JWT and a stubbed null-user response; no user history is written.
- VidSrc reaches its downstream player but fails automated verification. VidSrc.cc returns HTTP 403 with `X-Frame-Options: SAMEORIGIN`, preventing its error page from being embedded. 2Embed's selected nested source returns HTTP 403.
- The user reported black players in Chrome and Brave on one PC/network. Pausing the ad blocker did not help; the browser then showed a VidLink connection timeout. The user confirmed that playback worked after connecting to a VPN, suggesting a network-path, DNS or filtering issue rather than establishing intentional ISP blocking.


## HxH episode selector

HxH (2011) now displays a single list of episodes 1–148 and a continuous number in the watch-page heading. Selecting E135 maps to the existing S2/E73 playback and history coordinates; saved links continue to work. Next Episode advances from E62 to E63 and E136 to E137 across the underlying season groups. Other shows retain season-based controls. This is a presentation/selection change, not a change to provider episode numbering or user data.

Validation: 24 regression tests, lint, TypeScript and the production build pass, including direct E135 selection, existing-link restoration, season boundaries, final episode and unchanged controls for other shows. Desktop and mobile browser checks also pass on the deployed public site.
