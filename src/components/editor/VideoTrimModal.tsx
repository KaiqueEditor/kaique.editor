import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Scissors, Play } from 'lucide-react';
import type { ThemeTokens } from '../../constants/theme';

interface VideoTrimModalProps {
  isOpen: boolean;
  file: File | null;
  T: ThemeTokens;
  onCancel: () => void;
  onConfirm: (trimStart: number) => void;
}

const CLIP_DURATION = 15;

export const VideoTrimModal: React.FC<VideoTrimModalProps> = ({
  isOpen,
  file,
  T,
  onCancel,
  onConfirm,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const videoUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    setTrimStart(0);
    setDuration(0);
  }, [file]);

  if (!isOpen || !file) return null;

  const maxStart = Math.max(0, duration - CLIP_DURATION);
  const clipEnd = Math.min(duration, trimStart + CLIP_DURATION);

  const playSegment = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(trimStart, maxStart);
    void videoRef.current.play().catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-w-2xl rounded-3xl p-5 sm:p-6"
        style={{ background: T.sidebar, border: `1px solid ${T.border}`, boxShadow: T.shadow }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black" style={{ color: T.textPrimary }}>
              Escolher trecho de 15 segundos
            </h3>
            <p className="text-xs mt-1" style={{ color: T.textDim }}>
              Defina IN (início) e OUT (fim). O trecho sempre terá 15 segundos.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl transition-all active:scale-90"
            style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${T.border}` }}>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            muted
            playsInline
            className="w-full max-h-[45vh] object-contain"
            onLoadedMetadata={e => {
              const d = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0;
              setDuration(d);
              e.currentTarget.currentTime = 0;
            }}
            onTimeUpdate={e => {
              const end = trimStart + CLIP_DURATION;
              if (e.currentTarget.currentTime >= end && duration > CLIP_DURATION) {
                e.currentTarget.currentTime = trimStart;
                void e.currentTarget.play().catch(() => {});
              }
            }}
          />
        </div>

        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-black uppercase" style={{ color: T.textFaint }}>IN</p>
              <p className="text-sm font-black" style={{ color: T.textPrimary }}>{trimStart.toFixed(1)}s</p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-black uppercase" style={{ color: T.textFaint }}>OUT</p>
              <p className="text-sm font-black" style={{ color: T.textPrimary }}>{clipEnd.toFixed(1)}s</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-bold mb-2" style={{ color: T.textDim }}>
              <span>Mover início do corte</span>
              <span>{trimStart.toFixed(1)}s</span>
            </div>
          <input
            type="range"
            min={0}
            max={maxStart}
            step={0.1}
            value={Math.min(trimStart, maxStart)}
            onChange={e => {
              const newStart = Number(e.target.value);
              setTrimStart(newStart);
              if (videoRef.current) {
                videoRef.current.currentTime = newStart;
              }
            }}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: T.accent, background: T.glassMd }}
          />
          </div>
          <button
            onClick={playSegment}
            className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-2"
            style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textSub }}
          >
            <Play size={13} />
            Pré-visualizar trecho IN → OUT
          </button>
          <p className="text-[11px] mt-2" style={{ color: T.textFaint }}>
            Duração do vídeo: {duration.toFixed(1)}s {duration > CLIP_DURATION ? `· Janela fixa: ${CLIP_DURATION}s` : '· Vídeo menor que 15s'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide"
            style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(Math.min(trimStart, maxStart))}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-2"
            style={{ background: T.accent, color: T.accentText, boxShadow: `0 6px 20px ${T.accentGlow}` }}
          >
            <Scissors size={13} />
            Usar esse trecho
          </button>
        </div>
      </div>
    </div>
  );
};
