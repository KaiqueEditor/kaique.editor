import React from 'react';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { applySynthidBypass } from '../services/processors/synthidBypass';
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
        const rawData = reader.result as string;
        const finalData = await applySynthidBypass(rawData);
        updateSection(id, { imageUrl: finalData, videoUrl: undefined, videoTrimStart: undefined });
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
    const clipEnd = clipStart + 15;

    const srcUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = srcUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.position = 'fixed';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0.0001';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '1';
    document.body.appendChild(video);

    try {
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Falha ao carregar vídeo.')); };
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('error', onError, { once: true });
      });

      if (!(video as any).captureStream || typeof MediaRecorder === 'undefined') {
        const videoObjectUrl = URL.createObjectURL(file);
        updateSection(id, {
          videoUrl: videoObjectUrl,
          videoMimeType: file.type || 'video/mp4',
          imageUrl: undefined,
          videoTrimStart: clipStart,
        });
        return;
      }

      const stream = (video as any).captureStream() as MediaStream;
      const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Falha ao buscar ponto de corte.')); };
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = Math.min(clipStart, Math.max(0, (video.duration || 0) - 0.05));
      });

      const stopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(250);
      await video.play();

      await new Promise<void>((resolve) => {
        const check = () => {
          if (video.currentTime >= clipEnd || video.ended) {
            resolve();
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      });

      recorder.stop();
      video.pause();
      await stopPromise;

      const clippedBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (clippedBlob.size < 2048) {
        throw new Error('Clip ficou vazio.');
      }
      const videoObjectUrl = URL.createObjectURL(clippedBlob);
      updateSection(id, {
        videoUrl: videoObjectUrl,
        videoMimeType: clippedBlob.type || 'video/webm',
        imageUrl: undefined,
        videoTrimStart: 0,
      });
    } catch (error) {
      console.warn('Falha ao recortar no upload, usando arquivo original:', error);
      const videoObjectUrl = URL.createObjectURL(file);
      updateSection(id, {
        videoUrl: videoObjectUrl,
        videoMimeType: file.type || 'video/mp4',
        imageUrl: undefined,
        videoTrimStart: clipStart,
      });
    } finally {
      video.pause();
      video.remove();
      URL.revokeObjectURL(srcUrl);
    }
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
