import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { projectStorage } from '../services/storage/projectStorage';
import { inlineImagesToDataUrl } from './useExport';
import type { Section, ProjectConfig } from '../types';

const AUTO_SAVE_INTERVAL = 3 * 60 * 1000; // 3 minutos
const AUTO_BACKUP_ID = 'auto-backup';
const AUTO_BACKUP_NAME = '🔄 Auto-backup';

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

        try {
            // Gerar thumbnail (leve)
            let thumbnailDataUrl: string | undefined;
            const firstSlide = exportRefs.current[0];
            if (firstSlide) {
                // Tornar container fixo visível temporariamente para a captura
                const wrapper = firstSlide.parentElement;
                const fixedContainer = wrapper?.parentElement;
                if (fixedContainer) fixedContainer.style.opacity = '1';
                // Protege contra CORS para thumbnails
                const restoreImages = await inlineImagesToDataUrl(firstSlide);
                await new Promise(r => setTimeout(r, 100));
                try {
                    const { toJpeg } = await import('html-to-image');
                    thumbnailDataUrl = await toJpeg(firstSlide, { quality: 0.3, pixelRatio: 0.15 });
                } finally {
                    restoreImages();
                    if (fixedContainer) fixedContainer.style.opacity = '0.0001';
                }
            }
            // Salvar localmente com ID fixo — sempre sobrescreve o mesmo slot
            await projectStorage.saveProject(
                AUTO_BACKUP_ID,
                AUTO_BACKUP_NAME,
                sections,
                config,
                thumbnailDataUrl,
            );

            console.log('[AutoSave] Backup local salvo (auto-backup)');
        } catch (err) {
            console.warn('[AutoSave] Erro:', err);
        }
    }, [sections, config, exportRefs]);

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(doAutoSave, AUTO_SAVE_INTERVAL);
        return () => clearInterval(timer);
    }, [enabled, doAutoSave]);

    return { doAutoSave };
}
