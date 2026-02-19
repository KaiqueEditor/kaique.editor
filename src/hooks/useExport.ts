import { useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Section } from '../types';
import { useStore } from '../store';

export const useExport = () => {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setIsExporting = useStore(state => state.setIsExporting);
  const setExportStep = useStore(state => state.setExportStep);
  const isExporting = useStore(state => state.isExporting);
  const exportStep = useStore(state => state.exportStep);

  const captureSlideAsPng = useCallback(async (node: HTMLDivElement): Promise<string> => {
    const parent = node.parentElement;
    if (parent) parent.style.opacity = '1';
    try {
      let dataUrl = '';
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          dataUrl = await htmlToImage.toPng(node, {
            pixelRatio: 1,
            cacheBust: true,
            width: 1080,
            height: 1440,
          });
          if (dataUrl && dataUrl.length > 200) break;
        } catch {
          await new Promise(r => setTimeout(r, 400));
        }
      }
      return dataUrl;
    } finally {
      if (parent) parent.style.opacity = '0.0001';
    }
  }, []);

  const recordSlideAsMp4 = useCallback(async (node: HTMLDivElement, videoUrl: string): Promise<Blob> => {
    const parent = node.parentElement;

    // ── 1. Captura overlay (textos, cores) sem o vídeo ──────────────────────
    const existingVideo = node.querySelector('video') as HTMLVideoElement | null;
    if (parent) parent.style.opacity = '1';
    if (existingVideo) existingVideo.style.opacity = '0';
    const overlayDataUrl = await htmlToImage.toPng(node, { pixelRatio: 1, width: 1080, height: 1440 });
    if (existingVideo) existingVideo.style.opacity = '1';
    if (parent) parent.style.opacity = '0.0001';

    const overlayImg = new Image();
    overlayImg.src = overlayDataUrl;
    await new Promise(r => { overlayImg.onload = r; overlayImg.onerror = r; });

    // ── 2. Cria vídeo dedicado fora do DOM ───────────────────────────────────
    // Nunca entra no DOM — o browser não suspende o decode por visibilidade
    const offVideo = document.createElement('video');
    offVideo.src = videoUrl;
    offVideo.muted = true;
    offVideo.playsInline = true;
    offVideo.crossOrigin = 'anonymous';
    offVideo.currentTime = 0;

    // Aguarda metadados e seek para o início
    await new Promise<void>((res, rej) => {
      offVideo.onloadedmetadata = () => res();
      offVideo.onerror = () => rej(new Error('Erro ao carregar vídeo para export'));
      offVideo.load();
    });
    await new Promise<void>(res => {
      offVideo.onseeked = () => res();
      offVideo.currentTime = 0;
    });

    // ── 3. Canvas composto ───────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d')!;

    // ── 4. Muxer + Encoder ───────────────────────────────────────────────────
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: 1080, height: 1440 },
      fastStart: 'in-memory',
    });

    const encConfig = { codec: 'avc1.42002a', width: 1080, height: 1440, bitrate: 8_000_000, framerate: 30 };
    const supported = await VideoEncoder.isConfigSupported(encConfig);
    if (!supported.supported) throw new Error('Codec H.264 não suportado neste browser.');
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { throw e; },
    });
    encoder.configure(encConfig);

    // ── 5. captureStream + MediaStreamTrackProcessor ─────────────────────────
    // Lê frames diretamente do decoder — independente de viewport/visibilidade
    await offVideo.play();
    const stream = (offVideo as any).captureStream() as MediaStream;
    const [track] = stream.getVideoTracks();
    const processor = new (window as any).MediaStreamTrackProcessor({ track });
    const reader = processor.readable.getReader() as ReadableStreamDefaultReader<VideoFrame>;

    const DURATION = 15; // segundos
    let firstTs = -1;
    let lastKeyFrameOffset = -Infinity;

    while (true) {
      const { done, value: srcFrame } = await reader.read();
      if (done) break;

      const elapsed = srcFrame.timestamp / 1_000_000; // µs → s

      if (firstTs < 0) firstTs = elapsed;
      const relativeTime = elapsed - firstTs;

      if (relativeTime >= DURATION) {
        srcFrame.close();
        break;
      }

      // Desenha frame do vídeo + overlay de texto no canvas
      ctx.drawImage(srcFrame, 0, 0, 1080, 1440);
      ctx.drawImage(overlayImg, 0, 0, 1080, 1440);
      srcFrame.close();

      const outFrame = new VideoFrame(canvas, {
        timestamp: Math.round(relativeTime * 1_000_000),
        duration: Math.round(1_000_000 / 30),
      });
      const needsKeyFrame = relativeTime - lastKeyFrameOffset >= 5;
      if (needsKeyFrame) lastKeyFrameOffset = relativeTime;
      encoder.encode(outFrame, { keyFrame: needsKeyFrame });
      outFrame.close();
    }

    offVideo.pause();
    track.stop();
    await reader.cancel();

    await encoder.flush();
    encoder.close();
    muxer.finalize();

    return new Blob([target.buffer], { type: 'video/mp4' });
  }, []);

  const downloadSlide = useCallback(async (node: HTMLDivElement, section: Section, label: string) => {
    try {
      if (section.videoUrl) {
        const mp4Blob = await recordSlideAsMp4(node, section.videoUrl);
        saveAs(mp4Blob, `${label}.mp4`);
      } else {
        const parent = node.parentElement;
        if (parent) parent.style.opacity = '1';
        try {
          const dataUrl = await htmlToImage.toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            width: 1080,
            height: 1440,
          });
          saveAs(dataUrl, `${label}.png`);
        } finally {
          if (parent) parent.style.opacity = '0.0001';
        }
      }
    } catch (e) {
      console.error('Erro ao baixar slide:', e);
      alert('Erro ao baixar. Veja o console para detalhes.');
    }
  }, [recordSlideAsMp4]);

  const exportAll = useCallback(async (sections: Section[]) => {
    if (sections.length === 0) return;
    setIsExporting(true);
    const zip = new JSZip();

    try {
      setExportStep('preparando');

      for (let i = 0; i < sections.length; i++) {
        const node = exportRefs.current[i];
        if (!node) continue;

        if (sections[i].videoUrl) {
          setExportStep(`gravando vídeo ${i + 1} de ${sections.length}`);
          try {
            const mp4Blob = await recordSlideAsMp4(node, sections[i].videoUrl!);
            zip.file(`slide-${i + 1}.mp4`, mp4Blob);
          } catch (vErr) {
            console.warn(`Vídeo ${i + 1} falhou, exportando como PNG`, vErr);
            const rawDataUrl = await captureSlideAsPng(node);
            zip.file(`slide-${i + 1}.png`, rawDataUrl.split(',')[1], { base64: true });
          }
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
      alert('Erro ao exportar. Veja o console para detalhes.');
    } finally {
      setIsExporting(false);
      setExportStep(null);
    }
  }, [recordSlideAsMp4, captureSlideAsPng, setIsExporting, setExportStep]);

  return {
    exportRefs,
    exportAll,
    downloadSlide,
    isExporting,
    exportStep,
  };
};
