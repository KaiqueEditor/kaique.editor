import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trash2, ImageIcon, PanelsTopLeft,
  MessageSquareText, Minus, Plus, UploadCloud, Upload, Sparkles,
  Loader2, EyeOff, Image as LucideImage, Video, Download, RefreshCw,
  ChevronDown, ChevronUp, GripVertical, Copy,
} from 'lucide-react';
import { Section } from '../../types';
import { FONT_OPTIONS, FONT_CATEGORIES } from '../../constants/fonts';
import { useStore } from '../../store';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { geminiService } from '../../services/api/geminiService';
import { Theme, ThemeTokens, DARK_FALLBACK } from '../../constants/theme';

interface SlideEditorProps {
  section: Section;
  index: number;
  isActive: boolean;
  onClick: () => void;
  theme?: Theme;
  T?: ThemeTokens;
  onDownload?: () => Promise<void> | void;
  onVideoUpload?: (sectionId: string, file: File) => void;
  onImageUpload?: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

// ── Pad de foco da imagem (opção B — miniatura como fundo) ──────────────────
interface FocusPadProps {
  imageUrl?: string;
  videoUrl?: string;
  posX: number;
  posY: number;
  onChange: (x: number, y: number) => void;
  T: ThemeTokens;
}

const FocusPad: React.FC<FocusPadProps> = ({ imageUrl, videoUrl, posX, posY, onChange, T }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getPos = useCallback((clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onChange(x, y);
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) getPos(e.clientX, e.clientY); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [getPos]);

  // Touch handlers
  useEffect(() => {
    const el = padRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        getPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [getPos]);

  const hasMedia = !!(imageUrl || videoUrl);

  return (
    <div>
      <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
        <span>Foco da imagem</span>
        <span style={{ color: T.textSub }}>{Math.round(posX)}% · {Math.round(posY)}%</span>
      </div>
      <div
        ref={padRef}
        className="relative w-full rounded-xl overflow-hidden cursor-crosshair select-none"
        style={{
          aspectRatio: '1080/700',
          background: T.glassMd,
          border: `1.5px solid ${T.border}`,
        }}
        onMouseDown={e => {
          e.preventDefault();
          dragging.current = true;
          getPos(e.clientX, e.clientY);
        }}
        onTouchStart={e => {
          e.preventDefault();
          getPos(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        {/* Imagem de fundo FIEL à pre-visualização do slide */}
        {hasMedia && imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-150"
            style={{ objectPosition: `${posX}% ${posY}%` }}
            draggable={false}
          />
        )}

        {/* Overlay escuro leve */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />

        {/* Grid de referência - rule of thirds */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '33.33% 33.33%',
        }} />

        {!hasMedia && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <ImageIcon size={18} style={{ color: T.textFaint, opacity: 0.5 }} />
            <span className="text-[8px] font-bold" style={{ color: T.textFaint }}>Arraste para posicionar</span>
          </div>
        )}

        {/* Indicador de posição — crosshair premium */}
        <div
          className="absolute pointer-events-none transition-all duration-100"
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Linhas de crosshair full-width/height */}
          <div style={{ position: 'absolute', top: '50%', left: -999, right: -999, height: 1, background: 'rgba(255,255,255,0.4)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: -999, bottom: -999, width: 1, background: 'rgba(255,255,255,0.4)', transform: 'translateX(-50%)' }} />
          {/* Círculo central com glow */}
          <div style={{
            position: 'relative',
            width: 14, height: 14,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.3), 0 0 12px rgba(255,255,255,0.5)',
            transform: 'translate(-50%, -50%)',
          }} />
        </div>
      </div>
    </div>
  );
};

// ── SlideEditor ─────────────────────────────────────────────────────────────
export const SlideEditor: React.FC<SlideEditorProps> = ({
  section, index, isActive, onClick, T: TProp, onDownload,
  onVideoUpload, onImageUpload, dragHandleProps,
}) => {
  const T = TProp || DARK_FALLBACK;
  const sections = useStore(state => state.sections);
  const updateSection = useStore(state => state.updateSection);
  const deleteSection = useStore(state => state.deleteSection);
  const duplicateSection = useStore(state => state.duplicateSection);
  const reorderSections = useStore(state => state.reorderSections);
  const config = useStore(state => state.config);
  const updateConfig = useStore(state => state.updateConfig);
  const { generate, isGenerating } = useImageGeneration();
  const isAdmin = useStore(state => state.isAdmin);

  const s = section;
  const generating = isGenerating(s.id);
  const update = (updates: Partial<Section>) => updateSection(s.id, updates);
  const label = index === 0 ? 'CAPA' : index === sections.length - 1 ? 'FINAL' : `FRAME ${index + 1}`;
  const hasImage = !!(s.imageUrl || s.videoUrl);

  const presets = useStore(state => state.presets);
  const savePreset = useStore(state => state.savePreset);
  const deletePreset = useStore(state => state.deletePreset);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [titleVariations, setTitleVariations] = useState<string[]>([]);
  const [variationIndex, setVariationIndex] = useState(0);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const originalTitleRef = useRef(s.title);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Seções colapsáveis para mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ imagem: true });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (url) updateConfig({ avatarUrl: url });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleCycleTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoadingVariations) return;

