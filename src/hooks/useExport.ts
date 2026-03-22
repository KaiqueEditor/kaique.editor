import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Section, EXPORT_FORMATS } from '../types';
import { useStore } from '../store';
import { cloudStorage } from '../services/storage/cloudStorage';
import { supabase } from '../lib/supabase';
// @ts-ignore
import ffmpegCoreURL from '@ffmpeg/core?url';
// @ts-ignore
import ffmpegWasmURL from '@ffmpeg/core/wasm?url';

type ExportDeps = {
  htmlToImage: { toPng: (node: HTMLElement, options?: any) => Promise<string> };
  JSZip: any;
  saveAs: (data: Blob | string, filename?: string, options?: any) => void;
};

type CompositeOpts = {
  videoUrl: string;
  videoMimeType?: string;
  overlayData: Uint8Array;
  drawW: number;
  drawH: number;
  cropX: number;
  cropY: number;
  videoH: number;
  isStorytelling: boolean;
  bgColor: string;
  trimStart: number;
  duration: number;
};

let exportDepsPromise: Promise<ExportDeps> | null = null;
let ffmpegBridgePromise: Promise<{
  compositeToMp4: (opts: CompositeOpts) => Promise<Blob>;
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

      const compositeToMp4 = async (opts: CompositeOpts): Promise<Blob> => {
        const {
          videoUrl, videoMimeType, overlayData,
          drawW, drawH, cropX, cropY,
          videoH, isStorytelling, bgColor,
          trimStart, duration,
        } = opts;

        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ext = (videoMimeType || '').includes('webm') ? 'webm' : 'mp4';
        const inName = `in-${stamp}.${ext}`;
        const overlayName = `ov-${stamp}.png`;
        const outName = `out-${stamp}.mp4`;

        await ffmpeg.writeFile(inName, await fetchFile(videoUrl));
        await ffmpeg.writeFile(overlayName, overlayData);

        // Usa trim filter para seeking preciso (evita pular frames por keyframe)
        // scale com lanczos para melhor qualidade
        // H.264 exige dimensões pares — drawW/drawH já vêm arredondados para par
        const trimFilter = trimStart > 0
          ? `trim=start=${trimStart}:duration=${duration},setpts=PTS-STARTPTS,`
          : '';

        let filter: string;
        if (isStorytelling) {
          const padColor = bgColor.replace('#', '0x');
          filter = [
            `[0:v]${trimFilter}scale=${drawW}:${drawH}:flags=lanczos[s]`,
            `[s]crop=1080:${videoH}:${cropX}:${cropY}[c]`,
            `[c]pad=1080:1440:0:0:${padColor}[p]`,
            `[p][1:v]overlay=0:0:shortest=1[out]`,
          ].join(';');
        } else {
          filter = [
            `[0:v]${trimFilter}scale=${drawW}:${drawH}:flags=lanczos[s]`,
            `[s]crop=1080:1440:${cropX}:${cropY}[c]`,
            `[c][1:v]overlay=0:0:shortest=1[out]`,
          ].join(';');
        }

        await ffmpeg.exec([
          '-i', inName,
          '-loop', '1',        // overlay PNG repete por toda a duração
          '-i', overlayName,
          '-filter_complex', filter,
          '-map', '[out]',
          '-map', '0:a?',      // copia áudio original se existir (? = opcional)
          ...(trimStart === 0 ? ['-t', String(duration)] : []),
          '-r', '30',          // força 30fps constante (elimina VFR)
          '-c:v', 'libx264',
          '-crf', '18',        // Alta qualidade (menor = melhor, 18 ≈ visually lossless)
          '-preset', 'ultrafast', // Máximo desempenho no browser
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',       // codec de áudio compatível
          '-b:a', '128k',      // bitrate de áudio
          '-movflags', '+faststart',
          outName,
        ]);

        const output = await ffmpeg.readFile(outName) as Uint8Array;
        await ffmpeg.deleteFile(inName).catch(() => { });
        await ffmpeg.deleteFile(overlayName).catch(() => { });
        await ffmpeg.deleteFile(outName).catch(() => { });

        return new Blob([output as unknown as BlobPart], { type: 'video/mp4' });
      };

      return { compositeToMp4 };
    })().catch(e => {
      ffmpegBridgePromise = null; // reseta para permitir retry
      throw e;
    });
  }

  return ffmpegBridgePromise;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`Timeout: ${label}`)), timeoutMs);
    }),
  ]);
};

