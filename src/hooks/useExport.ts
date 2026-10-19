import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Section, EXPORT_FORMATS } from '../types';
import { useStore } from '../store';
import { cloudStorage } from '../services/storage/cloudStorage';
import { supabase } from '../lib/supabase';

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

/**
 * Compõe vídeo + overlay em MP4/WebM usando Canvas + MediaRecorder.
 * Sem FFmpeg WASM — 100% APIs nativas do browser.
 */
const compositeWithCanvas = async (opts: CompositeOpts): Promise<Blob> => {
  const {
    videoUrl, overlayData,
    drawW, drawH, cropX, cropY,
    videoH, isStorytelling, bgColor,
    trimStart, duration,
  } = opts;

  const W = 1080;
  const H = 1440;

  // 1) Converte overlay PNG data → ImageBitmap
  const overlayBlob = new Blob([overlayData as unknown as BlobPart], { type: 'image/png' });
  const overlayBitmap = await createImageBitmap(overlayBlob);

  // 2) Cria vídeo source (off-screen)
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true; // Necessário para play() funcionar
  video.preload = 'auto';
  video.playsInline = true;
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(video);

  await new Promise<void>((resolve, reject) => {
    video.oncanplaythrough = () => resolve();
    video.onerror = () => reject(new Error('Falha ao carregar vídeo para exportação.'));
    video.src = videoUrl;
    setTimeout(() => reject(new Error('Timeout carregando vídeo para exportação.')), 30000);
  });

  // Seek para o ponto de trim
  if (trimStart > 0) {
    video.currentTime = trimStart;
    await new Promise<void>(resolve => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 3000);
    });
  }

  // 3) Canvas de composição
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 4) Configura MediaRecorder na stream do canvas
  const stream = canvas.captureStream(30); // 30 FPS

  // 4.1) Conectar áudio do vídeo à stream
  let audioCtx: AudioContext | null = null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      const audioSource = audioCtx.createMediaElementSource(video);
      const audioDest = audioCtx.createMediaStreamDestination();
      audioSource.connect(audioDest);
      // NOTE: Não conectamos ao áudio do sistema (audioCtx.destination), então tocará mudo para o usuário!

      audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      video.muted = false; // Precisamos desmutar para o AudioContext puxar o som
    }
  } catch (err) {
    console.warn('[Export] Falha ao capturar trilha de áudio:', err);
  }

  // Tenta mp4 primeiro, fallback para webm
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000, // 5 Mbps — boa qualidade
  });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const recorderDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const finalType = mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
      resolve(new Blob(chunks, { type: finalType }));
    };
  });

  // 5) Loop de renderização: desenha frames no canvas
  recorder.start(100); // chunk a cada 100ms

  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume().catch(() => {});
  }

  try {
    await video.play();
  } catch (e: any) {
    if (e.name === 'NotAllowedError') {
      console.warn('[Export] Autoplay com som bloqueado. Voltando para mudo.');
      video.muted = true;
      await video.play();
    } else {
      throw e;
    }
  }

  const endTime = trimStart + duration;
  const drawFrame = () => {
    // Preenche background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Desenha vídeo com crop (usando coordenadas de destino com offset negativo pra simular object-cover)
    ctx.save();
    if (isStorytelling) {
      ctx.beginPath();
      ctx.rect(0, 0, W, videoH);
      ctx.clip();
    }
    ctx.drawImage(video, -cropX, -cropY, drawW, drawH);
    ctx.restore();

    // Overlay (textos, avatar, etc.)
    ctx.drawImage(overlayBitmap, 0, 0, W, H);
  };

  await new Promise<void>((resolve) => {
    const tick = () => {
      if (video.paused || video.ended || video.currentTime >= endTime) {
        resolve();
        return;
      }
      drawFrame();
      requestAnimationFrame(tick);
    };
    tick();
  });

  // Último frame
  drawFrame();

  video.pause();
  recorder.stop();
  video.remove();
  if (audioCtx) {
    audioCtx.close().catch(() => {});
  }
  overlayBitmap.close();

  return recorderDone;
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

  // Sem pré-carregamento — Canvas + MediaRecorder não precisa de setup prévio.

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
   * Compõe o vídeo final usando Canvas + MediaRecorder.
   * Pipeline: vídeo → canvas (scale/crop) + overlay → MediaRecorder → MP4/WebM.
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
    const coverScale = Math.max(1080 / vW, videoH / vH) * userScale;
    const drawW = Math.round(Math.round(vW * coverScale) / 2) * 2;
    const drawH = Math.round(Math.round(vH * coverScale) / 2) * 2;
    const cropX = Math.round(Math.max(0, drawW - 1080) * posX / 100);
    const cropY = Math.round(Math.max(0, drawH - videoH) * posY / 100);

    const duration = Math.min(15, Math.max(0.5, Math.min(trimStart + 15, dur || 15) - trimStart));

    // Converte overlay HTMLImageElement → Uint8Array para compositeWithCanvas
    const overlayResp = await fetch(overlay.src);
    const overlayData = new Uint8Array(await overlayResp.arrayBuffer());

    console.log('[Export] Compondo vídeo via Canvas + MediaRecorder...');
    return withTimeout(
      compositeWithCanvas({
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

  /**
   * Exporta os slides em um ZIP (PNG; slides com vídeo viram MP4).
   * `indices` limita a quais slides entram; `pixelRatio` 2 = alta resolução.
   */
  const exportAll = useCallback(async (sections: Section[], opts: { indices?: number[]; pixelRatio?: number } = {}) => {
    if (sections.length === 0 || isExporting) return;
    const indices = opts.indices ?? sections.map((_, i) => i);
    if (indices.length === 0) return;
    setIsExporting(true);

    try {
      setExportStep('preparando');
      const { JSZip, saveAs } = await loadExportDeps();
      const zip = new JSZip();

      for (let n = 0; n < indices.length; n++) {
        const i = indices[n];
        const node = exportRefs.current[i];
        if (!node) continue;

        if (sections[i].videoUrl) {
          setExportStep(`vídeo ${n + 1} de ${indices.length}`);
          const mp4 = await withTimeout(
            composeVideoAsMp4(node, sections[i]),
            180000,
            `exportando vídeo do slide ${i + 1}`
          );
          zip.file(`slide-${i + 1}.mp4`, mp4);
        } else {
          setExportStep(`slide ${n + 1} de ${indices.length}`);
          const rawDataUrl = await captureSlideAsPng(node, opts.pixelRatio ?? 1);
          zip.file(`slide-${i + 1}.png`, rawDataUrl.split(',')[1], { base64: true });
        }
      }

      setExportStep('compactando');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `carrossel-pro-${Date.now()}.zip`);
      toast.success(`${indices.length} ${indices.length === 1 ? 'slide exportado' : 'slides exportados'}`);

      // Log export to Supabase (best-effort)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const carouselName = sections[0]?.title || 'Sem título';
          await cloudStorage.logExport(user.id, user.email || '', indices.length, carouselName, 'zip');
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
