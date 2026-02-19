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
          // Salva sections SEM imageUrl/videoUrl (base64 enche o localStorage)
          sections: state.sections.map(s => ({
            ...s,
            imageUrl: undefined,
            videoUrl: undefined,
          })),
          config: {
            ...state.config,
            // Avatar também pode ser base64 grande — salva só se for URL externa
            avatarUrl: state.config.avatarUrl?.startsWith('data:') ? '' : state.config.avatarUrl,
          },
          activeSlide: state.activeSlide,
        }),
      }
    ),
    { name: 'KaiqueEditor' }
  )
);
