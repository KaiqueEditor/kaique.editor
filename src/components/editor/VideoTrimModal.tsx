import { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button, Dialog, Field, Slider } from '../../ui';

interface VideoTrimModalProps {
  isOpen: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (trimStart: number) => void;
}

const CLIP_DURATION = 15;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Escolhe a janela de 15 s do vídeo que vai para o slide. */
export function VideoTrimModal({ isOpen, file, onCancel, onConfirm }: VideoTrimModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const videoUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  useEffect(() => { setTrimStart(0); setDuration(0); }, [file]);

  const maxStart = Math.max(0, duration - CLIP_DURATION);
  const start = Math.min(trimStart, maxStart);
  const clipEnd = Math.min(duration, start + CLIP_DURATION);

  const playSegment = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    void v.play().catch(() => {});
  };

  return (
    <Dialog
      open={isOpen && !!file}
      onClose={onCancel}
      title="Trecho do vídeo"
      description="O slide usa 15 segundos do vídeo. Arraste para escolher onde começa."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" data-autofocus onClick={() => onConfirm(start)} disabled={duration === 0}>Usar este trecho</Button>
        </>
      }
    >
      <div className="rounded-ui-md overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          muted
          playsInline
          className="w-full max-h-[45vh] object-contain"
          onLoadedMetadata={e => {
            setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0);
            e.currentTarget.currentTime = 0;
          }}
          onTimeUpdate={e => {
            if (duration > CLIP_DURATION && e.currentTarget.currentTime >= start + CLIP_DURATION) {
              e.currentTarget.currentTime = start;
              void e.currentTarget.play().catch(() => {});
            }
          }}
        />
      </div>

      {duration > CLIP_DURATION ? (
        <Field label="Início do trecho" aside={`${fmt(start)} – ${fmt(clipEnd)}`}>
          {id => (
            <Slider id={id} min={0} max={maxStart} step={0.1} value={start}
              onChange={v => { setTrimStart(v); if (videoRef.current) videoRef.current.currentTime = v; }} />
          )}
        </Field>
      ) : (
        <p className="text-footnote text-muted">{duration > 0 ? `O vídeo tem ${fmt(duration)}: entra inteiro.` : 'Carregando vídeo…'}</p>
      )}

      <Button icon={<Play size={15} />} onClick={playSegment} className="self-start" disabled={duration === 0}>Ver o trecho</Button>
    </Dialog>
  );
}
