import { useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import * as MP4Box from 'mp4box';
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
    // ── 1. Captura overlay (textos/cores) sem o vídeo ──────────────────────
    const existingVideo = node.querySelector('video') as HTMLVideoElement | null;
    const parent = node.parentElement;
    if (parent) parent.style.opacity = '1';
    if (existingVideo) existingVideo.style.opacity = '0';
    const overlayDataUrl = await htmlToImage.toPng(node, { pixelRatio: 1, width: 1080, height: 1440 });
    if (existingVideo) existingVideo.style.opacity = '1';
    if (parent) parent.style.opacity = '0.0001';

    const overlayImg = new Image();
    overlayImg.src = overlayDataUrl;
    await new Promise(r => { overlayImg.onload = r; overlayImg.onerror = r; });

    // ── 2. Fetch do vídeo como ArrayBuffer ───────────────────────────────────
    // Decodificação 100% off-screen via WebCodecs — sem dependência de DOM ou viewport
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();

    // ── 3. Canvas de composição ───────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d')!;

    // ── 4. Muxer + Encoder de saída ───────────────────────────────────────────
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: 1080, height: 1440 },
      fastStart: 'in-memory',
    });

    const encConfig = {
      codec: 'avc1.42002a',
      width: 1080,
      height: 1440,
      bitrate: 8_000_000,
      framerate: 30,
    };
    const supported = await VideoEncoder.isConfigSupported(encConfig);
    if (!supported.supported) throw new Error('Codec H.264 não suportado neste browser.');

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e),
    });
    encoder.configure(encConfig);

    // ── 5. VideoDecoder + mp4box — decodifica frames direto do arquivo ────────
    // Sem <video> no DOM, sem viewport, sem throttle do Chrome
    const DURATION = 15; // primeiros 15 segundos
    let firstTs = -1;
    let lastKeyFrameOffset = -Infinity;
    let resolved = false;

    await new Promise<void>((resolve, reject) => {
      const mp4boxFile = MP4Box.createFile();

      const decoder = new VideoDecoder({
        output: (frame: VideoFrame) => {
          if (resolved) { frame.close(); return; }

          const tsSeconds = frame.timestamp / 1_000_000;
          if (firstTs < 0) firstTs = tsSeconds;
          const elapsed = tsSeconds - firstTs;

          if (elapsed >= DURATION) {
            frame.close();
            if (!resolved) { resolved = true; resolve(); }
            return;
          }

          // Compõe: frame do vídeo + overlay de texto no canvas
          ctx.drawImage(frame, 0, 0, 1080, 1440);
          ctx.drawImage(overlayImg, 0, 0, 1080, 1440);
          frame.close();

          const outFrame = new VideoFrame(canvas, {
            timestamp: Math.round(elapsed * 1_000_000),
            duration: Math.round(1_000_000 / 30),
          });
          const needsKeyFrame = elapsed - lastKeyFrameOffset >= 5;
          if (needsKeyFrame) lastKeyFrameOffset = elapsed;
          encoder.encode(outFrame, { keyFrame: needsKeyFrame });
          outFrame.close();
        },
        error: (e) => reject(e),
      });

      mp4boxFile.onReady = (info: any) => {
        const videoTrack = info.tracks.find((t: any) => t.type === 'video');
        if (!videoTrack) { reject(new Error('Nenhuma track de vídeo encontrada')); return; }

        decoder.configure({
          codec: videoTrack.codec,
          codedWidth: videoTrack.video.width,
          codedHeight: videoTrack.video.height,
          description: getAvcDescription(mp4boxFile, videoTrack),
        });

        mp4boxFile.setExtractionOptions(videoTrack.id, null, { nbSamples: Infinity });
        mp4boxFile.start();
      };

      mp4boxFile.onSamples = async (_id: number, _user: any, samples: any[]) => {
        for (const sample of samples) {
          if (resolved) break;
          const chunk = new EncodedVideoChunk({
            type: sample.is_sync ? 'key' : 'delta',
            timestamp: (sample.cts / sample.timescale) * 1_000_000,
            duration: (sample.duration / sample.timescale) * 1_000_000,
            data: sample.data,
          });
          decoder.decode(chunk);
        }
        if (!resolved) {
          await decoder.flush();
          if (!resolved) { resolved = true; resolve(); }
        }
      };

      mp4boxFile.onError = (e: any) => reject(new Error(String(e)));

      // Alimenta o mp4box com o ArrayBuffer do arquivo de vídeo
      const buf = arrayBuffer as any;
      buf.fileStart = 0;
      mp4boxFile.appendBuffer(buf);
      mp4boxFile.flush();
    });

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

// Extrai o AVCDecoderConfigurationRecord (parâmetro obrigatório para decodificar H.264)
function getAvcDescription(mp4boxFile: any, videoTrack: any): Uint8Array | undefined {
  try {
    const trak = mp4boxFile.getTrackById(videoTrack.id);
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).DataStream.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8); // pula os primeiros 8 bytes do box header
      }
    }
  } catch {
    // Se falhar, retorna undefined — o decoder tenta sem description
  }
  return undefined;
}
