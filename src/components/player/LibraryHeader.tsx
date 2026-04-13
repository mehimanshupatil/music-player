import { Search, X, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select';
import { usePlayerStore } from '@/stores/playerStore';
import { scanDirectory } from '@/lib/scanner';
import { getStoredFolder, db } from '@/lib/dexie';
import { supportsFileSystemAccess } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function LibraryHeader() {
  const searchQuery = usePlayerStore(s => s.searchQuery);
  const sortBy      = usePlayerStore(s => s.sortBy);
  const trackCount  = usePlayerStore(s => s.tracks.length);
  const isScanning  = usePlayerStore(s => s.isScanning);

  const setSearch        = usePlayerStore(s => s.actions.setSearch);
  const setSortBy        = usePlayerStore(s => s.actions.setSortBy);
  const setTracks        = usePlayerStore(s => s.actions.setTracks);
  const setIsScanning    = usePlayerStore(s => s.actions.setIsScanning);
  const setScanProgress  = usePlayerStore(s => s.actions.setScanProgress);

  async function rescan() {
    if (!supportsFileSystemAccess()) return;
    const stored = await getStoredFolder();
    if (!stored) return;
    const perm = await stored.handle.requestPermission({ mode: 'read' });
    if (perm !== 'granted') return;

    setIsScanning(true);
    await scanDirectory(stored.handle, status => {
      if (status.type === 'scanning') {
        setScanProgress({ scanned: status.scanned, total: status.total, current: status.current });
      } else if (status.type === 'done' || status.type === 'error') {
        setIsScanning(false);
        setScanProgress({ scanned: 0, total: 0, current: '' });
      }
    });
    const updated = await db.tracks.toArray();
    setTracks(updated);
  }

  return (
    <div
      className="frosted sticky top-0 z-[var(--z-sidebar)] border-b border-[var(--color-border)]"
      style={{ background: 'var(--color-player-bar-bg)' }}
    >
      {/* Top row: title + actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-subhead leading-none">Library</p>
          <p className="text-label mt-0.5">
            {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
          </p>
        </div>

        {supportsFileSystemAccess() && (
          <Button
            variant="ghost"
            size="icon"
            onClick={rescan}
            disabled={isScanning}
            className="h-8 w-8"
            aria-label="Re-scan folder"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          </Button>
        )}

        <ThemeToggle />
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <Input
            id="track-search"
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearch('')}
            placeholder="Search tracks…"
            className="pl-8 pr-8 h-8 text-sm"
            style={{ borderRadius: 'var(--radius-full)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger
            className="h-8 w-8 px-0 justify-center"
            style={{ borderRadius: 'var(--radius-sm)' }}
            aria-label="Sort tracks"
          >
            <ArrowUpDown size={13} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="artist">Artist</SelectItem>
            <SelectItem value="album">Album</SelectItem>
            <SelectItem value="trackNumber">Track #</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
