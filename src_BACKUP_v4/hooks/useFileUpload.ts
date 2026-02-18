import { useCallback } from 'react';
import { applySynthidBypass } from '../services/processors/synthidBypass';
import { validateImageFile, validateVideoFile } from '../utils/validation';
import { useStore } from '../store';

export const useFileUpload = () => {
  const updateSection = useStore(state => state.updateSection);
  const removeGeneratingId = useStore(state => state.removeGeneratingId);

  const handleFileUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    removeGeneratingId(id);

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    } else {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let finalData = reader.result as string;

      if (!isVideo) {
        finalData = await applySynthidBypass(finalData);
      }

      if (isVideo) {
        updateSection(id, { videoUrl: finalData, imageUrl: undefined });
      } else {
        updateSection(id, { imageUrl: finalData, videoUrl: undefined });
      }
    };
    reader.readAsDataURL(file);
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

  return { handleFileUpload, handleAvatarUpload };
};
