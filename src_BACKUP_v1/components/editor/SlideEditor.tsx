import React from 'react';
import {
  Type as TypeIcon,
  Trash2,
  ImageIcon,
  PanelsTopLeft,
  MessageSquareText,
  Minus, Plus,
  UploadCloud,
  Sparkles,
  Loader2,
  Move,
  EyeOff,
  Image as LucideImage,
  Palette as PaletteIcon,
  TextAlignStart,
  TextAlignCenter,
  TextAlignEnd
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

export const SlideEditor: React.FC<SlideEditorProps> = ({ section, index, isActive, onClick }) => {
  const sections = useStore(state => state.sections);
  const updateSection = useStore(state => state.updateSection);
  const deleteSection = useStore(state => state.deleteSection);
  const { generate, isGenerating } = useImageGeneration();
  const { handleFileUpload } = useFileUpload();

  const s = section;
  const generating = isGenerating(s.id);

  const update = (updates: Partial<Section>) => updateSection(s.id, updates);

  return (
    <div
      className={`p-6 rounded-[2.5rem] border-2 transition-all relative ${isActive ? 'border-black bg-white shadow-2xl scale-[1.02] z-10' : 'border-slate-200 bg-white/50 opacity-40 grayscale hover:opacity-100'}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-white bg-black px-4 py-1.5 rounded-full uppercase tracking-widest">
          {index === 0 ? 'CAPA' : index === sections.length - 1 ? 'FINAL' : `SLIDE ${index + 1}`}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Text Content */}
        <div className="space-y-4 bg-white p-4 rounded-3xl border border-slate-100">
          <label className="text-[10px] font-black uppercase text-black flex items-center gap-2 mb-1">
            <TypeIcon size={14} /> Narrativa & Texto
          </label>
          <div>
            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Título Principal (Grande)</label>
            <textarea
              value={s.title}
              onChange={e => update({ title: e.target.value })}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-black outline-none focus:ring-2 focus:ring-black h-24 resize-none leading-snug shadow-sm"
              placeholder="Texto Impactante Grande"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Subtítulo / Rótulo (Pequeno)</label>
            <textarea
              value={s.content}
              onChange={e => update({ content: e.target.value })}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-[11px] text-black outline-none focus:ring-2 focus:ring-black h-28 resize-none shadow-sm"
              placeholder="Contexto ou Rótulo Pequeno"
            />
          </div>

          {/* Text Position Slider */}
          <div className="pt-2 border-t border-slate-50">
            <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-1.5">
              <span>Ajuste Vertical do Texto</span>
              <span className="text-indigo-600">{(s.textPosY ?? 85)}px</span>
            </div>
            <input
              type="range" min="0" max="250" step="5"
              value={s.textPosY ?? 85}
              onChange={e => update({ textPosY: parseInt(e.target.value) })}
              onClick={e => e.stopPropagation()}
              className="w-full h-1.5 bg-slate-100 rounded-lg accent-black appearance-none cursor-ns-resize"
            />
            <div className="flex justify-between text-[7px] text-slate-300 uppercase mt-1">
              <span>Topo</span><span>Base</span>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Layout de Exibição</label>
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
            <button title="Background" onClick={(e) => { e.stopPropagation(); update({ layoutType: 'background' }); }}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.layoutType === 'background' ? 'bg-white shadow-md text-black' : 'text-slate-400 hover:text-slate-600'}`}>
              <ImageIcon size={16} />
            </button>
            <button title="Storytelling" onClick={(e) => { e.stopPropagation(); update({ layoutType: 'storytelling' }); }}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.layoutType === 'storytelling' ? 'bg-white shadow-md text-black' : 'text-slate-400 hover:text-slate-600'}`}>
              <PanelsTopLeft size={16} />
            </button>
            <button title="Social Post" onClick={(e) => { e.stopPropagation(); update({ layoutType: 'social-post' }); }}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.layoutType === 'social-post' ? 'bg-white shadow-md text-black' : 'text-slate-400 hover:text-slate-600'}`}>
              <MessageSquareText size={16} />
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
          <label className="text-[10px] font-black uppercase text-black flex items-center gap-2 mb-1">
            <PaletteIcon size={14} /> Paleta de Cores
          </label>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Cor de Fundo', key: 'bgColor', default: '#000000' },
              { label: 'Nome no Perfil', key: 'brandingColor', default: '#ffffff' },
              { label: 'Títulos', key: 'titleColor', default: '#ffffff' },
              { label: 'Texto de Apoio', key: 'bodyColor', default: '#ffffff' },
            ].map(({ label, key, default: def }) => (
              <div key={key}>
                <label className="text-[8px] font-black uppercase text-slate-400 mb-1.5 block">{label}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(s as any)[key] || def}
                    onChange={e => update({ [key]: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    className="w-10 h-10 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{(s as any)[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Alinhamento Texto</label>
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
            <button onClick={() => update({ alignment: 'left' })} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.alignment === 'left' ? 'bg-white shadow-md text-black' : 'text-slate-400'}`}><TextAlignStart size={16} /></button>
            <button onClick={() => update({ alignment: 'center' })} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.alignment === 'center' ? 'bg-white shadow-md text-black' : 'text-slate-400'}`}><TextAlignCenter size={16} /></button>
            <button onClick={() => update({ alignment: 'right' })} className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${s.alignment === 'right' ? 'bg-white shadow-md text-black' : 'text-slate-400'}`}><TextAlignEnd size={16} /></button>
          </div>
        </div>

        {/* Image Studio */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <label className="text-[10px] font-black uppercase text-white mb-4 flex items-center gap-2">
            <Move size={14} className="text-indigo-400" /> Estúdio de Imagem
          </label>
          <div className="space-y-5">
            {s.layoutType === 'social-post' && (
              <button
                onClick={() => update({ showSocialImage: !(s.showSocialImage !== false) })}
                className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black transition-all border ${s.showSocialImage !== false ? 'bg-white/20 text-white border-white/20' : 'bg-white/5 text-slate-500 border-white/5'}`}
              >
                {s.showSocialImage !== false ? <LucideImage size={16} /> : <EyeOff size={16} />}
                {s.showSocialImage !== false ? 'REMOVER IMAGEM DO POST' : 'ADICIONAR IMAGEM AO POST'}
              </button>
            )}

            {/* Sliders */}
            {[
              { label: 'Foco Horizontal (X)', key: 'imagePosX', min: 0, max: 100, step: 1, unit: '%', default: 50 },
              { label: 'Foco Vertical (Y)', key: 'imagePosY', min: 0, max: 100, step: 1, unit: '%', default: 50 },
            ].map(({ label, key, min, max, step, unit, default: def }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-0.5">
                  <span>{label}</span>
                  <span className="text-indigo-400">{(s as any)[key] ?? def}{unit}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={(s as any)[key] ?? def}
                  onChange={e => update({ [key]: parseFloat(e.target.value) })}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-white appearance-none"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-5 pt-1">
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-1.5">
                  <span>Zoom</span><span className="text-indigo-400">{s.imageScale ?? 1}x</span>
                </div>
                <input type="range" min="1" max="4" step="0.1" value={s.imageScale ?? 1}
                  onChange={e => update({ imageScale: parseFloat(e.target.value) })}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-1 bg-slate-800 rounded-lg accent-white appearance-none" />
              </div>
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-1.5">
                  <span>Contraste</span><span className="text-indigo-400">{Math.round((s.overlayOpacity ?? 0.4) * 100)}%</span>
                </div>
                <input type="range" min="0" max="0.95" step="0.05" value={s.overlayOpacity ?? 0.4}
                  onChange={e => update({ overlayOpacity: parseFloat(e.target.value) })}
                  onClick={e => e.stopPropagation()}
                  className="w-full h-1 bg-slate-800 rounded-lg accent-white appearance-none" />
              </div>
            </div>

            {/* Upload / Generate */}
            <div className="grid grid-cols-1 gap-2 mt-2">
              <label className="w-full flex items-center justify-center gap-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all border border-white/5 active:scale-95">
                <UploadCloud size={16} className="text-indigo-400" /> TROCAR MÍDIA (FOTO/VÍDEO)
                <input type="file" className="hidden" accept="image/*,video/*" onChange={e => handleFileUpload(s.id, e)} />
              </label>
              <button
                disabled={generating}
                onClick={(e) => { e.stopPropagation(); generate(s.id, s.imagePrompt || s.title, s.content); }}
                className="w-full flex items-center justify-center gap-3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all border border-indigo-400/20 active:scale-95 shadow-lg overflow-hidden relative"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {generating ? 'GERANDO IA...' : 'GERAR IMAGEM IA'}
              </button>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase text-black flex items-center gap-2">
            <TypeIcon size={14} /> Estilos Tipográficos
          </label>
          <div className="space-y-4">
            {/* Title Font */}
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Fonte Título Principal</label>
              <select
                value={s.titleFont || 'anton'}
                onChange={e => update({ titleFont: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="w-full text-[10px] font-bold p-3 border border-slate-200 rounded-xl bg-white text-black focus:ring-2 focus:ring-black outline-none shadow-sm"
              >
                {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Tamanho Título</label>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl shadow-inner h-[46px] border border-slate-200">
                <button onClick={() => update({ titleSize: Math.max(10, (s.titleSize || 30) - 2) })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50"><Minus size={12} /></button>
                <span className="flex-1 text-center text-[11px] font-black text-black tabular-nums">{s.titleSize || 30}</span>
                <button onClick={() => update({ titleSize: Math.min(120, (s.titleSize || 30) + 2) })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50"><Plus size={12} /></button>
              </div>
            </div>

            {/* Body Font */}
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Fonte Subtítulo</label>
              <select
                value={s.bodyFont || 'sans'}
                onChange={e => update({ bodyFont: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="w-full text-[10px] font-bold p-3 border border-slate-200 rounded-xl bg-white text-black focus:ring-2 focus:ring-black outline-none shadow-sm"
              >
                {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Tamanho Subtítulo</label>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl shadow-inner h-[46px] border border-slate-200">
                <button onClick={() => update({ bodySize: Math.max(10, (s.bodySize || 20) - 1) })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50"><Minus size={12} /></button>
                <span className="flex-1 text-center text-[11px] font-black text-black tabular-nums">{s.bodySize || 20}</span>
                <button onClick={() => update({ bodySize: Math.min(60, (s.bodySize || 20) + 1) })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50"><Plus size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
