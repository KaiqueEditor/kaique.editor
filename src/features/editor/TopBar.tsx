import { plainText } from '../../utils/formatters';
import {
  BarChart3, ChevronDown, Download, Eye, FileText, FolderOpen, Layers, LogOut,
  Moon, Palette, Plus, Redo2, Save, UserRound, Sun, Undo2,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button, IconButton, Menu, StatusDot, type MenuItem } from '../../ui';

export type SaveStatus = 'saved' | 'dirty' | 'saving';

export interface TopBarActions {
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onOpenProjects: () => void;
  onNewCarousel: () => void;
  onImportRoteiro: () => void;
  onOpenThemes: () => void;
  onOpenAssets: () => void;
  onOpenSettings: () => void;
  onOpenAnalytics: () => void;
  onLogout: () => void;
}

interface TopBarProps extends TopBarActions {
  saveStatus: SaveStatus;
  exporting: boolean;
  exportStep?: string | null;
  exportingPDF: boolean;
  isAdmin: boolean;
  userEmail?: string | null;
}

const STATUS_LABEL: Record<SaveStatus, string> = { saved: 'Salvo', dirty: 'Não salvo', saving: 'Salvando…' };

export function TopBar(props: TopBarProps) {
  const { saveStatus, exporting, exportStep, exportingPDF, isAdmin, userEmail } = props;
  const sections = useStore(s => s.sections);
  const canUndo = useStore(s => s.canUndo);
  const canRedo = useStore(s => s.canRedo);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);

  const title = plainText(sections[0]?.title ?? '') || 'Sem título';

  const projectMenu: MenuItem[] = [
    { label: 'Meus projetos', icon: <FolderOpen size={15} />, onSelect: props.onOpenProjects },
    { label: 'Novo carrossel', icon: <Plus size={15} />, onSelect: props.onNewCarousel },
    { label: 'Importar roteiro', icon: <FileText size={15} />, onSelect: props.onImportRoteiro },
    { label: 'Temas', icon: <Palette size={15} />, onSelect: props.onOpenThemes, separated: true },
    { label: 'Paletas', icon: <Layers size={15} />, onSelect: props.onOpenAssets },
    { label: 'Minha marca', icon: <UserRound size={15} />, onSelect: props.onOpenSettings },
    ...(isAdmin ? [{ label: 'Analytics', icon: <BarChart3 size={15} />, onSelect: props.onOpenAnalytics }] : []),
    {
      label: theme === 'dark' ? 'Modo claro' : 'Modo escuro',
      icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
      onSelect: toggleTheme, separated: true,
    },
    { label: 'Sair', icon: <LogOut size={15} />, onSelect: props.onLogout, danger: true, hint: userEmail ?? undefined },
  ];


  return (
    <header className="glass absolute top-3.5 left-3.5 right-3.5 z-30 h-14 rounded-pill flex items-center justify-between gap-4 pl-2 pr-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Menu
          items={projectMenu}
          trigger={p => (
            <button {...p} type="button"
              className="h-10 pl-3 pr-2.5 rounded-pill flex items-center gap-1.5 bg-fg/[0.08] hover:bg-fg/[0.12] transition-colors">
              <span className="text-subhead font-semibold tracking-tight">Carrossel<span className="text-brand">.</span>Pro</span>
              <ChevronDown size={14} className="text-muted" aria-hidden="true" />
              <span className="sr-only">Menu do projeto</span>
            </button>
          )}
        />
        <span className="text-subhead font-semibold truncate max-w-[340px] ml-1.5" title={title}>{title}</span>
        <StatusDot tone={saveStatus === 'saved' ? 'ok' : saveStatus === 'saving' ? 'busy' : 'error'}>{STATUS_LABEL[saveStatus]}</StatusDot>
      </div>

      <div className="flex items-center gap-1.5">
        <IconButton label="Desfazer (⌘Z)" onClick={undo} disabled={!canUndo}><Undo2 size={17} /></IconButton>
        <IconButton label="Refazer (⇧⌘Z)" onClick={redo} disabled={!canRedo}><Redo2 size={17} /></IconButton>
        <IconButton label="Salvar (⌘S)" onClick={props.onSave} disabled={saveStatus === 'saving'}><Save size={17} /></IconButton>
        <span className="w-px h-5 bg-fg/10 mx-1" aria-hidden="true" />
        <Button icon={<Eye size={16} />} onClick={props.onPreview}>Visualizar</Button>
        <Button variant="primary" loading={exporting || exportingPDF} icon={<Download size={16} />} onClick={props.onExport}>
          {exporting ? (exportStep || 'Exportando') : exportingPDF ? 'Gerando PDF' : 'Exportar'}
        </Button>
      </div>
    </header>
  );
}
