import React from 'react';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { validateImageFile, validateVideoFile } from '../utils/validation';
import { useStore } from '../store';

export const useFileUpload = () => {
  const updateSection = useStore(state => state.updateSection);
  const removeGeneratingId = useStore(state => state.removeGeneratingId);

  const handleImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    removeGeneratingId(id);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const imageUrl = reader.result as string;
        updateSection(id, { imageUrl, videoUrl: undefined, videoTrimStart: undefined, showSocialImage: true });
      } catch (error) {
        console.error('File processing failed:', error);
        toast.error('Falha ao processar arquivo enviado.');
      }
    };
    reader.readAsDataURL(file);
  }, [updateSection, removeGeneratingId]);

  const validateVideoUpload = useCallback((file: File): boolean => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return false;
    }
    return true;
  }, []);

  const applyVideoClip = useCallback(async (id: string, file: File, trimStart = 0) => {
    removeGeneratingId(id);

    const clipStart = Math.max(0, trimStart);
    const videoObjectUrl = URL.createObjectURL(file);

    updateSection(id, {
      videoUrl: videoObjectUrl,
      videoMimeType: file.type || 'video/mp4',
      imageUrl: undefined,
      videoTrimStart: clipStart,
      showSocialImage: true,
    });
  }, [updateSection, removeGeneratingId]);

  const handleAvatarUpload = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => onComplete(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  return { handleImageUpload, validateVideoUpload, applyVideoClip, handleAvatarUpload };
};
