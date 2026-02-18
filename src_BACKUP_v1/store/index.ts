import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createCarouselSlice, CarouselSlice } from './slices/carouselSlice';
import { createEditorSlice, EditorSlice } from './slices/editorSlice';

type StoreState = CarouselSlice & EditorSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createCarouselSlice(...a),
        ...createEditorSlice(...a),
      }),
      {
        name: 'kaique-editor-store',
        partialize: (state) => ({
          sections: state.sections,
          config: state.config,
          activeSlide: state.activeSlide,
        }),
      }
    ),
    { name: 'KaiqueEditor' }
  )
);
