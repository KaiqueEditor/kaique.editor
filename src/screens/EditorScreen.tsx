import { lazy, useRef, Suspense, useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AnalyticsPage } from '../components/analytics/AnalyticsPage';
import { useAdmin } from '../hooks/useAdmin';
import { CarouselSlide } from '../components/carousel/CarouselSlide';
import { useStore } from '../store';
import { useProcessText } from '../hooks/useProcessText';
import { useExport, inlineImagesToDataUrl } from '../hooks/useExport';
import { useExportPDF } from '../hooks/useExportPDF';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useHistory } from '../hooks/useHistory';
import { useFileUpload } from '../hooks/useFileUpload';
import { VideoTrimModal } from '../components/editor/VideoTrimModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { Onboarding } from '../components/onboarding/Onboarding';
import { CustomThemes } from '../components/themes/CustomThemes';
import { AssetGalleryModal } from '../components/gallery/AssetGalleryModal';
import { projectStorage } from '../services/storage/projectStorage';
import { cloudStorage } from '../services/storage/cloudStorage';
import { getTheme } from '../constants/theme';
import { STARTER_TEMPLATES } from '../constants/starterTemplates';
import type { Section } from '../types/carousel.types';
import { EXPORT_FORMATS } from '../types/carousel.types';
import { buildTemplateSections, createDefaultSection } from '../lib/sections';
import { DesktopEditor } from '../features/editor/DesktopEditor';
import { MobileEditor } from '../features/editor/mobile/MobileEditor';
import type { SaveStatus } from '../features/editor/TopBar';
import { HomeScreen } from '../features/home/HomeScreen';
import type { Project } from '../features/home/useProjects';
import { Button, Dialog } from '../ui';

const ExportPreview = lazy(() => import('../components/export/ExportPreview').then(mod => ({ default: mod.ExportPreview })));

