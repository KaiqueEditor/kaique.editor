import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { cloudStorage } from '../services/storage/cloudStorage';
import { projectStorage } from '../services/storage/projectStorage';
import { toast } from 'react-hot-toast';
import type { Section, ProjectConfig } from '../types';

const AUTO_SAVE_INTERVAL = 3 * 60 * 1000; // 3 minutos

interface UseAutoSaveOptions {
    sections: Section[];
    config: ProjectConfig;
    currentProjectId: string | null;
    userId: string | undefined;
    exportRefs: MutableRefObject<(HTMLDivElement | null)[]>;
    enabled?: boolean;
}

export function useAutoSave({
    sections,
    config,
    currentProjectId,
    userId,
    exportRefs,
    enabled = true,
}: UseAutoSaveOptions) {
    const lastSaveRef = useRef<string>('');

    const doAutoSave = useCallback(async () => {
        if (sections.length === 0) return;

        // Evita salvar se nada mudou
        const hash = JSON.stringify({ sections, config });
        if (hash === lastSaveRef.current) return;
        lastSaveRef.current = hash;

        const name = sections[0]?.title || 'Sem título';
        const id = currentProjectId || Date.now().toString();

        try {
            // Gerar thumbnail
            let thumbnailDataUrl: string | undefined;
            const firstSlide = exportRefs.current[0];
            if (firstSlide) {
                const { toJpeg } = await import('html-to-image');
                thumbnailDataUrl = await toJpeg(firstSlide, { quality: 0.4, pixelRatio: 0.2 });
            }

            // Salvar localmente
            await projectStorage.saveProject(id, name, sections, config, thumbnailDataUrl);

            // Salvar na nuvem
            if (userId) {
                await cloudStorage.saveCarousel(userId, name, sections, config, thumbnailDataUrl);
            }

            console.log('[AutoSave] Salvo automaticamente');
        } catch (err) {
            console.warn('[AutoSave] Erro:', err);
        }
    }, [sections, config, currentProjectId, userId, exportRefs]);

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(doAutoSave, AUTO_SAVE_INTERVAL);
        return () => clearInterval(timer);
    }, [enabled, doAutoSave]);

    return { doAutoSave };
}
