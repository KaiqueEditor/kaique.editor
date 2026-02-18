import { useEffect } from 'react';
import { useStore } from '../store';

export const useKeyboardShortcuts = () => {
  const activeSlide = useStore(state => state.activeSlide);
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const sections = useStore(state => state.sections);
  const setAgentOpen = useStore(state => state.setAgentOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

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

      // Open Agent: Cmd+K
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        setAgentOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, setActiveSlide, sections, setAgentOpen]);
};
