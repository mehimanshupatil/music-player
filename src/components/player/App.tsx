import { useRef, useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TrackList } from './TrackList';
import { WaveformPlayer } from './WaveformPlayer';
import { PlayerBar } from './PlayerBar';
import { FolderPicker } from './FolderPicker';
import { ScanProgress } from './ScanProgress';
import { usePlayerStore } from '@/stores/playerStore';
import { useFolderPersistence } from '@/hooks/useFolderPersistence';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function App() {
  const seekRef = useRef<(t: number) => void>(() => {});
  const seek    = useCallback((t: number) => seekRef.current(t), []);

  const { folderState, folderName, requestPermission, markReady } = useFolderPersistence();

  const theme         = usePlayerStore(s => s.theme);
  const sidebarOpen   = usePlayerStore(s => s.sidebarOpen);
  const setSidebarOpen = usePlayerStore(s => s.actions.setSidebarOpen);
  const tracks        = usePlayerStore(s => s.tracks);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'dark' : 'light';
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  // Watch system preference when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useMediaSession(seek);
  useKeyboardShortcuts(seek);

  const hasLibrary = tracks.length > 0;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-dvh" style={{ background: 'var(--color-bg-base)' }}>
        {/* Main layout */}
        <div className="flex flex-1 min-h-0">

          {/* ── Desktop Sidebar ── */}
          <aside
            className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r border-[var(--color-border)] h-full"
            style={{ background: 'var(--color-sidebar-bg)' }}
          >
            {hasLibrary ? (
              <TrackList />
            ) : (
              <FolderPicker
                folderState={folderState}
                folderName={folderName}
                requestPermission={requestPermission}
                markReady={markReady}
              />
            )}
          </aside>

          {/* ── Main content ── */}
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            {folderState === 'loading' ? (
              <div className="flex flex-1 items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-caption"
                >
                  Loading library…
                </motion.div>
              </div>
            ) : hasLibrary ? (
              <WaveformPlayer onSeekReady={fn => { seekRef.current = fn; }} />
            ) : (
              /* Mobile: show folder picker in main area */
              <div className="flex md:hidden flex-col flex-1">
                <FolderPicker
                  folderState={folderState}
                  folderName={folderName}
                  requestPermission={requestPermission}
                  markReady={markReady}
                />
              </div>
            )}
          </main>
        </div>

        {/* ── Player Bar ── */}
        <PlayerBar seek={seek} />

        {/* ── Mobile: Bottom sheet sidebar ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 z-[var(--z-overlay)]"
                style={{ background: 'var(--color-bg-overlay)', backdropFilter: 'blur(4px)' }}
                onClick={() => setSidebarOpen(false)}
              />

              {/* Drawer */}
              <motion.div
                key="drawer"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{    y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-drawer)] flex flex-col"
                style={{
                  height:           '82vh',
                  background:       'var(--color-bg-base)',
                  borderTopLeftRadius:  'var(--radius-2xl)',
                  borderTopRightRadius: 'var(--radius-2xl)',
                  borderTop:        '1px solid var(--color-border)',
                  boxShadow:        '0 -8px 30px rgba(0,0,0,0.15)',
                  paddingBottom:    '88px', // clear player bar
                }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                  <div className="w-9 h-1 rounded-full"
                    style={{ background: 'var(--color-border-strong)' }} />
                </div>
                <TrackList />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background:  'var(--color-bg-elevated)',
              border:      '1px solid var(--color-border)',
              color:       'var(--color-text-primary)',
              borderRadius:'var(--radius-md)',
              boxShadow:   'var(--shadow-card)',
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
