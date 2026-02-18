import { Project } from '../../types';

const STORAGE_KEY = 'kaique-editor-projects';
const CURRENT_PROJECT_KEY = 'kaique-editor-current';

class ProjectStorage {
  saveProject(project: Project): void {
    try {
      const projects = this.getAllProjects();
      const index = projects.findIndex(p => p.id === project.id);

      if (index >= 0) {
        projects[index] = { ...project, updatedAt: new Date().toISOString() };
      } else {
        projects.push(project);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  saveCurrentProject(project: Partial<Project>): void {
    try {
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify({
        ...project,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save current project:', error);
    }
  }

  loadCurrentProject(): Partial<Project> | null {
    try {
      const data = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load current project:', error);
      return null;
    }
  }

  loadProject(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  getAllProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  deleteProject(id: string): void {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  exportToJSON(project: Project): string {
    return JSON.stringify(project, null, 2);
  }

  importFromJSON(json: string): Project {
    const project = JSON.parse(json);
    if (!project.id || !project.sections || !project.config) {
      throw new Error('Invalid project format');
    }
    return project;
  }
}

export const projectStorage = new ProjectStorage();
