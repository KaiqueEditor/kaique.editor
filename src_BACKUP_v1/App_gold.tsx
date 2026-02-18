import React, { useRef, lazy, Suspense } from 'react';
import {
  Sparkles, Type as TypeIcon, Layers, ChevronLeft, ChevronRight,
  Upload, Wand2, Eye, Download, Bot, Loader2, User
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

const AgentChat = lazy(() => import('./components/chat/AgentChat'));

export default function App() {
  const sections = useStore(state => state.sections);
  const activeSlide = useStore(state => state.activeSlide);
  const config = useStore(state => state.config);
  const isAgentOpen = useStore(state => state.isAgentOpen);
  const showExportPreview = useStore(state => state.showExportPreview);
  const generatingIds = useStore(state => state.generatingIds);

  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setAgentOpen = useStore(state => state.setAgentOpen);
  const setShowExportPreview = useStore(state => state.setShowExportPreview);
  const updateConfig = useStore(state => state.updateConfig);

  const { processText, isProcessing } = useProcessText();
  const { exportRefs, exportAll, isExporting, exportStep } = useExport();
  const { handleAvatarUpload } = useFileUpload();
  useKeyboardShortcuts();

  const globalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = React.useState('');

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
    toast.success('Roteiro aplicado! Gerando imagens...');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080808]">

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(20,20,20,0.95)',
            color: '#fff',
            border: '1px solid rgba(245,166,35,0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#F5A623', secondary: '#000' } },
        }}
      />

      {/* ══════════════════════════════════════
          SIDEBAR — Apple Glass Noir & Gold
      ══════════════════════════════════════ */}
      <aside className="w-full lg:w-[460px] flex-shrink-0 overflow-y-auto max-h-screen lg:sticky lg:top-0 z-20 no-scrollbar"
        style={{
          background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
          borderRight: '1px solid rgba(245,166,35,0.12)',
        }}
      >
        <div className="p-8">

          {/* ── Header ── */}
          <header className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo pill */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #F5A623, #e08e00)',
                  boxShadow: '0 0 24px rgba(245,166,35,0.4)',
                }}
              >
                <Sparkles size={22} color="#000" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter leading-none"
                  style={{ color: '#F5A623', fontFamily: "'Inter', sans-serif" }}>
                  Kaique.Editor
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.35em] mt-0.5"
                  style={{ color: 'rgba(245,166,35,0.4)' }}>
                  Metodologia Viral IA
                </p>
              </div>
            </div>

            {/* Agent button */}
            <button
              onClick={() => setAgentOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all group"
              style={{
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.2)',
                color: '#F5A623',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.18)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.08)';
              }}
            >
              <Bot size={18} />
              <div className="hidden sm:block text-left">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Fale com o</p>
                <p className="text-[10px] font-black uppercase leading-none">Agente IA</p>
              </div>
            </button>
          </header>

          {/* ── Divider ── */}
          <div className="mb-8 h-px" style={{ background: 'linear-gradient(90deg, rgba(245,166,35,0.3), transparent)' }} />

          <section className="space-y-7">

            {/* ── Perfil ── */}
            <div className="p-5 rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mb-5"
                style={{ color: 'rgba(245,166,35,0.5)' }}>
                <User size={12} /> Perfil de Conteúdo
              </div>
              <div className="flex items-center gap-5">
                <div
                  onClick={() => globalAvatarInputRef.current?.click()}
                  className="relative flex-shrink-0 cursor-pointer group"
                  style={{ width: 72, height: 72 }}
                >
                  <img
                    src={config.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                    style={{ border: '2px solid rgba(245,166,35,0.3)' }}
                  />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <Upload size={16} color="#F5A623" />
                  </div>
                  <input
                    type="file" ref={globalAvatarInputRef} className="hidden" accept="image/*"
                    onChange={e => handleAvatarUpload(e, (url) => updateConfig({ avatarUrl: url }))}
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  {[
                    { placeholder: 'Seu Nome', key: 'branding' as const },
                    { placeholder: '@seu.identificador', key: 'signature' as const },
                  ].map(({ placeholder, key }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={placeholder}
                      value={config[key]}
                      onChange={e => updateConfig({ [key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.5)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Qtd slides ── */}
            <div>
              <label className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                <div className="flex items-center gap-2">
                  <Layers size={12} style={{ color: '#F5A623' }} /> Slides
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
                  {config.numSlides}
                </span>
              </label>
              <input
                type="range" min={6} max={10}
                value={config.numSlides}
                onChange={e => updateConfig({ numSlides: parseInt(e.target.value) })}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#F5A623', background: 'rgba(255,255,255,0.08)' }}
              />
              <div className="flex justify-between text-[8px] mt-1.5 font-bold"
                style={{ color: 'rgba(255,255,255,0.2)' }}>
                <span>6</span><span>10</span>
              </div>
            </div>

            {/* ── Textarea ── */}
            <div>
              <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                <TypeIcon size={12} style={{ color: '#F5A623' }} /> Texto / Roteiro IA
              </label>
              <textarea
                placeholder="Cole aqui seu texto ou roteiro gerado pelo Agente IA..."
                className="w-full h-40 px-5 py-4 text-sm rounded-2xl outline-none resize-none transition-all"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.6,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full mt-3 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                style={{
                  background: isProcessing || !textInput.trim()
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #F5A623, #e08e00)',
                  color: isProcessing || !textInput.trim() ? 'rgba(255,255,255,0.2)' : '#000',
                  boxShadow: isProcessing || !textInput.trim() ? 'none' : '0 8px 32px rgba(245,166,35,0.35)',
                  cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {isProcessing ? 'Processando...' : 'Distribuir nos Slides'}
              </button>
            </div>

          </section>
        </div>

        {/* ── Lista de slides ── */}
        {sections.length > 0 && (
          <div className="p-8 pt-4 space-y-6 pb-28"
            style={{ borderTop: '1px solid rgba(245,166,35,0.08)' }}>
            {sections.map((s, idx) => (
              <SlideEditor
                key={s.id}
                section={s}
                index={idx}
                isActive={activeSlide === idx}
                onClick={() => setActiveSlide(idx)}
              />
            ))}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════
          CANVAS PRINCIPAL
      ══════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(245,166,35,0.04) 0%, #080808 70%)' }}>

        {/* Hidden export nodes — fora da tela */}
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
          <div className="w-full flex flex-col items-center gap-8">

            {/* ── Contador de slides ── */}
            <div className="flex items-center gap-8 px-8 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(activeSlide - 1)}
                className="p-2 rounded-xl transition-all disabled:opacity-20"
                style={{ color: '#F5A623' }}
                onMouseEnter={e => { if (activeSlide !== 0) (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <ChevronLeft size={28} />
              </button>

              <div className="text-center" style={{ minWidth: 80 }}>
                <p className="text-[8px] font-black uppercase tracking-[0.5em] mb-0.5"
                  style={{ color: 'rgba(245,166,35,0.4)' }}>Slide</p>
                <p className="font-black text-3xl tabular-nums" style={{ color: '#fff' }}>
                  {activeSlide + 1}
                  <span className="text-base font-light ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    / {sections.length}
                  </span>
                </p>
              </div>

              <button
                disabled={activeSlide === sections.length - 1}
                onClick={() => setActiveSlide(activeSlide + 1)}
                className="p-2 rounded-xl transition-all disabled:opacity-20"
                style={{ color: '#F5A623' }}
                onMouseEnter={e => { if (activeSlide !== sections.length - 1) (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* ── Preview do slide — proporção real 3:4 ── */}
            <div
              className="relative overflow-hidden transition-all"
              style={{
                width: '100%',
                maxWidth: 380,
                aspectRatio: '1080 / 1440',   /* proporção idêntica ao export */
                borderRadius: '2rem',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.12)',
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

            {/* ── Dots ── */}
            <div className="flex gap-2">
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === activeSlide ? 24 : 6,
                    height: 6,
                    background: i === activeSlide ? '#F5A623' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            {/* ── Botões de ação ── */}
            <div className="flex gap-4 w-full" style={{ maxWidth: 380 }}>
              <button
                onClick={() => setShowExportPreview(true)}
                className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <Eye size={16} /> Revisar
              </button>
              <button
                onClick={() => exportAll(sections)}
                disabled={isExporting}
                className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isExporting ? 'rgba(245,166,35,0.3)' : 'linear-gradient(135deg, #F5A623, #e08e00)',
                  color: '#000',
                  boxShadow: isExporting ? 'none' : '0 8px 32px rgba(245,166,35,0.3)',
                }}
              >
                {isExporting
                  ? <><Loader2 className="animate-spin" size={16} /><span>{exportStep?.toUpperCase()}</span></>
                  : <><Download size={16} /><span>Exportar</span></>
                }
              </button>
            </div>

          </div>
        ) : (
          /* ── Empty State ── */
          <div className="text-center max-w-md animate-fade-in flex flex-col items-center gap-8">
            <div
              className="w-24 h-24 rounded-[2rem] flex items-center justify-center"
              style={{
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.2)',
                boxShadow: '0 0 60px rgba(245,166,35,0.08)',
              }}
            >
              <Sparkles size={40} color="#F5A623" />
            </div>

            <div>
              <h2 className="text-5xl font-black tracking-tighter mb-3"
                style={{
                  background: 'linear-gradient(135deg, #F5A623, rgba(245,166,35,0.4))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                Kaique.Editor
              </h2>
              <p className="text-base font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Transforme textos em carrosséis virais com IA.
                <br />Comece falando com o Agente Estrategista.
              </p>
            </div>

            <button
              onClick={() => setAgentOpen(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #F5A623, #e08e00)',
                color: '#000',
                boxShadow: '0 12px 40px rgba(245,166,35,0.3)',
              }}
            >
              <Bot size={20} /> Falar com Agente IA
            </button>

            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Ou use <kbd className="px-2 py-1 rounded-lg text-xs font-mono mx-1"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ⌘K
              </kbd> para abrir o Agente
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
