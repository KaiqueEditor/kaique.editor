import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { projectStorage } from '../../services/storage/projectStorage';
import { cloudStorage } from '../../services/storage/cloudStorage';
import type { ProjectConfig, Section } from '../../types/carousel.types';

export interface Project {
  id: string;
  name: string;
  slideCount: number;
  updatedAt: string;
  source: 'cloud' | 'local';
  thumbnailUrl?: string;
  sections: Section[];
  config: ProjectConfig;
}

/** Projetos da nuvem + os que só existem neste aparelho, mais recentes primeiro. */
export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [local, cloud] = await Promise.all([
        projectStorage.getAllProjects().catch(() => []),
        userId ? cloudStorage.getUserCarousels(userId).catch(() => []) : Promise.resolve([]),
      ]);
      const cloudProjects: Project[] = cloud.map(c => ({
        id: c.id, name: c.name, slideCount: c.slide_count, updatedAt: c.updated_at, source: 'cloud' as const,
        thumbnailUrl: c.thumbnail_url, sections: c.sections ?? [], config: c.config,
      }));
      const cloudIds = new Set(cloudProjects.map(p => p.id));
      const cloudNames = new Set(cloudProjects.map(p => p.name));
      const localOnly: Project[] = local
        .filter(p => p.id !== 'auto-backup' && !cloudIds.has(p.id) && !cloudNames.has(p.name))
        .map(p => ({
          id: p.id, name: p.name, slideCount: p.slideCount, updatedAt: p.updatedAt, source: 'local' as const,
          thumbnailUrl: p.thumbnailDataUrl, sections: p.sections, config: p.config,
        }));
      setProjects([...cloudProjects, ...localOnly].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch {
      toast.error('Não foi possível carregar seus projetos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const remove = useCallback(async (p: Project) => {
    const ok = p.source === 'cloud' ? await cloudStorage.deleteCarousel(p.id) : (await projectStorage.deleteProject(p.id), true);
    if (!ok) { toast.error('Não foi possível apagar'); return; }
    await projectStorage.deleteProject(p.id).catch(() => {});
    setProjects(prev => prev.filter(x => x.id !== p.id));
    toast.success(`“${p.name}” apagado`);
  }, []);

  const duplicate = useCallback(async (p: Project) => {
    const name = `${p.name} (cópia)`;
    if (p.source === 'cloud' && userId) {
      const row = await cloudStorage.createCarousel(userId, name, p.sections, p.config, p.thumbnailUrl);
      if (!row) { toast.error('Não foi possível duplicar'); return; }
    } else {
      await projectStorage.duplicateProject(p.id);
    }
    toast.success('Projeto duplicado');
    load();
  }, [userId, load]);

  return { projects, loading, reload: load, remove, duplicate };
}

/** "agora", "há 5 min", "ontem", "12 de out." */
export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ontem';
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