    // Se já temos variações, apenas cicla
    if (titleVariations.length > 0) {
      const next = (variationIndex + 1) % (titleVariations.length + 1);
      setVariationIndex(next);
      // índice igual ao total = volta ao original
      update({ title: next === titleVariations.length ? originalTitleRef.current : titleVariations[next] });
      return;
    }

    // Primeira chamada: gera variações
    originalTitleRef.current = s.title;
    setIsLoadingVariations(true);
    try {
      const variations = await geminiService.generateTitleVariations(s.title, s.content);
      setTitleVariations(variations);
      setVariationIndex(0);
      if (variations.length > 0) update({ title: variations[0] });
    } catch {
      // silently fail
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDownload || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideoByType = file.type.startsWith('video/');
    const isVideoByName = /\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv|mpeg|mpg|3gp)$/i.test(file.name);
    if ((isVideoByType || isVideoByName) && onVideoUpload) {
      onVideoUpload(s.id, file);
    } else if (onImageUpload) {
      onImageUpload(s.id, e);
    }
    // Reset input para permitir re-upload do mesmo arquivo
    e.target.value = '';
  };

  return (
    <div
      className={`rounded-2xl transition-all overflow-hidden ${isActive ? 'animate-glow-pulse' : ''}`}
      style={{
        background: confirmDelete ? 'rgba(239,68,68,0.12)' : isActive ? T.glassMd : T.glass,
        border: confirmDelete
          ? '1.5px solid rgba(239,68,68,0.4)'
          : isActive ? `1.5px solid ${T.borderStrong}` : `1px solid ${T.border}`,
        boxShadow: isActive ? `0 0 0 1px ${T.glass}, ${T.shadow}` : 'none',
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* ── Header do card — clique aqui alterna abrir/fechar ── */}
      <div className="flex items-stretch cursor-pointer">
        {/* Grip handle isolado para o drag event */}
        <div
          {...dragHandleProps}
          className="w-8 flex items-center justify-center flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          style={{ cursor: 'grab', background: T.glass }}
          title="Arraste para reordenar"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={13} style={{ color: T.textFaint }} />
        </div>

        <div
          onClick={onClick}
          className="flex-1 flex items-center gap-3 pr-4 py-3.5"
          style={{ borderBottom: isActive ? `1px solid ${T.border}` : 'none' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: s.bgColor || '#000', border: `2px solid ${T.border}` }}
          >
            {s.videoUrl ? <span style={{ fontSize: 10 }}>🎬</span> : s.imageUrl ? <span style={{ fontSize: 10 }}>🖼</span> : null}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: isActive ? T.accent : T.glassMd, color: isActive ? T.accentText : T.textDim }}
              >
                {label}
              </span>
              {hasImage && <span className="text-[8px] font-bold" style={{ color: T.success }}>✓ img</span>}
            </div>
            <p className="text-[10px] font-semibold truncate" style={{ color: isActive ? T.textSub : T.textDim }}>
              {s.title || 'Sem título'}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Reorder buttons */}
            <button
              onClick={e => { e.stopPropagation(); if (index > 0) reorderSections(index, index - 1); }}
              className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:bg-white/10 disabled:opacity-20"
              style={{ color: T.textFaint }}
              title="Mover para cima"
              disabled={index === 0}
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); if (index < sections.length - 1) reorderSections(index, index + 1); }}
              className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:bg-white/10 disabled:opacity-20"
              style={{ color: T.textFaint }}
              title="Mover para baixo"
              disabled={index === sections.length - 1}
            >
              <ChevronDown size={13} />
            </button>

            {/* Duplicate */}
            <button
              onClick={e => { e.stopPropagation(); duplicateSection(s.id); }}
              className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:bg-white/10"
              style={{ color: T.textFaint }}
              title="Duplicar slide"
            >
              <Copy size={13} />
            </button>

            {onDownload && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 active:opacity-60 disabled:opacity-50 disabled:cursor-wait hover:bg-white/10"
                style={{ color: isDownloading ? T.textSub : T.textFaint }}
                title={s.videoUrl ? 'Baixar MP4' : 'Baixar PNG'}
              >
                {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              </button>
            )}

            {confirmDelete ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
                  className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
                >Deletar</button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/5"
                  style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
                >Cancelar</button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 active:opacity-60 hover:bg-white/10"
                style={{ color: T.textFaint }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Painel expandido ── */}
      {isActive && (
        <div className="p-4 space-y-3">
          {/* Texto */}
          {(() => {
            const fontSlots = [
              { label: 'Título', fontKey: 'titleFont', sizeKey: 'titleSize', defaultFont: 'druk', defaultSize: 30, sizeMin: 10, sizeMax: 120, sizeStep: 2 },
              { label: 'Corpo', fontKey: 'bodyFont', sizeKey: 'bodySize', defaultFont: 'montserrat', defaultSize: 20, sizeMin: 10, sizeMax: 60, sizeStep: 1 },
            ];
            return (
              <div className="space-y-3">
                {/* Título */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[8px] font-bold uppercase" style={{ color: T.textFaint }}>Título</p>
                    <button
                      onClick={handleCycleTitle}
                      title={titleVariations.length > 0 ? `Variação ${variationIndex + 1}/${titleVariations.length} — clique para próxima` : 'Gerar variações de headline'}
                      className="p-1 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 hover:bg-white/10"
                      style={{ color: isLoadingVariations ? T.accent : T.textFaint, background: 'transparent' }}
                    >
                      <RefreshCw size={11} className={isLoadingVariations ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <textarea
                    value={s.title}
                    onChange={e => update({ title: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none resize-none leading-snug transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                    placeholder="Texto impactante"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <p className="text-[8px] font-bold uppercase mb-1.5" style={{ color: T.textFaint }}>Subtítulo</p>
                  <textarea
                    value={s.content}
                    onChange={e => update({ content: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none resize-none transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                    placeholder="Subtítulo ou contexto"
                  />
                </div>

                {/* Altura do texto */}
                <div>
                  <div className="flex justify-between text-[8px] font-black uppercase mb-2" style={{ color: T.textFaint }}>
                    <span>Altura do texto</span>
                    <span style={{ color: T.textSub }}>{s.textPosY ?? 85}px</span>
                  </div>
                  <input type="range" min="0" max="250" step="5"
                    value={s.textPosY ?? 85}
                    onChange={e => update({ textPosY: parseInt(e.target.value) })}
                    onClick={e => e.stopPropagation()}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: T.accent, background: T.glassMd }}
                  />
                </div>

                {/* Tipografia — colapsável */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSection('tipografia'); }}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Tipografia</p>
                    <ChevronDown size={12} style={{ color: T.textFaint, transform: openSections.tipografia ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </button>
                  {openSections.tipografia && fontSlots.map(({ label: lbl, fontKey, sizeKey, defaultFont, defaultSize, sizeMin, sizeMax, sizeStep }) => {
                    const currentFont = (s as any)[fontKey] || defaultFont;
                    const currentSize = (s as any)[sizeKey] || defaultSize;
                    return (
                      <div key={fontKey} className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 flex-shrink-0 p-0.5 rounded-lg" style={{ background: T.glassMd }}>
                          <button onClick={e => { e.stopPropagation(); update({ [sizeKey]: Math.max(sizeMin, currentSize - sizeStep) }); }}
                            className="w-5 h-5 rounded flex items-center justify-center transition-all active:scale-90" style={{ color: T.textDim }}
                          ><Minus size={9} /></button>
                          <span className="text-[9px] font-black w-6 text-center tabular-nums" style={{ color: T.textPrimary }}>{currentSize}</span>
                          <button onClick={e => { e.stopPropagation(); update({ [sizeKey]: Math.min(sizeMax, currentSize + sizeStep) }); }}
                            className="w-5 h-5 rounded flex items-center justify-center transition-all active:scale-90" style={{ color: T.textDim }}
                          ><Plus size={9} /></button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: T.textFaint }}>{lbl}</p>
                          <select
                            value={currentFont}
                            onChange={e => { e.stopPropagation(); update({ [fontKey]: e.target.value }); }}
                            onClick={e => e.stopPropagation()}
                            className="w-full text-[10px] font-bold rounded-lg outline-none"
                            style={{ padding: '5px 8px', background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary, cursor: 'pointer' }}
                          >
                            {FONT_CATEGORIES.map(cat => {
                              const options = FONT_OPTIONS.filter(f => f.category === cat.key && (!f.adminOnly || isAdmin));
                              if (options.length === 0) return null;
                              return (
                                <optgroup key={cat.key} label={cat.label}>
                                  {options.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </optgroup>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Layout + Alinhamento */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Layout</p>
                      <div className="flex p-1 gap-1 rounded-xl" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
                        {[
                          { key: 'storytelling', icon: <PanelsTopLeft size={11} />, label: 'Feed' },
                          { key: 'social-post', icon: <MessageSquareText size={11} />, label: 'Twitter' },
                        ].map(({ key, icon, label: lbl }) => (
                          <button key={key}
                            onClick={e => {
                              e.stopPropagation();
                              const newLayout = key as Section['layoutType'];
                              if (newLayout === 'social-post') {
                                update({ layoutType: newLayout, bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#536471', brandingColor: '#0f1419', alignment: 'left' });
                              } else {
                                update({ layoutType: newLayout, bgColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', brandingColor: '#ffffff' });
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-0.5 py-2 rounded-lg text-[7px] font-black uppercase tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-95"
                            style={{
                              background: s.layoutType === key ? T.accent : 'transparent',
                              color: s.layoutType === key ? T.accentText : T.textDim,
                            }}
                          >
                            {icon} {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Alinhamento</p>
                      <div className="flex p-1 gap-1 rounded-xl" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button key={align}
                            onClick={e => { e.stopPropagation(); update({ alignment: align }); }}
                            className="flex-1 py-2 rounded-lg text-[10px] font-black transition-all"
                            style={{
                              background: s.alignment === align ? T.accent : 'transparent',
                              color: s.alignment === align ? T.accentText : T.textDim,
                            }}
                          >
                            {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Perfil Social — compacto ── */}
          {s.layoutType === 'social-post' && (
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8 }} className="space-y-1.5">
              <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Perfil</p>
              <div className="flex items-center gap-2">
                <div
                  onClick={e => { e.stopPropagation(); avatarInputRef.current?.click(); }}
                  className="group relative flex-shrink-0 cursor-pointer"
                  style={{ width: 32, height: 32 }}
                >
                  <img src={config.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" style={{ border: `1.5px solid ${T.border}` }} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Upload size={10} color="#ffffff" />
                  </div>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <input
                  type="text" placeholder="Nome" value={config.branding}
                  onChange={e => updateConfig({ branding: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold outline-none transition-all"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                />
                <input
                  type="text" placeholder="@user" value={config.handle}
                  onChange={e => updateConfig({ handle: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="w-20 px-2 py-1.5 rounded-lg text-[10px] font-bold outline-none transition-all"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontFamily: 'monospace' }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                />
              </div>
            </div>
          )}

          {/* Design + imagem */}
          {(() => {
            const isSocial = s.layoutType === 'social-post';
            const PALETTES = isSocial ? [
              { name: 'Twitter', bg: '#ffffff', title: '#0f1419', body: '#536471', brand: '#0f1419' },
              { name: 'Noite', bg: '#15202b', title: '#ffffff', body: '#8b98a5', brand: '#ffffff' },
              { name: 'Creme', bg: '#faf7f2', title: '#1a1a1a', body: '#555555', brand: '#1a1a1a' },
              { name: 'Roxo', bg: '#f0e6ff', title: '#2d1b69', body: '#6b46c1', brand: '#2d1b69' },
            ] : [
              { name: 'Midnight', bg: '#000000', title: '#ffffff', body: '#aaaaaa', brand: '#ffffff' },
              { name: 'Dourado', bg: '#000000', title: '#F5A623', body: '#c8860f', brand: '#F5A623' },
              { name: 'Cinza', bg: '#000000', title: '#cccccc', body: '#888888', brand: '#cccccc' },
              { name: 'Bege', bg: '#000000', title: '#e8d5b0', body: '#b5936a', brand: '#e8d5b0' },
            ];
            const colorFields = [
              { label: '🎨 Fundo', key: 'bgColor', def: isSocial ? '#ffffff' : '#000000' },
              { label: '✏️ Título', key: 'titleColor', def: isSocial ? '#0f1419' : '#ffffff' },
              { label: '📝 Texto', key: 'bodyColor', def: isSocial ? '#536471' : '#ffffff' },
              { label: '👤 Autor', key: 'brandingColor', def: isSocial ? '#0f1419' : '#ffffff' },
            ];
            return (
              <div className="space-y-3">
                {/* ── Cores & Paletas — colapsável ── */}
                <div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSection('cores'); }}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      Cores & Paletas
                    </p>
                    <ChevronDown size={12} style={{ color: T.textFaint, transform: openSections.cores ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </button>

                  {openSections.cores && (
                    <div className="space-y-3">
                      {/* Paletas rápidas */}
                      <div className="grid grid-cols-4 gap-2">
                        {PALETTES.map(p => (
                          <button
                            key={p.name}
                            onClick={e => { e.stopPropagation(); update({ bgColor: p.bg, titleColor: p.title, bodyColor: p.body, brandingColor: p.brand }); }}
                            className="flex flex-col items-center gap-1.5 transition-all active:scale-95"
                            title={p.name}
                          >
                            <div className="w-full h-7 rounded-xl overflow-hidden flex" style={{ border: `1.5px solid ${T.border}` }}>
                              <div style={{ background: p.bg, flex: '3' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', flex: '2' }}>
                                <div style={{ background: p.title, flex: 1 }} />
                                <div style={{ background: p.body, flex: 1 }} />
                              </div>
                            </div>
                            <span className="text-[7px] font-bold uppercase" style={{ color: T.textFaint }}>{p.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Cores individuais */}
                      <div className="flex gap-2">
                        {colorFields.map(({ label: lbl, key, def }) => {
                          const currentColor = (s as any)[key] || def;
                          return (
                            <div key={key} className="relative flex flex-col items-center gap-1.5 flex-1">
                              <div className="w-full h-7 rounded-lg" style={{ background: currentColor, border: `1.5px solid ${T.border}` }} />
                              <span className="text-[7px] font-bold" style={{ color: T.textFaint }}>{lbl}</span>
                              <input
                                type="color" value={currentColor}
                                onChange={e => { e.stopPropagation(); update({ [key]: e.target.value }); }}
                                onClick={e => e.stopPropagation()}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Presets salvos */}
                      {presets.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Salvos</p>
                            {!savingPreset && (
                              <button
                                onClick={e => { e.stopPropagation(); setSavingPreset(true); setPresetName(''); }}
                                className="text-[7px] font-black uppercase px-2 py-1 rounded-lg transition-all active:scale-95"
                                style={{ color: T.accent, background: T.glass, border: `1px solid ${T.border}` }}
                              >+ Salvar</button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {presets.map(p => (
                              <div key={p.id} className="relative group">
                                <button
                                  onClick={e => { e.stopPropagation(); update({ layoutType: p.layoutType, titleFont: p.titleFont, bodyFont: p.bodyFont, titleSize: p.titleSize, bodySize: p.bodySize, bgColor: p.bgColor, titleColor: p.titleColor, bodyColor: p.bodyColor, brandingColor: p.brandingColor, alignment: p.alignment, overlayOpacity: p.overlayOpacity, textPosY: p.textPosY, imageScale: p.imageScale }); }}
                                  className="w-full flex flex-col items-center gap-1.5 transition-all active:scale-95"
                                  title={p.name}
                                >
                                  <div className="w-full h-7 rounded-xl overflow-hidden flex" style={{ border: `1.5px solid ${T.border}` }}>
                                    <div style={{ background: p.bgColor, flex: '3' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: '2' }}>
                                      <div style={{ background: p.titleColor, flex: 1 }} />
                                      <div style={{ background: p.bodyColor, flex: 1 }} />
                                    </div>
                                  </div>
                                  <span className="text-[7px] font-bold uppercase truncate w-full text-center" style={{ color: T.textFaint }}>{p.name}</span>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); deletePreset(p.id); }}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black items-center justify-center hidden group-hover:flex"
                                  style={{ background: '#ef4444', color: '#ffffff' }}
                                >×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {presets.length === 0 && !savingPreset && (
                        <button
                          onClick={e => { e.stopPropagation(); setSavingPreset(true); setPresetName(''); }}
                          className="w-full text-[8px] font-bold py-2 rounded-lg transition-all active:scale-95"
                          style={{ color: T.textDim, background: T.glass, border: `1px solid ${T.border}` }}
                        >+ Salvar combinação de cores atual</button>
                      )}

                      {savingPreset && (
                        <div className="flex gap-1.5">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nome do estilo..."
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              e.stopPropagation();
                              if (e.key === 'Enter' && presetName.trim()) {
                                savePreset({ id: Date.now().toString(), name: presetName.trim(), layoutType: s.layoutType, titleFont: s.titleFont, bodyFont: s.bodyFont, titleSize: s.titleSize, bodySize: s.bodySize, bgColor: s.bgColor, titleColor: s.titleColor, bodyColor: s.bodyColor, brandingColor: s.brandingColor, alignment: s.alignment, overlayOpacity: s.overlayOpacity, textPosY: s.textPosY, imageScale: s.imageScale });
                                setSavingPreset(false);
                              }
                              if (e.key === 'Escape') setSavingPreset(false);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold outline-none"
                            style={{ background: T.inputBg, border: `1px solid ${T.inputFocus}`, color: T.textPrimary }}
                          />
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (presetName.trim()) {
                                savePreset({ id: Date.now().toString(), name: presetName.trim(), layoutType: s.layoutType, titleFont: s.titleFont, bodyFont: s.bodyFont, titleSize: s.titleSize, bodySize: s.bodySize, bgColor: s.bgColor, titleColor: s.titleColor, bodyColor: s.bodyColor, brandingColor: s.brandingColor, alignment: s.alignment, overlayOpacity: s.overlayOpacity, textPosY: s.textPosY, imageScale: s.imageScale });
                              }
                              setSavingPreset(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all"
                            style={{ background: T.accent, color: T.accentText }}
                          >✓</button>
                          <button
                            onClick={e => { e.stopPropagation(); setSavingPreset(false); }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all"
                            style={{ background: T.glass, color: T.textFaint, border: `1px solid ${T.border}` }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Imagem — colapsável ── */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSection('imagem'); }}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Imagem</p>
                    <ChevronDown size={12} style={{ color: T.textFaint, transform: openSections.imagem ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                  </button>

                  {openSections.imagem && (
                    <>
                      {/* Toggle imagem (só social) */}
                      {isSocial && (
                        <button
                          onClick={e => { e.stopPropagation(); update({ showSocialImage: !(s.showSocialImage !== false) }); }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all mb-3"
                          style={{
                            background: s.showSocialImage !== false ? T.glassMd : T.glass,
                            border: `1px solid ${s.showSocialImage !== false ? T.borderStrong : T.border}`,
                            color: s.showSocialImage !== false ? T.textPrimary : T.textDim,
                          }}
                        >
                          {s.showSocialImage !== false ? <LucideImage size={12} /> : <EyeOff size={12} />}
                          {s.showSocialImage !== false ? 'Remover imagem' : 'Adicionar imagem'}
                        </button>
                      )}

                      {/* Foco da imagem */}
                      <div className="mb-3">
                        <FocusPad
                          imageUrl={s.imageUrl}
                          videoUrl={s.videoUrl}
                          posX={s.imagePosX ?? 50}
                          posY={s.imagePosY ?? 50}
                          onChange={(x, y) => update({ imagePosX: x, imagePosY: y })}
                          T={T}
                        />
                      </div>

                      {/* Zoom + Escurecimento */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {[
                          { label: 'Zoom', key: 'imageScale', min: 1, max: 4, step: 0.1, def: 1, pct: false, unit: 'x' },
                          { label: 'Escurecimento', key: 'overlayOpacity', min: 0, max: 0.95, step: 0.05, def: 0.4, pct: true, unit: '' },
                        ].map(({ label: lbl, key, min, max, step, def, pct, unit }) => (
                          <div key={key}>
                            <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
                              <span>{lbl}</span>
                              <span style={{ color: T.textSub }}>
                                {pct
                                  ? `${Math.round(((s as any)[key] ?? def) * 100)}%`
                                  : `${parseFloat(((s as any)[key] ?? def).toFixed(2))}${unit}`
                                }
                              </span>
                            </div>
                            <input type="range" min={min} max={max} step={step}
                              value={(s as any)[key] ?? def}
                              onChange={e => update({ [key]: parseFloat(e.target.value) })}
                              onClick={e => e.stopPropagation()}
                              className="w-full h-1 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: T.accent, background: T.glassMd }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Degradê + Área da Imagem */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
                            <span>Degradê</span>
                            <span style={{ color: T.textSub }}>
                              {Math.round((s.gradientIntensity ?? 0.8) * 100)}%
                            </span>
                          </div>
                          <input type="range" min={0} max={1} step={0.05}
                            value={s.gradientIntensity ?? 0.8}
                            onChange={e => update({ gradientIntensity: parseFloat(e.target.value) })}
                            onClick={e => e.stopPropagation()}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: T.accent, background: T.glassMd }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
                            <span>Área Imagem</span>
                            <span style={{ color: T.textSub }}>
                              {s.imageHeight ?? 55}%
                            </span>
                          </div>
                          <input type="range" min={30} max={100} step={5}
                            value={s.imageHeight ?? 55}
                            onChange={e => update({ imageHeight: parseInt(e.target.value) })}
                            onClick={e => e.stopPropagation()}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: T.accent, background: T.glassMd }}
                          />
                        </div>
                      </div>

                      {/* Aviso MP4 */}
                      {s.videoUrl && (
                        <div
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-bold mb-3"
                          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.borderStrong}`, color: T.textSub }}
                        >
                          <Video size={11} />
                          Este frame será exportado como <strong>.mp4</strong> (15s)
                        </div>
                      )}

                      {/* Upload + Gerar IA */}
                      <div className="flex gap-2">
                        <label
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all active:scale-95 active:opacity-70"
                          style={{
                            background: s.videoUrl ? 'rgba(255,255,255,0.08)' : T.glass,
                            border: `1px solid ${s.videoUrl ? T.borderStrong : T.border}`,
                            color: s.videoUrl ? T.textSub : T.textDim,
                          }}
                        >
                          {s.videoUrl
                            ? <><Video size={13} /> Trocar vídeo</>
                            : <><UploadCloud size={13} /> Imagem / Vídeo</>
                          }
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <button
                          disabled={generating}
                          onClick={e => { e.stopPropagation(); generate(s.id, s.imagePrompt || s.title, s.content); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                          style={{
                            background: generating ? T.glassMd : T.accent,
                            color: generating ? T.textDim : T.accentText,
                            boxShadow: generating ? 'none' : `0 2px 12px ${T.accentGlow}`,
                            border: generating ? `1px solid ${T.border}` : '1px solid transparent',
                          }}
                        >
                          {generating ? <Loader2 className="animate-spin animate-pulse-subtle" size={13} /> : <Sparkles size={13} />}
                          {generating ? 'Gerando...' : 'Gerar IA'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      )
      }
    </div >
  );
};
