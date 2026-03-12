import { StateCreator } from 'zustand';
import { Theme } from '../../constants/theme';
import { StylePreset, ExportFormatKey } from '../../types/carousel.types';

export interface EditorSlice {
  // UI state
  isAgentOpen: boolean;
  showExportPreview: boolean;
  isExporting: boolean;
  exportStep: string | null;
  isProcessing: boolean;
  generatingIds: string[];
  useAI: boolean;

  // Theme
  theme: Theme;

  // Image Agent
  isImageAgentOpen: boolean;
  imageAgentSectionId: string | null;

  // Track the current project ID
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  // Admin capabilities
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;

  // Current user email
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;

  // Actions
  setAgentOpen: (isOpen: boolean) => void;
  setShowExportPreview: (show: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setExportStep: (step: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  addGeneratingId: (id: string) => void;
  removeGeneratingId: (id: string) => void;
  setGeneratingIds: (ids: string[]) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setImageAgentOpen: (open: boolean, sectionId?: string | null) => void;
  setUseAI: (v: boolean) => void;

  // Export format
  exportFormat: ExportFormatKey;
  setExportFormat: (format: ExportFormatKey) => void;

  // Style Presets
  presets: StylePreset[];
  savePreset: (preset: StylePreset) => void;
  deletePreset: (id: string) => void;

  // Mobile navigation
  mobileActiveTab: 'editor' | 'projects' | 'preview' | 'create' | 'settings';
  setMobileActiveTab: (tab: 'editor' | 'projects' | 'preview' | 'create' | 'settings') => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  isAgentOpen: false,
  showExportPreview: false,
  isExporting: false,
  exportStep: null,
  isProcessing: false,
  generatingIds: [],
  useAI: true,
  theme: 'dark',
  isImageAgentOpen: false,
  imageAgentSectionId: null,
  currentProjectId: null,
  isAdmin: false,
  userEmail: null,

  setAdmin: (v) => set({ isAdmin: v }),
  setUserEmail: (email) => set({ userEmail: email }),
  setAgentOpen: (isOpen) => set({ isAgentOpen: isOpen }),
  setShowExportPreview: (show) => set({ showExportPreview: show }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setExportStep: (step) => set({ exportStep: step }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),

  addGeneratingId: (id) => set((state) => ({
    generatingIds: [...state.generatingIds, id],
  })),

  removeGeneratingId: (id) => set((state) => ({
    generatingIds: state.generatingIds.filter(gid => gid !== id),
  })),

  setGeneratingIds: (ids) => set({ generatingIds: ids }),

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('myhub-theme', theme);
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('myhub-theme', next);
    return { theme: next };
  }),
  setImageAgentOpen: (open, sectionId = null) => set({ isImageAgentOpen: open, imageAgentSectionId: sectionId }),
  setUseAI: (v: boolean) => set({ useAI: v }),

  setCurrentProjectId: (id: string | null) => set({ currentProjectId: id }),

  exportFormat: 'carousel',
  setExportFormat: (format) => set({ exportFormat: format }),

  presets: [],
  savePreset: (preset) => set(state => ({ presets: [...state.presets, preset] })),
  deletePreset: (id) => set(state => ({ presets: state.presets.filter(p => p.id !== id) })),

  mobileActiveTab: 'preview',
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
});
