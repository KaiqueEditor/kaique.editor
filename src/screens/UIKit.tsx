import { useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ChevronLeft, ChevronRight, Download, Eye, Image, Palette, Plus, Redo2, Type, Undo2,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Button, IconButton, Field, Input, Textarea, Select, Slider, Tabs, Segmented,
  Panel, SectionLabel, Swatch, StatusDot,
} from '../ui';

const GRAYS: Array<[string, string]> = [
  ['bg', 'bg-bg'], ['canvas', 'bg-canvas'], ['surface', 'bg-surface'], ['surface-2', 'bg-surface-2'],
  ['line-strong', 'bg-line-strong'], ['faint', 'bg-faint'], ['muted', 'bg-muted'], ['fg-2', 'bg-fg-2'], ['fg', 'bg-fg'],
];
const TYPE_SCALE: Array<[string, string]> = [
  ['text-large font-bold', 'Large Title · 34'], ['text-title1 font-bold', 'Title 1 · 28'],
  ['text-title2 font-bold', 'Title 2 · 22'], ['text-title3 font-semibold', 'Title 3 · 20'],
  ['text-body', 'Body · 17'], ['text-subhead', 'Subhead · 15'], ['text-footnote', 'Footnote · 13'], ['text-caption', 'Caption · 12'],
];

