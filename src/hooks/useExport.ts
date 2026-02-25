import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Section } from '../types';
import { useStore } from '../store';
import ffmpegCoreURL from '@ffmpeg/core?url';
import ffmpegWasmURL from '@ffmpeg/core/wasm?url';

type ExportDeps = {
  htmlToImage: { toPng: (node: HTMLElement, options?: any) => Promise<string> };
  JSZip: any;
  saveAs: (data: Blob | string, filename?: string, options?: any) => void;
};

let exportDepsPromise: Promise<ExportDeps> | null = null;
let ffmpegBridgePromise: Promise<{
  toMp4: (input: Blob) => Promise<Blob>;
}> | null = null;

const loadExportDeps = async (): Promise<ExportDeps> => {
  if (!exportDepsPromise) {
    exportDepsPromise = Promise.all([
      import('html-to-image'),
      import('jszip'),
      import('file-saver'),
    ]).then(([htmlToImageMod, jszipMod, fileSaverMod]) => ({
      htmlToImage: htmlToImageMod,
      JSZip: (jszipMod as any).default ?? jszipMod,
      saveAs: ((fileSaverMod as any).default ?? (fileSaverMod as any).saveAs) as ExportDeps['saveAs'],
    }));
  }
  return exportDepsPromise;
};

const loadFfmpegBridge = async () => {
  if (!ffmpegBridgePromise) {
    ffmpegBridgePromise = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util'),
      ]);

      const ffmpeg = new FFmpeg();
      await withTimeout(
        ffmpeg.load({
          coreURL: ffmpegCoreURL,
          wasmURL: ffmpegWasmURL,
        }),
        120000,
        'carregando ffmpeg'
      );

      const toMp4 = async (input: Blob): Promise<Blob> => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const inName = `in-${stamp}.webm`;
        const outName = `out-${stamp}.mp4`;

        await ffmpeg.writeFile(inName, await fetchFile(input));
        await ffmpeg.exec([
          '-i', inName,
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-an',
          outName,
        ]);

        const output = await ffmpeg.readFile(outName);
        await ffmpeg.deleteFile(inName);
        await ffmpeg.deleteFile(outName);

        return new Blob([output], { type: 'video/mp4' });
      };

      return { toMp4 };
    })();
  }

  return ffmpegBridgePromise;
};

