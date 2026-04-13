import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { Track } from '@/lib/dexie';
import { shuffle } from '@/lib/utils';

export type RepeatMode = 'none' | 'one' | 'all';
export type Theme = 'light' | 'dark' | 'system';

interface PlayerState {
  // Library
  tracks: Track[];
  searchQuery: string;
  sortBy: 'title' | 'artist' | 'album' | 'trackNumber';

  // Queue
  queue: Track[];
  queueIndex: number;
  currentTrack: Track | null;

  // Playback (not persisted — managed by wavesurfer)
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Settings (persisted)
  volume: number;
  isMuted: boolean;
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  theme: Theme;

  // UI
  sidebarOpen: boolean;
  isScanning: boolean;
  scanProgress: { scanned: number; total: number; current: string };

  actions: {
    setTracks(tracks: Track[]): void;
    setSearch(q: string): void;
    setSortBy(s: PlayerState['sortBy']): void;
    playTrack(track: Track): void;
    playAll(tracks: Track[], startIndex?: number): void;
    setIsPlaying(v: boolean): void;
    setCurrentTime(t: number): void;
    setDuration(d: number): void;
    next(): void;
    prev(): void;
    setVolume(v: number): void;
    toggleMute(): void;
    toggleShuffle(): void;
    cycleRepeat(): void;
    setTheme(t: Theme): void;
    toggleSidebar(): void;
    setSidebarOpen(v: boolean): void;
    setIsScanning(v: boolean): void;
    setScanProgress(p: { scanned: number; total: number; current: string }): void;
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    immer((set, get) => ({
      tracks: [],
      searchQuery: '',
      sortBy: 'title',
      queue: [],
      queueIndex: -1,
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      shuffleMode: false,
      repeatMode: 'none',
      theme: 'system',
      sidebarOpen: false,
      isScanning: false,
      scanProgress: { scanned: 0, total: 0, current: '' },

      actions: {
        setTracks(tracks) {
          set(s => { s.tracks = tracks; });
        },

        setSearch(q) {
          set(s => { s.searchQuery = q; });
        },

        setSortBy(sortBy) {
          set(s => { s.sortBy = sortBy; });
        },

        playTrack(track) {
          const { queue, shuffleMode, tracks } = get();
          // Build queue from current track list
          const source = tracks.length ? tracks : [track];
          const idx = source.findIndex(t => t.id === track.id);
          const newQueue = shuffleMode ? shuffle(source) : source;
          const newIdx = shuffleMode
            ? newQueue.findIndex(t => t.id === track.id)
            : Math.max(0, idx);
          set(s => {
            s.queue = newQueue;
            s.queueIndex = newIdx;
            s.currentTrack = newQueue[newIdx] ?? track;
            s.isPlaying = true;
          });
        },

        playAll(tracks, startIndex = 0) {
          const { shuffleMode } = get();
          const newQueue = shuffleMode ? shuffle(tracks) : tracks;
          const newIdx = shuffleMode ? 0 : startIndex;
          set(s => {
            s.queue = newQueue;
            s.queueIndex = newIdx;
            s.currentTrack = newQueue[newIdx] ?? null;
            s.isPlaying = true;
          });
        },

        setIsPlaying(v) {
          set(s => { s.isPlaying = v; });
        },

        setCurrentTime(t) {
          set(s => { s.currentTime = t; });
        },

        setDuration(d) {
          set(s => { s.duration = d; });
        },

        next() {
          const { queue, queueIndex, repeatMode } = get();
          if (!queue.length) return;
          let nextIdx = queueIndex + 1;
          if (nextIdx >= queue.length) {
            if (repeatMode === 'all') nextIdx = 0;
            else { set(s => { s.isPlaying = false; }); return; }
          }
          set(s => {
            s.queueIndex = nextIdx;
            s.currentTrack = queue[nextIdx];
            s.isPlaying = true;
            s.currentTime = 0;
          });
        },

        prev() {
          const { queue, queueIndex, currentTime } = get();
          if (!queue.length) return;
          // If >3s in, restart current track
          if (currentTime > 3) {
            set(s => { s.currentTime = 0; });
            return;
          }
          const prevIdx = Math.max(0, queueIndex - 1);
          set(s => {
            s.queueIndex = prevIdx;
            s.currentTrack = queue[prevIdx];
            s.isPlaying = true;
            s.currentTime = 0;
          });
        },

        setVolume(v) {
          set(s => {
            s.volume = Math.max(0, Math.min(1, v));
            s.isMuted = false;
          });
        },

        toggleMute() {
          set(s => { s.isMuted = !s.isMuted; });
        },

        toggleShuffle() {
          const { shuffleMode, queue, queueIndex, tracks } = get();
          const current = queue[queueIndex] ?? null;
          const newShuffle = !shuffleMode;
          let newQueue = newShuffle ? shuffle(tracks) : [...tracks];
          const newIdx = current ? newQueue.findIndex(t => t.id === current.id) : 0;
          set(s => {
            s.shuffleMode = newShuffle;
            s.queue = newQueue;
            s.queueIndex = Math.max(0, newIdx);
          });
        },

        cycleRepeat() {
          const order: RepeatMode[] = ['none', 'all', 'one'];
          const { repeatMode } = get();
          const next = order[(order.indexOf(repeatMode) + 1) % order.length];
          set(s => { s.repeatMode = next; });
        },

        setTheme(t) {
          set(s => { s.theme = t; });
        },

        toggleSidebar() {
          set(s => { s.sidebarOpen = !s.sidebarOpen; });
        },

        setSidebarOpen(v) {
          set(s => { s.sidebarOpen = v; });
        },

        setIsScanning(v) {
          set(s => { s.isScanning = v; });
        },

        setScanProgress(p) {
          set(s => { s.scanProgress = p; });
        },
      },
    })),
    {
      name: 'musik-player-settings',
      // Only persist user preferences, not library/queue state
      partialize: (s) => ({
        volume: s.volume,
        isMuted: s.isMuted,
        shuffleMode: s.shuffleMode,
        repeatMode: s.repeatMode,
        theme: s.theme,
        sortBy: s.sortBy,
      }),
    }
  )
);

// Selectors
export const useFilteredTracks = () => {
  const tracks = usePlayerStore(s => s.tracks);
  const query  = usePlayerStore(s => s.searchQuery);
  const sortBy = usePlayerStore(s => s.sortBy);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      )
    : tracks;

  return [...filtered].sort((a, b) => {
    if (sortBy === 'trackNumber') {
      const dn = (a.discNumber ?? 1) - (b.discNumber ?? 1);
      if (dn !== 0) return dn;
      return (a.trackNumber ?? 999) - (b.trackNumber ?? 999);
    }
    return (a[sortBy] ?? '').toString().localeCompare((b[sortBy] ?? '').toString());
  });
};
