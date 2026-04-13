import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { updateMediaSession, clearMediaSession } from '@/lib/mediaSession';

export function useMediaSession(seek: (t: number) => void) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const currentTime  = usePlayerStore(s => s.currentTime);
  const duration     = usePlayerStore(s => s.duration);

  const setIsPlaying = usePlayerStore(s => s.actions.setIsPlaying);
  const next         = usePlayerStore(s => s.actions.next);
  const prev         = usePlayerStore(s => s.actions.prev);

  useEffect(() => {
    if (!currentTrack) { clearMediaSession(); return; }
    updateMediaSession(currentTrack, isPlaying, currentTime, duration, {
      onPlay:  () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onNext:  next,
      onPrev:  prev,
      onSeek:  seek,
    });
  }, [currentTrack, isPlaying, currentTime, duration]);
}
