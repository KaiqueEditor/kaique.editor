import { plainText } from '../../../utils/formatters';
import { useLayoutEffect, useRef, useState } from 'react';
import {
  ChevronLeft, Download, Eye, FileText, Image as ImageIcon, Layers, LayoutList, LogOut, Moon,
  MoreHorizontal, Palette, Plus, Redo2, Save, UserRound, Sun, Type, Undo2,
} from 'lucide-react';
import { useStore } from '../../../store';
import { createDefaultSection } from '../../../lib/sections';
import { CarouselSlide } from '../../../components/carousel/CarouselSlide';
import { Button, IconButton, Menu, StatusDot, cx } from '../../../ui';
import { SlideThumb, useFormat } from '../shared';
import { TextPanel } from '../inspector/TextPanel';
import { ImagePanel } from '../inspector/ImagePanel';
import { StylePanel } from '../inspector/StylePanel';
import { ImportRoteiroDialog, type RoteiroMode } from '../ImportRoteiroDialog';
import { SlidePanel } from './SlidePanel';
import type { SaveStatus } from '../TopBar';

type Tab = 'texto' | 'imagem' | 'estilo' | 'slide';

const TOP = 72;          // barra de cima + margem
const STRIP = 78;        // faixa de miniaturas
const SHEET_CLOSED = 92; // folha só com as abas
const STATUS_LABEL: Record<SaveStatus, string> = { saved: 'Salvo', dirty: 'Não salvo', saving: 'Salvando…' };

export interface MobileEditorProps {
  saveStatus: SaveStatus;
  exporting: boolean;
  exportStep?: string | null;
  exportingPDF: boolean;
  isProcessing: boolean;
  onBack: () => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onOpenThemes: () => void;
  onOpenAssets: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onProcessRoteiro: (text: string, mode: RoteiroMode) => void;
  onAvatarClick: () => void;
  onImageUpload: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (sectionId: string, file: File) => void;
  onDownloadSlide: (index: number) => void;
}

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: 'texto', label: 'Texto', icon: <Type size={20} /> },
  { key: 'imagem', label: 'Imagem', icon: <ImageIcon size={20} /> },
  { key: 'estilo', label: 'Estilo', icon: <Palette size={20} /> },
  { key: 'slide', label: 'Slide', icon: <LayoutList size={20} /> },
];

