import { useState } from 'react';
import { Layers, MessageSquareText, Palette as PaletteIcon, PanelsTopLeft, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../../store';
import { pickSlideStyle } from '../../../lib/sections';
import { openEditorDialog } from '../../../lib/editorEvents';
import type { Section, StylePreset } from '../../../types/carousel.types';
import { Button, Input, Segmented } from '../../../ui';
import { ColorField, Group, useActiveSection } from '../shared';

type Palette = { name: string; bg: string; title: string; body: string; brand: string };

const FEED_PALETTES: Palette[] = [
  { name: 'Meia-noite', bg: '#000000', title: '#ffffff', body: '#aaaaaa', brand: '#ffffff' },
  { name: 'Dourado', bg: '#000000', title: '#F5A623', body: '#c8860f', brand: '#F5A623' },
  { name: 'Cinza', bg: '#000000', title: '#cccccc', body: '#888888', brand: '#cccccc' },
  { name: 'Bege', bg: '#000000', title: '#e8d5b0', body: '#b5936a', brand: '#e8d5b0' },
];
const SOCIAL_PALETTES: Palette[] = [
  { name: 'Claro', bg: '#ffffff', title: '#0f1419', body: '#536471', brand: '#0f1419' },
  { name: 'Noite', bg: '#15202b', title: '#ffffff', body: '#8b98a5', brand: '#ffffff' },
  { name: 'Creme', bg: '#faf7f2', title: '#1a1a1a', body: '#555555', brand: '#1a1a1a' },
  { name: 'Roxo', bg: '#f0e6ff', title: '#2d1b69', body: '#6b46c1', brand: '#2d1b69' },
];

/** Amostra de cores: fundo à esquerda, título e texto à direita. */
function PaletteChip({ bg, title, body, label, onClick, onRemove }: {
  bg: string; title: string; body: string; label: string; onClick: () => void; onRemove?: () => void;
}) {
  return (
    <div className="relative group">
      <button type="button" onClick={onClick} className="w-full flex flex-col items-center gap-1.5 transition-transform duration-200 active:scale-95" title={label}>
        <span className="w-full h-9 rounded-ui-sm overflow-hidden flex shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]">
          <span style={{ background: bg, flex: 3 }} />
          <span className="flex flex-col" style={{ flex: 2 }}>
            <span style={{ background: title, flex: 1 }} />
            <span style={{ background: body, flex: 1 }} />
          </span>
        </span>
        <span className="text-caption text-muted truncate w-full text-center">{label}</span>
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Apagar ${label}`}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
          <X size={11} />
        </button>
      )}
    </div>
  );
}

export function StylePanel() {
  const { section: s, sections, update } = useActiveSection();
  const updateSection = useStore(st => st.updateSection);
  const presets = useStore(st => st.presets);
  const savePreset = useStore(st => st.savePreset);
  const deletePreset = useStore(st => st.deletePreset);
  const carouselTemplates = useStore(st => st.carouselTemplates);
  const saveCarouselTemplate = useStore(st => st.saveCarouselTemplate);
  const applyCarouselTemplate = useStore(st => st.applyCarouselTemplate);
  const deleteCarouselTemplate = useStore(st => st.deleteCarouselTemplate);
  const [naming, setNaming] = useState<null | 'preset' | 'carousel'>(null);
  const [name, setName] = useState('');
  if (!s) return null;

  const isSocial = s.layoutType === 'social-post';
  const palettes = isSocial ? SOCIAL_PALETTES : FEED_PALETTES;

  const setLayout = (layoutType: Section['layoutType']) => {
    if (layoutType === s.layoutType) return;
    update(layoutType === 'social-post'
      ? { layoutType, bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#536471', brandingColor: '#0f1419', alignment: 'left' }
      : { layoutType, bgColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', brandingColor: '#ffffff' });
  };

  const applyToAll = () => {
    const style = pickSlideStyle(s);
    sections.forEach(sec => { if (sec.id !== s.id) updateSection(sec.id, style); });
    toast.success('Estilo aplicado a todos os slides');
  };

  const confirmName = () => {
    const n = name.trim();
    if (!n) { setNaming(null); return; }
    if (naming === 'preset') {
      const preset: StylePreset = {
        id: Date.now().toString(), name: n, layoutType: s.layoutType, titleFont: s.titleFont, bodyFont: s.bodyFont,
        titleSize: s.titleSize, bodySize: s.bodySize, bgColor: s.bgColor, titleColor: s.titleColor, bodyColor: s.bodyColor,
        brandingColor: s.brandingColor, alignment: s.alignment, overlayOpacity: s.overlayOpacity, textPosY: s.textPosY, imageScale: s.imageScale,
      };
      savePreset(preset);
    } else if (naming === 'carousel') {
      saveCarouselTemplate(n);
    }
    toast.success(`“${n}” salvo`);
    setNaming(null);
  };

  const nameInput = naming && (
    <div className="flex gap-2">
      <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={naming === 'carousel' ? 'Nome do estilo do carrossel' : 'Nome do estilo do slide'}
        aria-label="Nome do estilo"
        onKeyDown={e => { if (e.key === 'Enter') confirmName(); if (e.key === 'Escape') setNaming(null); }} />
      <Button variant="primary" onClick={confirmName}>Salvar</Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Group title="Layout">
        <Segmented<Section['layoutType']>
          label="Layout do slide"
          value={s.layoutType === 'social-post' ? 'social-post' : 'storytelling'}
          onChange={setLayout}
          options={[
            { value: 'storytelling', label: <><PanelsTopLeft size={15} />Feed</> },
            { value: 'social-post', label: <><MessageSquareText size={15} />Post (X)</> },
          ]}
        />
      </Group>

      <Group title="Cores">
        <div className="grid grid-cols-4 gap-2.5">
          {palettes.map(p => (
            <PaletteChip key={p.name} label={p.name} bg={p.bg} title={p.title} body={p.body}
              onClick={() => update({ bgColor: p.bg, titleColor: p.title, bodyColor: p.body, brandingColor: p.brand })} />
          ))}
        </div>
        <div className="flex justify-between px-1 pt-1">
          <ColorField label="Fundo" value={s.bgColor || (isSocial ? '#ffffff' : '#000000')} onChange={v => update({ bgColor: v })} />
          <ColorField label="Título" value={s.titleColor || '#ffffff'} onChange={v => update({ titleColor: v })} />
          <ColorField label="Texto" value={s.bodyColor || '#ffffff'} onChange={v => update({ bodyColor: v })} />
          <ColorField label="Marca" value={s.brandingColor || '#ffffff'} onChange={v => update({ brandingColor: v })} />
        </div>

        <div className="flex gap-4 px-1">
          <button type="button" onClick={() => openEditorDialog('assets')} className="inline-flex items-center gap-1.5 text-footnote font-medium text-muted hover:text-fg">
            <Layers size={14} aria-hidden="true" />Mais paletas
          </button>
          <button type="button" onClick={() => openEditorDialog('themes')} className="inline-flex items-center gap-1.5 text-footnote font-medium text-muted hover:text-fg">
            <PaletteIcon size={14} aria-hidden="true" />Meus temas
          </button>
        </div>
      </Group>

      {sections.length > 1 && (
        <Button onClick={applyToAll}>Aplicar estilo a todos os slides</Button>
      )}

      <Group title="Estilos salvos">
        {naming ? nameInput : (
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon={<Plus size={14} />} onClick={() => { setName(''); setNaming('preset'); }}>Deste slide</Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => { setName(''); setNaming('carousel'); }}>Do carrossel</Button>
          </div>
        )}
        {presets.length > 0 && (
          <div className="grid grid-cols-4 gap-2.5">
            {presets.map(p => (
              <PaletteChip key={p.id} label={p.name} bg={p.bgColor} title={p.titleColor} body={p.bodyColor}
                onRemove={() => deletePreset(p.id)}
                onClick={() => update({
                  layoutType: p.layoutType, titleFont: p.titleFont, bodyFont: p.bodyFont, titleSize: p.titleSize, bodySize: p.bodySize,
                  bgColor: p.bgColor, titleColor: p.titleColor, bodyColor: p.bodyColor, brandingColor: p.brandingColor,
                  alignment: p.alignment, overlayOpacity: p.overlayOpacity, textPosY: p.textPosY, imageScale: p.imageScale,
                })} />
            ))}
          </div>
        )}
        {carouselTemplates.length > 0 && (
          <ul className="flex flex-col">
            {carouselTemplates.map(t => (
              <li key={t.id} className="flex items-center gap-2 py-1">
                <button type="button" onClick={() => { applyCarouselTemplate(t.id); toast.success(`“${t.name}” aplicado`); }}
                  className="flex-1 flex items-center gap-2.5 min-w-0 h-9 px-2 -mx-2 rounded-ui-sm hover:bg-fg/[0.06] text-left">
                  <span className="w-6 h-6 rounded-full flex-shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]" style={{ background: t.capaStyle.bgColor }} />
                  <span className="text-subhead truncate">{t.name}</span>
                  <span className="ml-auto text-caption text-faint">carrossel</span>
                </button>
                <button type="button" onClick={() => deleteCarouselTemplate(t.id)} aria-label={`Apagar ${t.name}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-danger hover:bg-danger/10">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {!naming && presets.length === 0 && carouselTemplates.length === 0 && (
          <p className="text-footnote text-faint">Guarde as cores e fontes deste slide, ou a capa e os slides do carrossel, para reusar depois.</p>
        )}
      </Group>
    </div>
  );
}
