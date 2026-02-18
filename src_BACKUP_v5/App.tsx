import React, { useRef, lazy, Suspense } from 'react';
import {
  Type as TypeIcon, Layers, ChevronLeft, ChevronRight,
  Upload, Wand2, Eye, Download, Loader2, User, Sun, Moon, Palette, FileText,
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

const AgentChat = lazy(() => import('./components/chat/AgentChat'));
const ImageAgentChat = lazy(() => import('./components/chat/ImageAgentChat'));

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
  const [textInput, setTextInput] = React.useState('');

  // Theme tokens
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

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors duration-300"
      style={{ background: T.bgCanvas }}
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
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside
        className="w-full lg:w-[460px] flex-shrink-0 overflow-y-auto max-h-screen lg:sticky lg:top-0 z-20 no-scrollbar transition-colors duration-300"
        style={{
          background: T.sidebar,
          borderRight: `1px solid ${T.border}`,
        }}
      >
        <div className="p-8">

          {/* ── Header ── */}
          <header className="mb-8 flex items-center justify-between gap-3">
            {/* Logo — wordmark puro, sem ícone */}
            <div className="min-w-0">
              <h1
                className="font-black leading-none truncate"
                style={{
                  color: T.textPrimary,
                  letterSpacing: '-0.05em',
                  fontSize: '1.25rem',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Kaique<span style={{ color: T.textDim }}>.</span>Editor
              </h1>
            </div>

            {/* Right actions: Agente Texto | Agente Imagem | Tema */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Agente Texto */}
              <button
                onClick={() => setAgentOpen(true)}
                title="Agente de Texto"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  color: T.textSub,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = T.cardHover;
                  (e.currentTarget as HTMLElement).style.color = T.textPrimary;
                  (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = T.card;
                  (e.currentTarget as HTMLElement).style.color = T.textSub;
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                }}
              >
                <FileText size={15} />
                <span className="hidden sm:block text-[9px] font-black uppercase tracking-wide">Texto</span>
              </button>

              {/* Agente Imagem */}
              <button
                onClick={() => {
                  const id = sections[activeSlide]?.id;
                  setImageAgentOpen(true, id || null);
                }}
                title="Agente de Imagem"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  color: T.textSub,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = T.cardHover;
                  (e.currentTarget as HTMLElement).style.color = T.textPrimary;
                  (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = T.card;
                  (e.currentTarget as HTMLElement).style.color = T.textSub;
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                }}
              >
                <Palette size={15} />
                <span className="hidden sm:block text-[9px] font-black uppercase tracking-wide">Imagem</span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Modo claro' : 'Modo escuro'}
                className="p-2.5 rounded-xl transition-all"
                style={{
                  background: T.glass,
                  border: `1px solid ${T.border}`,
                  color: T.textDim,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = T.glassMd;
                  (e.currentTarget as HTMLElement).style.color = T.textPrimary;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = T.glass;
                  (e.currentTarget as HTMLElement).style.color = T.textDim;
                }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>

          {/* ── Divider ── */}
          <div className="mb-7 h-px" style={{ background: T.border }} />

          <section className="space-y-6">

            {/* ── Perfil ── */}
            <div
              className="p-5 rounded-3xl transition-colors duration-300"
              style={{ background: T.glass, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest mb-5"
                style={{ color: T.textFaint }}>
                <User size={11} /> Identidade
              </div>

              {/* Avatar + Nome */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  onClick={() => globalAvatarInputRef.current?.click()}
                  className="relative flex-shrink-0 cursor-pointer group"
                  style={{ width: 56, height: 56 }}
                >
                  <img
                    src={config.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-2xl"
                    style={{ border: `2px solid ${T.border}` }}
                  />
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <Upload size={13} color="#ffffff" />
                  </div>
                  <input
                    type="file" ref={globalAvatarInputRef} className="hidden" accept="image/*"
                    onChange={e => handleAvatarUpload(e, (url) => updateConfig({ avatarUrl: url }))}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>
                    Nome do criador
                  </p>
                  <input
                    type="text"
                    placeholder="Kaique Torres"
                    value={config.branding}
                    onChange={e => updateConfig({ branding: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
                    style={{
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                  />
                </div>
              </div>

              {/* Handle + Watermark — separados */}
              <div className="space-y-3">
                {/* @handle — aparece nos slides Twitter/social */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      @ Instagram
                    </p>
                    <span className="text-[8px] font-medium px-2 py-0.5 rounded-full" style={{ background: T.glassMd, color: T.textDim }}>
                      Formato Twitter
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="@kaique.editor"
                    value={config.handle}
                    onChange={e => updateConfig({ handle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
                    style={{
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary,
                      fontFamily: 'monospace',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                  />
                </div>

                {/* Marca d'água — rodapé de todos os slides */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                      Marca D'água
                    </p>
                    <span className="text-[8px] font-medium px-2 py-0.5 rounded-full" style={{ background: T.glassMd, color: T.textDim }}>
                      Rodapé do carrossel
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="@kaique.editor"
                    value={config.watermark}
                    onChange={e => updateConfig({ watermark: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
                    style={{
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary,
                      fontFamily: 'monospace',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.inputFocus; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; }}
                  />
                  <p className="text-[8px] mt-1.5 px-0.5" style={{ color: T.textFaint }}>
                    Aparece discreto no rodapé — quase invisível, só para proteção
                  </p>
                </div>
              </div>
            </div>

            {/* ── Qtd de frames do carrossel ── */}
            <div className="px-1">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest mb-3"
                style={{ color: T.textFaint }}>
                <Layers size={11} style={{ color: T.textDim }} /> Frames do Carrossel
              </p>
              <div
                className="flex items-center justify-between p-1.5 rounded-2xl"
                style={{ background: T.glass, border: `1px solid ${T.border}` }}
              >
                <button
                  onClick={() => updateConfig({ numSlides: Math.max(3, config.numSlides - 1) })}
                  disabled={config.numSlides <= 3}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all disabled:opacity-20"
                  style={{ background: T.glassMd, color: T.textPrimary }}
                  onMouseEnter={e => { if (config.numSlides > 3) (e.currentTarget as HTMLElement).style.background = T.card; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.glassMd; }}
                >
                  −
                </button>
                <div className="text-center">
                  <span className="font-black text-2xl tabular-nums" style={{ color: T.textPrimary }}>
                    {config.numSlides}
                  </span>
                  <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: T.textFaint }}>
                    frames
                  </p>
                </div>
                <button
                  onClick={() => updateConfig({ numSlides: Math.min(15, config.numSlides + 1) })}
                  disabled={config.numSlides >= 15}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all disabled:opacity-20"
                  style={{ background: T.glassMd, color: T.textPrimary }}
                  onMouseEnter={e => { if (config.numSlides < 15) (e.currentTarget as HTMLElement).style.background = T.card; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.glassMd; }}
                >
                  +
                </button>
              </div>
            </div>

            {/* ── Textarea ── */}
            <div>
              <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest mb-3"
                style={{ color: T.textFaint }}>
                <TypeIcon size={11} style={{ color: T.textDim }} /> Roteiro do Carrossel
              </label>
              <textarea
                placeholder="Cole aqui seu texto ou roteiro para o carrossel..."
                className="w-full h-36 px-4 py-3.5 text-sm rounded-2xl outline-none resize-none transition-all"
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
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full mt-3 flex items-center justify-center gap-3 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                style={{
                  background: isProcessing || !textInput.trim() ? T.glass : T.accent,
                  color: isProcessing || !textInput.trim() ? T.textFaint : T.accentText,
                  boxShadow: isProcessing || !textInput.trim() ? 'none' : `0 4px 20px ${T.accentGlow}`,
                  cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer',
                  border: `1px solid ${isProcessing || !textInput.trim() ? T.border : 'transparent'}`,
                }}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isProcessing ? 'Processando...' : 'Gerar Carrossel'}
              </button>
            </div>

          </section>
        </div>

        {/* ── Lista de slides ── */}
        {sections.length > 0 && (
          <div className="p-8 pt-2 space-y-4 pb-28 transition-colors duration-300"
            style={{ borderTop: `1px solid ${T.border}` }}>
            <p className="text-[8px] font-black uppercase tracking-widest px-1 mb-4"
              style={{ color: T.textFaint }}>
              {sections.length} Frame{sections.length !== 1 ? 's' : ''} · Clique para editar
            </p>
            {sections.map((s, idx) => (
              <SlideEditor
                key={s.id}
                section={s}
                index={idx}
                isActive={activeSlide === idx}
                onClick={() => setActiveSlide(idx)}
                theme={theme}
                T={T}
                onOpenImageAgent={(id) => setImageAgentOpen(true, id)}
              />
            ))}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════
          CANVAS PRINCIPAL
      ══════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-300"
        style={{ background: T.bgCanvas }}
      >
        {/* Hidden export nodes */}
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
          <div className="w-full flex flex-col items-center gap-7">

            {/* ── Contador de slides ── */}
            <div
              className="flex items-center gap-6 px-7 py-3.5 rounded-2xl transition-colors duration-300"
              style={{
                background: T.glass,
                border: `1px solid ${T.border}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(activeSlide - 1)}
                className="p-2 rounded-xl transition-all disabled:opacity-20"
                style={{ color: T.textPrimary }}
                onMouseEnter={e => { if (activeSlide !== 0) (e.currentTarget as HTMLElement).style.background = T.glassMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center" style={{ minWidth: 72 }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.5em] mb-0.5"
                  style={{ color: T.textFaint }}>Frame</p>
                <p className="font-black text-2xl tabular-nums" style={{ color: T.textPrimary }}>
                  {activeSlide + 1}
                  <span className="text-sm font-light ml-1" style={{ color: T.textFaint }}>
                    / {sections.length}
                  </span>
                </p>
              </div>

              <button
                disabled={activeSlide === sections.length - 1}
                onClick={() => setActiveSlide(activeSlide + 1)}
                className="p-2 rounded-xl transition-all disabled:opacity-20"
                style={{ color: T.textPrimary }}
                onMouseEnter={e => { if (activeSlide !== sections.length - 1) (e.currentTarget as HTMLElement).style.background = T.glassMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* ── Preview do slide — proporção real 3:4 ── */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                width: '100%',
                maxWidth: 370,
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
                onImageClick={(id) => setImageAgentOpen(true, id)}
              />
            </div>

            {/* ── Dots ── */}
            <div className="flex gap-2">
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === activeSlide ? 22 : 6,
                    height: 6,
                    background: i === activeSlide ? T.accent : T.glassMd,
                  }}
                />
              ))}
            </div>

            {/* ── Botões de ação ── */}
            <div className="flex gap-3 w-full" style={{ maxWidth: 370 }}>
              <button
                onClick={() => setShowExportPreview(true)}
                className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  background: T.glass,
                  border: `1px solid ${T.border}`,
                  color: T.textSub,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.glassMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.glass; }}
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
          <div className="text-center max-w-sm animate-fade-in flex flex-col items-center gap-7">
            <div>
              <h2
                className="font-black tracking-tighter mb-3"
                style={{
                  color: T.textPrimary,
                  fontSize: '3rem',
                  letterSpacing: '-0.05em',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1,
                }}
              >
                Kaique<span style={{ color: T.textDim }}>.</span>Editor
              </h2>
              <p className="text-sm font-light leading-relaxed mt-4" style={{ color: T.textDim }}>
                Crie carrosséis virais para o Instagram com IA.
                <br />Comece pelo Agente de Texto.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAgentOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                style={{
                  background: T.accent,
                  color: T.accentText,
                  boxShadow: `0 10px 32px ${T.accentGlow}`,
                }}
              >
                <FileText size={18} /> Agente Texto
              </button>
              <button
                onClick={() => setImageAgentOpen(true, null)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                style={{
                  background: T.glass,
                  color: T.textSub,
                  border: `1px solid ${T.border}`,
                }}
              >
                <Palette size={18} /> Agente Imagem
              </button>
            </div>

            <p className="text-xs" style={{ color: T.textFaint }}>
              Use <kbd className="px-2 py-1 rounded-lg text-xs font-mono mx-1"
                style={{ background: T.glass, color: T.textDim, border: `1px solid ${T.border}` }}>
                ⌘K
              </kbd> para o Agente de Texto
            </p>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════
          MODAIS
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
