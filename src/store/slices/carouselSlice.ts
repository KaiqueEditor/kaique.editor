import { StateCreator } from 'zustand';
import { Section, ProjectConfig, CarouselTemplate, SlideStyle, BrandKit } from '../../types';

export interface CarouselSlice {
  sections: Section[];
  activeSlide: number;
  config: ProjectConfig;
  carouselTemplates: CarouselTemplate[];

  // History (undo/redo)
  _history: Section[][];
  _historyIndex: number;
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setSections: (sections: Section[]) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  setActiveSlide: (index: number) => void;
  updateConfig: (updates: Partial<ProjectConfig>) => void;
  addSection: (section: Section) => void;
  saveCarouselTemplate: (name: string) => void;
  deleteCarouselTemplate: (id: string) => void;
  applyCarouselTemplate: (id: string) => void;

  // Brand Kit
  brandKits: BrandKit[];
  saveBrandKit: (name: string) => void;
  deleteBrandKit: (id: string) => void;
  applyBrandKit: (id: string) => void;
}

// Extrai apenas os campos de estilo de uma Section
const toSlideStyle = (s: Section): SlideStyle => ({
  layoutType: s.layoutType,
  titleFont: s.titleFont,
  bodyFont: s.bodyFont,
  titleSize: s.titleSize,
  bodySize: s.bodySize,
  bgColor: s.bgColor,
  titleColor: s.titleColor,
  bodyColor: s.bodyColor,
  brandingColor: s.brandingColor,
  alignment: s.alignment,
  overlayOpacity: s.overlayOpacity,
  textPosY: s.textPosY,
  imageScale: s.imageScale,
});

export const createCarouselSlice: StateCreator<CarouselSlice> = (set) => ({
  sections: [],
  activeSlide: 0,
  config: {
    branding: '',
    handle: '',
    watermark: '',
    // SVG local evita requisição externa que bloquearia canvas no export (CORS)
    avatarUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='8' fill='%23334155'/><circle cx='20' cy='15' r='7' fill='%2394a3b8'/><ellipse cx='20' cy='33' rx='11' ry='8' fill='%2394a3b8'/></svg>`,
    numSlides: 10,
  },
  carouselTemplates: [],
  _history: [],
  _historyIndex: -1,
  canUndo: false,
  canRedo: false,

  _pushHistory: () => set((state) => {
    const newHistory = state._history.slice(0, state._historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state.sections)));
    if (newHistory.length > 30) newHistory.shift();
    return { _history: newHistory, _historyIndex: newHistory.length - 1, canUndo: true, canRedo: false };
  }),

  undo: () => set((state) => {
    if (state._historyIndex <= 0) return {};
    const newIndex = state._historyIndex - 1;
    return {
      sections: JSON.parse(JSON.stringify(state._history[newIndex])),
      _historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    };
  }),

  redo: () => set((state) => {
    if (state._historyIndex >= state._history.length - 1) return {};
    const newIndex = state._historyIndex + 1;
    return {
      sections: JSON.parse(JSON.stringify(state._history[newIndex])),
      _historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state._history.length - 1,
    };
  }),

  setSections: (sections) => set({ sections, activeSlide: 0 }),

  updateSection: (id, updates) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  deleteSection: (id) => set((state) => {
    state._pushHistory();
    return { sections: state.sections.filter(s => s.id !== id) };
  }),

  duplicateSection: (id) => set((state) => {
    state._pushHistory();
    const idx = state.sections.findIndex(s => s.id === id);
    if (idx === -1) return {};
    const original = state.sections[idx];
    const clone: Section = {
      ...JSON.parse(JSON.stringify(original)),
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    };
    const newSections = [...state.sections];
    newSections.splice(idx + 1, 0, clone);
    return { sections: newSections, activeSlide: idx + 1 };
  }),

  reorderSections: (startIndex, endIndex) => set((state) => {
    state._pushHistory();
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

  saveCarouselTemplate: (name) => set((state) => {
    const capa = state.sections[0];
    const slide = state.sections[1] ?? state.sections[0];
    if (!capa) return {};
    const template: CarouselTemplate = {
      id: Date.now().toString(),
      name,
      capaStyle: toSlideStyle(capa),
      slidesStyle: toSlideStyle(slide),
    };
    return { carouselTemplates: [...state.carouselTemplates, template] };
  }),

  deleteCarouselTemplate: (id) => set((state) => ({
    carouselTemplates: state.carouselTemplates.filter(t => t.id !== id),
  })),

  applyCarouselTemplate: (id) => set((state) => {
    const t = state.carouselTemplates.find(ct => ct.id === id);
    if (!t) return {};
    const sections = state.sections.map((s, idx) => {
      const style = idx === 0 ? t.capaStyle : t.slidesStyle;
      return { ...s, ...style };
    });
    return { sections };
  }),

  // ── Brand Kit ──
  brandKits: [],

  saveBrandKit: (name) => set((state) => {
    const s = state.sections[0];
    if (!s) return {};
    const kit: BrandKit = {
      id: Date.now().toString(),
      name,
      branding: state.config.branding,
      handle: state.config.handle,
      watermark: state.config.watermark,
      avatarUrl: state.config.avatarUrl,
      titleFont: s.titleFont,
      bodyFont: s.bodyFont,
      titleColor: s.titleColor,
      bodyColor: s.bodyColor,
      bgColor: s.bgColor,
      brandingColor: s.brandingColor,
    };
    return { brandKits: [...state.brandKits, kit] };
  }),

  deleteBrandKit: (id) => set((state) => ({
    brandKits: state.brandKits.filter(k => k.id !== id),
  })),

  applyBrandKit: (id) => set((state) => {
    const kit = state.brandKits.find(k => k.id === id);
    if (!kit) return {};
    return {
      config: {
        ...state.config,
        branding: kit.branding,
        handle: kit.handle,
        watermark: kit.watermark,
        avatarUrl: kit.avatarUrl,
      },
      sections: state.sections.map(s => ({
        ...s,
        titleFont: kit.titleFont,
        bodyFont: kit.bodyFont,
        titleColor: kit.titleColor,
        bodyColor: kit.bodyColor,
        bgColor: kit.bgColor,
        brandingColor: kit.brandingColor,
      })),
    };
  }),
});
