import { wrap, proxy } from 'comlink';
import type { Track } from './dexie';
import { db, upsertTracks, storeFolder, updateFolderTrackCount } from './dexie';
import type { ScanProgress } from './metadataWorker';

export type ScanStatus =
  | { type: 'idle' }
  | { type: 'scanning'; scanned: number; total: number; current: string }
  | { type: 'done'; count: number }
  | { type: 'error'; message: string };

type WorkerApi = {
  scanFolder(
    dir: FileSystemDirectoryHandle,
    onProgress: (p: ScanProgress) => void
  ): Promise<{ tracks: Track[] }>;
};

export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress: (status: ScanStatus) => void
): Promise<Track[]> {
  const workerInstance = new Worker(
    new URL('./metadataWorker.ts', import.meta.url),
    { type: 'module' }
  );
  const api = wrap<WorkerApi>(workerInstance);

  try {
    onProgress({ type: 'scanning', scanned: 0, total: 0, current: 'Collecting files…' });

    const { tracks } = await api.scanFolder(
      dirHandle,
      proxy((p: ScanProgress) => {
        onProgress({ type: 'scanning', scanned: p.scanned, total: p.total, current: p.current });
      })
    );

    await storeFolder(dirHandle);
    await db.tracks.clear();
    await upsertTracks(tracks);
    await updateFolderTrackCount(tracks.length);

    onProgress({ type: 'done', count: tracks.length });
    return tracks;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onProgress({ type: 'error', message });
    return [];
  } finally {
    workerInstance.terminate();
  }
}
