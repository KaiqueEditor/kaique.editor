import React, { useRef, lazy, Suspense, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Type as TypeIcon, ChevronLeft, ChevronRight,
  Upload, Wand2, Eye, Download, Loader2, Sun, Moon, Palette, FileText, ChevronDown,
  PanelLeft, X, ExternalLink, LayoutTemplate, Settings, Droplets,
  MessageSquareText, ClipboardPaste, Sparkles, FolderOpen, FileOutput,
  PenLine, Copy, Check, Plus, Save, LogOut, BarChart3, Undo2, Redo2,
  Play, Pause, User, Layers,
} from 'lucide-react';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { useAdmin, clearAdminCache } from './hooks/useAdmin';
import { Toaster, toast } from 'react-hot-toast';
import { CarouselSlide } from './components/carousel/CarouselSlide';
import { SlideEditor } from './components/editor/SlideEditor';
import { LoginPage } from './components/auth/LoginPage';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { supabase } from './lib/supabase';
import { useStore } from './store';
import { useProcessText } from './hooks/useProcessText';
import { useExport } from './hooks/useExport';
import { useExportPDF } from './hooks/useExportPDF';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useHistory } from './hooks/useHistory';
import { useFileUpload } from './hooks/useFileUpload';
import { VideoTrimModal } from './components/editor/VideoTrimModal';
import { ProjectsGalleryModal } from './components/history/ProjectsGalleryModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { TemplateGallery } from './components/templates/TemplateGallery';
import { Onboarding } from './components/onboarding/Onboarding';
import { CustomThemes } from './components/themes/CustomThemes';
import { AssetGalleryModal } from './components/gallery/AssetGalleryModal';
import { projectStorage } from './services/storage/projectStorage';
import { cloudStorage } from './services/storage/cloudStorage';
import { getTheme } from './constants/theme';
import { STARTER_TEMPLATES } from './constants/starterTemplates';
import type { ThemeTokens } from './constants/theme';
import type { Section, ProjectConfig } from './types/carousel.types';
import { EXPORT_FORMATS } from './types/carousel.types';
import { APP_VERSION, VERSION_NOTES } from './version';

const ExportPreview = lazy(() => import('./components/export/ExportPreview').then(mod => ({ default: mod.ExportPreview })));
import { inlineImagesToDataUrl } from './hooks/useExport';

// ── Helper: cria uma Section vazia/default ──────────────────────────────────────
const createDefaultSection = (index: number, userEmail?: string | null): Section => {
  const isTimePrimo = userEmail?.toLowerCase() === 'marcela.depaula@timeprimo.com' || userEmail?.toLowerCase() === 'lorena.volpini@timeprimo.com';
  const adminEmails = ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'];
  const isAdmin = adminEmails.includes(userEmail?.toLowerCase() ?? '');

  return {
    id: `default-${Date.now()}-${index}`,
    title: index === 0 ? 'Título da Capa' : `Slide ${index + 1}`,
    content: index === 0 ? 'Comece editando este texto' : 'Adicione seu conteúdo aqui',
    alignment: 'center',
    layoutType: 'storytelling',
    titleFont: isTimePrimo ? 'filson-pro-bold' : isAdmin ? 'wide' : 'plus-jakarta',
    bodyFont: isTimePrimo ? 'open-sans' : isAdmin ? 'montserrat' : 'sans',
    titleColor: '#FFFFFF',
    bodyColor: '#e0e0e0',
    bgColor: '#1a1a2e',
    brandingColor: '#00E5C3',
    titleSize: 70,
    bodySize: 22,
    imagePosX: 50,
    imagePosY: 50,
    imageScale: 1,
    overlayOpacity: 0,
    textPosY: 70,
    showSocialImage: false,
  };
};

// ── Sidebar inner content (reutilizado no desktop e no mobile sheet) ──────────
interface SidebarContentProps {
  T: ThemeTokens;
  isDark: boolean;
  textInput: string;
  setTextInput: (v: string) => void;
  profileOpen: boolean;
  setProfileOpen: (fn: (prev: boolean) => boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  config: ProjectConfig;
  sections: Section[];
  activeSlide: number;
  isProcessing: boolean;
  globalAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleProcessText: () => void;
  updateConfig: (patch: Partial<ProjectConfig>) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>, cb: (url: string) => void) => void;
  setActiveSlide: (idx: number) => void;
  toggleTheme: () => void;
  onDownloadSlide: (idx: number, s: Section) => Promise<void>;
  onImageUpload: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (sectionId: string, file: File) => void;
  sessionUserEmail?: string | null;
  onLogout: () => void;
  onOpenCustomThemes: () => void;
  onOpenAssets: () => void;
  onNewCarrossel: () => void;
}

