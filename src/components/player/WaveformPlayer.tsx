import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { coverGradient, formatDuration } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { useWaveSurfer } from '@/hooks/useWaveSurfer';

interface Props {
  onSeekReady: (fn: (t: number) => void) => void;
}

export function WaveformPlayer({ onSeekReady }: Props) {
  const waveRef    = useRef<HTMLDivElement>(null);
  const { seek }   = useWaveSurfer(waveRef);

  const currentTrack = usePlayerStore(s => s.currentTrack);
  const duration     = usePlayerStore(s => s.duration);
  const currentTime  = usePlayerStore(s => s.currentTime);

  // Register seek function with parent — runs once when seek is stable
  useEffect(() => {
    onSeekReady(seek);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seek]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 opacity-30">
        <div
          className="w-48 h-48 rounded-[var(--radius-xl)]"
          style={{ background: 'var(--color-bg-subtle)' }}
        />
        <p className="text-caption">Pick a track to start listening</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 py-8 max-w-lg mx-auto w-full overflow-y-auto custom-scroll">

      {/* Album art */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1    }}
          exit={{    opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25, ease: [0.32, 0, 0.67, 0] }}
          className="w-48 h-48 md:w-56 md:h-56 rounded-[var(--radius-xl)] overflow-hidden flex-shrink-0"
          style={{
            boxShadow:  'var(--shadow-card)',
            background: currentTrack.coverArt
              ? undefined
              : coverGradient(currentTrack.album || currentTrack.title),
          }}
        >
          {currentTrack.coverArt && (
            <img
              src={currentTrack.coverArt}
              alt={`${currentTrack.album} cover`}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Track info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id + '-info'}
          initial={{ opacity: 0, y: 8  }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="text-center w-full"
        >
          <p
            className="text-display truncate"
            style={{ letterSpacing: '-0.025em' }}
            title={currentTrack.title}
          >
            {currentTrack.title}
          </p>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {currentTrack.artist}
          </p>
          <p className="text-caption mt-0.5">{currentTrack.album}</p>

          {/* Format badges */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs)] text-label"
              style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
            >
              {currentTrack.format.toUpperCase()}
            </span>
            {currentTrack.bitrate && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs)] text-label"
                style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
              >
                {currentTrack.bitrate}kbps
              </span>
            )}
            {currentTrack.year && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs)] text-label"
                style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}
              >
                {currentTrack.year}
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Waveform */}
      <div
        className="w-full rounded-[var(--radius-md)] overflow-hidden waveform-container"
        style={{
          background: 'var(--color-bg-elevated)',
          border:     '1px solid var(--color-border)',
          padding:    '12px 16px',
          boxShadow:  'var(--shadow-sm)',
        }}
      >
        <div ref={waveRef} />
        <div className="flex justify-between mt-1">
          <span className="text-label tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {formatDuration(currentTime)}
          </span>
          <span className="text-label tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {formatDuration(duration || currentTrack.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
