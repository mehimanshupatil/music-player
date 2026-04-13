import { motion, AnimatePresence } from 'motion/react';
import { usePlayerStore } from '@/stores/playerStore';

export function ScanProgress() {
  const isScanning  = usePlayerStore(s => s.isScanning);
  const scanProgress = usePlayerStore(s => s.scanProgress);

  const pct = scanProgress.total > 0
    ? Math.round((scanProgress.scanned / scanProgress.total) * 100)
    : 0;

  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-3 border-b border-[var(--color-border)]"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-caption">
              {scanProgress.total > 0
                ? `Scanning ${scanProgress.scanned} / ${scanProgress.total}`
                : 'Collecting files…'}
            </span>
            <span className="text-label">{pct}%</span>
          </div>

          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--color-progress-track)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--color-progress-fill)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear', duration: 0.3 }}
            />
          </div>

          {scanProgress.current && (
            <p className="text-label mt-1 truncate" title={scanProgress.current}>
              {scanProgress.current}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
