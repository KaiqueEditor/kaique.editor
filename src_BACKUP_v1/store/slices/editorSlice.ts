import { StateCreator } from 'zustand';

export interface EditorSlice {
  isAgentOpen: boolean;
  showExportPreview: boolean;
  isExporting: boolean;
  exportStep: string | null;
  isProcessing: boolean;
  generatingIds: string[];

  // Actions
  setAgentOpen: (isOpen: boolean) => void;
  setShowExportPreview: (show: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setExportStep: (step: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  addGeneratingId: (id: string) => void;
  removeGeneratingId: (id: string) => void;
  setGeneratingIds: (ids: string[]) => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  isAgentOpen: false,
  showExportPreview: false,
  isExporting: false,
  exportStep: null,
  isProcessing: false,
  generatingIds: [],

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
});
