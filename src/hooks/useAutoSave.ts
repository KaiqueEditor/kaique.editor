import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { projectStorage } from '../services/storage/projectStorage';
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

        try {
            // Gerar thumbnail (leve)
            let thumbnailDataUrl: string | undefined;
            const firstSlide = exportRefs.current[0];
            if (firstSlide) {
                const { toJpeg } = await import('html-to-image');
                thumbnailDataUrl = await toJpeg(firstSlide, { quality: 0.3, pixelRatio: 0.15 });
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