/** Catálogo dos componentes base. Abre em localhost:3000/?kit (só em dev). */
export function UIKit() {
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const [tab, setTab] = useState<'texto' | 'imagem' | 'estilo'>('texto');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [ratio, setRatio] = useState<'4:5' | '3:4' | '1:1'>('4:5');
  const [pos, setPos] = useState(70);
  const [color, setColor] = useState('#FFFFFF');

  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <header className="glass sticky top-0 z-20 h-14 flex items-center justify-between px-4 gap-4 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-subhead font-semibold tracking-tight">Carrossel<span className="text-accent-text">.</span>Pro</span>
          <span className="w-px h-5 bg-line-strong" aria-hidden="true" />
          <span className="text-subhead text-fg-2 truncate">Componentes base</span>
          <StatusDot>Salvo</StatusDot>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton label="Desfazer"><Undo2 size={17} /></IconButton>
          <IconButton label="Refazer" disabled><Redo2 size={17} /></IconButton>
          <Button icon={<Eye size={16} />}>Visualizar</Button>
          <Button variant="primary" icon={<Download size={16} />}>Exportar</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex flex-col gap-2">
            <p className="text-footnote font-semibold text-accent-text">Fase 1 · Fundação</p>
            <h1 className="text-large font-bold">Limpo, leve e translúcido.</h1>
            <p className="text-body text-muted max-w-xl">Cinzas em escala, um violeta de ação, a fonte do sistema e painéis de vidro sobre o seu conteúdo.</p>
          </div>
          <Button onClick={toggleTheme}>Tema {theme === 'dark' ? 'escuro' : 'claro'}</Button>
        </div>

        {/* Vidro sobre conteúdo: é aqui que o material aparece de verdade */}
        <section aria-label="Material de vidro" className="relative h-[420px] rounded-ui-xl overflow-hidden bg-canvas flex items-center justify-center">
          <div className="relative w-[300px] h-[375px] rounded-[6px] overflow-hidden bg-[#121214] shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(135deg,#1d4ed8,#0ea5e9_45%,#f97316)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center gap-2 text-center">
              <p className="font-['Archivo_Black',_'Anton',_sans-serif] text-[22px] leading-[1.05] uppercase text-white">A dona do ChatGPT acabou de cortar o preço em 80%</p>
              <p className="text-[9px] tracking-[0.25em] text-white/60 font-semibold">ARRASTA PRO LADO ›››</p>
            </div>
          </div>
          <div className="glass absolute top-5 left-1/2 -translate-x-1/2 rounded-pill p-1 flex items-center gap-1">
            <Segmented label="Formato" value={ratio} onChange={setRatio} className="bg-transparent"
              options={[{ value: '4:5', label: '4:5' }, { value: '3:4', label: '3:4' }, { value: '1:1', label: '1:1' }]} />
            <span className="w-px h-5 bg-line-strong mx-1" aria-hidden="true" />
            <span className="px-2 text-footnote tabular-nums text-muted">58%</span>
          </div>
          <div className="glass absolute bottom-5 left-1/2 -translate-x-1/2 rounded-pill p-1 flex items-center gap-1">
            <IconButton label="Slide anterior"><ChevronLeft size={18} /></IconButton>
            <span className="px-2 text-footnote tabular-nums">1 de 9</span>
            <IconButton label="Próximo slide"><ChevronRight size={18} /></IconButton>
          </div>
          <Panel glass className="absolute right-5 top-5 bottom-5 w-[288px] p-3 flex flex-col gap-4">
            <Tabs label="Painel do slide" value={tab} onChange={setTab}
              options={[
                { value: 'texto', label: <span className="inline-flex items-center gap-1.5"><Type size={13} />Texto</span> },
                { value: 'imagem', label: <span className="inline-flex items-center gap-1.5"><Image size={13} />Imagem</span> },
                { value: 'estilo', label: <span className="inline-flex items-center gap-1.5"><Palette size={13} />Estilo</span> },
              ]} />
            <Field label="Posição vertical" aside={`${pos}%`}>{id => <Slider id={id} min={0} max={100} value={pos} onChange={setPos} />}</Field>
            <Segmented label="Alinhamento" value={align} onChange={setAlign}
              options={[
                { value: 'left', label: <AlignLeft size={15} />, ariaLabel: 'Esquerda' },
                { value: 'center', label: <AlignCenter size={15} />, ariaLabel: 'Centro' },
                { value: 'right', label: <AlignRight size={15} />, ariaLabel: 'Direita' },
              ]} />
          </Panel>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="p-6 flex flex-col gap-4">
            <SectionLabel>Cinzas</SectionLabel>
            <div className="grid grid-cols-9 gap-1.5">
              {GRAYS.map(([name, cls]) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className={`h-12 rounded-ui-sm shadow-[inset_0_0_0_1px_rgba(128,128,128,0.2)] ${cls}`} />
                  <span className="text-caption2 text-faint truncate">{name}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {['bg-accent', 'bg-accent-text', 'bg-success', 'bg-danger'].map(c => (
                <div key={c} className={`flex-1 h-10 rounded-ui-sm ${c}`} />
              ))}
            </div>
          </Panel>

          <Panel className="p-6 flex flex-col gap-3">
            <SectionLabel>Tipografia</SectionLabel>
            {TYPE_SCALE.map(([cls, name]) => (
              <div key={cls} className="flex items-baseline justify-between gap-4">
                <span className={`${cls} truncate`}>Carrossel</span>
                <span className="text-caption text-faint whitespace-nowrap">{name}</span>
              </div>
            ))}
          </Panel>

          <Panel className="p-6 flex flex-col gap-5">
            <SectionLabel>Botões</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Exportar</Button>
              <Button>Visualizar</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="danger">Apagar</Button>
              <Button variant="primary" loading>Salvando</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" icon={<Plus size={14} />}>Slide</Button>
              <Button size="lg" variant="primary" icon={<Plus size={18} />}>Novo carrossel</Button>
              <IconButton label="Adicionar slide"><Plus size={18} /></IconButton>
            </div>
          </Panel>

          <Panel className="p-6 flex flex-col gap-5">
            <SectionLabel>Campos</SectionLabel>
            <Field label="Título">{id => <Textarea id={id} defaultValue="A dona do ChatGPT acabou de cortar o próprio preço em 80%" />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fonte">{id => <Select id={id}><option>Wide Black</option><option>Montserrat</option></Select>}</Field>
              <Field label="Tamanho">{id => <Input id={id} type="number" defaultValue={30} />}</Field>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-footnote font-medium text-fg-2 flex-1">Cor do título</span>
              {[['#FFFFFF', 'Branco'], ['#C7C7CC', 'Cinza'], ['#A79CFF', 'Violeta'], ['#FFD60A', 'Amarelo']].map(([c, n]) => (
                <Swatch key={c} color={c} label={n} selected={color === c} onClick={() => setColor(c)} />
              ))}
            </div>
            <div className="flex gap-4 flex-wrap">
              <StatusDot>Salvo</StatusDot>
              <StatusDot tone="busy">Salvando…</StatusDot>
              <StatusDot tone="error">Sem conexão</StatusDot>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
