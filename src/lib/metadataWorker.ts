/// <reference lib="webworker" />
import { expose } from 'comlink';
import { parseBlob } from 'music-metadata';
import { generateId, isAudioFile } from './utils';
import type { Track } from './dexie';

export interface ScanProgress {
  scanned: number;
  total: number;
  current: string;
}

export interface ScanResult {
  tracks: Track[];
}

async function collectFiles(
  dirHandle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<{ file: File; path: string; handle: FileSystemFileHandle }[]> {
  const results: { file: File; path: string; handle: FileSystemFileHandle }[] = [];
  for await (const [name, entry] of dirHandle.entries()) {
    if (entry.kind === 'file' && isAudioFile(name)) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      results.push({ file, path: `${basePath}/${name}`, handle: fileHandle });
    } else if (entry.kind === 'directory') {
      const sub = await collectFiles(entry as FileSystemDirectoryHandle, `${basePath}/${name}`);
      results.push(...sub);
    }
  }
  return results;
}

async function parseTrack(
  file: File,
  filePath: string,
  fileHandle: FileSystemFileHandle
): Promise<Track> {
  const id = generateId(filePath);
  try {
    const meta = await parseBlob(file, { duration: true, skipCovers: false });
    const { common, format } = meta;

    let coverArt: string | undefined;
    const pic = common.picture?.[0];
    if (pic) {
      const b64 = btoa(
        Array.from(pic.data).map(b => String.fromCharCode(b)).join('')
      );
      coverArt = `data:${pic.format};base64,${b64}`;
    }

    return {
      id,
      filePath,
      title:       common.title  || file.name.replace(/\.[^.]+$/, ''),
      artist:      common.artist || 'Unknown Artist',
      albumArtist: common.albumartist || common.artist || 'Unknown Artist',
      album:       common.album  || 'Unknown Album',
      year:        common.year,
      trackNumber: common.track?.no ?? undefined,
      discNumber:  common.disk?.no  ?? undefined,
      duration:    format.duration ?? 0,
      coverArt,
      format:      format.container?.toLowerCase() ?? file.name.split('.').pop() ?? 'audio',
      bitrate:     format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
      sampleRate:  format.sampleRate,
      fileHandle,
    };
  } catch {
    return {
      id,
      filePath,
      title:       file.name.replace(/\.[^.]+$/, ''),
      artist:      'Unknown Artist',
      albumArtist: 'Unknown Artist',
      album:       'Unknown Album',
      duration:    0,
      format:      file.name.split('.').pop() ?? 'audio',
      fileHandle,
    };
  }
}

const worker = {
  async scanFolder(
    dirHandle: FileSystemDirectoryHandle,
    onProgress: (p: ScanProgress) => void
  ): Promise<ScanResult> {
    const files = await collectFiles(dirHandle, dirHandle.name);
    const tracks: Track[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const { file, path, handle } = files[i];
      onProgress({ scanned: i, total, current: file.name });
      const track = await parseTrack(file, path, handle);
      tracks.push(track);
    }

    onProgress({ scanned: total, total, current: '' });
    return { tracks };
  },
};

expose(worker);
