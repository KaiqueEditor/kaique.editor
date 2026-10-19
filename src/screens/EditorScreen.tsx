import { lazy, useRef, Suspense, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Eye, Download, Loader2, Sun, Moon, Palette, FileText, Settings, MessageSquareText, ClipboardPaste, Sparkles, FolderOpen, FileOutput, Plus, Save, LogOut, BarChart3, Undo2, Redo2, Play, Pause, Layers } from 'lucide-react';
import { AnalyticsPage } from '../components/analytics/AnalyticsPage';
import { useAdmin } from '../hooks/useAdmin';
import { Toaster, toast } from 'react-hot-toast';
import { CarouselSlide } from '../components/carousel/CarouselSlide';
import { BottomTabBar } from '../components/layout/BottomTabBar';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { useProcessText } from '../hooks/useProcessText';
import { useExport } from '../hooks/useExport';
import { useExportPDF } from '../hooks/useExportPDF';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useHistory } from '../hooks/useHistory';
import { useFileUpload } from '../hooks/useFileUpload';
import { VideoTrimModal } from '../components/editor/VideoTrimModal';
import { ProjectsGalleryModal } from '../components/history/ProjectsGalleryModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { Onboarding } from '../components/onboarding/Onboarding';
import { CustomThemes } from '../components/themes/CustomThemes';
import { AssetGalleryModal } from '../components/gallery/AssetGalleryModal';
import { projectStorage } from '../services/storage/projectStorage';
import { cloudStorage } from '../services/storage/cloudStorage';
import { getTheme } from '../constants/theme';
import type { Section } from '../types/carousel.types';
import { EXPORT_FORMATS } from '../types/carousel.types';
import { inlineImagesToDataUrl } from '../hooks/useExport';
import { createDefaultSection } from '../lib/sections';
import { SidebarContent, type SidebarContentProps } from '../components/layout/Sidebar';
import { DesktopEditor } from '../features/editor/DesktopEditor';
import { Button, Dialog } from '../ui';

const ExportPreview = lazy(() => import('../components/export/ExportPreview').then(mod => ({ default: mod.ExportPreview })));

