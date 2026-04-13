import { useEffect, useState } from 'react';
import { getStoredFolder } from '@/lib/dexie';
import { getAllTracks } from '@/lib/dexie';
import { usePlayerStore } from '@/stores/playerStore';

export type FolderState = 'loading' | 'none' | 'needs-permission' | 'ready';

export function useFolderPersistence() {
  const [folderState, setFolderState] = useState<FolderState>('loading');
  const [folderName, setFolderName] = useState<string>('');
  const setTracks = usePlayerStore(s => s.actions.setTracks);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredFolder();
        if (!stored) { setFolderState('none'); return; }

        setFolderName(stored.name);

        // Check permission without prompting
        const perm = await stored.handle.queryPermission({ mode: 'read' });
        if (perm === 'granted') {
          const tracks = await getAllTracks();
          setTracks(tracks);
          setFolderState('ready');
        } else {
          setFolderState('needs-permission');
        }
      } catch {
        setFolderState('none');
      }
    })();
  }, []);

  async function requestPermission(): Promise<boolean> {
    try {
      const stored = await getStoredFolder();
      if (!stored) return false;
      const perm = await stored.handle.requestPermission({ mode: 'read' });
      if (perm === 'granted') {
        const tracks = await getAllTracks();
        setTracks(tracks);
        setFolderState('ready');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function markReady() { setFolderState('ready'); }

  return { folderState, folderName, requestPermission, markReady };
}
