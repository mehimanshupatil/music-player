import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Music } from 'lucide-react';
import { LibraryHeader } from './LibraryHeader';
import { ScanProgress } from './ScanProgress';
import { TrackRow } from './TrackRow';
import { useFilteredTracks } from '@/stores/playerStore';

const ROW_HEIGHT = 52;

export function TrackList() {
  const tracks    = useFilteredTracks();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count:          tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize:   () => ROW_HEIGHT,
    overscan:       10,
  });

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-sidebar-bg)' }}>
      <LibraryHeader />
      <ScanProgress />

      {/* Track list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto custom-scroll px-2"
        role="grid"
        aria-label="Track list"
      >
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Music size={32} />
            <p className="text-caption">No tracks found</p>
          </div>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map(vItem => (
              <div
                key={vItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                  transform: `translateY(${vItem.start}px)`,
                }}
              >
                <TrackRow
                  track={tracks[vItem.index]}
                  index={vItem.index}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
