import React, { useRef, lazy, Suspense, useState } from 'react';
import {
  Type as TypeIcon, ChevronLeft, ChevronRight,
  Upload, Wand2, Eye, Download, Loader2, Sun, Moon, Palette, FileText, ChevronDown,
  PanelLeft, X,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { CarouselSlide } from './components/carousel/CarouselSlide';
import { SlideEditor } from './components/editor/SlideEditor';
import { useStore } from './store';
import { useProcessText } from './hooks/useProcessText';
import { useExport } from './hooks/useExport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFileUpload } from './hooks/useFileUpload';
import { ExportPreview } from './components/export/ExportPreview';
import { getTheme } from './constants/theme';
import type { ThemeTokens } from './constants/theme';
import type { Section, ProjectConfig } from './types/carousel.types';

const AgentChat = lazy(() => import('./components/chat/AgentChat'));
const ImageAgentChat = lazy(() => import('./components/chat/ImageAgentChat'));

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
  setAgentOpen: (v: boolean) => void;
  setImageAgentOpen: (open: boolean, id?: string | null) => void;
  setActiveSlide: (idx: number) => void;
  toggleTheme: () => void;
}

function SidebarContent({
  T, isDark, textInput, setTextInput, profileOpen, setProfileOpen,
  setMobileSidebarOpen, config, sections, activeSlide, isProcessing,
  globalAvatarInputRef, handleProcessText, updateConfig, handleAvatarUpload,
  setAgentOpen, setImageAgentOpen, setActiveSlide, toggleTheme,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="p-5 sm:p-7">

        {/* ── Header ── */}
        <header className="mb-7 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            {/* Mobile: botão fechar */}
            <button
              className="lg:hidden p-1.5 rounded-lg transition-all active:scale-90"
              style={{ color: T.textDim }}
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Fechar painel"
            >
              <X size={18} />
            </button>
            <h1
              className="font-black leading-none truncate"
              style={{
                color: T.textPrimary,
                letterSpacing: '-0.05em',
                fontSize: '1.2rem',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Kaique<span style={{ color: T.textDim }}>.</span>Editor
            </h1>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setAgentOpen(true)}
              title="Agente de Texto"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 active:opacity-70"
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}
            >
              <FileText size={14} />
              <span className="text-[9px] font-black uppercase tracking-wide hidden sm:inline">Texto</span>
            </button>

            <button
              onClick={() => {
                const id = sections[activeSlide]?.id;
                setImageAgentOpen(true, id || null);
              }}
              title="Agente de Imagem"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 active:opacity-70"
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}
            >
              <Palette size={14} />
              <span className="text-[9px] font-black uppercase tracking-wide hidden sm:inline">Imagem</span>
            </button>

            <button
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
              className="p-2 rounded-xl transition-all active:scale-95 active:opacity-70"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <div className="mb-6 h-px" style={{ background: T.border }} />

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
              placeholder="Cole aqui seu texto ou roteiro..."
              className="w-full h-32 px-4 py-3 text-sm rounded-2xl outline-none resize-none transition-all"
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

            {/* Stepper frames + Gerar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0"
                style={{ background: T.glass, border: `1px solid ${T.border}` }}>
                <button
                  onClick={() => updateConfig({ numSlides: Math.max(3, config.numSlides - 1) })}
                  disabled={config.numSlides <= 3}
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-base transition-all disabled:opacity-20 active:scale-90"
                  style={{ color: T.textPrimary }}
                >−</button>
                <span className="font-black text-sm tabular-nums px-2" style={{ color: T.textPrimary }}>
                  {config.numSlides}
                </span>
                <button
                  onClick={() => updateConfig({ numSlides: Math.min(15, config.numSlides + 1) })}
                  disabled={config.numSlides >= 15}
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-base transition-all disabled:opacity-20 active:scale-90"
                  style={{ color: T.textPrimary }}
                >+</button>
              </div>
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
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

          {/* ── Perfil — accordion ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all active:opacity-70"
              style={{ background: T.glass }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: `1.5px solid ${T.border}` }}>
                  <img src={config.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                  {config.branding || 'Identidade do criador'}
                </span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: T.textFaint,
                  transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms',
                }}
              />
            </button>

            {profileOpen && (
              <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${T.border}`, background: T.glass }}>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => globalAvatarInputRef.current?.click()}
                    className="relative flex-shrink-0 cursor-pointer"
                    style={{ width: 48, height: 48 }}
                  >
                    <img src={config.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl"
                      style={{ border: `2px solid ${T.border}` }} />
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <Upload size={12} color="#ffffff" />
                    </div>
                    <input type="file" ref={globalAvatarInputRef} className="hidden" accept="image/*"
                      onChange={e => handleAvatarUpload(e, (url) => updateConfig({ avatarUrl: url }))} />
                  </div>
                  <input
                    type="text" placeholder="Seu Nome Completo"
                    value={config.branding}
                    onChange={e => updateConfig({ branding: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all"
                    style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: T.textFaint }}>@ Handle</p>
                    <input
                      type="text" placeholder="@usuario"
                      value={config.handle}
                      onChange={e => updateConfig({ handle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all"
                      style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary, fontFamily: 'monospace' }}
                      onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                      onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                    />
                  </div>
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: T.textFaint }}>Marca D'água</p>
                    <input
                      type="text" placeholder="@usuario"
                      value={config.watermark}
                      onChange={e => updateConfig({ watermark: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all"
                      style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textPrimary, fontFamily: 'monospace' }}
                      onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                      onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </section>
      </div>

      {/* ── Lista de frames ── */}
      {sections.length > 0 && (
        <div className="px-5 sm:px-7 pb-24 space-y-4 transition-colors duration-300"
          style={{ borderTop: `1px solid ${T.border}` }}>
          <p className="text-[8px] font-black uppercase tracking-widest px-1 pt-5 mb-2"
            style={{ color: T.textFaint }}>
            {sections.length} Frame{sections.length !== 1 ? 's' : ''} · Clique para editar
          </p>
          {sections.map((s, idx) => (
            <SlideEditor
              key={s.id}
              section={s}
              index={idx}
              isActive={activeSlide === idx}
              onClick={() => {
                setActiveSlide(idx);
                if (window.innerWidth < 1024) setMobileSidebarOpen(false);
              }}
              theme={isDark ? 'dark' : 'light'}
              T={T}
              onOpenImageAgent={(id) => setImageAgentOpen(true, id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const sections = useStore(state => state.sections);
  const activeSlide = useStore(state => state.activeSlide);
  const config = useStore(state => state.config);
  const isAgentOpen = useStore(state => state.isAgentOpen);
  const showExportPreview = useStore(state => state.showExportPreview);
  const generatingIds = useStore(state => state.generatingIds);
  const theme = useStore(state => state.theme);
  const isImageAgentOpen = useStore(state => state.isImageAgentOpen);
  const imageAgentSectionId = useStore(state => state.imageAgentSectionId);

  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setAgentOpen = useStore(state => state.setAgentOpen);
  const setShowExportPreview = useStore(state => state.setShowExportPreview);
  const updateConfig = useStore(state => state.updateConfig);
  const toggleTheme = useStore(state => state.toggleTheme);
  const setImageAgentOpen = useStore(state => state.setImageAgentOpen);

  const { processText, isProcessing } = useProcessText();
  const { exportRefs, exportAll, isExporting, exportStep } = useExport();
  const { handleAvatarUpload } = useFileUpload();
  useKeyboardShortcuts();

  const globalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState('');
  const swipeTouchStart = useRef<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const T = getTheme(theme);
  const isDark = theme === 'dark';

  const handleProcessText = () => {
    if (!textInput.trim()) {
      toast.error('Cole um texto ou roteiro primeiro!');
      return;
    }
    processText(textInput);
  };

  const handleAgentApply = (text: string) => {
    setTextInput(text);
    processText(text);
    setAgentOpen(false);
    toast.success('Roteiro aplicado! Gerando carrossel...');
  };

  // Props compartilhadas para SidebarContent
  const sidebarProps: SidebarContentProps = {
    T, isDark, textInput, setTextInput, profileOpen, setProfileOpen,
    mobileSidebarOpen, setMobileSidebarOpen, config, sections, activeSlide,
    isProcessing, globalAvatarInputRef, handleProcessText,
    updateConfig,
    handleAvatarUpload, setAgentOpen,
    setImageAgentOpen,
    setActiveSlide, toggleTheme,
  };

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
          MOBILE SIDEBAR — overlay sheet (esquerda)
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
          CANVAS PRINCIPAL
      ══════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden transition-colors duration-300"
        style={{ background: T.bgCanvas, minHeight: '100dvh' }}
      >
        {/* Mobile top bar */}
        <div className="lg:hidden w-full flex items-center justify-between mb-4 px-1">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-90"
            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}
          >
            <PanelLeft size={15} />
            <span className="text-[9px] font-black uppercase tracking-wide">Editar</span>
          </button>

          <h1
            className="font-black"
            style={{
              color: T.textPrimary,
              letterSpacing: '-0.04em',
              fontSize: '1rem',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Kaique<span style={{ color: T.textDim }}>.</span>Editor
          </h1>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all active:scale-90"
            style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Nós de exportação ocultos */}
        <div className="fixed -left-[10000px] -top-[10000px]">
          {sections.map((s, idx) => (
            <CarouselSlide
              key={`exp-${s.id}`}
              innerRef={el => { exportRefs.current[idx] = el; }}
              section={s}
              config={config}
              index={idx}
              total={sections.length}
              isExport={true}
              isGenerating={generatingIds.includes(s.id)}
            />
          ))}
        </div>

        {sections.length > 0 ? (
          <div className="w-full flex flex-col items-center gap-5">

            {/* ── Preview ── */}
            <div
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
                maxWidth: 'min(420px, 88vw)',
                aspectRatio: '1080 / 1440',
                borderRadius: '2rem',
                boxShadow: isDark
                  ? '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)'
                  : '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
              }}
            >
              <CarouselSlide
                section={sections[activeSlide]}
                config={config}
                index={activeSlide}
                total={sections.length}
                isExport={false}
                isGenerating={generatingIds.includes(sections[activeSlide].id)}
                onAvatarClick={() => globalAvatarInputRef.current?.click()}
              />
            </div>

            {/* ── Navegação ── */}
            <div className="flex items-center gap-3">
              <button
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(activeSlide - 1)}
                className="p-2.5 rounded-xl transition-all disabled:opacity-20 active:scale-90"
                style={{ color: T.textPrimary, background: T.glass, border: `1px solid ${T.border}` }}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1.5">
                {sections.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
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
                onClick={() => setActiveSlide(activeSlide + 1)}
                className="p-2.5 rounded-xl transition-all disabled:opacity-20 active:scale-90"
                style={{ color: T.textPrimary, background: T.glass, border: `1px solid ${T.border}` }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* ── Ações ── */}
            <div className="flex gap-3 w-full" style={{ maxWidth: 'min(420px, 88vw)' }}>
              <button
                onClick={() => setShowExportPreview(true)}
                className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 active:opacity-70"
                style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textSub }}
              >
                <Eye size={15} /> Revisar
              </button>
              <button
                onClick={() => exportAll(sections)}
                disabled={isExporting}
                className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isExporting ? T.glassMd : T.accent,
                  color: isExporting ? T.textDim : T.accentText,
                  boxShadow: isExporting ? 'none' : `0 8px 28px ${T.accentGlow}`,
                  border: `1px solid ${isExporting ? T.border : 'transparent'}`,
                }}
              >
                {isExporting
                  ? <><Loader2 className="animate-spin" size={14} /><span>{exportStep?.toUpperCase()}</span></>
                  : <><Download size={15} /><span>Exportar</span></>
                }
              </button>
            </div>

          </div>
        ) : (
          /* ── Empty State ── */
          <div className="text-center max-w-xs animate-fade-in flex flex-col items-center gap-6 px-4">
            <div>
              <h2
                className="font-black tracking-tighter"
                style={{
                  color: T.textPrimary,
                  fontSize: '2.5rem',
                  letterSpacing: '-0.05em',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1,
                }}
              >
                Kaique<span style={{ color: T.textDim }}>.</span>Editor
              </h2>
              <p className="text-sm font-light leading-relaxed mt-3" style={{ color: T.textDim }}>
                Cole seu roteiro na sidebar e clique em Gerar — ou use o Agente de Texto para criar do zero.
              </p>
            </div>

            <button
              onClick={() => setAgentOpen(true)}
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
              style={{
                background: T.accent,
                color: T.accentText,
                boxShadow: `0 10px 32px ${T.accentGlow}`,
              }}
            >
              <FileText size={18} /> Agente de Texto
            </button>

            <p className="text-xs hidden lg:block" style={{ color: T.textFaint }}>
              Atalho de teclado{' '}
              <kbd className="px-2 py-1 rounded-lg text-xs font-mono mx-0.5"
                style={{ background: T.glass, color: T.textDim, border: `1px solid ${T.border}` }}>
                ⌘K
              </kbd>
            </p>
          </div>
        )}

        {/* ── Mobile FAB ── */}
        {sections.length > 0 && (
          <button
            className="lg:hidden fixed bottom-6 right-5 z-50 flex items-center gap-2 px-4 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-90"
            style={{
              background: T.accent,
              color: T.accentText,
              boxShadow: `0 8px 28px ${T.accentGlow}`,
            }}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <PanelLeft size={16} />
            Slides
          </button>
        )}
      </main>

      {/* ══════════════════════════════════════
          DRAWERS (AgentChat e ImageAgentChat)
      ══════════════════════════════════════ */}
      <Suspense fallback={null}>
        {isAgentOpen && (
          <AgentChat
            isOpen={isAgentOpen}
            onClose={() => setAgentOpen(false)}
            onApplyText={handleAgentApply}
            T={T}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isImageAgentOpen && (
          <ImageAgentChat
            isOpen={isImageAgentOpen}
            onClose={() => setImageAgentOpen(false)}
            sectionId={imageAgentSectionId}
            T={T}
          />
        )}
      </Suspense>

      {showExportPreview && (
        <ExportPreview
          sections={sections}
          config={config}
          generatingIds={generatingIds}
          isExporting={isExporting}
          exportStep={exportStep}
          onClose={() => setShowExportPreview(false)}
          onExport={() => exportAll(sections)}
        />
      )}
    </div>
  );
}
