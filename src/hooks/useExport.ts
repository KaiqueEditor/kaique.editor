import { useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Section } from '../types';
import { useStore } from '../store';

export const useExport = () => {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setIsExporting = useStore(state => state.setIsExporting);
  const setExportStep = useStore(state => state.setExportStep);
  const isExporting = useStore(state => state.isExporting);
  const exportStep = useStore(state => state.exportStep);

  const recordSlideAsVideo = useCallback(async (node: HTMLDivElement): Promise<Blob> => {
    const originalStyle = node.style.cssText;
    node.style.width = '1080px';
    node.style.height = '1440px';
    node.style.setProperty('zoom', '1');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    const video = node.querySelector('video');

    if (!video || !ctx) throw new Error("Vídeo não encontrado para gravação.");

    const recorder = new MediaRecorder(canvas.captureStream(30), {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 8000000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise(async (resolve, reject) => {
      recorder.onstop = () => {
        node.style.cssText = originalStyle;
        resolve(new Blob(chunks, { type: 'video/mp4' }));
      };

      recorder.start();

      const videoEl = node.querySelector('video');
      if (videoEl) videoEl.style.opacity = '0';
      const textOverlayDataUrl = await htmlToImage.toPng(node, { pixelRatio: 1 });
      if (videoEl) videoEl.style.opacity = '1';

      const overlayImg = new Image();
      overlayImg.src = textOverlayDataUrl;
      await new Promise(r => overlayImg.onload = r);

      let startTime = Date.now();
      const duration = 3000;

      const drawLoop = () => {
        const now = Date.now();
        if (now - startTime > duration) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, 1080, 1440);
        ctx.drawImage(overlayImg, 0, 0, 1080, 1440);
        requestAnimationFrame(drawLoop);
      };
      drawLoop();
    });
  }, []);

  const exportAll = useCallback(async (sections: Section[]) => {
    if (sections.length === 0) return;
    setIsExporting(true);
    const zip = new JSZip();

    try {
      setExportStep('preparando');
      for (let i = 0; i < sections.length; i++) {
        const node = exportRefs.current[i];
        if (node) {
          if (sections[i].videoUrl) {
            setExportStep(`gravando vídeo ${i + 1}`);
            try {
              const videoBlob = await recordSlideAsVideo(node);
              zip.file(`slide-${i + 1}.mp4`, videoBlob);
            } catch (vErr) {
              const rawDataUrl = await htmlToImage.toPng(node, { pixelRatio: 1 });
              zip.file(`slide-${i + 1}.png`, rawDataUrl.split(',')[1], { base64: true });
            }
          } else {
            setExportStep(`renderizando slide ${i + 1}`);
            const rawDataUrl = await htmlToImage.toPng(node, { pixelRatio: 1, cacheBust: true });
            zip.file(`slide-${i + 1}.png`, rawDataUrl.split(',')[1], { base64: true });
          }
        }
      }
      setExportStep('finalizando zip');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `kaique-editor-${Date.now()}.zip`);
    } catch (e) {
      console.error("Erro na exportação:", e);
      alert("Erro ao exportar.");
    } finally {
      setIsExporting(false);
      setExportStep(null);
    }
  }, [recordSlideAsVideo, setIsExporting, setExportStep]);

  return {
    exportRefs,
    exportAll,
    isExporting,
    exportStep,
  };
};
