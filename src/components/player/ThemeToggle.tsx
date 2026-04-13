import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { usePlayerStore, type Theme } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light',  icon: <Sun  size={15} />, label: 'Light' },
  { value: 'system', icon: <Monitor size={15} />, label: 'System' },
  { value: 'dark',   icon: <Moon size={15} />, label: 'Dark' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const theme   = usePlayerStore(s => s.theme);
  const setTheme = usePlayerStore(s => s.actions.setTheme);

  function cycle() {
    const idx  = themes.findIndex(t => t.value === theme);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.value);
  }

  const current = themes.find(t => t.value === theme) ?? themes[1];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={cycle}
          className={cn(
            'btn-circle w-8 h-8 text-[var(--color-text-secondary)]',
            'hover:text-[var(--color-text-primary)]',
            className
          )}
          aria-label={`Theme: ${current.label}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1   }}
              exit={{    opacity: 0, rotate:  30,  scale: 0.7 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              {current.icon}
            </motion.span>
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{current.label} theme</TooltipContent>
    </Tooltip>
  );
}
