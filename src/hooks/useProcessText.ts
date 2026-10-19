import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useStore } from '../store';
import { buildSectionsFromText, type TextMode } from '../lib/buildSections';

export const useProcessText = () => {
  const setSections = useStore(state => state.setSections);
  const isProcessing = useStore(state => state.isProcessing);
  const setIsProcessing = useStore(state => state.setIsProcessing);

  const processText = useCallback(async (rawText: string, mode: TextMode = 'feed') => {
    if (isProcessing) return;
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
      setSections(buildSectionsFromText(rawText, mode, useStore.getState().userEmail));
    } catch (error) {
      console.error('Text processing error:', error);
      toast.error('Falha ao processar o texto.');
    } finally {
      setIsProcessing(false);
    }
  }, [setSections, setIsProcessing, isProcessing]);

  return { processText, isProcessing };
};