const waitForEvent = (el: EventTarget, event: string, timeoutMs: number) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout aguardando evento ${event}`));
    }, timeoutMs);

    const done = () => {
      cleanup();
      resolve();
    };

    const fail = () => {
      cleanup();
      reject(new Error(`Erro aguardando evento ${event}`));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      el.removeEventListener(event, done as EventListener);
      el.removeEventListener('error', fail as EventListener);
    };

    el.addEventListener(event, done as EventListener, { once: true });
    el.addEventListener('error', fail as EventListener, { once: true });
  });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`Timeout: ${label}`)), timeoutMs);
    }),
  ]);
};

const seekVideo = async (video: HTMLVideoElement, time: number) => {
  video.currentTime = Math.max(0, time);
  await waitForEvent(video, 'seeked', 4000);
};

export const useExport = () => {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setIsExporting = useStore(state => state.setIsExporting);
  const setExportStep = useStore(state => state.setExportStep);
  const isExporting = useStore(state => state.isExporting);
  const exportStep = useStore(state => state.exportStep);

  useEffect(() => {
    // Pré-carrega o motor de export em background para reduzir timeout no primeiro download.
    void loadFfmpegBridge().catch(() => {
      // Erro aqui não bloqueia uso; será tratado no fluxo de export.
    });
  }, []);

  const captureSlideAsPng = useCallback(async (node: HTMLDivElement, pixelRatio = 1): Promise<string> => {
    const { htmlToImage } = await loadExportDeps();
    const parent = node.parentElement;
    if (parent) parent.style.opacity = '1';
    try {
      let dataUrl = '';
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          dataUrl = await htmlToImage.toPng(node, {
            pixelRatio,
            cacheBust: true,
            width: 1080,
            height: 1440,
          });
          if (dataUrl && dataUrl.length > 200) break;
        } catch {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      if (!dataUrl) {
        throw new Error('Falha ao capturar slide como PNG.');
      }
      return dataUrl;
    } finally {
      if (parent) parent.style.opacity = '0.0001';
    }
  }, []);

  const captureOverlay = useCallback(async (node: HTMLDivElement): Promise<HTMLImageElement> => {
    const { htmlToImage } = await loadExportDeps();
    const existingVideo = node.querySelector('video') as HTMLVideoElement | null;
    const parent = node.parentElement;

    if (parent) parent.style.opacity = '1';
    if (existingVideo) existingVideo.style.opacity = '0';

    const overlayDataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 1,
      width: 1080,
      height: 1440,
      cacheBust: true,
      backgroundColor: 'transparent',
    });

    if (existingVideo) existingVideo.style.opacity = '1';
    if (parent) parent.style.opacity = '0.0001';

    const img = new Image();
    img.src = overlayDataUrl;
    await new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    return img;
  }, []);

  const composeVideoAsWebM = useCallback(async (node: HTMLDivElement, section: Section): Promise<Blob> => {
    const videoUrl = section.videoUrl;
    if (!videoUrl) throw new Error('Slide sem vídeo.');

    const trimStart = Math.max(0, section.videoTrimStart ?? 0);
    const clipDuration = 15;

    const overlay = await captureOverlay(node);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível para exportação.');

    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0.0001';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '1';
    document.body.appendChild(video);

    try {
      await waitForEvent(video, 'loadedmetadata', 8000);

      const start = Math.min(trimStart, Math.max(0, (video.duration || trimStart + clipDuration) - 0.05));
      const end = Math.min(start + clipDuration, video.duration || start + clipDuration);
      const fps = 30;

      const stream = canvas.captureStream(fps);
      const mimeType = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ].find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || 'video/webm';

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder não suportado neste navegador.');
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const stopPromise = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error('Falha ao gravar vídeo do canvas.'));
      });

      recorder.start(250);
      await seekVideo(video, start);
      await video.play();

      await new Promise<void>((resolve, reject) => {
        let done = false;
        let lastT = -1;
        let stagnantFrames = 0;
        const hardTimeout = window.setTimeout(() => {
          done = true;
          reject(new Error('Timeout renderizando frames do vídeo.'));
        }, 30000);

        const finish = () => {
          window.clearTimeout(hardTimeout);
          done = true;
          resolve();
        };

        const step = () => {
          if (done) return;
          const t = video.currentTime;

          ctx.clearRect(0, 0, 1080, 1440);
          ctx.drawImage(video, 0, 0, 1080, 1440);
          ctx.drawImage(overlay, 0, 0, 1080, 1440);

          if (Math.abs(t - lastT) < 0.0005) stagnantFrames += 1;
          else stagnantFrames = 0;
          lastT = t;

          if (stagnantFrames > 240) {
            finish();
            return;
          }

          if (t >= end || video.ended) {
            finish();
            return;
          }

          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            (video as any).requestVideoFrameCallback(() => step());
          } else {
            requestAnimationFrame(step);
          }
        };

        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
          (video as any).requestVideoFrameCallback(() => step());
        } else {
          requestAnimationFrame(step);
        }
      });

      video.pause();
      recorder.stop();
      await withTimeout(stopPromise, 6000, 'finalizando gravação webm');

      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 4096) {
        throw new Error('Gravação de vídeo ficou vazia.');
      }
      return blob;
    } finally {
      video.pause();
      video.remove();
    }
  }, [captureOverlay]);

  const composeVideoAsMp4 = useCallback(async (node: HTMLDivElement, section: Section) => {
    const webm = await composeVideoAsWebM(node, section);
    const ffmpeg = await withTimeout(loadFfmpegBridge(), 120000, 'inicializando ffmpeg');
    const mp4 = await withTimeout(ffmpeg.toMp4(webm), 120000, 'convertendo para mp4');
    return mp4;
  }, [composeVideoAsWebM]);

  const downloadSlide = useCallback(async (node: HTMLDivElement, section: Section, label: string) => {
    const { saveAs } = await loadExportDeps();

    try {
      if (section.videoUrl) {
        const mp4 = await withTimeout(
          composeVideoAsMp4(node, section),
          180000,
          'exportando vídeo'
        );
        saveAs(mp4, `${label}.mp4`);
      } else {
        const dataUrl = await captureSlideAsPng(node, 2);
        saveAs(dataUrl, `${label}.png`);
      }
    } catch (e) {
      console.error('Erro ao baixar slide:', e);
      toast.error('Erro ao baixar slide.');
    }
  }, [composeVideoAsMp4, captureSlideAsPng]);

  const exportAll = useCallback(async (sections: Section[]) => {
    if (sections.length === 0 || isExporting) return;
    setIsExporting(true);

    try {
      setExportStep('carregando módulos');
      const { JSZip, saveAs } = await loadExportDeps();
      const zip = new JSZip();

      for (let i = 0; i < sections.length; i++) {
        const node = exportRefs.current[i];
        if (!node) continue;

        if (sections[i].videoUrl) {
          setExportStep(`renderizando vídeo ${i + 1} de ${sections.length}`);
          const mp4 = await withTimeout(
            composeVideoAsMp4(node, sections[i]),
            180000,
            `exportando vídeo do slide ${i + 1}`
          );
          zip.file(`slide-${i + 1}.mp4`, mp4);
        } else {
          setExportStep(`renderizando slide ${i + 1} de ${sections.length}`);
          const rawDataUrl = await captureSlideAsPng(node);
          zip.file(`slide-${i + 1}.png`, rawDataUrl.split(',')[1], { base64: true });
        }
      }

      setExportStep('finalizando zip');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `kaique-editor-${Date.now()}.zip`);
    } catch (e) {
      console.error('Erro na exportação:', e);
      toast.error('Erro ao exportar arquivo ZIP.');
    } finally {
      setIsExporting(false);
      setExportStep(null);
    }
  }, [composeVideoAsMp4, captureSlideAsPng, setIsExporting, setExportStep, isExporting]);

  return {
    exportRefs,
    exportAll,
    downloadSlide,
    isExporting,
    exportStep,
  };
};
