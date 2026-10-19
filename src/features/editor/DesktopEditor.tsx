import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { TopBar, type SaveStatus, type TopBarActions } from './TopBar';
import { SlideRail } from './SlideRail';
import { CanvasStage } from './CanvasStage';
import { Inspector } from './inspector/Inspector';
import { ImportRoteiroDialog } from './ImportRoteiroDialog';

interface DesktopEditorProps extends Omit<TopBarActions, 'onImportRoteiro'> {
  saveStatus: SaveStatus;
  exporting: boolean;
  exportStep?: string | null;
  exportingPDF: boolean;
  isAdmin: boolean;
  userEmail?: string | null;
  isProcessing: boolean;
  onProcessRoteiro: (text: string) => void;
  onAvatarClick: () => void;
  onImageUpload: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (sectionId: string, file: File) => void;
  onDownloadSlide: (index: number) => void;
}

/** Editor desktop: canvas ao centro e barras/painéis de vidro flutuando por cima. */
export function DesktopEditor(props: DesktopEditorProps) {
  const { onProcessRoteiro, onAvatarClick, onImageUpload, onVideoUpload, onDownloadSlide, isProcessing, onSave, ...bar } = props;
  const hasSlides = useStore(s => s.sections.length > 0);
  const [importOpen, setImportOpen] = useState(false);

  // ⌘S / Ctrl+S salva o projeto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  return (
    <div className="hidden lg:block fixed inset-0 bg-canvas text-fg font-sans overflow-hidden">
      <TopBar {...bar} onSave={onSave} onImportRoteiro={() => setImportOpen(true)} />

      {hasSlides ? (
        <>
          <SlideRail onDownloadSlide={onDownloadSlide} />
          <CanvasStage onAvatarClick={onAvatarClick} onVideoUpload={onVideoUpload} />
          <Inspector onImageUpload={onImageUpload} onVideoUpload={onVideoUpload} onDownloadSlide={onDownloadSlide} />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-6">
          <h1 className="text-large font-bold">Comece um carrossel</h1>
          <p className="text-body text-muted max-w-md">Cole um roteiro, abra um projeto salvo ou use um modelo pronto pelo menu Carrossel.Pro.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setImportOpen(true)}
              className="h-11 px-5 rounded-pill bg-accent text-on-accent font-semibold text-body hover:bg-accent-hover transition-colors">
              Importar roteiro
            </button>
            <button type="button" onClick={bar.onOpenProjects}
              className="h-11 px-5 rounded-pill bg-fg/10 hover:bg-fg/[0.15] font-medium text-body transition-colors">
              Meus projetos
            </button>
          </div>
        </div>
      )}

      <ImportRoteiroDialog
        open={importOpen}
        busy={isProcessing}
        onClose={() => setImportOpen(false)}
        onConfirm={text => { onProcessRoteiro(text); setImportOpen(false); }}
      />
    </div>
  );
}