/**
 * Converte todas as <img> de um nó DOM para data URLs inline (base64).
 * Evita que html-to-image refaça fetch CORS — que falha silenciosamente
 * em CDNs (Supabase Storage, Unsplash, DALL·E, etc.), causando imagens
 * em branco na exportação.
 *
 * Estratégia:
 * 1. Tenta via canvas (rápido — usa o bitmap já carregado pelo browser).
 * 2. Se canvas der "tainted", faz fetch + blob → data URL.
 * 3. Se ambos falharem, a imagem permanece com o src original (fallback).
 *
 * Retorna uma função de restore que devolve os src originais.
 */
export const inlineImagesToDataUrl = async (node: HTMLElement): Promise<() => void> => {
  const images = Array.from(node.querySelectorAll('img'));
  const saved: { el: HTMLImageElement; originalSrc: string }[] = [];

  await Promise.all(
    images.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;

      // 1) Tenta canvas — funciona se crossOrigin="anonymous" foi respeitado
      try {
        if (img.complete && img.naturalWidth > 0) {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = c.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 200) {
              saved.push({ el: img, originalSrc: src });
              img.src = dataUrl;
              return;
            }
          }
        }
      } catch { /* canvas tainted — fallback para fetch */ }

      // 2) Fetch → blob → data URL
      try {
        const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl && dataUrl.length > 200) {
          saved.push({ el: img, originalSrc: src });
          img.src = dataUrl;
        }
      } catch {
        console.warn('[Export] Não conseguiu inlinear imagem:', src.slice(0, 80));
      }
    })
  );

  // Aguarda o browser processar os novos src
  await new Promise(r => setTimeout(r, 50));

  return () => {
    for (const { el, originalSrc } of saved) {
      el.src = originalSrc;
    }
  };
};

/**
 * Carrega metadados do vídeo sem criar canvas nem reproduzir.
 * Retorna largura, altura e duração.
 */
const getVideoInfo = (url: string): Promise<{ vW: number; vH: number; dur: number }> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:1;';
    document.body.appendChild(video);
    const cleanup = () => video.remove();
    video.onloadedmetadata = () => {
      const result = { vW: video.videoWidth, vH: video.videoHeight, dur: video.duration || 0 };
      cleanup();
      resolve(result);
    };
    video.onerror = () => { cleanup(); reject(new Error('Falha ao carregar metadados do vídeo.')); };
    video.src = url;
  });

