import type { Track } from './dexie';

export function updateMediaSession(
  track: Track,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (time: number) => void;
  }
) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title:  track.title,
    artist: track.artist,
    album:  track.album,
    artwork: track.coverArt
      ? [{ src: track.coverArt, sizes: '512x512' }]
      : [],
  });

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  navigator.mediaSession.setActionHandler('play',          handlers.onPlay);
  navigator.mediaSession.setActionHandler('pause',         handlers.onPause);
  navigator.mediaSession.setActionHandler('nexttrack',     handlers.onNext);
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime != null) handlers.onSeek(details.seekTime);
  });

  if (duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: currentTime,
      });
    } catch {}
  }
}

export function clearMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
  for (const action of ['play', 'pause', 'nexttrack', 'previoustrack', 'seekto'] as const) {
    try { navigator.mediaSession.setActionHandler(action, null); } catch {}
  }
}
