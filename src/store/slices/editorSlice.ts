import { StateCreator } from 'zustand';
import { Theme } from '../../constants/theme';
import { StylePreset, ExportFormatKey } from '../../types/carousel.types';

/** Fonte e cor que todo carrossel de Feed novo usa. Vazio = padrão do app. */
export interface BrandDefaults {
  titleFont?: string;
  bodyFont?: string;
  titleColor?: string;
}

export interface EditorSlice {
  showExportPreview: boolean;
  isExporting: boolean;
  exportStep: string | null;
  isProcessing: boolean;
  generatingIds: string[];

  // Theme
  theme: Theme;


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
  setShowExportPreview: (show: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setExportStep: (step: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  addGeneratingId: (id: string) => void;
  removeGeneratingId: (id: string) => void;
  setGeneratingIds: (ids: string[]) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Export format
  exportFormat: ExportFormatKey;
  setExportFormat: (format: ExportFormatKey) => void;

  // Padrões da marca para carrosséis novos (ficam neste aparelho)
  brandDefaults: BrandDefaults;
  setBrandDefaults: (patch: Partial<BrandDefaults>) => void;

  // Style Presets
  presets: StylePreset[];
  savePreset: (preset: StylePreset) => void;
  deletePreset: (id: string) => void;

  // Mobile navigation
  mobileActiveTab: 'editor' | 'projects' | 'preview' | 'create' | 'settings';
  setMobileActiveTab: (tab: 'editor' | 'projects' | 'preview' | 'create' | 'settings') => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  showExportPreview: false,
  isExporting: false,
  exportStep: null,
  isProcessing: false,
  generatingIds: [],
  theme: 'dark',
  currentProjectId: null,
  isAdmin: false,
  userEmail: null,

  setAdmin: (v) => set({ isAdmin: v }),
  setUserEmail: (email) => set({ userEmail: email }),
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

  setCurrentProjectId: (id: string | null) => set({ currentProjectId: id }),

  exportFormat: 'carousel',
  setExportFormat: (format) => set({ exportFormat: format }),
  brandDefaults: {},
  setBrandDefaults: (patch) => set(state => ({ brandDefaults: { ...state.brandDefaults, ...patch } })),

  presets: [],
  savePreset: (preset) => set(state => ({ presets: [...state.presets, preset] })),
  deletePreset: (id) => set(state => ({ presets: state.presets.filter(p => p.id !== id) })),

  mobileActiveTab: 'preview',
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
});