// Conta slides a partir do formato "texto N" do roteiro
const countSlidesFromText = (text: string): number => {
  const matches = text.match(/^texto\s+\d+/gim);
  if (!matches || matches.length === 0) return 0;
  const maxN = Math.max(...matches.map(m => parseInt(m.match(/\d+/)![0], 10)));
  if (maxN <= 0) return 0;
  // texto 1 = capa (1 slide); cada par seguinte = 1 slide
  return maxN === 1 ? 1 : 1 + Math.ceil((maxN - 1) / 2);
};

function SidebarContent({
  T, isDark, textInput, setTextInput, profileOpen, setProfileOpen,
  setMobileSidebarOpen, config, sections, activeSlide, isProcessing,
  globalAvatarInputRef, handleProcessText, updateConfig, handleAvatarUpload,
  setActiveSlide, toggleTheme, onDownloadSlide, onImageUpload, onVideoUpload,
  sessionUserEmail, onLogout, onOpenCustomThemes, onOpenAssets, onNewCarrossel,
}: SidebarContentProps) {
  const detectedSlides = useMemo(() => countSlidesFromText(textInput), [textInput]);
  const carouselTemplates = useStore(state => state.carouselTemplates);
  const saveCarouselTemplate = useStore(state => state.saveCarouselTemplate);
  const deleteCarouselTemplate = useStore(state => state.deleteCarouselTemplate);
  const applyCarouselTemplate = useStore(state => state.applyCarouselTemplate);
  const reorderSections = useStore(state => state.reorderSections);
  const exportFormat = useStore(state => state.exportFormat);
  const setExportFormat = useStore(state => state.setExportFormat);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [wmOpen, setWmOpen] = useState(false);
  const [formatoOpen, setFormatoOpen] = useState(false);
  const [estilosOpen, setEstilosOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(sections.length === 0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const setSections = useStore(state => state.setSections);

  const applyStarterTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    const isTimePrimo = sessionUserEmail?.toLowerCase() === 'marcela.depaula@timeprimo.com' || sessionUserEmail?.toLowerCase() === 'lorena.volpini@timeprimo.com';

    const newSections = template.slides.map((slide, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: slide.title || '',
      content: slide.content || '',
      alignment: slide.alignment || 'left',
      layoutType: slide.layoutType || 'storytelling',
      titleFont: isTimePrimo ? 'filson-pro-bold' : (slide.titleFont || 'bebas-neue'),
      bodyFont: isTimePrimo ? 'open-sans' : (slide.bodyFont || 'sans'),
      titleSize: slide.titleSize || 40,
      bodySize: slide.bodySize || 18,
      bgColor: slide.bgColor || '#000000',
      titleColor: slide.titleColor || '#ffffff',
      bodyColor: slide.bodyColor || '#cccccc',
      brandingColor: slide.brandingColor || '#ffffff',
      imagePosX: slide.imagePosX ?? 50,
      imagePosY: slide.imagePosY ?? 50,
      imageScale: slide.imageScale ?? 1,
      overlayOpacity: slide.overlayOpacity ?? 0,
      textPosY: slide.textPosY ?? 85,
      showSocialImage: slide.showSocialImage ?? false,
    } as any));
    setSections(newSections);
    setTemplatesOpen(false);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="p-5 sm:p-7">

        {/* ── Header ── */}
        <header className="mb-7 flex items-center justify-between gap-3">
          <div>
            <h1
              className="font-black leading-none whitespace-nowrap text-sm sm:text-xl"
              style={{
                color: T.textPrimary,
                letterSpacing: '-0.05em',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Carrossel<span style={{ color: T.textDim }}>.</span>Pro
            </h1>
            <p className="text-[7px] font-bold tracking-wide" style={{ color: T.textFaint }}>
              by <span style={{ color: T.accent }}>Kaique.Editor</span>
            </p>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-1.5">

            <button
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
              className="p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/5"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Minha Conta"
                className="hidden lg:flex p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/5"
                style={{ background: userMenuOpen ? T.glassMd : T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
              >
                <User size={15} />
              </button>
              {userMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-3"
                  style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: 'blur(20px)' }}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: T.textFaint }}>Logado como</p>
                    <p className="text-xs font-bold truncate pr-2" style={{ color: T.textPrimary }}>{sessionUserEmail || 'Usuário'}</p>
                  </div>
                  <div className="h-px w-full" style={{ background: T.border }} />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-red-500/10 active:scale-95"
                    style={{ color: '#ff4444' }}
                  >
                    <LogOut size={13} /> Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Clica fora esconde o menu (usando truque do overlay vazio só quando tá aberto) */}
        {userMenuOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setUserMenuOpen(false)}
          />
        )}

        <div className="mb-6 h-px" style={{ background: T.border }} />

        {/* ── Templates Rápidos ── */}
        <div className="mb-5 rounded-2xl overflow-hidden transition-all"
          style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
            onClick={() => setTemplatesOpen(!templatesOpen)}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                <Sparkles size={12} style={{ color: T.accent }} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textPrimary }}>
                  {sections.length === 0 ? 'Começar com Template' : 'Templates'}
                </p>
                <p className="text-[7px] font-bold" style={{ color: T.textFaint }}>
                  {sections.length === 0 ? 'Escolha um modelo pronto' : '7 modelos prontos'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sections.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNewCarrossel(); }}
                  className="text-[8px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:scale-105"
                  style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
                >
                  + Novo
                </button>
              )}
              <ChevronDown size={12} style={{ color: T.textFaint, transform: templatesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {templatesOpen && (
            <div className="px-3 pb-3 space-y-3" style={{ borderTop: `1px solid ${T.border}` }}>
              {/* Feed */}
              <div className="pt-2">
                <p className="text-[7px] font-black uppercase tracking-widest mb-2 px-1" style={{ color: T.textFaint }}>Feed / Carrossel</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_TEMPLATES.filter(t => t.category === 'feed').map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyStarterTemplate(t)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{ background: T.glassMd, border: `1px solid ${T.border}` }}
                    >
                      <span className="text-base flex-shrink-0">{t.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black truncate" style={{ color: T.textPrimary }}>{t.name}</p>
                        <p className="text-[7px] font-medium" style={{ color: T.textFaint }}>{t.slideCount} slides</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Twitter */}
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest mb-2 px-1" style={{ color: T.textFaint }}>Twitter / X</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_TEMPLATES.filter(t => t.category === 'twitter').map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyStarterTemplate(t)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{ background: T.glassMd, border: `1px solid ${T.border}` }}
                    >
                      <span className="text-base flex-shrink-0">{t.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black truncate" style={{ color: T.textPrimary }}>{t.name}</p>
                        <p className="text-[7px] font-medium" style={{ color: T.textFaint }}>{t.slideCount} slides</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Educação */}
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest mb-2 px-1" style={{ color: T.textFaint }}>Educação</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_TEMPLATES.filter(t => t.category === 'educacao').map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyStarterTemplate(t)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{ background: T.glassMd, border: `1px solid ${T.border}` }}
                    >
                      <span className="text-base flex-shrink-0">{t.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black truncate" style={{ color: T.textPrimary }}>{t.name}</p>
                        <p className="text-[7px] font-medium" style={{ color: T.textFaint }}>{t.slideCount} slides</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="space-y-4">

          {/* ── Roteiro ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                style={{ color: T.textFaint }}>
                <TypeIcon size={11} style={{ color: T.textDim }} /> Roteiro
              </label>
              {textInput.length > 0 && (
                <span className="text-[8px] font-bold tabular-nums" style={{ color: T.textFaint }}>
                  {textInput.length} chars
                </span>
              )}
            </div>
            <textarea
              placeholder={"Cole aqui o seu roteiro...\n\ntexto 1\nTítulo da Capa\n\ntexto 2\nSubtítulo · Conteúdo do slide 2"}
              className="w-full h-32 lg:h-44 px-4 py-3 text-sm rounded-2xl outline-none resize-none transition-all"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              style={{
                background: T.inputBg,
                border: `1px solid ${T.inputBorder}`,
                color: T.textPrimary,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
            />

            {/* Gerar Carrossel */}
            <div className="mt-2 space-y-1.5">
              {detectedSlides > 0 && (
                <span
                  className="block text-[9px] font-black uppercase tracking-widest"
                  style={{ color: T.accent }}
                >
                  {detectedSlides} slide{detectedSlides !== 1 ? 's' : ''} detectado{detectedSlides !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95"
                style={{
                  background: isProcessing || !textInput.trim() ? T.glass : T.accent,
                  color: isProcessing || !textInput.trim() ? T.textFaint : T.accentText,
                  boxShadow: isProcessing || !textInput.trim() ? 'none' : `0 4px 20px ${T.accentGlow}`,
                  cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer',
                  border: `1px solid ${isProcessing || !textInput.trim() ? T.border : 'transparent'}`,
                }}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                {isProcessing ? 'Processando...' : 'Gerar Carrossel'}
              </button>
            </div>
          </div>

          {/* ── Marca d'Água — compacta e colapsável ── */}
          <div className="rounded-xl overflow-hidden transition-all"
            style={{ background: T.glassMd, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between px-3 py-2 cursor-pointer"
              onClick={() => setWmOpen(!wmOpen)}>
              <div className="flex items-center gap-2">
                <Droplets size={11} style={{ color: T.accent }} />
                <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textSub }}>
                  {config.watermark || "Marca d'Água"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {config.watermark && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ background: T.accentGlow, color: T.accent }}>
                    ATIVO
                  </span>
                )}
                <ChevronDown size={12} style={{ color: T.textFaint, transform: wmOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>
            </div>
            {wmOpen && (
              <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
                <input
                  type="text"
                  placeholder="ex: @seuinstagram"
                  value={config.watermark}
                  onChange={e => updateConfig({ watermark: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold outline-none transition-all mt-2"
                  style={{
                    background: T.inputBg,
                    border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                />
              </div>
            )}
          </div>

        </section>
      </div>

      {/* ── Formato de Exportação ── */}
      {sections.length > 0 && (
        <div className="px-5 sm:px-7 pt-3 pb-2">
          <div className="rounded-2xl overflow-hidden transition-all"
            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => setFormatoOpen(!formatoOpen)}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                  <LayoutTemplate size={12} style={{ color: T.accent }} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textPrimary }}>Formato</p>
              </div>
              <ChevronDown size={12} style={{ color: T.textFaint, transform: formatoOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>
            {formatoOpen && (
              <div className="flex gap-1.5 px-3 pb-3">
                {EXPORT_FORMATS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setExportFormat(f.key)}
                    className="flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: exportFormat === f.key ? T.accent : T.glass,
                      color: exportFormat === f.key ? T.accentText : T.textFaint,
                      border: `1px solid ${exportFormat === f.key ? T.accent : T.border}`,
                    }}
                  >
                    {f.label}<br />
                    <span style={{ opacity: 0.6, fontSize: '6px' }}>{f.ratio}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Meus Estilos ── */}
      {sections.length > 0 && (
        <div className="px-5 sm:px-7 pt-2 pb-3">
          <div className="rounded-2xl overflow-hidden transition-all"
            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => setEstilosOpen(!estilosOpen)}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.glassMd }}>
                  <LayoutTemplate size={12} style={{ color: T.accent }} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textPrimary }}>
                    Meus Estilos
                  </p>
                  <p className="text-[7px] font-bold" style={{ color: T.textFaint }}>
                    {carouselTemplates.length > 0
                      ? `${carouselTemplates.length} estilo${carouselTemplates.length !== 1 ? 's' : ''} salvo${carouselTemplates.length !== 1 ? 's' : ''}`
                      : 'Salve cores e fontes para reusar'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!savingTemplate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSavingTemplate(true); setTemplateName(''); setEstilosOpen(true); }}
                    className="text-[8px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:scale-105"
                    style={{ background: T.accent, color: T.accentText }}
                  >
                    + Salvar
                  </button>
                )}
                <ChevronDown size={12} style={{ color: T.textFaint, transform: estilosOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>
            </div>

            {estilosOpen && (<>
              {/* Input de nome */}
              {savingTemplate && (
                <div className="flex gap-1.5 px-4 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nome do estilo (ex: Escuro, Favorito...)"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && templateName.trim()) {
                        saveCarouselTemplate(templateName.trim());
                        setSavingTemplate(false);
                      }
                      if (e.key === 'Escape') setSavingTemplate(false);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold outline-none"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputFocus}`, color: T.textPrimary }}
                  />
                  <button
                    onClick={() => {
                      if (templateName.trim()) saveCarouselTemplate(templateName.trim());
                      setSavingTemplate(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black transition-all hover:scale-105"
                    style={{ background: T.accent, color: T.accentText }}
                  >Salvar</button>
                  <button
                    onClick={() => setSavingTemplate(false)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-black transition-all"
                    style={{ background: T.glass, color: T.textFaint, border: `1px solid ${T.border}` }}
                  >✕</button>
                </div>
              )}

              {/* Grid de estilos salvos */}
              {carouselTemplates.length > 0 && (
                <div className="grid grid-cols-3 gap-2 px-4 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
                  {carouselTemplates.map(t => (
                    <div key={t.id} className="relative group">
                      <button
                        onClick={() => applyCarouselTemplate(t.id)}
                        className="w-full flex flex-col items-center gap-1.5 transition-all active:scale-95 hover:scale-[1.03]"
                        title={`Aplicar "${t.name}" em todos os slides`}
                      >
                        <div className="w-full h-10 rounded-xl overflow-hidden flex" style={{ border: `1.5px solid ${T.border}` }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, background: t.capaStyle.bgColor }} />
                            <div style={{ flex: 1, background: t.capaStyle.titleColor }} />
                          </div>
                          <div style={{ width: 1, background: T.border }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, background: t.slidesStyle.bgColor }} />
                            <div style={{ flex: 1, background: t.slidesStyle.titleColor }} />
                          </div>
                        </div>
                        <span className="text-[7px] font-bold truncate w-full text-center" style={{ color: T.textSub }}>
                          {t.name}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteCarouselTemplate(t.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black items-center justify-center hidden group-hover:flex transition-all"
                        style={{ background: '#ef4444', color: '#ffffff' }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Acesso rápido: Temas e Galeria */}
              <div className="flex gap-1.5 px-4 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenCustomThemes(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: T.glassMd, color: T.textSub, border: `1px solid ${T.border}` }}
                >
                  <Palette size={11} /> Temas
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenAssets(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: T.glassMd, color: T.textSub, border: `1px solid ${T.border}` }}
                >
                  <Layers size={11} /> Galeria
                </button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* ── Lista de frames ── */}
      {sections.length > 0 && (
        <div className="px-5 sm:px-7 pb-24 space-y-4 transition-colors duration-300"
          style={{ borderTop: `1px solid ${T.border}` }}>




          <div className="flex items-center justify-between px-1 pt-3 pb-2 sticky top-0 z-10"
            style={{ background: T.sidebar, backdropFilter: 'blur(8px)' }}>
            <p className="text-[8px] font-black uppercase tracking-widest"
              style={{ color: T.textFaint }}>
              {sections.length} Slide{sections.length !== 1 ? 's' : ''} · Visualizando capa/slide {activeSlide + 1}
            </p>
          </div>
          {sections.map((s, idx) => (
            <div
              key={s.id}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderTop = `2px solid ${T.accent}`; }}
              onDragLeave={e => { e.currentTarget.style.borderTop = ''; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderTop = '';
                if (dragIdx.current !== null && dragIdx.current !== idx) {
                  reorderSections(dragIdx.current, idx);
                  setActiveSlide(idx);
                }
                dragIdx.current = null;
              }}
            >
              <SlideEditor
                section={s}
                index={idx}
                isActive={activeSlide === idx}
                onClick={() => { setActiveSlide(idx); }}
                theme={isDark ? 'dark' : 'light'}
                T={T}
                onDownload={async () => { await onDownloadSlide(idx, s); }}
                onImageUpload={onImageUpload}
                onVideoUpload={onVideoUpload}
                dragHandleProps={{
                  draggable: true,
                  onDragStart: () => { dragIdx.current = idx; },
                  onDragEnd: () => { dragIdx.current = null; },
                }}
                sessionUserEmail={sessionUserEmail}
              />
            </div>
          ))}

          {/* Botão Adicionar Slide */}
          <button
            onClick={() => {
              const newSection = createDefaultSection(sections.length, useStore.getState().userEmail);
              useStore.getState().addSection(newSection);
              setActiveSlide(sections.length);
              toast.success('Novo slide adicionado!');
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${T.accent}18, ${T.accent}08)`,
              color: T.accent,
              border: `1.5px dashed ${T.accent}40`,
            }}
          >
            <Plus size={18} strokeWidth={3} /> Adicionar Slide
          </button>
        </div>
      )}

      {/* Version badge — sutil no rodapé */}
      <div className="flex-shrink-0 flex items-center justify-center py-3 border-t" style={{ borderColor: T.border }}>
        <button
          onClick={() => {
            const latest = VERSION_NOTES[0];
            if (latest) {
              toast(
                `v${latest.version} (${latest.date})\n${latest.changes.map(c => `• ${c}`).join('\n')}`,
                { duration: 6000, icon: '📋', style: { maxWidth: '420px', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.5' } }
              );
            }
          }}
          className="text-[9px] font-medium tracking-wider transition-all hover:opacity-100"
          style={{ color: T.textFaint, opacity: 0.4 }}
          title={`CarrosselPro v${APP_VERSION}`}
        >
          v{APP_VERSION}
        </button>
      </div>
    </div>
  );
}

// ── App Viewer/Editor ─────────────────────────────────────────────────────────
function CarrosselApp({ session, onLogout }: { session: any; onLogout: () => void }) {
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
  const setExportFormat = useStore(state => state.setExportFormat);
  const brandKits = useStore(state => state.brandKits);
  const saveBrandKit = useStore(state => state.saveBrandKit);
  const deleteBrandKit = useStore(state => state.deleteBrandKit);
  const applyBrandKit = useStore(state => state.applyBrandKit);

  const { isAdmin } = useAdmin();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const globalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState('');
  const swipeTouchStart = useRef<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
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
        setSlideDirection('left');
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
  // Mobile: false = editor+preview integrado (padrão), true = full canvas gallery
  const [mobilePreviewMode, setMobilePreviewMode] = useState(false);
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

    restoreFromCloud();

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

  // Auto-save status é controlado pelo useAutoSave hook
  const [autoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');


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

      toast.success('Projeto salvo com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar o projeto');
    } finally {
      setSavingProject(false);
    }
  }, [currentProjectId, setCurrentProjectId, sections, config, exportRefs]);

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

  // Novo Carrossel
  const setSections = useStore(state => state.setSections);
  const handleNewCarousel = () => {
    if (sections.length > 0 && !confirm('Criar um novo carrossel? O atual será salvo automaticamente.')) return;
    setSections([]);
    setTextInput('');
    toast.success('Pronto! Comece um novo carrossel.');
  };

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
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
            color: T.textPrimary,
            border: `1px solid ${T.border}`,
            backdropFilter: 'blur(20px)',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '13px',
          },
          success: { iconTheme: { primary: T.accent, secondary: T.accentText } },
        }}
      />

      {/* ══════════════════════════════════════
          SIDEBAR — desktop sticky
      ══════════════════════════════════════ */}
      <aside
        className="hidden lg:flex w-[460px] flex-shrink-0 flex-col max-h-screen sticky top-0 z-20 transition-colors duration-300"
        style={{ background: T.sidebar, borderRight: `1px solid ${T.border}` }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

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
        className={`flex-1 flex flex-col transition-colors duration-300 pb-24 lg:pb-0 ${mobileActiveTab !== 'preview' ? 'hidden lg:flex' : ''}`}
        style={{ background: T.bgCanvas, height: '100dvh', overflow: 'hidden' }}
      >

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
                  onClick={() => { setSlideDirection('right'); setActiveSlide(activeSlide - 1); setIsAutoPlaying(false); }}
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
                  onClick={() => { setSlideDirection('left'); setActiveSlide(activeSlide + 1); setIsAutoPlaying(false); }}
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

      {/* ── Custom Confirm Modal — Novo Carrossel ── */}
      {showNewConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setShowNewConfirm(false)}
          />
          {/* Card */}
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
              border: `1px solid ${T.border}`,
              boxShadow: `0 24px 80px rgba(0,0,0,0.5)`,
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div className="px-6 pt-7 pb-5 text-center">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}25` }}
              >
                <FileText size={24} style={{ color: T.accent }} />
              </div>
              <h3 className="text-base font-black mb-1.5" style={{ color: T.textPrimary, letterSpacing: '-0.02em' }}>
                Criar Novo Carrossel?
              </h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: T.textSub }}>
                O carrossel atual será descartado. Você pode salvar o projeto antes de continuar.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowNewConfirm(false)}
                className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                style={{ background: T.glass, color: T.textSub, border: `1px solid ${T.border}` }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  useStore.getState().setSections([]);
                  setActiveSlide(0);
                  setTextInput('');
                  setShowNewConfirm(false);
                  toast.success('Novo carrossel criado!');
                }}
                className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                style={{ background: T.accent, color: T.accentText, boxShadow: `0 4px 20px ${T.accent}40` }}
              >
                Criar Novo
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}

// ── Aplicação Autenticada ───────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Initial session check — also picks up OAuth tokens from URL hash (#access_token=...)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);

      // If we got a session from hash params (OAuth redirect), clean up the URL
      if (session && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email);
      setSession(session);

      // OAuth redirect: when user returns from Google/GitHub, the session is picked up here
      if (event === 'SIGNED_IN' && session) {
        setAuthLoading(false);
        // Clean up the URL hash if present
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      const email = session.user.email ?? '';
      // Set admin flag based on email so font dropdowns show PRO fonts immediately
      const adminEmails = ['kaiqueseditor@gmail.com', 'agente.kaique@gmail.com'];
      useStore.getState().setAdmin(adminEmails.includes(email.toLowerCase()));
      useStore.getState().setUserEmail(email || null);

      // ── Migração de fontes ao fazer login ────────────────────────────────
      // Corrige seções salvas com fontes genéricas (anteriores à implementação de fontes por usuário)
      const isTimePrimoUser = email === 'marcela.depaula@timeprimo.com' || email === 'lorena.volpini@timeprimo.com';
      const isAdminUser = email === 'kaiqueseditor@gmail.com' || email === 'agente.kaique@gmail.com';
      if (isTimePrimoUser || isAdminUser) {
        const targetTitle = isTimePrimoUser ? 'filson-pro-bold' : 'wide';
        const targetBody  = isTimePrimoUser ? 'open-sans' : 'montserrat';
        // Fontes genéricas que indicam que o slide ainda não foi personalizado
        const genericTitles = new Set(['plus-jakarta', 'sans', 'bebas-neue', 'montserrat', 'wide', 'filson-pro-bold']);
        const genericBodies  = new Set(['sans', 'plus-jakarta', 'montserrat', 'open-sans', 'filson-pro-bold']);
        setTimeout(() => {
          const { sections, updateSection } = useStore.getState();
          sections.forEach(s => {
            const wTitle = !s.titleFont || genericTitles.has(s.titleFont);
            const wBody  = !s.bodyFont  || genericBodies.has(s.bodyFont);
            if (wTitle || wBody) {
              updateSection(s.id, {
                ...(wTitle ? { titleFont: targetTitle } : {}),
                ...(wBody  ? { bodyFont: targetBody }  : {}),
              });
            }
          });
        }, 800); // Aguarda a restauração do cloud/localStorage
      }
      // ────────────────────────────────────────────────────────────────────

      // Log login (best-effort)
      cloudStorage.logLogin(session.user.id, email).catch(() => {});
    } else {
      useStore.getState().setAdmin(false);
      useStore.getState().setUserEmail(null);
    }
  }, [session]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#000' }}>
        <Loader2 className="animate-spin text-[#00E5C3]" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.03)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              fontSize: '11px',
              fontFamily: 'Inter',
              fontWeight: 600,
              letterSpacing: '0.05em',
            },
          }}
        />
        <LoginPage onLogin={(user) => setSession({ user })} />
      </>
    );
  }

  return <CarrosselApp session={session} onLogout={async () => {
    clearAdminCache();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut falhou, forçando reload:', e);
    }
    // Força reload para limpar qualquer estado residual
    window.location.reload();
  }} />;
}
