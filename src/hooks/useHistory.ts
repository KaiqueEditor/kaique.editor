import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import type { Section } from '../types/carousel.types';

const MAX_HISTORY = 30;

/**
 * Hook de Undo/Redo para sections.
 * Salva snapshots do array de sections.
 * Ctrl+Z = undo, Ctrl+Shift+Z = redo.
 */
export function useHistory() {
    const sections = useStore(s => s.sections);
    const setSections = useStore(s => s.setSections);

    const past = useRef<Section[][]>([]);
    const future = useRef<Section[][]>([]);
    const skipNext = useRef(false);

    // Registra snapshot quando sections muda (exceto via undo/redo)
    useEffect(() => {
        if (skipNext.current) {
            skipNext.current = false;
            return;
        }
        if (sections.length === 0) return;

        // Evita duplicatas consecutivas
        const lastPast = past.current[past.current.length - 1];
        if (lastPast && JSON.stringify(lastPast) === JSON.stringify(sections)) return;

        past.current = [...past.current.slice(-MAX_HISTORY), sections];
        future.current = [];
    }, [sections]);

    const undo = useCallback(() => {
        if (past.current.length <= 1) return; // precisa de pelo menos 2 (estado anterior + atual)
        const current = past.current.pop()!;
        future.current = [current, ...future.current];
        const prev = past.current[past.current.length - 1];
        if (prev) {
            skipNext.current = true;
            setSections(prev);
        }
    }, [setSections]);

    const redo = useCallback(() => {
        if (future.current.length === 0) return;
        const next = future.current.shift()!;
        past.current = [...past.current, next];
        skipNext.current = true;
        setSections(next);
    }, [setSections]);

    const canUndo = past.current.length > 1;
    const canRedo = future.current.length > 0;

    return { undo, redo, canUndo, canRedo };
}
