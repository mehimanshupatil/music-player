import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

export function useKeyboardShortcuts(seek: (t: number) => void) {
  const isPlaying   = usePlayerStore(s => s.isPlaying);
  const currentTime = usePlayerStore(s => s.currentTime);
  const volume      = usePlayerStore(s => s.volume);

  const setIsPlaying  = usePlayerStore(s => s.actions.setIsPlaying);
  const next          = usePlayerStore(s => s.actions.next);
  const prev          = usePlayerStore(s => s.actions.prev);
  const setVolume     = usePlayerStore(s => s.actions.setVolume);
  const toggleMute    = usePlayerStore(s => s.actions.toggleMute);
  const toggleShuffle = usePlayerStore(s => s.actions.toggleShuffle);
  const cycleRepeat   = usePlayerStore(s => s.actions.cycleRepeat);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const ctrl = e.metaKey || e.ctrlKey;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) next();
          else seek(currentTime + 10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) prev();
          else seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 0.05);
          break;
        case 'm': case 'M':
          if (!ctrl) toggleMute();
          break;
        case 's': case 'S':
          if (!ctrl) toggleShuffle();
          break;
        case 'r': case 'R':
          if (!ctrl) cycleRepeat();
          break;
        case 'f': case 'F':
          if (ctrl) {
            e.preventDefault();
            document.getElementById('track-search')?.focus();
          }
          break;
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, currentTime, volume]);
}