// ── App Viewer/Editor ─────────────────────────────────────────────────────────
export function CarrosselApp({ session, onLogout }: { session: any; onLogout: () => void }) {
  const sections = useStore(state => state.sections);
  const activeSlide = useStore(state => state.activeSlide);
  const config = useStore(state => state.config);
  const showExportPreview = useStore(state => state.showExportPreview);
  const generatingIds = useStore(state => state.generatingIds);
  const theme = useStore(state => state.theme);

  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setShowExportPreview = useStore(state => state.setShowExportPreview);
  const updateConfig = useStore(state => state.updateConfig);
  const toggleTheme = useStore(state => state.toggleTheme);
  const { processText, isProcessing } = useProcessText();
  const { exportRefs, exportAll, downloadSlide, captureSlideAsPng, isExporting, exportStep } = useExport();
  const { exportPDF, isExportingPDF } = useExportPDF();
  const { handleAvatarUpload, handleImageUpload, validateVideoUpload, applyVideoClip } = useFileUpload();
  const { undo, redo } = useHistory();
  useKeyboardShortcuts({ onUndo: undo, onRedo: redo });

  const exportFormat = useStore(state => state.exportFormat);

  const { isAdmin } = useAdmin();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const globalAvatarInputRef = useRef<HTMLInputElement>(null);
  const desktopAvatarInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState('');
  const swipeTouchStart = useRef<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef({ activeSlide, sections: sections.length });
  autoPlayRef.current = { activeSlide, sections: sections.length };

  // Autoplay timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      const { activeSlide: cur, sections: len } = autoPlayRef.current;
      if (cur >= len - 1) {
        setIsAutoPlaying(false);
        setActiveSlide(0);
      } else {
        setActiveSlide(cur + 1);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(() => {
    if (typeof window === 'undefined') return 500 / 1080;
    const isMobile = window.innerWidth < 1024;
    const w = Math.min(500, window.innerWidth * (isMobile ? 0.90 : 0.80));
    const scaleByWidth = w / 1080;
    // Also constrain by viewport height: leave ~220px for toolbar + nav + actions
    const availableHeight = window.innerHeight - 220;
    const scaleByHeight = availableHeight / 1440;
    return Math.min(scaleByWidth, scaleByHeight);
  });
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.getBoundingClientRect().width;
      if (w <= 0) return;
      const scaleByWidth = w / 1080;
      // Leave ~220px for toolbar + navigation + action buttons
      const availableHeight = window.innerHeight - 220;
      const scaleByHeight = availableHeight / 1440;
      setPreviewScale(Math.min(scaleByWidth, scaleByHeight));
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    compute();
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, []);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<{ sectionId: string; file: File } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('carrosselpro-onboarding-done'));
  const [showCustomThemes, setShowCustomThemes] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const currentProjectId = useStore(state => state.currentProjectId);
  const setCurrentProjectId = useStore(state => state.setCurrentProjectId);
  const mobileActiveTab = useStore(state => state.mobileActiveTab);
  useAutoSave({
    sections,
    config,
    currentProjectId,
    userId: session?.user?.id,
    exportRefs,
  });

  // Restaurar último projeto: primeiro do Cloud, depois fallback local
  useEffect(() => {
    const restoreFromCloud = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const cloudProjects = await cloudStorage.getUserCarousels(user.id);
          if (cloudProjects.length > 0) {
            const latest = cloudProjects[0]; // sorted by updated_at desc
            if (latest.sections && latest.sections.length > 0) {
              useStore.getState().setSections(latest.sections);
              if (latest.config) useStore.getState().updateConfig(latest.config);
              return; // cloud restored
            }
          }
        }
      } catch { /* cloud failed, try local */ }

      // Fallback: local auto-backup
      try {
        const backup = await projectStorage.loadProject('auto-backup');
        if (backup && backup.sections.length > 0) {
          const state = useStore.getState();
          const looksLikeSameSession = state.sections.length === backup.sections.length;
          if (looksLikeSameSession) {
            useStore.getState().setSections(backup.sections);
          }
        }
      } catch { /* no backup */ }
    };

    // Só começa a contar mudanças depois que a restauração (e os slides padrão) assentaram.
    restoreFromCloud().finally(() => {
      setTimeout(() => { trackChanges.current = true; setDirty(false); }, 1800);
    });

    // Se não existem slides, cria um set padrão para o usuário poder começar imediatamente
    setTimeout(() => {
      const state = useStore.getState();
      if (state.sections.length === 0) {
        const defaultSlides = [
          createDefaultSection(0, useStore.getState().userEmail),
          createDefaultSection(1, useStore.getState().userEmail),
          createDefaultSection(2, useStore.getState().userEmail),
        ];
        useStore.getState().setSections(defaultSlides);
      }
    }, 1500);
  }, []);

  // Status de salvamento: qualquer mudança depois da restauração inicial marca como "não salvo".
  const [dirty, setDirty] = useState(false);
  const trackChanges = useRef(false);
  useEffect(() => {
    if (trackChanges.current) setDirty(true);
  }, [sections, config]);
  const autoSaveStatus = 'idle' as 'idle' | 'saving' | 'saved';


  const [savingProject, setSavingProject] = useState(false);

  const handleManualSave = useCallback(async () => {
    setSavingProject(true);
    try {
      let thumbnailDataUrl;
      const firstSlide = exportRefs.current[0];
      if (firstSlide) {
        const wrapper = firstSlide.parentElement;
        const fixedContainer = wrapper?.parentElement;
        if (fixedContainer) fixedContainer.style.opacity = '1';
        // Protege contra CORS para thumbnails
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

      const name = sections[0]?.title || 'Sem título';
      const idToSave = currentProjectId || (Date.now().toString() + Math.random().toString(36).slice(2, 6));

      await projectStorage.saveProject(idToSave, name, sections, config, thumbnailDataUrl);
      if (!currentProjectId) setCurrentProjectId(idToSave);

      // Cloud save (Supabase)
      try {
        const userId = session?.user?.id;
        if (userId) {
          await cloudStorage.saveCarousel(userId, name, sections, config, thumbnailDataUrl);
        }
      } catch { /* cloud save is best-effort */ }

      setDirty(false);
      toast.success('Projeto salvo');
    } catch (err) {
      toast.error('Erro ao salvar o projeto');
    } finally {
      setSavingProject(false);
    }
  }, [currentProjectId, setCurrentProjectId, sections, config, exportRefs, session]);

  // Exportar PDF: renderiza cada slide como PNG e compila
  const handleExportPDF = useCallback(async () => {
    const fmt = EXPORT_FORMATS.find(f => f.key === exportFormat);
    const fmtW = fmt?.width ?? 1080;
    const fmtH = fmt?.height ?? 1440;
    const images: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const node = exportRefs.current[i];
      if (!node) continue;
      try {
        const dataUrl = await captureSlideAsPng(node);
        images.push(dataUrl);
      } catch (err) {
        console.warn(`PDF: falha ao capturar slide ${i + 1}:`, err);
      }
    }
    if (images.length > 0) {
      await exportPDF(images, sections[0]?.title || 'Carrossel', fmtW, fmtH);
    }
  }, [sections, exportRefs, exportPDF, exportFormat, captureSlideAsPng]);

  const T = getTheme(theme);
  const isDark = theme === 'dark';

  const handleProcessText = () => {
    if (!textInput.trim()) {
      toast.error('Cole um texto ou roteiro primeiro!');
      return;
    }
    processText(textInput);
  };

  const handleVideoUploadRequest = (sectionId: string, file: File) => {
    if (!validateVideoUpload(file)) return;
    setPendingVideo({ sectionId, file });
  };

  // Props compartilhadas para SidebarContent
  const sidebarProps: SidebarContentProps = {
    T, isDark, textInput, setTextInput, profileOpen, setProfileOpen,
    mobileSidebarOpen, setMobileSidebarOpen, config, sections, activeSlide,
    isProcessing, globalAvatarInputRef, handleProcessText,
    updateConfig,
    handleAvatarUpload,
    setActiveSlide, toggleTheme,
    onImageUpload: handleImageUpload,
    onVideoUpload: handleVideoUploadRequest,
    onDownloadSlide: async (idx: number, s: Section) => {
      const node = exportRefs.current[idx];
      if (node) await downloadSlide(node, s, `slide-${idx + 1}`);
    },
    sessionUserEmail: session?.user?.email,
    onLogout,
    onOpenCustomThemes: () => setShowCustomThemes(true),
    onOpenAssets: () => setIsAssetsOpen(true),
    onNewCarrossel: () => setShowNewConfirm(true),
  };

  // AnalyticsPage (admin only)
  if (showAnalytics) {
    return <AnalyticsPage onBack={() => setShowAnalytics(false)} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors duration-300"
      style={{ background: T.bgCanvas, WebkitTapHighlightColor: 'transparent' }}
    >
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 80 }}
        toastOptions={{
          className: 'glass',
          style: {
            background: undefined,
            color: T.textPrimary,
            borderRadius: '999px',
            padding: '8px 16px',
            fontWeight: 500,
            fontSize: '15px',
          },
          success: { iconTheme: { primary: T.success, secondary: '#ffffff' } },
        }}
      />

      {/* Nós de exportação: sempre montados (desktop e celular) */}
        {/* Nós de exportação — tecnicamente visíveis para o browser (decode ativo), invisíveis para o usuário */}
        {/* IMPORTANTE: zIndex >= 0 e opacity > 0 são obrigatórios para o Chrome decodificar frames de vídeo */}
        {/* Container com dimensões reais para garantir que o text layout é idêntico ao preview */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: `${(EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080) + 20}px`,
            height: `${(EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440) + 20}px`,
            overflow: 'visible',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: 0.0001,
          }}
        >
          {sections.map((s, idx) => (
            <div
              key={`exp-${s.id}`}
              style={{
                position: 'absolute',
                top: 0,
                left: `${idx * 1100}px`,
                width: `${EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080}px`,
                height: `${EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440}px`,
                // Sem opacity aqui — o container pai já controla visibilidade.
                // Dupla opacity impedia a captura correta das imagens.
                pointerEvents: 'none',
              }}
            >
              <CarouselSlide
                innerRef={el => { exportRefs.current[idx] = el; }}
                section={s}
                config={config}
                index={idx}
                total={sections.length}
                isExport={true}
                isGenerating={generatingIds.includes(s.id)}
                formatWidth={EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080}
                formatHeight={EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440}
              />
            </div>
          ))}
        </div>


      {/* ══════════════════════════════════════
          EDITOR DESKTOP — canvas central + vidro
      ══════════════════════════════════════ */}
      <DesktopEditor
        saveStatus={savingProject ? 'saving' : dirty ? 'dirty' : 'saved'}
        exporting={isExporting}
        exportStep={exportStep}
        exportingPDF={isExportingPDF}
        isAdmin={isAdmin}
        userEmail={session?.user?.email}
        isProcessing={isProcessing}
        onSave={handleManualSave}
        onPreview={() => setShowExportPreview(true)}
        onExportZip={() => exportAll(sections)}
        onExportPDF={handleExportPDF}
        onOpenProjects={() => setHistoryOpen(true)}
        onNewCarousel={() => setShowNewConfirm(true)}
        onOpenThemes={() => setShowCustomThemes(true)}
        onOpenAssets={() => setIsAssetsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onLogout={onLogout}
        onProcessRoteiro={text => { setTextInput(text); processText(text); setActiveSlide(0); }}
        onAvatarClick={() => desktopAvatarInputRef.current?.click()}
        onImageUpload={handleImageUpload}
        onVideoUpload={handleVideoUploadRequest}
        onDownloadSlide={async idx => {
          const node = exportRefs.current[idx];
          const s = sections[idx];
          if (node && s) await downloadSlide(node, s, `slide-${idx + 1}`);
        }}
      />
      <input ref={desktopAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => { handleAvatarUpload(e, url => updateConfig({ avatarUrl: url })); e.target.value = ''; }} />

      {/* ══════════════════════════════════════
          MOBILE SIDEBAR — overlay sheet (opens from Editor tab)
      ══════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0 z-[100] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: mobileSidebarOpen ? 1 : 0,
          pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
        }}
        onClick={() => setMobileSidebarOpen(false)}
      />
      {/* Sheet */}
      <div
        className="lg:hidden fixed left-0 top-0 h-full z-[110] overflow-hidden transition-transform duration-300"
        style={{
          width: 'min(360px, 92vw)',
          background: T.sidebar,
          borderRight: `1px solid ${T.border}`,
          boxShadow: isDark ? '8px 0 40px rgba(0,0,0,0.6)' : '8px 0 40px rgba(0,0,0,0.15)',
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <SidebarContent {...sidebarProps} />
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ══════════════════════════════════════ */}
      <BottomTabBar />

      {/* ══════════════════════════════════════
          MOBILE TAB VIEWS
      ══════════════════════════════════════ */}

      {/* Tab: Editor — roteiro, formato, watermark, gerar carrossel */}
      {mobileActiveTab === 'editor' && (
        <div className="lg:hidden fixed inset-0 z-[80] overflow-y-auto pb-24" style={{ background: T.sidebar }}>
          <SidebarContent {...sidebarProps} />
        </div>
      )}

      {/* Tab: Projetos — histórico de carrosséis */}
      {mobileActiveTab === 'projects' && (
        <div className="lg:hidden fixed inset-0 z-[80] overflow-y-auto pb-24" style={{ background: T.bgCanvas }}>
          <div className="p-5 pt-6">
            <h2 className="text-lg font-black mb-1" style={{ color: T.textPrimary, letterSpacing: '-0.03em' }}>Meus Projetos</h2>
            <p className="text-[10px] font-bold mb-4" style={{ color: T.textFaint }}>Seus carrosséis salvos</p>
          </div>
          <ProjectsGalleryModal
            isOpen={true}
            onClose={() => useStore.getState().setMobileActiveTab('preview')}
          />
        </div>
      )}

      {/* Tab: Criar — criar manual */}
      {mobileActiveTab === 'create' && (
        <div className="lg:hidden fixed inset-0 z-[80] overflow-y-auto pb-24" style={{ background: T.bgCanvas }}>
          <div className="p-5 pt-6 space-y-5">
            <h2 className="text-lg font-black" style={{ color: T.textPrimary, letterSpacing: '-0.03em' }}>Criar Carrossel</h2>

            {/* Criar Manual */}
            <div className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textFaint }}>Modo Manual</p>
              <p className="text-xs font-semibold mb-4" style={{ color: T.textSub }}>
                Crie slides um a um, do seu jeito
              </p>
              <button
                onClick={() => {
                  const newSection = createDefaultSection(sections.length, useStore.getState().userEmail);
                  useStore.getState().addSection(newSection);
                  setActiveSlide(sections.length);
                  toast.success('Slide adicionado!');
                  useStore.getState().setMobileActiveTab('preview');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
              >
                <Plus size={14} /> Adicionar Slide
              </button>
              {sections.length > 0 && (
                <p className="text-[9px] font-bold mt-2 text-center" style={{ color: T.textFaint }}>
                  {sections.length} slide{sections.length !== 1 ? 's' : ''} no carrossel atual
                </p>
              )}
            </div>

            {/* Novo Carrossel (limpar) */}
            <button
              onClick={() => {
                if (sections.length > 0) {
                  setShowNewConfirm(true);
                } else {
                  useStore.getState().setSections([
                    createDefaultSection(0, useStore.getState().userEmail),
                    createDefaultSection(1, useStore.getState().userEmail),
                    createDefaultSection(2, useStore.getState().userEmail),
                  ]);
                  setTextInput('');
                  toast.success('Novo carrossel criado!');
                  useStore.getState().setMobileActiveTab('preview');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              style={{ background: T.glass, color: T.textSub, border: `1px dashed ${T.border}` }}
            >
              <FileText size={14} /> Novo Carrossel Vazio
            </button>

          </div>
        </div>
      )}

      {/* Tab: Ajustes — tema, perfil/logout */}
      {mobileActiveTab === 'settings' && (
        <div className="lg:hidden fixed inset-0 z-[80] overflow-y-auto pb-24" style={{ background: T.bgCanvas }}>
          <div className="p-5 pt-6 space-y-5">
            <h2 className="text-lg font-black" style={{ color: T.textPrimary, letterSpacing: '-0.03em' }}>Ajustes</h2>

            {/* Tema */}
            <div className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textFaint }}>Aparência</p>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full py-2 px-3 rounded-xl transition-all active:scale-95"
                style={{ background: T.glass, border: `1px solid ${T.border}` }}
              >
                {isDark ? <Sun size={16} style={{ color: T.accent }} /> : <Moon size={16} style={{ color: T.accent }} />}
                <span className="text-xs font-bold" style={{ color: T.textPrimary }}>
                  {isDark ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </button>
            </div>

            {/* Projeto */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest px-4 pt-4 pb-2" style={{ color: T.textFaint }}>Projeto</p>
              <button
                onClick={handleManualSave}
                disabled={savingProject}
                className="flex items-center gap-3 w-full py-3 px-4 transition-all active:bg-white/5"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                {savingProject
                  ? <Loader2 className="animate-spin" size={16} style={{ color: T.accent }} />
                  : <Save size={16} style={{ color: T.accent }} />
                }
                <span className="text-xs font-bold flex-1 text-left" style={{ color: T.textPrimary }}>
                  {savingProject ? 'Salvando...' : 'Salvar Projeto'}
                </span>
                <ChevronRight size={14} style={{ color: T.textFaint }} />
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF || isExporting || isProcessing}
                className="flex items-center gap-3 w-full py-3 px-4 transition-all active:bg-white/5"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                {isExportingPDF
                  ? <Loader2 className="animate-spin" size={16} style={{ color: T.accent }} />
                  : <FileOutput size={16} style={{ color: T.accent }} />
                }
                <span className="text-xs font-bold flex-1 text-left" style={{ color: T.textPrimary }}>
                  {isExportingPDF ? 'Exportando PDF...' : 'Exportar PDF'}
                </span>
                <ChevronRight size={14} style={{ color: T.textFaint }} />
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-3 w-full py-3 px-4 transition-all active:bg-white/5"
              >
                <FolderOpen size={16} style={{ color: T.accent }} />
                <span className="text-xs font-bold flex-1 text-left" style={{ color: T.textPrimary }}>Meus Projetos</span>
                <ChevronRight size={14} style={{ color: T.textFaint }} />
              </button>
            </div>

            {/* Analytics (admin only) */}
            {isAdmin && (
              <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center gap-3 w-full py-3 px-4 transition-all active:bg-white/5"
                >
                  <BarChart3 size={16} style={{ color: T.accent }} />
                  <span className="text-xs font-bold flex-1 text-left" style={{ color: T.accent }}>Analytics</span>
                  <ChevronRight size={14} style={{ color: T.textFaint }} />
                </button>
              </div>
            )}

            {/* Perfil */}
            <div className="rounded-2xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textFaint }}>Conta</p>
              <p className="text-xs font-bold mb-1" style={{ color: T.textPrimary }}>{session?.user?.email || 'Usuário'}</p>
              <p className="text-[9px] font-medium" style={{ color: T.textFaint }}>Logado via {session?.user?.app_metadata?.provider || 'email'}</p>
            </div>

            {/* Sair */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              style={{
                background: 'rgba(255,68,68,0.1)',
                color: '#ff4444',
                border: '1px solid rgba(255,68,68,0.2)',
              }}
            >
              <LogOut size={14} /> Sair da Conta
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CANVAS PRINCIPAL (desktop: sempre visível / mobile: só na tab Preview)
      ══════════════════════════════════════ */}
      <main
        className={`flex-1 flex-col transition-colors duration-300 pb-24 lg:hidden ${mobileActiveTab !== 'preview' ? 'hidden' : 'flex'}`}
        style={{ background: T.bgCanvas, height: '100dvh', overflow: 'hidden' }}
      >

        {/* ── Content Area — preenche espaço restante, scroll se necessário ── */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">

          {sections.length > 0 ? (
            <div className="my-auto w-full flex flex-col items-center gap-3 sm:gap-4 p-4 lg:p-8">

              {/* ── Floating Toolbar (desktop/mobile: above preview) ── */}
              <div
                className="flex items-center gap-1 px-2 py-1.5 rounded-2xl"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${T.border}`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <button
                  onClick={() => { useStore.getState().undo(); toast('↩ Ação desfeita', { duration: 1200, icon: '↩' }); }}
                  disabled={!useStore.getState().canUndo}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-20"
                  style={{ color: T.textSub }}
                  title="Desfazer (Cmd+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={() => { useStore.getState().redo(); toast('↪ Ação refeita', { duration: 1200, icon: '↪' }); }}
                  disabled={!useStore.getState().canRedo}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-20"
                  style={{ color: T.textSub }}
                  title="Refazer (Cmd+Shift+Z)"
                >
                  <Redo2 size={16} />
                </button>
                <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
                <button
                  onClick={handleManualSave}
                  disabled={savingProject}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{ color: savingProject ? T.textFaint : T.textSub }}
                  title="Salvar"
                >
                  {savingProject ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || isExporting || isProcessing}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{ color: isExportingPDF ? T.textFaint : T.textSub }}
                  title="Export PDF"
                >
                  {isExportingPDF ? <Loader2 className="animate-spin" size={16} /> : <FileOutput size={16} />}
                </button>


                <button
                  onClick={() => setShowCustomThemes(true)}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{ color: T.textSub }}
                  title="Temas Personalizados"
                >
                  <Palette size={16} />
                </button>
                <button
                  onClick={() => setIsAssetsOpen(true)}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{ color: T.textSub }}
                  title="Galeria de Assets"
                >
                  <Layers size={16} />
                </button>
                <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hidden lg:flex p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 items-center justify-center"
                  style={{ color: T.textSub }}
                  title="Configurações (Agência)"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{ color: T.textSub }}
                  title="Histórico"
                >
                  <FolderOpen size={16} />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowAnalytics(true)}
                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90"
                    style={{ color: T.accent }}
                    title="Analytics"
                  >
                    <BarChart3 size={16} />
                  </button>
                )}
                {/* Auto-save indicator */}
                {autoSaveStatus !== 'idle' && (
                  <>
                    <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
                    <span
                      className="text-[9px] font-bold flex items-center gap-1 px-2"
                      style={{
                        color: autoSaveStatus === 'saved' ? '#00E5C3' : T.textFaint,
                        transition: 'opacity 0.3s',
                      }}
                    >
                      {autoSaveStatus === 'saving' ? '● Salvando...' : '✓ Salvo'}
                    </span>
                  </>
                )}
              </div>

              {/* Format badge */}
              <span className="text-[8px] font-bold tabular-nums px-2.5 py-1 rounded-full" style={{
                background: T.glass,
                color: T.textFaint,
                border: `1px solid ${T.border}`,
              }}>
                {EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080}×{EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440}
              </span>

              {/* ── Preview ── */}
              <div
                ref={previewContainerRef}
                className="relative overflow-hidden"
                onTouchStart={e => { swipeTouchStart.current = e.touches[0].clientX; }}
                onTouchEnd={e => {
                  if (swipeTouchStart.current === null) return;
                  const delta = swipeTouchStart.current - e.changedTouches[0].clientX;
                  if (Math.abs(delta) > 40) {
                    if (delta > 0 && activeSlide < sections.length - 1) setActiveSlide(activeSlide + 1);
                    if (delta < 0 && activeSlide > 0) setActiveSlide(activeSlide - 1);
                  }
                  swipeTouchStart.current = null;
                }}
                style={{
                  width: '100%',
                  maxWidth: 'min(450px, 81vw)',
                  aspectRatio: `${EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080} / ${EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440}`,
                  borderRadius: '2rem',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                  boxShadow: isDark
                    ? '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.03)'
                    : '0 24px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
              >
                {/* Renderiza nas dimensões do formato selecionado e escala via transform */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080, height: EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440, transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                  <CarouselSlide
                    section={sections[activeSlide]}
                    config={config}
                    index={activeSlide}
                    total={sections.length}
                    isExport={true}
                    isGenerating={generatingIds.includes(sections[activeSlide].id)}
                    onAvatarClick={() => globalAvatarInputRef.current?.click()}
                    formatWidth={EXPORT_FORMATS.find(f => f.key === exportFormat)?.width ?? 1080}
                    formatHeight={EXPORT_FORMATS.find(f => f.key === exportFormat)?.height ?? 1440}
                  />
                </div>
              </div>

              {/* ── Navegação ── */}
              <div className="flex items-center gap-3">
                <button
                  disabled={activeSlide === 0}
                  onClick={() => { setActiveSlide(activeSlide - 1); setIsAutoPlaying(false); }}
                  className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-20 disabled:hover:scale-100"
                  style={{ color: T.textPrimary, background: T.glass, border: `1px solid ${T.border}` }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => {
                    if (isAutoPlaying) {
                      setIsAutoPlaying(false);
                    } else {
                      if (activeSlide >= sections.length - 1) setActiveSlide(0);
                      setIsAutoPlaying(true);
                    }
                  }}
                  className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
                  style={{
                    color: isAutoPlaying ? '#000' : T.textPrimary,
                    background: isAutoPlaying ? T.accent : T.glass,
                    border: `1px solid ${isAutoPlaying ? T.accent : T.border}`,
                    boxShadow: isAutoPlaying ? `0 2px 12px ${T.accent}40` : 'none',
                  }}
                  title={isAutoPlaying ? 'Pausar' : 'Preview animado'}
                >
                  {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <div className="flex items-center gap-1.5">
                  {sections.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveSlide(i); setIsAutoPlaying(false); }}
                      className="rounded-full transition-all"
                      style={{
                        width: i === activeSlide ? 20 : 6,
                        height: 6,
                        minWidth: 6,
                        background: i === activeSlide ? T.accent : T.glassMd,
                      }}
                    />
                  ))}
                </div>

                <span className="text-[9px] font-bold tabular-nums" style={{ color: T.textFaint }}>
                  {activeSlide + 1}/{sections.length}
                </span>

                <button
                  disabled={activeSlide === sections.length - 1}
                  onClick={() => { setActiveSlide(activeSlide + 1); setIsAutoPlaying(false); }}
                  className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 disabled:opacity-20 disabled:hover:scale-100"
                  style={{ color: T.textPrimary, background: T.glass, border: `1px solid ${T.border}` }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* ── Primary Actions (Revisar + Exportar ZIP) ── */}
              <div className="flex gap-3 w-full" style={{ maxWidth: 'min(420px, 90vw)' }}>
                <button
                  onClick={() => setShowExportPreview(true)}
                  disabled={isProcessing || isExporting}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: T.glass,
                    border: `1px solid ${T.border}`,
                    color: isProcessing || isExporting ? T.textFaint : T.textSub,
                  }}
                >
                  <Eye size={14} /> Revisar
                </button>
                <button
                  onClick={() => {
                    if (generatingIds.length > 0) {
                      toast('Alguns slides ainda estão gerando imagens.');
                    }
                    exportAll(sections);
                  }}
                  disabled={isExporting || isProcessing}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: isExporting || isProcessing ? T.glassMd : T.accent,
                    color: isExporting || isProcessing ? T.textDim : T.accentText,
                    boxShadow: isExporting || isProcessing ? 'none' : `0 8px 28px ${T.accentGlow}`,
                    border: `1px solid ${isExporting || isProcessing ? T.border : 'transparent'}`,
                  }}
                >
                  {isExporting
                    ? <><Loader2 className="animate-spin" size={14} /><span>{exportStep?.toUpperCase()}</span></>
                    : <><Download size={14} /><span>Exportar ZIP</span></>
                  }
                </button>
              </div>
            </div>

          ) : (
            /* ── Empty State ── */
            <div className="my-auto self-center animate-fade-in flex flex-col items-center gap-8 px-6 py-8 w-full" style={{ maxWidth: 'min(640px, 90vw)' }}>

              {/* Título */}
              <div className="text-center">
                <h2
                  className={`font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${isDark
                    ? 'from-gray-200 via-white to-gray-400'
                    : 'from-gray-900 via-gray-700 to-gray-900'
                    }`}
                  style={{
                    fontSize: '3rem',
                    letterSpacing: '-0.06em',
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1,
                    filter: isDark ? 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' : 'none'
                  }}
                >
                  Carrossel.Pro
                </h2>
                <p className="text-sm font-medium leading-relaxed mt-4" style={{ color: T.textSub }}>
                  Crie carrosséis virais em 3 passos simples.
                </p>
              </div>

              {/* Mobile: abre a sidebar */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2.5 px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                style={{
                  background: T.accent,
                  color: T.accentText,
                  boxShadow: `0 10px 32px ${T.accentGlow}`,
                }}
              >
                <FileText size={18} /> Começar agora
              </button>

              {/* Guia de 3 passos — vertical no mobile, horizontal no desktop */}
              <div className="flex flex-col lg:flex-row items-stretch gap-2 w-full">

                {/* Passo 1 */}
                <div
                  className="flex-1 flex flex-col gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                      <MessageSquareText size={12} style={{ color: T.accent }} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      Passo 1
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold leading-snug text-left" style={{ color: T.textPrimary }}>
                    Escreva o roteiro: "texto 1", "texto 2"…
                  </p>
                </div>

                <div className="hidden lg:flex items-center flex-shrink-0" style={{ color: T.border }}>
                  <ChevronRight size={14} />
                </div>

                {/* Passo 2 */}
                <div
                  className="flex-1 flex flex-col gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                      <ClipboardPaste size={12} style={{ color: T.accent }} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      Passo 2
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold leading-snug text-left" style={{ color: T.textPrimary }}>
                    Cole o roteiro no painel lateral
                  </p>
                  <span className="mt-auto text-[10px] font-bold hidden lg:inline" style={{ color: T.textFaint }}>
                    ← Campo "Roteiro"
                  </span>
                  <span className="mt-auto text-[10px] font-bold lg:hidden" style={{ color: T.textFaint }}>
                    ↑ Toque em "Editar" e cole no campo Roteiro
                  </span>
                </div>

                <div className="hidden lg:flex items-center flex-shrink-0" style={{ color: T.border }}>
                  <ChevronRight size={14} />
                </div>

                {/* Passo 3 */}
                <div
                  className="flex-1 flex flex-col gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                      <Sparkles size={12} style={{ color: T.accent }} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      Passo 3
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold leading-snug text-left" style={{ color: T.textPrimary }}>
                    Toque em "Gerar Carrossel"
                  </p>
                  <span className="mt-auto text-[10px] font-bold hidden lg:inline" style={{ color: T.textFaint }}>
                    ← Botão na sidebar
                  </span>
                  <span className="mt-auto text-[10px] font-bold lg:hidden" style={{ color: T.textFaint }}>
                    ↑ Botão no painel lateral
                  </span>
                </div>

              </div>

              {/* Atalhos */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
                  style={{ background: T.accent, color: T.accentText, boxShadow: `0 4px 16px ${T.accentGlow}` }}
                >
                  <FolderOpen size={13} /> Meus Carrosséis
                </button>
              </div>

            </div>
          )}

        </div>{/* /Content Area */}

      </main >

      <Suspense fallback={null}>
        {showExportPreview && (
          <ExportPreview
            sections={sections}
            config={config}
            generatingIds={generatingIds}
            isExporting={isExporting}
            exportStep={exportStep}
            onClose={() => {
              if (isExporting) return;
              setShowExportPreview(false);
            }}
            onExport={() => {
              if (generatingIds.length > 0) {
                toast('Alguns slides ainda estão gerando imagens.');
              }
              exportAll(sections);
            }}
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

      <ProjectsGalleryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AssetGalleryModal
        isOpen={isAssetsOpen}
        onClose={() => setIsAssetsOpen(false)}
      />


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
            <Button variant="primary" onClick={() => {
              useStore.getState().setSections([
                createDefaultSection(0, useStore.getState().userEmail),
                createDefaultSection(1, useStore.getState().userEmail),
                createDefaultSection(2, useStore.getState().userEmail),
              ]);
              setActiveSlide(0);
              setTextInput('');
              setCurrentProjectId(null);
              setShowNewConfirm(false);
              toast.success('Carrossel novo criado');
            }}>Criar novo</Button>
          </>
        }
      >
        {null}
      </Dialog>

    </div >
  );
}
