import React, { useRef, useState, useMemo } from 'react';
import { Type as TypeIcon, Wand2, Loader2, Sun, Moon, Palette, ChevronDown, X, LayoutTemplate, Droplets, Sparkles, Plus, LogOut, User, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SlideEditor } from '../../components/editor/SlideEditor';
import { useStore } from '../../store';
import { STARTER_TEMPLATES } from '../../constants/starterTemplates';
import type { ThemeTokens } from '../../constants/theme';
import type { Section, ProjectConfig } from '../../types/carousel.types';
import { EXPORT_FORMATS } from '../../types/carousel.types';
import { APP_VERSION, VERSION_NOTES } from '../../version';
import { createDefaultSection, countSlidesFromText, buildTemplateSections } from '../../lib/sections';

// ── Sidebar inner content (reutilizado no desktop e no mobile sheet) ──────────
export interface SidebarContentProps {
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

export function SidebarContent({
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
    const newSections = buildTemplateSections(template, sessionUserEmail);
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
