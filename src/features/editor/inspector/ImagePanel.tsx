import { useCallback, useRef, useState } from 'react';
import { Download, EyeOff, Image as ImageIcon, Search, Trash2, UploadCloud, Video } from 'lucide-react';
import { ImageGallery } from '../../../components/gallery/ImageGallery';
import { Button, Field, Slider, cx } from '../../../ui';
import { Group, useActiveSection } from '../shared';

interface ImagePanelProps {
  onImageUpload: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (sectionId: string, file: File) => void;
  onDownloadSlide: (index: number) => void;
}

const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv|mpeg|mpg|3gp)$/i.test(f.name);

/** Prévia da mídia com um ponto arrastável que define o foco do enquadramento. */
function FocusPad({ imageUrl, videoUrl, x, y, onChange }: {
  imageUrl?: string; videoUrl?: string; x: number; y: number; onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setFrom = useCallback((clientX: number, clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onChange(
      Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))),
      Math.round(Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100))),
    );
  }, [onChange]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(100, x + d[0])), Math.max(0, Math.min(100, y + d[1])));
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-[4/3] rounded-ui-md overflow-hidden bg-fg/[0.06] cursor-crosshair select-none touch-none"
      onPointerDown={e => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setFrom(e.clientX, e.clientY); }}
      onPointerMove={e => { if (e.buttons === 1) setFrom(e.clientX, e.clientY); }}
    >
      {videoUrl
        ? <video src={videoUrl} muted className="w-full h-full object-cover pointer-events-none" />
        : <img src={imageUrl} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Foco da imagem"
        aria-valuetext={`${x}% horizontal, ${y}% vertical`}
        onKeyDown={onKey}
        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-white/25 backdrop-blur shadow-[0_2px_8px_rgba(0,0,0,0.5)] focus-visible:outline-offset-4"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </div>
  );
}

export function ImagePanel({ onImageUpload, onVideoUpload, onDownloadSlide }: ImagePanelProps) {
  const { section: s, index, update } = useActiveSection();
  const fileRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  if (!s) return null;

  const hasMedia = !!(s.imageUrl || s.videoUrl);
  const isSocial = s.layoutType === 'social-post';
  const imageHidden = isSocial && s.showSocialImage === false;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isVideoFile(file)) onVideoUpload(s.id, file);
    else onImageUpload(s.id, e);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      <Group>
        {hasMedia && !imageHidden ? (
          <FocusPad imageUrl={s.imageUrl} videoUrl={s.videoUrl} x={s.imagePosX ?? 50} y={s.imagePosY ?? 50}
            onChange={(x, y) => update({ imagePosX: x, imagePosY: y })} />
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className={cx(
              'w-full aspect-[4/3] rounded-ui-md border-2 border-dashed border-fg/15 hover:border-fg/30 hover:bg-fg/[0.03]',
              'flex flex-col items-center justify-center gap-2 text-muted transition-colors',
            )}>
            <UploadCloud size={26} aria-hidden="true" />
            <span className="text-subhead font-medium text-fg-2">Enviar foto ou vídeo</span>
            <span className="text-caption">ou arraste para o slide</span>
          </button>
        )}
        {hasMedia && !imageHidden && <p className="text-caption text-faint -mt-1">Arraste o ponto para escolher o foco.</p>}

        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
        <div className="grid grid-cols-2 gap-2">
          <Button icon={<UploadCloud size={15} />} onClick={() => fileRef.current?.click()}>{hasMedia ? 'Trocar' : 'Enviar'}</Button>
          <Button icon={<Search size={15} />} onClick={() => setGalleryOpen(true)}>Buscar</Button>
        </div>
        {hasMedia && (
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => update({ imageUrl: undefined, videoUrl: undefined, videoTrimStart: undefined })}>
            Remover mídia
          </Button>
        )}
        {isSocial && (
          <Button variant="ghost" icon={imageHidden ? <ImageIcon size={15} /> : <EyeOff size={15} />}
            onClick={() => update({ showSocialImage: imageHidden })}>
            {imageHidden ? 'Mostrar imagem no post' : 'Ocultar imagem do post'}
          </Button>
        )}
      </Group>

      {s.videoUrl && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-ui-sm bg-accent/15 text-footnote text-fg-2">
          <Video size={15} className="text-accent-text flex-shrink-0" aria-hidden="true" />
          Este slide será exportado como vídeo MP4 de 15 segundos.
        </div>
      )}

      <Group title="Ajustes">
        <Field label="Zoom" aside={`${(s.imageScale ?? 1).toFixed(1)}×`}>
          {id => <Slider id={id} min={1} max={4} step={0.1} value={s.imageScale ?? 1} onChange={v => update({ imageScale: v })} />}
        </Field>
        <Field label="Escurecer" aside={`${Math.round((s.overlayOpacity ?? 0.4) * 100)}%`}>
          {id => <Slider id={id} min={0} max={0.95} step={0.05} value={s.overlayOpacity ?? 0.4} onChange={v => update({ overlayOpacity: v })} />}
        </Field>
        <Field label="Degradê" aside={`${Math.round((s.gradientIntensity ?? 0.8) * 100)}%`}>
          {id => <Slider id={id} min={0} max={1} step={0.05} value={s.gradientIntensity ?? 0.8} onChange={v => update({ gradientIntensity: v })} />}
        </Field>
        <Field label="Área da imagem" aside={`${s.imageHeight ?? 55}%`}>
          {id => <Slider id={id} min={30} max={100} step={5} value={s.imageHeight ?? 55} onChange={v => update({ imageHeight: v })} />}
        </Field>
      </Group>

      <Button variant="ghost" icon={<Download size={15} />} onClick={() => onDownloadSlide(index)}>
        Baixar este slide ({s.videoUrl ? 'MP4' : 'PNG'})
      </Button>

      <ImageGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={url => { update({ imageUrl: url, videoUrl: undefined, showSocialImage: true }); setGalleryOpen(false); }}
      />
    </div>
  );
}
