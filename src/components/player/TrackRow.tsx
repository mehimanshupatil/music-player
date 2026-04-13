import { motion } from 'motion/react';
import { formatDuration, coverGradient } from '@/lib/utils';
import type { Track } from '@/lib/dexie';
import { usePlayerStore } from '@/stores/playerStore';

interface Props {
  track: Track;
  index: number;
  style?: React.CSSProperties;
}

function SoundBars() {
  return (
    <span className="flex items-end gap-px h-4" aria-label="Now playing">
      {[1, 2, 3].map(i => (
        <span key={i} className="soundbar-bar" style={{ height: '100%' }} />
      ))}
    </span>
  );
}

export function TrackRow({ track, index, style }: Props) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const playTrack    = usePlayerStore(s => s.actions.playTrack);

  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.4) }}
      className="track-row h-[52px] md:h-[52px] select-none"
      data-active={isActive}
      onDoubleClick={() => playTrack(track)}
      onClick={() => playTrack(track)}
      role="row"
      aria-selected={isActive}
    >
      {/* Track number / soundbars */}
      <span className="w-7 flex items-center justify-center flex-shrink-0 tabular-nums"
        style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: 13 }}>
        {isActive && isPlaying ? <SoundBars /> : (track.trackNumber ?? index + 1)}
      </span>

      {/* Cover art */}
      <span
        className="w-9 h-9 rounded-[var(--radius-xs)] flex-shrink-0 overflow-hidden"
        style={{
          background: track.coverArt ? undefined : coverGradient(track.album || track.title),
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {track.coverArt && (
          <img src={track.coverArt} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </span>

      {/* Title + artist */}
      <span className="flex flex-col min-w-0 flex-1">
        <span
          className="track-title truncate"
          style={{
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            lineHeight: '1.25',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
          }}
        >
          {track.title}
        </span>
        <span className="truncate text-caption" style={{ fontSize: 12 }}>
          {track.artist}
        </span>
      </span>

      {/* Duration */}
      <span className="tabular-nums flex-shrink-0 text-caption" style={{ fontSize: 12 }}>
        {formatDuration(track.duration)}
      </span>
    </motion.div>
  );
}
