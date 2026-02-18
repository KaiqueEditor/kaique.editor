import React from 'react';
import {
  Type as TypeIcon, Trash2, ImageIcon, PanelsTopLeft,
  MessageSquareText, Minus, Plus, UploadCloud, Sparkles,
  Loader2, Move, EyeOff, Image as LucideImage, Palette,
} from 'lucide-react';
import { Section } from '../../types';
import { FONT_OPTIONS } from '../../constants/fonts';
import { useStore } from '../../store';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { useFileUpload } from '../../hooks/useFileUpload';
import { Theme, ThemeTokens } from '../../constants/theme';

interface SlideEditorProps {
  section: Section;
  index: number;
  isActive: boolean;
  onClick: () => void;
  theme?: Theme;
  T?: ThemeTokens;
  onOpenImageAgent?: (sectionId: string) => void;
}

// Fallback dark tokens
const DARK_T: ThemeTokens = {
  bg: '#000', bgCanvas: '#000', sidebar: '#0a0a0a', card: '#111', cardHover: '#1a1a1a',
  glass: 'rgba(255,255,255,0.04)', glassMd: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.15)',
  accent: '#ffffff', accentText: '#000000', accentHover: 'rgba(255,255,255,0.9)', accentGlow: 'rgba(255,255,255,0.12)',
  textPrimary: '#ffffff', textSub: 'rgba(255,255,255,0.7)', textDim: 'rgba(255,255,255,0.4)', textFaint: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.08)', inputFocus: 'rgba(255,255,255,0.3)',
  success: '#30d158', shadow: '0 4px 24px rgba(0,0,0,0.6)', shadowStrong: '0 20px 60px rgba(0,0,0,0.8)',
};

