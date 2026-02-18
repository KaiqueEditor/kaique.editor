import { useCallback } from 'react';
import { geminiService } from '../services/api/geminiService';
import { applySynthidBypass } from '../services/processors/synthidBypass';
import { useStore } from '../store';

export const useImageGeneration = () => {
  const updateSection = useStore(state => state.updateSection);
  const addGeneratingId = useStore(state => state.addGeneratingId);
  const removeGeneratingId = useStore(state => state.removeGeneratingId);
  const generatingIds = useStore(state => state.generatingIds);

  const generate = useCallback(async (
    id: string,
    prompt: string,
    context: string
  ) => {
    addGeneratingId(id);

    try {
      let imageUrl = await geminiService.generateImageForSection(prompt, context);
      if (imageUrl) {
        imageUrl = await applySynthidBypass(imageUrl);
      }
      updateSection(id, { imageUrl, videoUrl: undefined });
    } catch (error: any) {
      console.error('Image generation failed:', error);
      throw error;
    } finally {
      removeGeneratingId(id);
    }
  }, [updateSection, addGeneratingId, removeGeneratingId]);

  const generateAll = useCallback(async (
    sections: Array<{ id: string; imagePrompt?: string; title: string; content: string }>,
    delay = 1500
  ) => {
    for (const section of sections) {
      try {
        const prompt = section.imagePrompt || section.title;
        await generate(section.id, prompt, section.content);
      } catch (err) {
        console.error(`Error generating image for ${section.id}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }, [generate]);

  return {
    generate,
    generateAll,
    generatingIds,
    isGenerating: (id: string) => generatingIds.includes(id),
  };
};
