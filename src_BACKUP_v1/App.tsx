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
  // Store state
  const sections = useStore(state => state.sections);
  const activeSlide = useStore(state => state.activeSlide);
  const config = useStore(state => state.config);
  const isAgentOpen = useStore(state => state.isAgentOpen);
  const showExportPreview = useStore(state => state.showExportPreview);
  const generatingIds = useStore(state => state.generatingIds);

  // Store actions
  const setActiveSlide = useStore(state => state.setActiveSlide);
  const setAgentOpen = useStore(state => state.setAgentOpen);
  const setShowExportPreview = useStore(state => state.setShowExportPreview);
  const updateConfig = useStore(state => state.updateConfig);

  // Hooks
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
    <div className="min-h-screen flex flex-col lg:flex-row text-slate-900 bg-[#020617]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        }}
      />

      {/* ====== SIDEBAR ====== */}
      <aside className="w-full lg:w-[500px] bg-white border-r border-slate-200 overflow-y-auto max-h-screen lg:sticky lg:top-0 shadow-2xl z-20 no-scrollbar">
        <div className="p-8">
          {/* Header */}
          <header className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-black rounded-2xl text-white shadow-xl flex items-center justify-center w-14 h-14">
                <Sparkles size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-[#0f172a] leading-tight">Kaique.Editor</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] -mt-1">Metodologia Viral IA</p>
              </div>
            </div>
            <button
              onClick={() => setAgentOpen(true)}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group border border-indigo-100"
            >
              <Bot size={24} className="group-hover:animate-bounce" />
              <div className="hidden sm:block text-left">
                <p className="text-[8px] font-black uppercase tracking-tighter">Fale com o</p>
                <p className="text-[10px] font-black uppercase leading-none">AGENTE IA</p>
              </div>
            </button>
          </header>

          <section className="space-y-8">
            {/* Profile */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                <User size={14} /> Perfil de Conteúdo
              </div>
              <div className="flex items-center gap-6">
                <div
                  onClick={() => globalAvatarInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden cursor-pointer relative group flex-shrink-0 shadow-lg border-2 border-white"
                >
                  <img src={config.avatarUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={18} className="text-white" />
                  </div>
                  <input
                    type="file"
                    ref={globalAvatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={e => handleAvatarUpload(e, (url) => updateConfig({ avatarUrl: url }))}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-white text-black focus:ring-2 focus:ring-black transition-all shadow-sm"
                    placeholder="Seu Nome"
                    value={config.branding}
                    onChange={e => updateConfig({ branding: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-white text-black focus:ring-2 focus:ring-black transition-all shadow-sm"
                    placeholder="@seu.identificador"
                    value={config.signature}
                    onChange={e => updateConfig({ signature: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Slide Count */}
            <div>
              <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-slate-500">
                <div className="flex items-center gap-2"><Layers size={14} /> Slides (6-10 ideal)</div>
                <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black">{config.numSlides}</span>
              </label>
              <input
                type="range" min={6} max={10}
                value={config.numSlides}
                onChange={e => updateConfig({ numSlides: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg accent-black appearance-none cursor-pointer"
              />
            </div>

            {/* Text Input */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 text-slate-500">
                <TypeIcon size={14} /> Texto Referência / Roteiro IA
              </label>
              <textarea
                placeholder="Cole aqui ou fale com o Agente IA..."
                className="w-full h-44 p-4 text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-100 outline-none resize-none font-medium bg-white text-black shadow-sm"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-black hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl transition-all shadow-xl text-sm uppercase tracking-widest"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                Distribuir nos Slides
              </button>
            </div>
          </section>
        </div>

        {/* Slides List */}
        {sections.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-8 space-y-8 pb-24">
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

      {/* ====== MAIN CANVAS ====== */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-slate-900/50">
        {/* Hidden export elements */}
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
          <div className="w-full max-w-lg flex flex-col gap-10">
            {/* Navigation */}
            <div className="flex items-center justify-between bg-white/5 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/10 shadow-2xl">
              <button
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(activeSlide - 1)}
                className="p-3 text-white disabled:opacity-20 hover:scale-125 transition-all"
              >
                <ChevronLeft size={44} />
              </button>
              <div className="text-center text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-1 opacity-40">Visualização</p>
                <p className="font-black text-4xl tabular-nums">
                  {activeSlide + 1} <span className="text-slate-600 text-xl font-light">/ {sections.length}</span>
                </p>
              </div>
              <button
                disabled={activeSlide === sections.length - 1}
                onClick={() => setActiveSlide(activeSlide + 1)}
                className="p-3 text-white disabled:opacity-20 hover:scale-125 transition-all"
              >
                <ChevronRight size={44} />
              </button>
            </div>

            {/* Current Slide Preview */}
            <div className="relative rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 transition-all transform hover:scale-[1.01]">
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

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => setShowExportPreview(true)}
                className="py-6 bg-white/10 text-white rounded-[2rem] text-[11px] font-black border border-white/10 hover:bg-white/20 transition-all uppercase tracking-[0.4em] flex items-center justify-center gap-3"
              >
                <Eye size={18} /> Revisar Todos
              </button>
              <button
                onClick={() => exportAll(sections)}
                disabled={isExporting}
                className="py-6 bg-white text-black rounded-[2rem] text-[11px] font-black hover:bg-indigo-50 transition-all uppercase tracking-[0.4em] flex items-center justify-center gap-3"
              >
                {isExporting
                  ? <><Loader2 className="animate-spin" size={20} /><span>{exportStep?.toUpperCase()}</span></>
                  : <><Download size={20} /><span>Exportar ZIP</span></>
                }
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center text-white max-w-lg animate-fade-in">
            <div className="w-32 h-32 bg-indigo-600/20 rounded-[4rem] flex items-center justify-center mx-auto mb-12 border border-indigo-500/30 animate-pulse">
              <Sparkles size={64} className="text-indigo-400" />
            </div>
            <h2 className="text-7xl font-black italic mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
              Kaique.Editor
            </h2>
            <p className="text-slate-400 text-2xl font-light leading-relaxed">
              Sua jornada viral começa aqui. Use o Agente IA Estrategista para criar o roteiro perfeito.
            </p>
            <button
              onClick={() => setAgentOpen(true)}
              className="mt-12 mx-auto flex items-center gap-4 bg-indigo-600 hover:bg-indigo-500 px-10 py-5 rounded-[2rem] text-white font-black uppercase tracking-widest transition-all shadow-2xl"
            >
              <Bot size={24} /> Falar com Agente IA
            </button>

            {/* Keyboard shortcut hint */}
            <p className="mt-6 text-slate-600 text-sm">
              Atalho: <kbd className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-xs font-mono">⌘K</kbd> para abrir o Agente IA
            </p>
          </div>
        )}
      </main>

      {/* ====== MODALS ====== */}
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
