import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function VolumeControl() {
  const volume      = usePlayerStore(s => s.volume);
  const isMuted     = usePlayerStore(s => s.isMuted);
  const setVolume   = usePlayerStore(s => s.actions.setVolume);
  const toggleMute  = usePlayerStore(s => s.actions.toggleMute);

  const effective = isMuted ? 0 : volume;
  const pct  = Math.round(effective * 100);
  const fill = `linear-gradient(to right, var(--color-slider-fill) ${pct}%, var(--color-slider-track) ${pct}%)`;

  const Icon = effective === 0 ? VolumeX
    : effective < 0.35 ? Volume
    : effective < 0.7  ? Volume1
    : Volume2;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleMute}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <Icon size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{isMuted ? 'Unmute' : 'Mute'} (M)</TooltipContent>
      </Tooltip>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        onChange={e => setVolume(parseFloat(e.target.value))}
        className="player-slider w-20"
        style={{ background: fill }}
        aria-label="Volume"
      />
    </div>
  );
}
