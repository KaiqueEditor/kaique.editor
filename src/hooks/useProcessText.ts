import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { geminiService } from '../services/api/geminiService';
import { Section } from '../types';
import { useStore } from '../store';
import { useImageGeneration } from './useImageGeneration';

const DEFAULT_SECTION_BASE: Omit<Section, 'id' | 'title' | 'content' | 'imagePrompt'> = {
  alignment: 'left',
  layoutType: 'storytelling',
  titleFont: 'montserrat',
  bodyFont: 'montserrat',
  bgColor: '#000000',
  titleColor: '#ffffff',
  bodyColor: '#ffffff',
  brandingColor: '#ffffff',
  titleSize: 30,
  bodySize: 16,
  imagePosX: 50,
  imagePosY: 0,
  imageScale: 1,
  overlayOpacity: 0,
  textPosY: 70,
  showSocialImage: true,
};

export const useProcessText = () => {
  const setSections = useStore(state => state.setSections);
  const isProcessing = useStore(state => state.isProcessing);
  const setIsProcessing = useStore(state => state.setIsProcessing);
  const numSlides = useStore(state => state.config.numSlides);
  const setGeneratingIds = useStore(state => state.setGeneratingIds);
  const useAI = useStore(state => state.useAI);
  const { generateAll } = useImageGeneration();

  // Detecta se o texto já está no formato estruturado "Texto N ..." (com ou sem traço)
  const isStructuredRoteiro = (text: string) => /^texto\s+\d+/im.test(text);

  const processText = useCallback(async (rawText: string) => {
    if (isProcessing) return;
    if (!rawText.trim()) return;
    setIsProcessing(true);

    let finalSections: Section[] = [];

    try {
      if (!useAI || isStructuredRoteiro(rawText)) {
        // Parse structured roteiro format (com ou sem traço)
        const lines = rawText.split(/\n+/);
        const dataMap: Record<number, string> = {};
        lines.forEach(line => {
          const match = line.match(/^texto\s+(\d+)\s*[-–:]?\s*(.*)/i);
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
              titleFont: 'wide',
              bodyFont: 'montserrat',
              alignment: 'center',
              titleSize: 30,
              bodySize: 10,
              textPosY: 70,
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
          titleFont: idx === 0 ? 'wide' : 'montserrat',
          bodyFont: 'montserrat',
          titleSize: 30,
          ...(idx === 0 ? { bodySize: 10 } : {}),
        }));
      }
    } catch (error) {
      console.error("Text processing error:", error);
      toast.error('Falha ao processar o texto. Verifique sua API key.');
      setIsProcessing(false);
      return;
    }

    setSections(finalSections);
    setIsProcessing(false);

    // Start generating images sequentially
    setGeneratingIds(finalSections.map(s => s.id));
    generateAll(finalSections);
  }, [setSections, setIsProcessing, numSlides, generateAll, setGeneratingIds, isProcessing, useAI]);

  return {
    processText,
    isProcessing,
  };
};
