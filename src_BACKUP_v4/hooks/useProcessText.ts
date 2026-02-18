import { useCallback } from 'react';
import { geminiService } from '../services/api/geminiService';
import { Section } from '../types';
import { useStore } from '../store';
import { useImageGeneration } from './useImageGeneration';

const DEFAULT_SECTION_BASE: Omit<Section, 'id' | 'title' | 'content' | 'imagePrompt'> = {
  alignment: 'left',
  layoutType: 'storytelling',
  titleFont: 'anton',
  bodyFont: 'sans',
  bgColor: '#000000',
  titleColor: '#ffffff',
  bodyColor: '#ffffff',
  brandingColor: '#ffffff',
  titleSize: 30,
  bodySize: 20,
  imagePosX: 50,
  imagePosY: 50,
  imageScale: 1,
  overlayOpacity: 0.4,
  textPosY: 85,
  showSocialImage: true,
};

export const useProcessText = () => {
  const setSections = useStore(state => state.setSections);
  const isProcessing = useStore(state => state.isProcessing);
  const setIsProcessing = useStore(state => state.setIsProcessing);
  const numSlides = useStore(state => state.config.numSlides);
  const setGeneratingIds = useStore(state => state.setGeneratingIds);
  const { generateAll } = useImageGeneration();

  const processText = useCallback(async (rawText: string) => {
    if (!rawText.trim()) return;
    setIsProcessing(true);

    let finalSections: Section[] = [];

    try {
      if (rawText.toLowerCase().includes('texto 1 -')) {
        // Parse structured roteiro format
        const lines = rawText.split(/\n+/);
        const dataMap: Record<number, string> = {};
        lines.forEach(line => {
          const match = line.match(/texto (\d+) - (.*)/i);
          if (match) dataMap[parseInt(match[1])] = match[2].trim();
        });

        const keys = Object.keys(dataMap).map(Number).sort((a, b) => a - b);
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1];
          if (dataMap[1]) {
            finalSections.push({
              ...DEFAULT_SECTION_BASE,
              id: `s-1-${Date.now()}`,
              title: dataMap[1] || '',
              content: '',
              layoutType: 'storytelling',
              titleFont: 'druk',
              alignment: 'center',
              titleSize: 40,
              textPosY: 85,
              imagePrompt: dataMap[1]
            });
          }

          for (let i = 2; i <= lastKey; i += 2) {
            if (dataMap[i] || dataMap[i + 1]) {
              finalSections.push({
                ...DEFAULT_SECTION_BASE,
                id: `s-${i}-${Date.now()}`,
                title: dataMap[i] || '',
                content: dataMap[i + 1] || '',
                imagePrompt: `${dataMap[i]} ${dataMap[i + 1]}`
              });
            }
          }
        }
      } else {
        const result = await geminiService.splitTextIntoSections(rawText, numSlides);
        finalSections = result.map((s, idx) => ({
          ...DEFAULT_SECTION_BASE,
          ...s,
          alignment: idx === 0 ? 'center' as const : 'left' as const,
          titleFont: idx === 0 ? 'druk' : 'anton',
          titleSize: idx === 0 ? 40 : 30,
        }));
      }
    } catch (error) {
      console.error("Text processing error:", error);
      alert("Falha ao processar o texto. Verifique sua API key.");
      setIsProcessing(false);
      return;
    }

    setSections(finalSections);
    setIsProcessing(false);

    // Start generating images sequentially
    setGeneratingIds(finalSections.map(s => s.id));
    generateAll(finalSections);
  }, [setSections, setIsProcessing, numSlides, generateAll, setGeneratingIds]);

  return {
    processText,
    isProcessing,
  };
};