// ── App autenticado: tela inicial (projetos) ↔ editor ─────────────────────────
export function CarrosselApp({ session, onLogout }: { session: any; onLogout: () => void }) {
  const sections = useStore(state => state.sections);
  const config = useStore(state => state.config);
  const showExportPreview = useStore(state => state.showExportPreview);
  const generatingIds = useStore(state => state.generatingIds);
  const theme = useStore(state => state.theme);
  const exportFormat = useStore(state => state.exportFormat);
  const currentProjectId = useStore(state => state.currentProjectId);
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setShowExportPreview = useStore(state => state.setShowExportPreview);
  const updateConfig = useStore(state => state.updateConfig);
  const setCurrentProjectId = useStore(state => state.setCurrentProjectId);

  const { processText, isProcessing } = useProcessText();
  const { exportRefs, exportAll, downloadSlide, captureSlideAsPng, isExporting, exportStep } = useExport();
  const { exportPDF, isExportingPDF } = useExportPDF();
  const { handleAvatarUpload, handleImageUpload, validateVideoUpload, applyVideoClip } = useFileUpload();
  const { undo, redo } = useHistory();
  useKeyboardShortcuts({ onUndo: undo, onRedo: redo });
  const { isAdmin } = useAdmin();

  const [view, setView] = useState<'home' | 'editor'>('home');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [showCustomThemes, setShowCustomThemes] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<{ sectionId: string; file: File } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('carrosselpro-onboarding-done'));
  const [savingProject, setSavingProject] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useAutoSave({ sections, config, currentProjectId, userId: session?.user?.id, exportRefs });

  // ── Status de salvamento: qualquer mudança depois de abrir/salvar marca "não salvo".
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDirty(true); }, [sections, config]);
  const markClean = () => setTimeout(() => setDirty(false), 50);
  const saveStatus: SaveStatus = savingProject ? 'saving' : dirty ? 'dirty' : 'saved';

  // ── Navegação
  const openEditor = () => { setActiveSlide(0); setView('editor'); };
  const goHome = () => { if (dirty) setConfirmLeave(true); else setView('home'); };

  const handleOpenProject = (p: Project) => {
    useStore.getState().setSections(p.sections);
    if (p.config) updateConfig(p.config);
    setCurrentProjectId(p.id);
    openEditor();
    markClean();
  };
  const startNewProject = (slides: Section[]) => {
    useStore.getState().setSections(slides);
    setCurrentProjectId(null);
    openEditor();
  };
  const blankSlides = () => {
    const email = useStore.getState().userEmail;
    return [0, 1, 2].map(i => createDefaultSection(i, email));
  };
  const handleNewFromTemplate = (id: string) => {
    const t = STARTER_TEMPLATES.find(x => x.id === id);
    if (t) startNewProject(buildTemplateSections(t, useStore.getState().userEmail));
  };
  const handleNewFromRoteiro = (text: string) => {
    setCurrentProjectId(null);
    processText(text);
    openEditor();
  };

  // ── Salvar: nuvem primeiro (atualiza o projeto aberto ou cria um novo), depois cópia local.
  const handleManualSave = useCallback(async (): Promise<boolean> => {
    setSavingProject(true);
    try {
      let thumbnailDataUrl: string | undefined;
      const firstSlide = exportRefs.current[0];
      if (firstSlide) {
        const fixedContainer = firstSlide.parentElement?.parentElement;
        if (fixedContainer) fixedContainer.style.opacity = '1';
        const restoreImages = await inlineImagesToDataUrl(firstSlide);
        await new Promise(r => setTimeout(r, 100));
        try {
          const { toJpeg } = await import('html-to-image');
          thumbnailDataUrl = await toJpeg(firstSlide, { quality: 0.5, pixelRatio: 0.25 });
        } finally {
          restoreImages();
          if (fixedContainer) fixedContainer.style.opacity = '0.0001';
        }
      }

      const name = sections[0]?.title?.trim() || 'Sem título';
      let savedId = currentProjectId;
      try {
        const userId = session?.user?.id;
        if (userId) {
          const row = await cloudStorage.saveCarousel(userId, name, sections, config, thumbnailDataUrl, currentProjectId);
          if (row) savedId = row.id;
        }
      } catch { /* nuvem é best-effort; a cópia local garante o trabalho */ }

      if (!savedId) savedId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      await projectStorage.saveProject(savedId, name, sections, config, thumbnailDataUrl);
      setCurrentProjectId(savedId);
      markClean();
      toast.success('Projeto salvo');
      return true;
    } catch {
      toast.error('Erro ao salvar o projeto');
      return false;
    } finally {
      setSavingProject(false);
    }
  }, [currentProjectId, setCurrentProjectId, sections, config, exportRefs, session]);

  // ── Exportar PDF: captura cada slide como PNG e compila
  const handleExportPDF = useCallback(async () => {
    const fmt = EXPORT_FORMATS.find(f => f.key === exportFormat) ?? EXPORT_FORMATS[0];
    const images: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const node = exportRefs.current[i];
      if (!node) continue;
      try { images.push(await captureSlideAsPng(node)); }
      catch (err) { console.warn(`PDF: falha ao capturar slide ${i + 1}:`, err); }
    }
    if (images.length > 0) await exportPDF(images, sections[0]?.title || 'Carrossel', fmt.width, fmt.height);
  }, [sections, exportRefs, exportPDF, exportFormat, captureSlideAsPng]);

  const handleVideoUploadRequest = (sectionId: string, file: File) => {
    if (!validateVideoUpload(file)) return;
    setPendingVideo({ sectionId, file });
  };
  const handleDownloadSlide = async (idx: number) => {
    const node = exportRefs.current[idx];
    const s = sections[idx];
    if (node && s) await downloadSlide(node, s, `slide-${idx + 1}`);
  };

  if (showAnalytics) return <AnalyticsPage onBack={() => setShowAnalytics(false)} />;

  const T = getTheme(theme);
  const fmt = EXPORT_FORMATS.find(f => f.key === exportFormat) ?? EXPORT_FORMATS[0];

  // Props comuns aos editores de desktop e celular
  const editorProps = {
    saveStatus,
    exporting: isExporting,
    exportStep,
    exportingPDF: isExportingPDF,
    isProcessing,
    onSave: handleManualSave,
    onPreview: () => setShowExportPreview(true),
    onExportZip: () => exportAll(sections),
    onExportPDF: handleExportPDF,
    onOpenThemes: () => setShowCustomThemes(true),
    onOpenAssets: () => setIsAssetsOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onLogout,
    onProcessRoteiro: (text: string) => { setCurrentProjectId(null); processText(text); setActiveSlide(0); },
    onAvatarClick: () => avatarInputRef.current?.click(),
    onImageUpload: handleImageUpload,
    onVideoUpload: handleVideoUploadRequest,
    onDownloadSlide: handleDownloadSlide,
  };

  return (
    <div className="min-h-screen bg-bg" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: view === 'editor' ? 104 : 24 }}
        toastOptions={{
          className: 'glass-strong',
          style: { background: undefined, color: T.textPrimary, borderRadius: '999px', padding: '8px 16px', fontWeight: 500, fontSize: '15px' },
          success: { iconTheme: { primary: T.success, secondary: '#ffffff' } },
        }}
      />

      {/* Nós de exportação: invisíveis, mas montados para o navegador decodificar imagens e vídeos.
          zIndex >= 0 e opacity > 0 são obrigatórios para o Chrome renderizar frames de vídeo. */}
      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, width: fmt.width + 20, height: fmt.height + 20,
        overflow: 'visible', zIndex: 0, pointerEvents: 'none', opacity: 0.0001,
      }}>
        {sections.map((s, idx) => (
          <div key={`exp-${s.id}`} style={{ position: 'absolute', top: 0, left: idx * 1100, width: fmt.width, height: fmt.height, pointerEvents: 'none' }}>
            <CarouselSlide
              innerRef={el => { exportRefs.current[idx] = el; }}
              section={s} config={config} index={idx} total={sections.length} isExport
              isGenerating={generatingIds.includes(s.id)}
              formatWidth={fmt.width} formatHeight={fmt.height}
            />
          </div>
        ))}
      </div>

      {view === 'home' ? (
        <HomeScreen
          userId={session?.user?.id}
          userEmail={session?.user?.email}
          isAdmin={isAdmin}
          isProcessing={isProcessing}
          onOpenProject={handleOpenProject}
          onNewBlank={() => startNewProject(blankSlides())}
          onNewFromRoteiro={handleNewFromRoteiro}
          onNewFromTemplate={handleNewFromTemplate}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onLogout={onLogout}
        />
      ) : (
        <>
          <DesktopEditor
            {...editorProps}
            isAdmin={isAdmin}
            userEmail={session?.user?.email}
            onOpenProjects={goHome}
            onNewCarousel={() => setShowNewConfirm(true)}
            onOpenAnalytics={() => setShowAnalytics(true)}
          />
          <MobileEditor {...editorProps} onBack={goHome} />
        </>
      )}

      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { handleAvatarUpload(e, url => updateConfig({ avatarUrl: url })); e.target.value = ''; }} />

      <Suspense fallback={null}>
        {showExportPreview && (
          <ExportPreview
            sections={sections}
            config={config}
            generatingIds={generatingIds}
            isExporting={isExporting}
            exportStep={exportStep}
            onClose={() => { if (!isExporting) setShowExportPreview(false); }}
            onExport={() => exportAll(sections)}
          />
        )}
      </Suspense>

      <VideoTrimModal
        isOpen={!!pendingVideo}
        file={pendingVideo?.file ?? null}
        T={T}
        onCancel={() => setPendingVideo(null)}
        onConfirm={async (trimStart) => {
          if (!pendingVideo) return;
          const toastId = toast.loading('Processando trecho de 15 segundos...');
          await applyVideoClip(pendingVideo.sectionId, pendingVideo.file, trimStart);
          toast.dismiss(toastId);
          setPendingVideo(null);
          toast.success('Vídeo aplicado com trecho de 15 segundos.');
        }}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AssetGalleryModal isOpen={isAssetsOpen} onClose={() => setIsAssetsOpen(false)} />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {showCustomThemes && <CustomThemes onClose={() => setShowCustomThemes(false)} T={T} />}

      <Dialog
        open={showNewConfirm}
        onClose={() => setShowNewConfirm(false)}
        title="Criar um carrossel novo?"
        description="O carrossel atual será descartado. Salve antes se quiser guardar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewConfirm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => { setShowNewConfirm(false); startNewProject(blankSlides()); toast.success('Carrossel novo criado'); }}>
              Criar novo
            </Button>
          </>
        }
      >
        {null}
      </Dialog>

      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Salvar antes de sair?"
        description="Este carrossel tem alterações que ainda não foram salvas."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { setConfirmLeave(false); markClean(); setView('home'); }}>Sair sem salvar</Button>
            <Button variant="primary" loading={savingProject} onClick={async () => {
              const ok = await handleManualSave();
              setConfirmLeave(false);
              if (ok) setView('home');
            }}>Salvar e sair</Button>
          </>
        }
      >
        {null}
      </Dialog>
    </div>
  );
}
