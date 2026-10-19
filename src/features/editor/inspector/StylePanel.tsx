import { useState } from 'react';
import { MessageSquareText, PanelsTopLeft, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../../store';
import { STARTER_TEMPLATES } from '../../../constants/starterTemplates';
import { buildTemplateSections, pickSlideStyle } from '../../../lib/sections';
import { DEFAULT_POST_META, type PostMeta, type Section, type StylePreset } from '../../../types/carousel.types';
import { X_THEMES, xThemeStyle } from '../../../lib/xPost';
import { Button, Field, Input, Segmented, cx } from '../../../ui';
import { ColorField, Group, useActiveSection } from '../shared';

type Palette = { name: string; bg: string; title: string; body: string; brand: string };

const FEED_PALETTES: Palette[] = [
  { name: 'Meia-noite', bg: '#000000', title: '#ffffff', body: '#aaaaaa', brand: '#ffffff' },
  { name: 'Dourado', bg: '#000000', title: '#F5A623', body: '#c8860f', brand: '#F5A623' },
  { name: 'Cinza', bg: '#000000', title: '#cccccc', body: '#888888', brand: '#cccccc' },
  { name: 'Bege', bg: '#000000', title: '#e8d5b0', body: '#b5936a', brand: '#e8d5b0' },
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
  const setSections = useStore(st => st.setSections);
  const setActiveSlide = useStore(st => st.setActiveSlide);
  const config = useStore(st => st.config);
  const updateConfig = useStore(st => st.updateConfig);
  const userEmail = useStore(st => st.userEmail);
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
  const meta = { ...DEFAULT_POST_META, ...config.postMeta };
  const setMeta = (patch: Partial<PostMeta>) => updateConfig({ postMeta: { ...meta, ...patch } });

  const setLayout = (layoutType: Section['layoutType']) => {
    if (layoutType === s.layoutType) return;
    update(layoutType === 'social-post'
      ? { layoutType, ...xThemeStyle(X_THEMES[0]), alignment: 'left' }
      : { layoutType, bgColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', brandingColor: '#ffffff' });
  };

  /** Tema do X vale para todos os posts do carrossel, como no app. */
  const applyXTheme = (t: typeof X_THEMES[number]) => {
    sections.forEach(sec => { if (sec.layoutType === 'social-post') updateSection(sec.id, xThemeStyle(t)); });
    toast.success(`Tema ${t.name} aplicado aos posts`);
  };

  /** Liga/desliga uma parte do rodapé em todos os posts. */
  const toggleAll = (key: 'postShowMeta' | 'postShowStats', on: boolean) => {
    sections.forEach(sec => { if (sec.layoutType === 'social-post') updateSection(sec.id, { [key]: on }); });
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

  const applyStarter = (id: string) => {
    const t = STARTER_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    if (!confirm(`Aplicar o modelo “${t.name}”? Os slides atuais serão substituídos.`)) return;
    setSections(buildTemplateSections(t, userEmail));
    setActiveSlide(0);
    toast.success(`Modelo “${t.name}” aplicado`);
  };

  const nameInput = naming && (
    <div className="flex gap-2">
      <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome do estilo"
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

      <Group title={isSocial ? 'Tema do X' : 'Cores'}>
        <div className="grid grid-cols-4 gap-2.5">
          {isSocial
            ? X_THEMES.map(t => (
              <PaletteChip key={t.name} label={t.name} bg={t.bg} title={t.text} body={t.secondary} onClick={() => applyXTheme(t)} />
            ))
            : FEED_PALETTES.map(p => (
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
      </Group>

      {isSocial && (
        <Group title="Post no slide">
          <Segmented<'top' | 'center'>
            label="Posição"
            value={s.postVAlign ?? 'top'}
            onChange={postVAlign => update({ postVAlign })}
            options={[
              { value: 'top', label: 'No topo' },
              { value: 'center', label: 'Centralizado' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-3 text-subhead cursor-pointer">
              Hora, data e visualizações
              <input type="checkbox" className="w-4 h-4 accent-current" checked={!!s.postShowMeta} onChange={e => toggleAll('postShowMeta', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-3 text-subhead cursor-pointer">
              Respostas, reposts e curtidas
              <input type="checkbox" className="w-4 h-4 accent-current" checked={!!s.postShowStats} onChange={e => toggleAll('postShowStats', e.target.checked)} />
            </label>
          </div>
          {(s.postShowMeta || s.postShowStats) && (
            <div className="grid grid-cols-3 gap-2">
              {s.postShowMeta && <>
                <Field label="Hora">{id => <Input id={id} value={meta.time} onChange={e => setMeta({ time: e.target.value })} />}</Field>
                <Field label="Data">{id => <Input id={id} value={meta.date} onChange={e => setMeta({ date: e.target.value })} />}</Field>
                <Field label="Visualiz.">{id => <Input id={id} value={meta.views} onChange={e => setMeta({ views: e.target.value })} />}</Field>
              </>}
              {s.postShowStats && <>
                <Field label="Respostas">{id => <Input id={id} value={meta.replies} onChange={e => setMeta({ replies: e.target.value })} />}</Field>
                <Field label="Reposts">{id => <Input id={id} value={meta.reposts} onChange={e => setMeta({ reposts: e.target.value })} />}</Field>
                <Field label="Curtidas">{id => <Input id={id} value={meta.likes} onChange={e => setMeta({ likes: e.target.value })} />}</Field>
                <Field label="Salvos">{id => <Input id={id} value={meta.bookmarks} onChange={e => setMeta({ bookmarks: e.target.value })} />}</Field>
              </>}
            </div>
          )}
        </Group>
      )}

      {sections.length > 1 && (
        <Button onClick={applyToAll}>Aplicar estilo a todos os slides</Button>
      )}

      <Group
        title="Meus estilos"
        action={!naming && (
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => { setName(''); setNaming('preset'); }}>Salvar</Button>
        )}
      >
        {naming === 'preset' && nameInput}
        {presets.length > 0 ? (
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
        ) : naming !== 'preset' && (
          <p className="text-footnote text-faint">Salve a combinação deste slide para reusar depois.</p>
        )}
      </Group>

      <Group
        title="Estilos de carrossel"
        action={!naming && (
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => { setName(''); setNaming('carousel'); }}>Salvar</Button>
        )}
      >
        {naming === 'carousel' && nameInput}
        {carouselTemplates.length > 0 ? (
          <ul className="flex flex-col">
            {carouselTemplates.map(t => (
              <li key={t.id} className="flex items-center gap-2 py-1.5">
                <button type="button" onClick={() => { applyCarouselTemplate(t.id); toast.success(`“${t.name}” aplicado`); }}
                  className="flex-1 flex items-center gap-2.5 min-w-0 h-9 px-2 -mx-2 rounded-ui-sm hover:bg-fg/[0.06] text-left">
                  <span className="w-6 h-6 rounded-full flex-shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]" style={{ background: t.capaStyle.bgColor }} />
                  <span className="text-subhead truncate">{t.name}</span>
                </button>
                <button type="button" onClick={() => deleteCarouselTemplate(t.id)} aria-label={`Apagar ${t.name}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-danger hover:bg-danger/10">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : naming !== 'carousel' && (
          <p className="text-footnote text-faint">Guarda o estilo da capa e dos slides para aplicar em outro carrossel.</p>
        )}
      </Group>

      <Group title="Modelos prontos">
        <div className="grid grid-cols-2 gap-2">
          {STARTER_TEMPLATES.map(t => (
            <button key={t.id} type="button" onClick={() => applyStarter(t.id)}
              className={cx('text-left p-3 rounded-ui-md bg-fg/[0.06] hover:bg-fg/[0.1] transition-colors flex flex-col gap-0.5')}>
              <span className="text-footnote font-semibold truncate">{t.name}</span>
              <span className="text-caption text-faint">{t.slideCount} slides</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Marca">
        <Field label="Marca d'água" hint="Aparece discreta no rodapé de todos os slides.">
          {id => <Input id={id} value={config.watermark} onChange={e => updateConfig({ watermark: e.target.value })} placeholder="@seuperfil" />}
        </Field>
      </Group>
    </div>
  );
}