/** Editor no celular: slide em destaque, faixa de miniaturas e folha de vidro com os controles. */
export function MobileEditor(props: MobileEditorProps) {
  const sections = useStore(s => s.sections);
  const activeSlide = useStore(s => s.activeSlide);
  const setActiveSlide = useStore(s => s.setActiveSlide);
  const config = useStore(s => s.config);
  const addSection = useStore(s => s.addSection);
  const userEmail = useStore(s => s.userEmail);
  const canUndo = useStore(s => s.canUndo);
  const canRedo = useStore(s => s.canRedo);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const fmt = useFormat();

  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 844 });
  const [tab, setTab] = useState<Tab | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const touchX = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sheetH = tab ? Math.round(size.h * 0.52) : SHEET_CLOSED;
  const stageH = Math.max(120, size.h - TOP - STRIP - sheetH - 12);
  const scale = Math.max(0.1, Math.min((size.w - 32) / fmt.width, stageH / fmt.height));
  const section = sections[activeSlide];
  const title = plainText(sections[0]?.title ?? '') || 'Sem título';

  const go = (i: number) => setActiveSlide(Math.max(0, Math.min(sections.length - 1, i)));

  return (
    <div ref={rootRef} className="lg:hidden fixed inset-0 bg-canvas text-fg font-sans overflow-hidden">
      {/* Slide */}
      {section && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[4px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)] transition-[top,width,height] duration-300 ease-out"
          style={{ top: TOP + Math.max(0, (stageH - fmt.height * scale) / 2), width: fmt.width * scale, height: fmt.height * scale }}
          onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchX.current === null) return;
            const dx = touchX.current - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) go(activeSlide + (dx > 0 ? 1 : -1));
            touchX.current = null;
          }}
        >
          <div style={{ width: fmt.width, height: fmt.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <CarouselSlide section={section} config={config} index={activeSlide} total={sections.length} isExport
              onAvatarClick={props.onAvatarClick} formatWidth={fmt.width} formatHeight={fmt.height} />
          </div>
        </div>
      )}

      {/* Barra de cima */}
      <header className="glass absolute top-3 left-3 right-3 z-40 h-[52px] rounded-pill flex items-center gap-1.5 px-1.5">
        <IconButton label="Voltar para projetos" onClick={props.onBack} className="w-10 h-10 bg-fg/[0.08] text-fg flex-shrink-0">
          <ChevronLeft size={20} />
        </IconButton>
        <div className="flex-1 min-w-0 flex flex-col leading-tight pl-1">
          <span className="text-subhead font-semibold truncate">{title}</span>
          <StatusDot tone={props.saveStatus === 'saved' ? 'ok' : props.saveStatus === 'saving' ? 'busy' : 'error'}>
            {STATUS_LABEL[props.saveStatus]} · {activeSlide + 1} de {sections.length}
          </StatusDot>
        </div>
        <Menu
          align="end"
          className="!static"
          items={[
            { label: 'Salvar', icon: <Save size={15} />, onSelect: props.onSave },
            { label: 'Visualizar', icon: <Eye size={15} />, onSelect: props.onPreview },
            { label: 'Desfazer', icon: <Undo2 size={15} />, onSelect: undo, disabled: !canUndo },
            { label: 'Refazer', icon: <Redo2 size={15} />, onSelect: redo, disabled: !canRedo },
            { label: 'Importar roteiro', icon: <FileText size={15} />, onSelect: () => setImportOpen(true), separated: true },
            { label: 'Temas', icon: <Palette size={15} />, onSelect: props.onOpenThemes },
            { label: 'Paletas', icon: <Layers size={15} />, onSelect: props.onOpenAssets },
            { label: 'Minha marca', icon: <UserRound size={15} />, onSelect: props.onOpenSettings },
            { label: theme === 'dark' ? 'Modo claro' : 'Modo escuro', icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />, onSelect: toggleTheme, separated: true },
            { label: 'Sair', icon: <LogOut size={15} />, onSelect: props.onLogout, danger: true },
          ]}
          trigger={t => <IconButton {...t} label="Mais opções" className="w-10 h-10"><MoreHorizontal size={20} /></IconButton>}
        />
        <Button variant="primary" loading={props.exporting || props.exportingPDF} icon={<Download size={16} />}
          className="h-10 flex-shrink-0" onClick={props.onExport}>
          Exportar
        </Button>
      </header>

      {/* Faixa de miniaturas */}
      <nav aria-label="Slides" className="absolute left-0 right-0 z-20 transition-[bottom] duration-300 ease-out" style={{ bottom: sheetH + 8 }}>
        <ol className="flex gap-2 px-4 py-1 overflow-x-auto no-scrollbar">
          {sections.map((s, i) => (
            <li key={s.id} className="flex-shrink-0">
              <button type="button" onClick={() => go(i)} aria-label={`Slide ${i + 1}`} aria-current={i === activeSlide ? 'true' : undefined}
                className={cx('block rounded-[12px] p-[2px]', i === activeSlide ? 'bg-story' : 'bg-transparent')}>
                <span className={cx('block rounded-[10px] p-[1.5px]', i === activeSlide ? 'bg-canvas' : 'ring-1 ring-fg/10')}>
                  <span className="block rounded-[8px] overflow-hidden">
                    <SlideThumb section={s} index={i} total={sections.length} width={44} />
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li className="flex-shrink-0">
            <button type="button" aria-label="Adicionar slide"
              onClick={() => { addSection(createDefaultSection(sections.length, userEmail)); go(sections.length); }}
              className="h-full min-h-[60px] w-12 rounded-[10px] bg-fg/[0.08] flex items-center justify-center text-fg">
              <Plus size={18} />
            </button>
          </li>
        </ol>
      </nav>

      {/* Folha de controles */}
      <section aria-label="Controles do slide"
        className="glass absolute left-2 right-2 bottom-2 z-30 rounded-[30px] flex flex-col transition-[height] duration-300 ease-out"
        style={{ height: sheetH - 8 }}>
        <button type="button" onClick={() => setTab(t => (t ? null : 'texto'))} aria-label={tab ? 'Recolher controles' : 'Abrir controles'}
          className="h-5 flex-shrink-0 flex items-center justify-center">
          <span className="w-9 h-[5px] rounded-full bg-fg/25" aria-hidden="true" />
        </button>
        <div role="tablist" aria-label="Painel do slide" className="grid grid-cols-4 gap-1 px-2 flex-shrink-0">
          {TABS.map(t => {
            const selected = tab === t.key;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={selected}
                onClick={() => setTab(cur => (cur === t.key ? null : t.key))}
                className={cx(
                  'h-[58px] rounded-ui-md flex flex-col items-center justify-center gap-1 text-caption transition-colors',
                  selected ? 'bg-fg/10 text-fg font-semibold' : 'text-muted',
                )}>
                <span className={selected ? 'text-accent-text' : ''} aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
        {tab && (
          <div role="tabpanel" aria-label={tab} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-4 pb-6">
            {tab === 'texto' && <TextPanel />}
            {tab === 'imagem' && <ImagePanel onImageUpload={props.onImageUpload} onVideoUpload={props.onVideoUpload} onDownloadSlide={props.onDownloadSlide} />}
            {tab === 'estilo' && <StylePanel />}
            {tab === 'slide' && <SlidePanel onDownloadSlide={props.onDownloadSlide} />}
          </div>
        )}
      </section>

      <ImportRoteiroDialog open={importOpen} busy={props.isProcessing} onClose={() => setImportOpen(false)}
        onConfirm={(text, mode) => { setImportOpen(false); props.onProcessRoteiro(text, mode); }} />
    </div>
  );
}