export const useExport = () => {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setIsExporting = useStore(state => state.setIsExporting);
  const setExportStep = useStore(state => state.setExportStep);
  const isExporting = useStore(state => state.isExporting);
  const exportStep = useStore(state => state.exportStep);
  const exportFormatKey = useStore(state => state.exportFormat);
  const fmt = EXPORT_FORMATS.find(f => f.key === exportFormatKey) || EXPORT_FORMATS[0];
  const EW = fmt.width;
  const EH = fmt.height;

  useEffect(() => {
    // Pré-carrega o motor de export em background para reduzir timeout no primeiro download.
    void loadFfmpegBridge().catch(() => {
      // Erro aqui não bloqueia uso; será tratado no fluxo de export.
    });
  }, []);

  const captureSlideAsPng = useCallback(async (node: HTMLDivElement, pixelRatio = 1): Promise<string> => {
    const { htmlToImage } = await loadExportDeps();
    // O nó de captura (innerRef) → wrapper div → container fixo (opacity: 0.0001)
    // Precisamos tornar o container fixo visível para o html-to-image funcionar.
    const wrapper = node.parentElement;
    const fixedContainer = wrapper?.parentElement;
    if (fixedContainer) fixedContainer.style.opacity = '1';

    // Pré-carregar todas as imagens do slide para evitar canvas tainted / imagens em branco
    const images = node.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>(resolve => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              // Timeout de segurança — não trava export se imagem não carregar
              setTimeout(resolve, 3000);
            })
      )
    );

    // Converte imagens externas → data URLs para evitar falha CORS silenciosa do html-to-image
    const restoreImages = await inlineImagesToDataUrl(node);

    // Delay para garantir que o browser renderizou o slide com todas as imagens
    await new Promise(r => setTimeout(r, 300));
    try {
      let dataUrl = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          dataUrl = await htmlToImage.toPng(node, {
            pixelRatio,
            cacheBust: false,
            width: EW,
            height: EH,
            skipAutoScale: true,
            includeQueryParams: true,
            fetchRequestInit: { mode: 'cors', credentials: 'omit' },
          });
          if (dataUrl && dataUrl.length > 200) break;
        } catch(err) {
          console.warn(`Tentativa ${attempt + 1} de captura falhou:`, err);
          await new Promise(r => setTimeout(r, 800));
        }
      }
      if (!dataUrl || dataUrl.length <= 200) {
        throw new Error('Falha ao capturar slide como PNG após 3 tentativas.');
      }
      return dataUrl;
    } finally {
      restoreImages();
      if (fixedContainer) fixedContainer.style.opacity = '0.0001';
    }
  }, [EW, EH]);

  const captureOverlay = useCallback(async (node: HTMLDivElement): Promise<HTMLImageElement> => {
    const { htmlToImage } = await loadExportDeps();
    const hasVideo = !!node.querySelector('video');
    const wrapper = node.parentElement;
    const fixedContainer = wrapper?.parentElement;

    if (fixedContainer) fixedContainer.style.opacity = '1';

    // Para slides com vídeo: torna o fundo do container transparente e exclui o
    // elemento <video> da captura (filter). Assim o frame congelado do vídeo não
    // aparece na overlay — os frames reais vêm do canvas abaixo.
    const originalBg = node.style.backgroundColor;
    let textAreaEl: HTMLElement | null = null;

    if (hasVideo) {
      node.style.backgroundColor = 'transparent';
      const bgContainer = node.firstElementChild as HTMLElement | null;
      const isFullBg = bgContainer?.classList.contains('h-full') ?? false;
      if (!isFullBg) {
        textAreaEl = node.lastElementChild as HTMLElement | null;
        if (textAreaEl) textAreaEl.style.backgroundColor = originalBg;
      }
    }

    const restore = () => {
      node.style.backgroundColor = originalBg;
      if (textAreaEl) textAreaEl!.style.backgroundColor = '';
      if (fixedContainer) fixedContainer.style.opacity = '0.0001';
    };

    // Converte imagens → data URLs para evitar CORS
    const restoreImages = await inlineImagesToDataUrl(node);

    let overlayDataUrl: string;
    try {
      overlayDataUrl = await htmlToImage.toPng(node, {
        pixelRatio: 1,
        width: EW,
        height: EH,
        cacheBust: false,
        backgroundColor: 'transparent',
        // Para slides com vídeo: exclui o <video> de background.
        // Cuidado: não podemos excluir todas as <img>, senão o avatar (Roteiro) e outras imagens do layout somem.
        // O Media de fundo sempre tem object-cover.
        filter: (el: Element) => {
          if (el instanceof HTMLVideoElement) return false;
          // Se tiver vídeo, a imagem de fallback do vídeo não deve ir pra overlay, mas o avatar sim.
          // O avatar em social-post usa object-cover, então não podemos filtrar cegamente img.object-cover
          if (hasVideo && el instanceof HTMLImageElement && el.classList.contains('bg-media-fallback')) return false;
          return true;
        },
      });
    } catch (e) {
      restoreImages();
      restore();
      throw e;
    }

    restoreImages();
    restore();

    const img = new Image();
    img.src = overlayDataUrl;
    await new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    return img;
  }, [EW, EH]);

  /**
   * Compõe o vídeo final em MP4 usando FFmpeg diretamente.
   * Elimina a etapa de gravação canvas/MediaRecorder (era ~10s a mais).
   * Pipeline: overlay PNG + vídeo original → filter_complex → H.264 MP4.
   */
  const composeVideoAsMp4 = useCallback(async (node: HTMLDivElement, section: Section): Promise<Blob> => {
    const videoUrl = section.videoUrl!;
    const trimStart = Math.max(0, section.videoTrimStart ?? 0);
    const posX = section.imagePosX ?? 50;
    const posY = section.imagePosY ?? 50;
    const userScale = section.imageScale ?? 1;
    const isStorytelling = section.layoutType === 'storytelling';
    const rawImageHeight = section.imageHeight ?? 55;
    const videoH = isStorytelling ? Math.round(1440 * (rawImageHeight / 100)) : 1440;
    const bgColor = section.bgColor || '#000000';

    // Paraleliza: carrega metadados do vídeo e captura overlay ao mesmo tempo
    const [{ vW, vH, dur }, overlay] = await Promise.all([
      withTimeout(getVideoInfo(videoUrl), 10000, 'carregando metadados do vídeo'),
      captureOverlay(node),
    ]);

    if (!vW || !vH) {
      throw new Error(
        'Codec do vídeo não suportado para exportação. ' +
        'Use H.264 (MP4 padrão). Vídeos HEVC/H.265 precisam ser convertidos antes de subir.'
      );
    }

    // Calcula box de recorte object-cover (idêntico ao comportamento CSS)
    // drawW/drawH arredondados para número par (H.264 exige dimensões pares)
    const coverScale = Math.max(1080 / vW, videoH / vH) * userScale;
    const drawW = Math.round(Math.round(vW * coverScale) / 2) * 2;
    const drawH = Math.round(Math.round(vH * coverScale) / 2) * 2;
    const cropX = Math.round(Math.max(0, drawW - 1080) * posX / 100);
    const cropY = Math.round(Math.max(0, drawH - videoH) * posY / 100);

    const duration = Math.min(15, Math.max(0.5, Math.min(trimStart + 15, dur || 15) - trimStart));

    // Converte overlay HTMLImageElement → Uint8Array para o ffmpeg
    const overlayResp = await fetch(overlay.src);
    const overlayData = new Uint8Array(await overlayResp.arrayBuffer());

    const ffmpegBridge = await withTimeout(loadFfmpegBridge(), 120000, 'inicializando ffmpeg');
    return withTimeout(
      ffmpegBridge.compositeToMp4({
        videoUrl,
        videoMimeType: section.videoMimeType,
        overlayData,
        drawW, drawH, cropX, cropY,
        videoH, isStorytelling, bgColor,
        trimStart, duration,
      }),
      180000,
      'compondo vídeo'
    );
  }, [captureOverlay]);

  const downloadSlide = useCallback(async (node: HTMLDivElement, section: Section, label: string) => {
    const { saveAs } = await loadExportDeps();

    try {
      if (section.videoUrl) {
        const mp4 = await withTimeout(
          composeVideoAsMp4(node, section),
          180000,
          'exportando vídeo'
        );
        saveAs(mp4 as unknown as Blob, `${label}.mp4`);
      } else {
        const dataUrl = await captureSlideAsPng(node, 2);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        saveAs(blob, `${label}.png`);
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
      saveAs(content, `carrossel-pro-${Date.now()}.zip`);

      // Log export to Supabase (best-effort)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const carouselName = sections[0]?.title || 'Sem título';
          await cloudStorage.logExport(user.id, user.email || '', sections.length, carouselName, 'zip');
        }
      } catch { /* silent */ }
    } catch (e: any) {
      console.error('Erro na exportação:', e);
      toast.error(`Erro ao exportar ZIP: ${e?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
      setExportStep(null);
    }
  }, [composeVideoAsMp4, captureSlideAsPng, setIsExporting, setExportStep, isExporting]);



  return {
    exportRefs,
    exportAll,
    downloadSlide,
    captureSlideAsPng,
    isExporting,
    exportStep,
  };
};
