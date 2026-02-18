import React from 'react';
import {
  Type as TypeIcon, Trash2, ImageIcon, PanelsTopLeft,
  MessageSquareText, Minus, Plus, UploadCloud, Sparkles,
  Loader2, Move, EyeOff, Image as LucideImage,
} from 'lucide-react';
import { Section } from '../../types';
import { FONT_OPTIONS } from '../../constants/fonts';
import { useStore } from '../../store';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { useFileUpload } from '../../hooks/useFileUpload';

interface SlideEditorProps {
  section: Section;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const GOLD = '#F5A623';
const GOLD_DIM = 'rgba(245,166,35,0.5)';
const GOLD_BG = 'rgba(245,166,35,0.08)';
const GLASS = 'rgba(255,255,255,0.04)';
const GLASS_BORDER = 'rgba(255,255,255,0.07)';
const TEXT_DIM = 'rgba(255,255,255,0.35)';
const TEXT_FAINT = 'rgba(255,255,255,0.18)';

export const SlideEditor: React.FC<SlideEditorProps> = ({ section, index, isActive, onClick }) => {
  const sections = useStore(state => state.sections);
  const updateSection = useStore(state => state.updateSection);
  const deleteSection = useStore(state => state.deleteSection);
  const { generate, isGenerating } = useImageGeneration();
  const { handleFileUpload } = useFileUpload();

  const s = section;
  const generating = isGenerating(s.id);
  const update = (updates: Partial<Section>) => updateSection(s.id, updates);
  const label = index === 0 ? 'CAPA' : index === sections.length - 1 ? 'FINAL' : `SLIDE ${index + 1}`;

  return (
    <div
      onClick={onClick}
      className="rounded-3xl transition-all cursor-pointer"
      style={{
        background: isActive ? 'rgba(245,166,35,0.06)' : GLASS,
        border: isActive ? `1.5px solid ${GOLD_DIM}` : `1px solid ${GLASS_BORDER}`,
        opacity: isActive ? 1 : 0.55,
        boxShadow: isActive ? '0 0 40px rgba(245,166,35,0.08)' : 'none',
        transform: isActive ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* ── Header do card ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${isActive ? 'rgba(245,166,35,0.12)' : GLASS_BORDER}` }}>
        <span
          className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{ background: isActive ? GOLD : 'rgba(255,255,255,0.08)', color: isActive ? '#000' : TEXT_DIM }}
        >
          {label}
        </span>
        <button
          onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: TEXT_FAINT }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_FAINT; }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {isActive && (
        <div className="p-5 space-y-5">

          {/* ── Narrativa ── */}
          <div className="space-y-3 p-4 rounded-2xl" style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}` }}>
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: GOLD_DIM }}>
              <TypeIcon size={11} /> Narrativa
            </p>
            <div>
              <p className="text-[8px] font-bold uppercase mb-1.5" style={{ color: TEXT_FAINT }}>Título (grande)</p>
              <textarea
                value={s.title}
                onChange={e => update({ title: e.target.value })}
                onClick={e => e.stopPropagation()}
                rows={3}
                className="w-full px-4 py-3 text-xs rounded-xl outline-none resize-none leading-snug transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${GLASS_BORDER}`, color: '#fff' }}
                onFocus={e => { e.currentTarget.style.borderColor = GOLD_DIM; }}
                onBlur={e => { e.currentTarget.style.borderColor = GLASS_BORDER; }}
                placeholder="Texto Impactante Grande"
              />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase mb-1.5" style={{ color: TEXT_FAINT }}>Subtítulo (pequeno)</p>
              <textarea
                value={s.content}
                onChange={e => update({ content: e.target.value })}
                onClick={e => e.stopPropagation()}
                rows={3}
                className="w-full px-4 py-3 text-xs rounded-xl outline-none resize-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${GLASS_BORDER}`, color: '#fff' }}
                onFocus={e => { e.currentTarget.style.borderColor = GOLD_DIM; }}
                onBlur={e => { e.currentTarget.style.borderColor = GLASS_BORDER; }}
                placeholder="Contexto ou rótulo pequeno"
              />
            </div>
            <div>
              <div className="flex justify-between text-[8px] font-black uppercase mb-2" style={{ color: TEXT_FAINT }}>
                <span>Posição vertical do texto</span>
                <span style={{ color: GOLD }}>{s.textPosY ?? 85}px</span>
              </div>
              <input type="range" min="0" max="250" step="5"
                value={s.textPosY ?? 85}
                onChange={e => update({ textPosY: parseInt(e.target.value) })}
                onClick={e => e.stopPropagation()}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: GOLD, background: 'rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          {/* ── Layout ── */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: TEXT_FAINT }}>Layout</p>
            <div className="flex p-1 gap-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[
                { key: 'background', icon: <ImageIcon size={15} />, label: 'BG' },
                { key: 'storytelling', icon: <PanelsTopLeft size={15} />, label: 'Story' },
                { key: 'social-post', icon: <MessageSquareText size={15} />, label: 'Social' },
              ].map(({ key, icon, label: lbl }) => (
                <button key={key}
                  onClick={e => { e.stopPropagation(); update({ layoutType: key as Section['layoutType'] }); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all"
                  style={{
                    background: s.layoutType === key ? GOLD : 'transparent',
                    color: s.layoutType === key ? '#000' : TEXT_DIM,
                  }}
                >
                  {icon} {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* ── Cores ── */}
          <div className="p-4 rounded-2xl space-y-4" style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}` }}>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD_DIM }}>Cores</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Fundo', key: 'bgColor', def: '#000000' },
                { label: 'Branding', key: 'brandingColor', def: '#ffffff' },
                { label: 'Título', key: 'titleColor', def: '#ffffff' },
                { label: 'Corpo', key: 'bodyColor', def: '#ffffff' },
              ].map(({ label: lbl, key, def }) => (
                <div key={key}>
                  <p className="text-[7px] font-black uppercase mb-1.5" style={{ color: TEXT_FAINT }}>{lbl}</p>
                  <div className="flex items-center gap-2.5">
                    <input type="color"
                      value={(s as any)[key] || def}
                      onChange={e => update({ [key]: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      className="w-9 h-9 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                      style={{ outline: `2px solid rgba(255,255,255,0.08)` }}
                    />
                    <span className="text-[8px] font-mono" style={{ color: TEXT_FAINT }}>{(s as any)[key] || def}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Alinhamento ── */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: TEXT_FAINT }}>Alinhamento</p>
            <div className="flex p-1 gap-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['left', 'center', 'right'] as const).map(align => (
                <button key={align}
                  onClick={e => { e.stopPropagation(); update({ alignment: align }); }}
                  className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all"
                  style={{
                    background: s.alignment === align ? GOLD : 'transparent',
                    color: s.alignment === align ? '#000' : TEXT_DIM,
                  }}
                >
                  {align === 'left' ? 'Esq' : align === 'center' ? 'Centro' : 'Dir'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Estúdio de imagem ── */}
          <div className="p-4 rounded-2xl space-y-4"
            style={{ background: 'rgba(245,166,35,0.04)', border: `1px solid rgba(245,166,35,0.1)` }}>
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: GOLD_DIM }}>
              <Move size={11} /> Estúdio de Imagem
            </p>

            {s.layoutType === 'social-post' && (
              <button
                onClick={e => { e.stopPropagation(); update({ showSocialImage: !(s.showSocialImage !== false) }); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                style={{
                  background: s.showSocialImage !== false ? GOLD_BG : GLASS,
                  border: `1px solid ${s.showSocialImage !== false ? 'rgba(245,166,35,0.25)' : GLASS_BORDER}`,
                  color: s.showSocialImage !== false ? GOLD : TEXT_DIM,
                }}
              >
                {s.showSocialImage !== false ? <LucideImage size={13} /> : <EyeOff size={13} />}
                {s.showSocialImage !== false ? 'Remover Imagem' : 'Adicionar Imagem'}
              </button>
            )}

            {[
              { label: 'Foco X', key: 'imagePosX', min: 0, max: 100, step: 1, unit: '%', def: 50 },
              { label: 'Foco Y', key: 'imagePosY', min: 0, max: 100, step: 1, unit: '%', def: 50 },
            ].map(({ label: lbl, key, min, max, step, unit, def }) => (
              <div key={key}>
                <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: TEXT_FAINT }}>
                  <span>{lbl}</span>
                  <span style={{ color: GOLD }}>{(s as any)[key] ?? def}{unit}</span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={(s as any)[key] ?? def}
                  onChange={e => update({ [key]: parseFloat(e.target.value) })}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: GOLD, background: 'rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Zoom', key: 'imageScale', min: 1, max: 4, step: 0.1, unit: 'x', def: 1, pct: false },
                { label: 'Contraste', key: 'overlayOpacity', min: 0, max: 0.95, step: 0.05, unit: '', def: 0.4, pct: true },
              ].map(({ label: lbl, key, min, max, step, unit, def, pct }) => (
                <div key={key}>
                  <div className="flex justify-between text-[8px] font-black uppercase mb-1.5" style={{ color: TEXT_FAINT }}>
                    <span>{lbl}</span>
                    <span style={{ color: GOLD }}>
                      {pct ? `${Math.round(((s as any)[key] ?? def) * 100)}%` : `${(s as any)[key] ?? def}${unit}`}
                    </span>
                  </div>
                  <input type="range" min={min} max={max} step={step}
                    value={(s as any)[key] ?? def}
                    onChange={e => update({ [key]: parseFloat(e.target.value) })}
                    onClick={e => e.stopPropagation()}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: GOLD, background: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all"
                style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: TEXT_DIM }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD_DIM; (e.currentTarget as HTMLElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = GLASS_BORDER; (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
              >
                <UploadCloud size={14} /> Upload Foto / Vídeo
                <input type="file" className="hidden" accept="image/*,video/*"
                  onChange={e => handleFileUpload(s.id, e)} />
              </label>
              <button
                disabled={generating}
                onClick={e => { e.stopPropagation(); generate(s.id, s.imagePrompt || s.title, s.content); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                style={{
                  background: generating ? 'rgba(245,166,35,0.15)' : 'linear-gradient(135deg, #F5A623, #e08e00)',
                  color: generating ? GOLD_DIM : '#000',
                  boxShadow: generating ? 'none' : '0 4px 20px rgba(245,166,35,0.25)',
                }}
              >
                {generating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                {generating ? 'Gerando IA...' : 'Gerar com IA'}
              </button>
            </div>
          </div>

          {/* ── Tipografia ── */}
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD_DIM }}>Tipografia</p>

            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <p className="text-[8px] font-black uppercase mb-2" style={{ color: TEXT_FAINT }}>Fonte Título</p>
                <select value={s.titleFont || 'anton'}
                  onChange={e => update({ titleFont: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="w-full text-[10px] font-bold px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: '#fff' }}
                >
                  {FONT_OPTIONS.map(f => <option key={f.id} value={f.id} style={{ background: '#111' }}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}` }}>
                <button onClick={e => { e.stopPropagation(); update({ titleSize: Math.max(10, (s.titleSize || 30) - 2) }); }}
                  className="p-1.5 rounded-lg transition-all" style={{ color: TEXT_DIM }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
                ><Minus size={12} /></button>
                <span className="text-[11px] font-black w-8 text-center" style={{ color: '#fff' }}>{s.titleSize || 30}</span>
                <button onClick={e => { e.stopPropagation(); update({ titleSize: Math.min(120, (s.titleSize || 30) + 2) }); }}
                  className="p-1.5 rounded-lg transition-all" style={{ color: TEXT_DIM }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
                ><Plus size={12} /></button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <p className="text-[8px] font-black uppercase mb-2" style={{ color: TEXT_FAINT }}>Fonte Subtítulo</p>
                <select value={s.bodyFont || 'sans'}
                  onChange={e => update({ bodyFont: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="w-full text-[10px] font-bold px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: '#fff' }}
                >
                  {FONT_OPTIONS.map(f => <option key={f.id} value={f.id} style={{ background: '#111' }}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}` }}>
                <button onClick={e => { e.stopPropagation(); update({ bodySize: Math.max(10, (s.bodySize || 20) - 1) }); }}
                  className="p-1.5 rounded-lg transition-all" style={{ color: TEXT_DIM }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
                ><Minus size={12} /></button>
                <span className="text-[11px] font-black w-8 text-center" style={{ color: '#fff' }}>{s.bodySize || 20}</span>
                <button onClick={e => { e.stopPropagation(); update({ bodySize: Math.min(60, (s.bodySize || 20) + 1) }); }}
                  className="p-1.5 rounded-lg transition-all" style={{ color: TEXT_DIM }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
                ><Plus size={12} /></button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
