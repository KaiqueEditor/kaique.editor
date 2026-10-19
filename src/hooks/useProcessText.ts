import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Section } from '../types';
import { useStore } from '../store';

const DEFAULT_SECTION_BASE: Omit<Section, 'id' | 'title' | 'content' | 'imagePrompt'> = {
  alignment: 'left',
  layoutType: 'storytelling',
  titleFont: 'bebas-neue',
  bodyFont: 'sans',
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

  const isTimePrimo = () => {
    const email = useStore.getState().userEmail?.toLowerCase();
    return email === 'marcela.depaula@timeprimo.com' || email === 'lorena.volpini@timeprimo.com';
  };

  const isAdmin = () => {
    const email = useStore.getState().userEmail?.toLowerCase() ?? '';
    return ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'].includes(email);
  };

  const getTitleFont = () => isTimePrimo() ? 'filson-pro-bold' : isAdmin() ? 'wide' : 'bebas-neue';
  const getBodyFont  = () => isTimePrimo() ? 'open-sans' : isAdmin() ? 'montserrat' : 'sans';

  // Detecta se o texto já está no formato estruturado "Texto N ..." (com ou sem traço)
  const isStructuredRoteiro = (text: string) => /^texto\s+\d+/im.test(text);

  const processText = useCallback(async (rawText: string) => {
    if (isProcessing) return;
    if (!rawText.trim()) return;
    setIsProcessing(true);

    let finalSections: Section[] = [];

    try {
      if (isStructuredRoteiro(rawText)) {
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
              titleFont: getTitleFont(),
              bodyFont: getBodyFont(),
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
              titleFont: getTitleFont(),
              bodyFont: getBodyFont(),
                id: `s-${i}-${Date.now()}`,
                title: dataMap[i] || '',
                content: dataMap[i + 1] || '',
                imagePrompt: `${dataMap[i]} ${dataMap[i + 1]}`
              });
            }
          }
        }
      } else {
        // Texto livre: cada parágrafo vira um slide (1ª linha = título, resto = corpo)
        const blocks = rawText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
        finalSections = blocks.map((block, idx) => {
          const [first, ...rest] = block.split('\n');
          return {
            ...DEFAULT_SECTION_BASE,
            id: `s-${idx + 1}-${Date.now()}`,
            title: first.trim(),
            content: rest.join(' ').trim(),
            imagePrompt: first.trim(),
            alignment: idx === 0 ? 'center' as const : 'left' as const,
            titleFont: getTitleFont(),
            bodyFont: getBodyFont(),
            titleSize: 30,
            ...(idx === 0 ? { bodySize: 10 } : {}),
          };
        });
      }
    } catch (error) {
      console.error("Text processing error:", error);
      toast.error('Falha ao processar o texto.');
      setIsProcessing(false);
      return;
    }

    setSections(finalSections);
    setIsProcessing(false);
  }, [setSections, setIsProcessing, isProcessing]);

  return {
    processText,
    isProcessing,
  };
};
