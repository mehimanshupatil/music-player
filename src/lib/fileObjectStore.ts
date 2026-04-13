/**
 * In-memory store for File objects picked via <input type="file">.
 * File objects cannot survive page refresh, so this is session-only.
 * The showDirectoryPicker path uses FileSystemFileHandle stored in Dexie instead.
 */
const store = new Map<string, File>();

export function setFileObject(id: string, file: File): void {
  store.set(id, file);
}

export function getFileObject(id: string): File | undefined {
  return store.get(id);
}

export function clearFileObjects(): void {
  store.clear();
}