export const SlideEditor: React.FC<SlideEditorProps> = ({
  section, index, isActive, onClick, T: TProp, onOpenImageAgent
}) => {
  const T = TProp || DARK_T;
  const sections = useStore(state => state.sections);
  const updateSection = useStore(state => state.updateSection);
  const deleteSection = useStore(state => state.deleteSection);
  const { generate, isGenerating } = useImageGeneration();
  const { handleFileUpload } = useFileUpload();

  const s = section;
  const generating = isGenerating(s.id);
  const update = (updates: Partial<Section>) => updateSection(s.id, updates);
  const label = index === 0 ? 'CAPA' : index === sections.length - 1 ? 'FINAL' : `SLIDE ${index + 1}`;
  const hasImage = !!(s.imageUrl || s.videoUrl);

  return (
    <div
      onClick={onClick}
      className="rounded-2xl transition-all cursor-pointer overflow-hidden"
      style={{
        background: isActive ? T.glassMd : T.glass,
        border: isActive ? `1.5px solid ${T.borderStrong}` : `1px solid ${T.border}`,
        opacity: isActive ? 1 : 0.65,
        boxShadow: isActive ? `0 0 0 1px ${T.glass}, ${T.shadow}` : 'none',
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* ── Card header — sempre visível ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: isActive ? `1px solid ${T.border}` : 'none' }}
      >
        {/* Color swatch do slide */}
        <div
          className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{
            background: s.bgColor || '#000',
            border: `2px solid ${T.border}`,
            fontSize: 10,
          }}
        >
          {hasImage && <span style={{ fontSize: 10 }}>🖼</span>}
        </div>

        {/* Info do slide */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{
                background: isActive ? T.accent : T.glassMd,
                color: isActive ? T.accentText : T.textDim,
              }}
            >
              {label}
            </span>
            {hasImage && (
              <span className="text-[8px] font-bold" style={{ color: T.success }}>✓ img</span>
            )}
          </div>
          <p className="text-[10px] font-semibold truncate" style={{ color: isActive ? T.textSub : T.textDim }}>
            {s.title || 'Sem título'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onOpenImageAgent && (
            <button
              onClick={e => { e.stopPropagation(); onOpenImageAgent(s.id); }}
              title="Agente de Imagem"
              className="p-1.5 rounded-lg transition-all"
              style={{ color: T.textFaint }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.textPrimary; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; }}
            >
              <Palette size={13} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: T.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Painel expandido (só quando ativo) ── */}
      {isActive && (
        <div className="p-4 space-y-4">

          {/* ── Narrativa ── */}
          <div className="space-y-3 p-4 rounded-2xl" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: T.textDim }}>
              <TypeIcon size={11} /> Narrativa
            </p>
            <div>
              <p className="text-[8px] font-bold uppercase mb-1.5" style={{ color: T.textFaint }}>Título (grande)</p>
              <textarea
                value={s.title}
                onChange={e => update({ title: e.target.value })}
                onClick={e => e.stopPropagation()}
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none resize-none leading-snug transition-all"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                placeholder="Texto Impactante Grande"
              />
            </div>
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
                placeholder="Contexto ou rótulo"
              />
            </div>
            <div>
              <div className="flex justify-between text-[8px] font-black uppercase mb-2" style={{ color: T.textFaint }}>
                <span>Posição vertical do texto</span>
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
          </div>

          {/* ── Layout + Alinhamento ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Layout</p>
              <div className="flex p-1 gap-1 rounded-xl" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
                {[
                  { key: 'background', icon: <ImageIcon size={13} />, label: 'BG' },
                  { key: 'storytelling', icon: <PanelsTopLeft size={13} />, label: 'St' },
                  { key: 'social-post', icon: <MessageSquareText size={13} />, label: 'So' },
                ].map(({ key, icon, label: lbl }) => (
                  <button key={key}
                    onClick={e => { e.stopPropagation(); update({ layoutType: key as Section['layoutType'] }); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all"
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
                    className="flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all"
                    style={{
                      background: s.alignment === align ? T.accent : 'transparent',
                      color: s.alignment === align ? T.accentText : T.textDim,
                    }}
                  >
                    {align === 'left' ? 'E' : align === 'center' ? 'C' : 'D'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Cores ── */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>Cores</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Fundo', key: 'bgColor', def: '#000000' },
                { label: 'Brand', key: 'brandingColor', def: '#ffffff' },
                { label: 'Título', key: 'titleColor', def: '#ffffff' },
                { label: 'Corpo', key: 'bodyColor', def: '#ffffff' },
              ].map(({ label: lbl, key, def }) => (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <input type="color"
                    value={(s as any)[key] || def}
                    onChange={e => update({ [key]: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className="w-9 h-9 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                    style={{ outline: `2px solid ${T.border}` }}
                  />
                  <p className="text-[7px] font-bold uppercase" style={{ color: T.textFaint }}>{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Estúdio de Imagem ── */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: T.textDim }}>
                <Move size={11} /> Imagem
              </p>
              {onOpenImageAgent && (
                <button
                  onClick={e => { e.stopPropagation(); onOpenImageAgent(s.id); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide transition-all"
                  style={{ background: T.glassMd, color: T.textDim, border: `1px solid ${T.border}` }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = T.accent;
                    (e.currentTarget as HTMLElement).style.color = T.accentText;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = T.glassMd;
                    (e.currentTarget as HTMLElement).style.color = T.textDim;
                  }}
                >
                  <Palette size={10} /> Agente IA
                </button>
              )}
            </div>

            {s.layoutType === 'social-post' && (
              <button
                onClick={e => { e.stopPropagation(); update({ showSocialImage: !(s.showSocialImage !== false) }); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                style={{
                  background: s.showSocialImage !== false ? T.glassMd : T.glass,
                  border: `1px solid ${s.showSocialImage !== false ? T.borderStrong : T.border}`,
                  color: s.showSocialImage !== false ? T.textPrimary : T.textDim,
                }}
              >
                {s.showSocialImage !== false ? <LucideImage size={12} /> : <EyeOff size={12} />}
                {s.showSocialImage !== false ? 'Remover Imagem' : 'Adicionar Imagem'}
              </button>
            )}

            {[
              { label: 'Foco X', key: 'imagePosX', min: 0, max: 100, step: 1, unit: '%', def: 50 },
              { label: 'Foco Y', key: 'imagePosY', min: 0, max: 100, step: 1, unit: '%', def: 50 },
            ].map(({ label: lbl, key, min, max, step, unit, def }) => (
              <div key={key}>
                <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
                  <span>{lbl}</span>
                  <span style={{ color: T.textSub }}>{(s as any)[key] ?? def}{unit}</span>
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

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Zoom', key: 'imageScale', min: 1, max: 4, step: 0.1, unit: 'x', def: 1, pct: false },
                { label: 'Escuro', key: 'overlayOpacity', min: 0, max: 0.95, step: 0.05, unit: '', def: 0.4, pct: true },
              ].map(({ label: lbl, key, min, max, step, unit, def, pct }) => (
                <div key={key}>
                  <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: T.textFaint }}>
                    <span>{lbl}</span>
                    <span style={{ color: T.textSub }}>
                      {pct ? `${Math.round(((s as any)[key] ?? def) * 100)}%` : `${(s as any)[key] ?? def}${unit}`}
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

            <div className="flex flex-col gap-2">
              <label
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all"
                style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong;
                  (e.currentTarget as HTMLElement).style.color = T.textPrimary;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLElement).style.color = T.textDim;
                }}
              >
                <UploadCloud size={13} /> Upload Foto / Vídeo
                <input type="file" className="hidden" accept="image/*,video/*"
                  onChange={e => handleFileUpload(s.id, e)} />
              </label>
              <button
                disabled={generating}
                onClick={e => { e.stopPropagation(); generate(s.id, s.imagePrompt || s.title, s.content); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                style={{
                  background: generating ? T.glassMd : T.accent,
                  color: generating ? T.textDim : T.accentText,
                  boxShadow: generating ? 'none' : `0 2px 12px ${T.accentGlow}`,
                  border: generating ? `1px solid ${T.border}` : '1px solid transparent',
                }}
              >
                {generating ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
                {generating ? 'Gerando IA...' : 'Gerar com IA'}
              </button>
            </div>
          </div>

          {/* ── Tipografia ── */}
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>Tipografia</p>

            {[
              { label: 'Título', fontKey: 'titleFont', sizeKey: 'titleSize', defaultFont: 'anton', defaultSize: 30, sizeMin: 10, sizeMax: 120, sizeStep: 2 },
              { label: 'Subtítulo', fontKey: 'bodyFont', sizeKey: 'bodySize', defaultFont: 'sans', defaultSize: 20, sizeMin: 10, sizeMax: 60, sizeStep: 1 },
            ].map(({ label: lbl, fontKey, sizeKey, defaultFont, defaultSize, sizeMin, sizeMax, sizeStep }) => (
              <div key={fontKey} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <div>
                  <p className="text-[7px] font-black uppercase mb-1" style={{ color: T.textFaint }}>{lbl}</p>
                  <select value={(s as any)[fontKey] || defaultFont}
                    onChange={e => update({ [fontKey]: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className="w-full text-[10px] font-bold px-3 py-2 rounded-xl outline-none transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id} style={{ background: '#111', color: '#fff' }}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase mb-1 text-center" style={{ color: T.textFaint }}>Tam</p>
                  <div className="flex items-center gap-0.5 p-0.5 rounded-xl" style={{ background: T.glass, border: `1px solid ${T.border}` }}>
                    <button onClick={e => { e.stopPropagation(); update({ [sizeKey]: Math.max(sizeMin, ((s as any)[sizeKey] || defaultSize) - sizeStep) }); }}
                      className="p-1.5 rounded-lg transition-all" style={{ color: T.textDim }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textPrimary}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
                    ><Minus size={11} /></button>
                    <span className="text-[10px] font-black w-7 text-center" style={{ color: T.textPrimary }}>
                      {(s as any)[sizeKey] || defaultSize}
                    </span>
                    <button onClick={e => { e.stopPropagation(); update({ [sizeKey]: Math.min(sizeMax, ((s as any)[sizeKey] || defaultSize) + sizeStep) }); }}
                      className="p-1.5 rounded-lg transition-all" style={{ color: T.textDim }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textPrimary}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
                    ><Plus size={11} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
