import { useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerStore } from '@/stores/playerStore';
import { getFileObject } from '@/lib/fileObjectStore';

export function useWaveSurfer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const wsRef = useRef<WaveSurfer | null>(null);

  // Individual selectors — never returns a new object, so no infinite loop
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const volume       = usePlayerStore(s => s.volume);
  const isMuted      = usePlayerStore(s => s.isMuted);

  // Individual action selectors — same function reference every render
  const setIsPlaying   = usePlayerStore(s => s.actions.setIsPlaying);
  const setCurrentTime = usePlayerStore(s => s.actions.setCurrentTime);
  const setDuration    = usePlayerStore(s => s.actions.setDuration);
  const next           = usePlayerStore(s => s.actions.next);

  // Initialise WaveSurfer once
  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container:     containerRef.current,
      waveColor:     'var(--color-waveform-muted)',
      progressColor: 'var(--color-waveform)',
      cursorColor:   'transparent',
      barWidth:      2,
      barGap:        2,
      barRadius:     2,
      height:        64,
      normalize:     true,
      interact:      true,
    });

    ws.on('timeupdate', (t) => setCurrentTime(t));
    ws.on('ready',      (d) => setDuration(d));
    ws.on('play',       ()  => setIsPlaying(true));
    ws.on('pause',      ()  => setIsPlaying(false));
    ws.on('finish',     ()  => {
      // Read repeatMode directly from store to avoid stale closure
      const rm = usePlayerStore.getState().repeatMode;
      if (rm === 'one') { ws.seekTo(0); ws.play(); }
      else usePlayerStore.getState().actions.next();
    });

    wsRef.current = ws;
    return () => { ws.destroy(); wsRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new track when currentTrack changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !currentTrack) return;

    (async () => {
      let url: string | null = null;
      let shouldRevoke = false;

      // Path 1: FileSystemFileHandle (showDirectoryPicker / persisted)
      if (currentTrack.fileHandle) {
        try {
          const file = await currentTrack.fileHandle.getFile();
          url = URL.createObjectURL(file);
          shouldRevoke = true;
        } catch (e) {
          console.warn('fileHandle.getFile() failed, trying fileObjectStore:', e);
        }
      }

      // Path 2: in-memory File object (<input> path)
      if (!url) {
        const file = getFileObject(currentTrack.id);
        if (file) {
          url = URL.createObjectURL(file);
          shouldRevoke = true;
        }
      }

      if (!url) {
        console.warn('No playback source for track:', currentTrack.title);
        return;
      }

      try {
        await ws.load(url);
        if (shouldRevoke) ws.once('ready', () => URL.revokeObjectURL(url!));
        if (usePlayerStore.getState().isPlaying) ws.play();
      } catch (e) {
        console.warn('Failed to load track:', e);
        if (shouldRevoke && url) URL.revokeObjectURL(url);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Sync play/pause
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !ws.getDuration()) return;
    if (isPlaying) { if (!ws.isPlaying()) ws.play(); }
    else           { if (ws.isPlaying())  ws.pause(); }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    wsRef.current?.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const seek = useCallback((time: number) => {
    const ws  = wsRef.current;
    const dur = ws?.getDuration() ?? 0;
    if (ws && dur > 0) ws.seekTo(Math.max(0, Math.min(1, time / dur)));
  }, []);

  return { seek, ws: wsRef };
}
