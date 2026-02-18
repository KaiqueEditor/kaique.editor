import { StateCreator } from 'zustand';
import { Section, ProjectConfig } from '../../types';

export interface CarouselSlice {
  sections: Section[];
  activeSlide: number;
  config: ProjectConfig;

  // Actions
  setSections: (sections: Section[]) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  setActiveSlide: (index: number) => void;
  updateConfig: (updates: Partial<ProjectConfig>) => void;
  addSection: (section: Section) => void;
}

export const createCarouselSlice: StateCreator<CarouselSlice> = (set) => ({
  sections: [],
  activeSlide: 0,
  config: {
    signature: '',
    branding: '',
    avatarUrl: 'https://avatar.vercel.sh/user',
    numSlides: 10,
  },

  setSections: (sections) => set({ sections, activeSlide: 0 }),

  updateSection: (id, updates) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  deleteSection: (id) => set((state) => ({
    sections: state.sections.filter(s => s.id !== id),
  })),

  reorderSections: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { sections: result };
  }),

  setActiveSlide: (index) => set({ activeSlide: index }),

  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates },
  })),

  addSection: (section) => set((state) => ({
    sections: [...state.sections, section],
  })),
});
