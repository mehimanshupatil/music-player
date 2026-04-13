import Dexie, { type Table } from 'dexie';

export interface Track {
  id: string;                    // hash of file path
  filePath: string;
  title: string;
  artist: string;
  albumArtist: string;
  album: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  duration: number;              // seconds
  coverArt?: string;             // base64 data URL
  format: string;
  bitrate?: number;
  sampleRate?: number;
  fileHandle?: FileSystemFileHandle;
}

export interface StoredFolder {
  id?: number;
  handle: FileSystemDirectoryHandle;
  name: string;
  lastScanned: Date;
  trackCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayHistoryEntry {
  id?: number;
  trackId: string;
  playedAt: Date;
}

class MusicDB extends Dexie {
  tracks!: Table<Track>;
  folders!: Table<StoredFolder>;
  playlists!: Table<Playlist>;
  playHistory!: Table<PlayHistoryEntry>;

  constructor() {
    super('musik-player');
    this.version(1).stores({
      tracks:      'id, filePath, albumArtist, album, title, artist, year',
      folders:     '++id, name',
      playlists:   'id, name, createdAt',
      playHistory: '++id, trackId, playedAt',
    });
  }
}

export const db = new MusicDB();

export async function getAllTracks(): Promise<Track[]> {
  return db.tracks.orderBy('albumArtist').toArray();
}

export async function clearLibrary(): Promise<void> {
  await db.tracks.clear();
}

export async function upsertTracks(tracks: Track[]): Promise<void> {
  await db.tracks.bulkPut(tracks);
}

export async function getStoredFolder(): Promise<StoredFolder | undefined> {
  return db.folders.toCollection().first();
}

export async function storeFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  await db.folders.clear();
  await db.folders.add({
    handle,
    name: handle.name,
    lastScanned: new Date(),
    trackCount: 0,
  });
}

export async function updateFolderTrackCount(count: number): Promise<void> {
  const folder = await db.folders.toCollection().first();
  if (folder?.id != null) {
    await db.folders.update(folder.id, { trackCount: count, lastScanned: new Date() });
  }
}
