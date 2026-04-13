import { useRef } from 'react';
import { motion } from 'motion/react';
import { FolderOpen, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/playerStore';
import { scanDirectory } from '@/lib/scanner';
import { supportsFileSystemAccess, isIOS, generateId, isAudioFile } from '@/lib/utils';
import { setFileObject, clearFileObjects } from '@/lib/fileObjectStore';
import type { FolderState } from '@/hooks/useFolderPersistence';
import type { Track } from '@/lib/dexie';
import { db } from '@/lib/dexie';

interface Props {
  folderState: FolderState;
  folderName: string;
  requestPermission: () => Promise<boolean>;
  markReady: () => void;
}

export function FolderPicker({ folderState, folderName, requestPermission, markReady }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setTracks       = usePlayerStore(s => s.actions.setTracks);
  const setIsScanning   = usePlayerStore(s => s.actions.setIsScanning);
  const setScanProgress = usePlayerStore(s => s.actions.setScanProgress);

  // ── Desktop / Android: File System Access API ──
  async function openFolder() {
    if (supportsFileSystemAccess()) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        setIsScanning(true);

        await scanDirectory(dirHandle, status => {
          if (status.type === 'scanning') {
            setScanProgress({ scanned: status.scanned, total: status.total, current: status.current });
          } else if (status.type === 'done' || status.type === 'error') {
            setIsScanning(false);
            setScanProgress({ scanned: 0, total: 0, current: '' });
            if (status.type === 'error') console.error(status.message);
          }
        });

        const tracks = await db.tracks.toArray();
        setTracks(tracks);
        markReady();
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error(e);
        setIsScanning(false);
      }
    } else {
      // iOS / fallback: use file input
      fileInputRef.current?.click();
    }
  }

  // ── iOS / fallback: <input type="file"> ──
  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => isAudioFile(f.name));
    e.target.value = '';
    if (!files.length) return;

    // Clear previous session files
    clearFileObjects();

    setIsScanning(true);
    const tracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setScanProgress({ scanned: i, total: files.length, current: file.name });

      const id = generateId(file.name + file.size);

      // Store File object in memory for playback this session
      setFileObject(id, file);

      try {
        const { parseBlob } = await import('music-metadata');
        const meta = await parseBlob(file, { duration: true, skipCovers: false });
        const { common, format } = meta;

        let coverArt: string | undefined;
        const pic = common.picture?.[0];
        if (pic) {
          const b64 = btoa(Array.from(pic.data).map(b => String.fromCharCode(b)).join(''));
          coverArt = `data:${pic.format};base64,${b64}`;
        }

        tracks.push({
          id,
          filePath:    file.name,
          title:       common.title       || file.name.replace(/\.[^.]+$/, ''),
          artist:      common.artist      || 'Unknown Artist',
          albumArtist: common.albumartist || common.artist || 'Unknown Artist',
          album:       common.album       || 'Unknown Album',
          year:        common.year,
          trackNumber: common.track?.no   ?? undefined,
          discNumber:  common.disk?.no    ?? undefined,
          duration:    format.duration    ?? 0,
          coverArt,
          format:      format.container?.toLowerCase() ?? file.name.split('.').pop() ?? 'audio',
          bitrate:     format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
          sampleRate:  format.sampleRate,
        });
      } catch {
        tracks.push({
          id,
          filePath:    file.name,
          title:       file.name.replace(/\.[^.]+$/, ''),
          artist:      'Unknown Artist',
          albumArtist: 'Unknown Artist',
          album:       'Unknown Album',
          duration:    0,
          format:      file.name.split('.').pop() ?? 'audio',
        });
      }
    }

    // No Dexie for input path — File objects can't survive refresh anyway
    setTracks(tracks);
    setIsScanning(false);
    setScanProgress({ scanned: 0, total: 0, current: '' });
    markReady();
  }

  // ── needs-permission state ──
  if (folderState === 'needs-permission') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <div
          className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center justify-center"
          style={{ background: 'var(--color-accent-subtle)' }}
        >
          <FolderOpen size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <p className="text-subhead mb-1">Re-open your library</p>
          <p className="text-caption">"{folderName}" needs permission to access your files again.</p>
        </div>
        <Button onClick={requestPermission} className="gap-2">
          <FolderOpen size={16} />
          Re-open folder
        </Button>
      </div>
    );
  }

  // ── empty state / initial picker ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center flex-1 gap-8 p-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-[var(--radius-xl)] flex items-center justify-center"
        style={{ background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-card)' }}
      >
        <Music size={36} style={{ color: 'var(--color-accent)' }} />
      </motion.div>

      <div>
        <h2 className="text-heading mb-2">Open your music</h2>
        <p className="text-caption max-w-xs mx-auto">
          {isIOS()
            ? 'Select audio files from your device to start listening.'
            : 'Select a folder containing your music files. Your library persists across sessions.'}
        </p>
      </div>

      {isIOS() && (
        <p className="ios-banner rounded-[var(--radius-md)] text-xs px-4 py-2">
          On iOS, you'll need to re-select files each session
        </p>
      )}

      <Button size="lg" onClick={openFolder} className="gap-2 px-8">
        <FolderOpen size={18} />
        {isIOS() ? 'Select audio files' : 'Open music folder'}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        // @ts-ignore — non-standard attribute
        webkitdirectory=""
        className="hidden"
        onChange={onFilesSelected}
      />

      <p className="text-label">
        Supports MP3 · FLAC · AAC · OGG · WAV · M4A · OPUS
      </p>
    </motion.div>
  );
}
