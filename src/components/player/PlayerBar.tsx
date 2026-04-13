import { motion } from 'motion/react';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, PanelLeftOpen,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { VolumeControl } from './VolumeControl';
import { coverGradient, formatDuration } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  seek: (t: number) => void;
}

export function PlayerBar({ seek }: Props) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const currentTime  = usePlayerStore(s => s.currentTime);
  const duration     = usePlayerStore(s => s.duration);
  const shuffleMode  = usePlayerStore(s => s.shuffleMode);
  const repeatMode   = usePlayerStore(s => s.repeatMode);

  const setIsPlaying   = usePlayerStore(s => s.actions.setIsPlaying);
  const next           = usePlayerStore(s => s.actions.next);
  const prev           = usePlayerStore(s => s.actions.prev);
  const toggleShuffle  = usePlayerStore(s => s.actions.toggleShuffle);
  const cycleRepeat    = usePlayerStore(s => s.actions.cycleRepeat);
  const toggleSidebar  = usePlayerStore(s => s.actions.toggleSidebar);

  const pct  = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fill = `linear-gradient(to right, var(--color-slider-fill) ${pct}%, var(--color-slider-track) ${pct}%)`;

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div
      className="frosted fixed bottom-0 left-0 right-0 border-t border-[var(--color-border)]"
      style={{ background: 'var(--color-player-bar-bg)', zIndex: 'var(--z-playerbar)' }}
    >
      {/* Seek bar — full width, flush at top */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={currentTime}
        onChange={e => seek(parseFloat(e.target.value))}
        className="player-slider w-full"
        style={{ background: fill, borderRadius: 0, height: 3, display: 'block' }}
        aria-label="Seek"
      />

      {/* Controls row */}
      <div className="flex items-center gap-3 px-4 py-2 md:py-3">

        {/* Mobile: sidebar toggle */}
        <button
          className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>

        {/* Track info — left */}
        <div className="flex items-center gap-3 flex-1 min-w-0 md:w-52 md:flex-none">
          {currentTrack ? (
            <>
              <div
                className="w-10 h-10 rounded-[var(--radius-sm)] flex-shrink-0 overflow-hidden"
                style={{
                  background: currentTrack.coverArt
                    ? undefined
                    : coverGradient(currentTrack.album || currentTrack.title),
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {currentTrack.coverArt && (
                  <img src={currentTrack.coverArt} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="truncate font-medium" style={{ fontSize: 13 }}>
                  {currentTrack.title}
                </p>
                <p className="truncate text-caption" style={{ fontSize: 12 }}>
                  {currentTrack.artist}
                </p>
              </div>
            </>
          ) : (
            <div
              className="w-10 h-10 rounded-[var(--radius-sm)] flex-shrink-0"
              style={{ background: 'var(--color-bg-subtle)' }}
            />
          )}
        </div>

        {/* Playback controls — center */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-center">

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleShuffle}
                className={cn(
                  'transition-colors p-1.5 rounded-[var(--radius-sm)]',
                  shuffleMode
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
                aria-label="Shuffle"
              >
                <Shuffle size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Shuffle (S)</TooltipContent>
          </Tooltip>

          <button className="btn-circle w-9 h-9" onClick={prev} aria-label="Previous">
            <SkipBack size={16} fill="currentColor" />
          </button>

          {/* Play / Pause */}
          <motion.button
            className="btn-circle btn-circle-accent w-12 h-12"
            onClick={() => setIsPlaying(!isPlaying)}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <AnimatePlayPause isPlaying={isPlaying} />
          </motion.button>

          <button className="btn-circle w-9 h-9" onClick={next} aria-label="Next">
            <SkipForward size={16} fill="currentColor" />
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={cycleRepeat}
                className={cn(
                  'transition-colors p-1.5 rounded-[var(--radius-sm)]',
                  repeatMode !== 'none'
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
                aria-label="Repeat"
              >
                <RepeatIcon size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Repeat: {repeatMode === 'none' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'} (R)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Time + Volume — right */}
        <div className="flex items-center gap-3 md:w-52 justify-end">
          <div
            className="hidden md:flex items-center gap-1 tabular-nums flex-shrink-0"
            style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          >
            <span>{formatDuration(currentTime)}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {formatDuration(duration || currentTrack?.duration || 0)}
            </span>
          </div>
          <div className="hidden md:flex">
            <VolumeControl />
          </div>
        </div>
      </div>
    </div>
  );
}

// Extracted to avoid re-creating motion props inline
function AnimatePlayPause({ isPlaying }: { isPlaying: boolean }) {
  return (
    <motion.span
      key={isPlaying ? 'pause' : 'play'}
      initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
      animate={{ opacity: 1, scale: 1,   rotate: 0   }}
      transition={{ duration: 0.15 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {isPlaying
        ? <Pause size={20} fill="currentColor" />
        : <Play  size={20} fill="currentColor" style={{ marginLeft: 2 }} />
      }
    </motion.span>
  );
}
