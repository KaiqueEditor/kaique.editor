import { StateCreator } from 'zustand';
import { Theme } from '../../constants/theme';

export interface EditorSlice {
  // UI state
  isAgentOpen: boolean;
  showExportPreview: boolean;
  isExporting: boolean;
  exportStep: string | null;
  isProcessing: boolean;
  generatingIds: string[];

  // Theme
  theme: Theme;

  // Image Agent
  isImageAgentOpen: boolean;
  imageAgentSectionId: string | null;

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
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  isAgentOpen: false,
  showExportPreview: false,
  isExporting: false,
  exportStep: null,
  isProcessing: false,
  generatingIds: [],
  theme: 'dark',
  isImageAgentOpen: false,
  imageAgentSectionId: null,

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

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setImageAgentOpen: (open, sectionId = null) => set({
    isImageAgentOpen: open,
    imageAgentSectionId: open ? sectionId : null,
  }),
});
