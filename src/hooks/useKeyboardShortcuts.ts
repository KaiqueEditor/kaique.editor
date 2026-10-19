import { useEffect } from 'react';
import { useStore } from '../store';

interface ShortcutOptions {
  onUndo?: () => void;
  onRedo?: () => void;
}

export const useKeyboardShortcuts = (opts?: ShortcutOptions) => {
  const activeSlide = useStore(state => state.activeSlide);
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const sections = useStore(state => state.sections);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      // Undo: Ctrl+Z / Cmd+Z
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        opts?.onUndo?.();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        opts?.onRedo?.();
        return;
      }

      // Next slide: Arrow Right
      if (e.key === 'ArrowRight' && activeSlide < sections.length - 1) {
        e.preventDefault();
        setActiveSlide(activeSlide + 1);
      }

      // Previous slide: Arrow Left
      if (e.key === 'ArrowLeft' && activeSlide > 0) {
        e.preventDefault();
        setActiveSlide(activeSlide - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, setActiveSlide, sections, opts]);
};
