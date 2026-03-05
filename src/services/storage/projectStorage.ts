import { openDB, DBSchema } from 'idb';
import type { Section, ProjectConfig } from '../../types/carousel.types';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  config: ProjectConfig;
  thumbnailDataUrl?: string; // PNG da capa em base64
  slideCount: number;
}

// ── Schema IndexedDB ───────────────────────────────────────────────────────────

interface CarrosselProDB extends DBSchema {
  projects: {
    key: string;
    value: SavedProject;
    indexes: { 'by-updated': string };
  };
}

const DB_NAME = 'carrosselpro-history';
const DB_VERSION = 1;

async function getDB() {
  return openDB<CarrosselProDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('projects', { keyPath: 'id' });
      store.createIndex('by-updated', 'updatedAt');
    },
  });
}

// ── ProjectStorage (IndexedDB) ─────────────────────────────────────────────────

class ProjectStorage {
  /** Salva ou atualiza um projeto */
  async saveProject(
    id: string,
    name: string,
    sections: Section[],
    config: ProjectConfig,
    thumbnailDataUrl?: string,
  ): Promise<SavedProject> {
    const db = await getDB();
    const existing = await db.get('projects', id);
    const now = new Date().toISOString();

    const project: SavedProject = {
      id,
      name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      // Imagens preservadas no IndexedDB (suporta centenas de MB)
      // Vídeos removidos (muito grandes)
      sections: sections.map(s => ({
        ...s,
        videoUrl: undefined,
      })),
      config: {
        ...config,
        avatarUrl: config.avatarUrl?.startsWith('data:') ? '' : config.avatarUrl,
      },
      thumbnailDataUrl,
      slideCount: sections.length,
    };

    await db.put('projects', project);

    // Limite de 10 carrosséis (ignorando auto-backup)
    const all = await db.getAll('projects');
    const saved = all.filter(p => p.id !== 'auto-backup');
    if (saved.length > 10) {
      const sorted = saved.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const toDelete = sorted.slice(10);
      for (const old of toDelete) {
        await db.delete('projects', old.id);
      }
    }

    return project;
  }

  /** Lista todos os projetos, mais recente primeiro */
  async getAllProjects(): Promise<SavedProject[]> {
    const db = await getDB();
    const all = await db.getAll('projects');
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /** Carrega um projeto pelo ID */
  async loadProject(id: string): Promise<SavedProject | undefined> {
    const db = await getDB();
    return db.get('projects', id);
  }

  /** Deleta um projeto */
  async deleteProject(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);
  }

  /** Duplica um projeto */
  async duplicateProject(id: string): Promise<SavedProject | undefined> {
    const db = await getDB();
    const original = await db.get('projects', id);
    if (!original) return undefined;

    const newProject: SavedProject = {
      ...original,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      name: `${original.name} (cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('projects', newProject);
    return newProject;
  }

  /** Exporta como JSON (para backup) */
  exportToJSON(project: SavedProject): string {
    return JSON.stringify(project, null, 2);
  }

  /** Importa de JSON */
  importFromJSON(json: string): SavedProject {
    const project = JSON.parse(json);
    if (!project.id || !project.sections || !project.config) {
      throw new Error('Formato inválido de projeto');
    }
    return project as SavedProject;
  }
}

export const projectStorage = new ProjectStorage();
