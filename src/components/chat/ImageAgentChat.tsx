import React, { useState, useRef, useEffect } from 'react';
import { Palette, X, Send, Loader2, Wand2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { ThemeTokens } from '../../constants/theme';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { useStore } from '../../store';
import { GoogleGenAI } from '@google/genai';
import { renderFormattedText } from '../../utils/formatters';

interface ImageAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string | null;
  T: ThemeTokens;
}

interface Msg {
  role: 'user' | 'agent';
  text: string;
  isPrompt?: boolean;
}

const STYLE_TAGS = [
  { label: 'Cinemático', prompt: 'cinematic photography, dramatic lighting, anamorphic lens' },
  { label: 'Minimalista', prompt: 'minimalist, clean white background, negative space, simple shapes' },
  { label: 'Abstrato', prompt: 'abstract art, bold colors, geometric shapes, modern design' },
  { label: 'Foto Real', prompt: 'photorealistic, 8K, hyper detailed, DSLR photography' },
  { label: 'Dark & Moody', prompt: 'dark moody atmosphere, low key lighting, dramatic shadows' },
  { label: 'Vibrante', prompt: 'vibrant colors, high saturation, energetic, eye-catching' },
];

const ImageAgentChat: React.FC<ImageAgentChatProps> = ({ isOpen, onClose, sectionId, T }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sections = useStore(state => state.sections);
  const { generate } = useImageGeneration();
  const section = sections.find(s => s.id === sectionId);

  // Animação entrada/saída
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && sectionId && section) {
      setMessages([]);
      setGenerated(false);
      setCurrentPrompt(section.imagePrompt || section.title || '');
      chatRef.current = null;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: `Você é um especialista em criação de prompts de imagem para carrosséis virais do Instagram.

Seu objetivo: ajudar a criar o prompt perfeito em inglês para gerar uma imagem impactante.

CONTEXTO DO SLIDE:
- Título: "${section.title}"
- Conteúdo: "${section.content}"
- Prompt atual: "${section.imagePrompt || 'nenhum'}"

REGRAS:
1. Sempre responda em português
2. Sugira melhorias e estilos visuais específicos
3. Quando o usuário aprovar ou pedir para gerar, entregue o prompt final em inglês entre as tags [PROMPT] e [/PROMPT]
4. O prompt deve incluir: subject, style, lighting, mood, composition
5. Seja criativo e focado em impacto visual para redes sociais`,
        },
      });

      setMessages([{
        role: 'agent',
        text: `🎨 **Agente de Imagem**\n\nVou te ajudar a criar a imagem perfeita para este slide!\n\n**Slide:** "${section.title}"\n\n${section.imagePrompt ? `**Prompt atual:** "${section.imagePrompt}"` : '**Ainda sem prompt de imagem.**'}\n\nComo quer a imagem? Descreva o estilo ou escolha um dos estilos rápidos acima.`,
      }]);
      setCurrentPrompt(section.imagePrompt || section.title || '');
    }
  }, [isOpen, sectionId]);

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isTyping) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessage({ message: text });
      const responseText = result.text;

      const promptMatch = responseText.match(/\[PROMPT\]([\s\S]*?)\[\/PROMPT\]/i);
      if (promptMatch) {
        const extracted = promptMatch[1].trim();
        setCurrentPrompt(extracted);
        setMessages(prev => [...prev,
          { role: 'agent', text: responseText.replace(/\[PROMPT\][\s\S]*?\[\/PROMPT\]/i, '').trim() },
          { role: 'agent', text: extracted, isPrompt: true },
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', text: responseText }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Erro na conexão. Tente novamente.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStyleTag = (style: typeof STYLE_TAGS[0]) => {
    sendMessage(`Quero o estilo: ${style.label}. Adicione "${style.prompt}" ao prompt.`);
  };

  const handleGenerate = async () => {
    if (!sectionId || !currentPrompt || isGenerating) return;
    setIsGenerating(true);
    setGenerated(false);
    try {
      await generate(sectionId, currentPrompt, section?.content || '');
      setGenerated(true);
      setMessages(prev => [...prev, { role: 'agent', text: '✅ Imagem gerada! Confira no slide ao lado.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: '❌ Erro ao gerar imagem. Tente novamente.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePrompt = () => {
    sendMessage('Refine o prompt, deixe mais criativo e impactante para carrossel viral do Instagram.');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[140]"
        style={{
          background: 'rgba(3, 6, 12, 0.62)',
          backdropFilter: 'blur(8px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
        onClick={onClose}
      />

      {/* Drawer lateral */}
      <div
        className="fixed right-0 top-0 h-screen z-[150] flex flex-col"
        style={{
          width: 'min(460px, 96vw)',
          background: `radial-gradient(circle at 15% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, ${T.sidebar} 0%, ${T.bg} 100%)`,
          borderLeft: `1px solid ${T.border}`,
          boxShadow: `-28px 0 80px rgba(0,0,0,0.45), ${T.shadowStrong}`,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: T.accent, boxShadow: `0 10px 24px ${T.accentGlow}`, color: T.accentText }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-black text-[24px] leading-none" style={{ color: T.textPrimary }}>Agente de Imagem</h3>
              <p className="text-[12px] font-semibold truncate max-w-[230px] mt-1" style={{ color: T.textDim }}>
                {section?.title ? `"${section.title.slice(0, 20)}${section.title.length > 20 ? '…' : ''}"` : 'Slide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl transition-all active:scale-90 active:opacity-70"
            style={{ color: T.textDim, background: T.glass, border: `1px solid ${T.border}` }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Estilos rápidos */}
        <div className="px-4 py-3.5 flex gap-2 flex-wrap flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.01)' }}>
          {STYLE_TAGS.map(tag => (
            <button
              key={tag.label}
              onClick={() => handleStyleTag(tag)}
              disabled={isTyping}
              className="px-3.5 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textSub, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar"
          style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(0,0,0,0.08) 100%)' }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.isPrompt ? (
                <div
                  className="w-full rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${T.borderStrong}` }}
                >
                  <p className="text-[11px] font-bold mb-2" style={{ color: T.textSub }}>Prompt final</p>
                  <p className="text-[12px] font-medium leading-relaxed" style={{ color: T.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>
                    {m.text}
                  </p>
                </div>
              ) : (
                <div
                  className="max-w-[96%] px-4 py-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === 'user'
                      ? {
                          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accent}CC 100%)`,
                          color: T.accentText,
                          borderBottomRightRadius: 4,
                          boxShadow: `0 8px 20px ${T.accentGlow}`,
                        }
                      : { background: T.glass, color: T.textSub, border: `1px solid ${T.border}`, borderBottomLeftRadius: 4 }
                  }
                >
                  {m.role === 'agent' && (
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold" style={{ color: T.textFaint }}>
                      <Sparkles size={10} />
                      Assistente
                    </div>
                  )}
                  {renderFormattedText(m.text)}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ color: T.textDim, background: T.glass, border: `1px solid ${T.border}` }}
            >
              <Loader2 className="animate-spin" size={14} />
              <span className="text-xs font-bold">Pensando...</span>
            </div>
          )}
        </div>

        {/* Prompt ativo + Gerar */}
        {currentPrompt && (
          <div
            className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
            style={{ borderTop: `1px solid ${T.border}`, background: T.glass }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: T.textFaint }}>Prompt ativo</p>
              <p className="text-[12px] truncate font-medium" style={{ color: T.textDim }}>{currentPrompt}</p>
            </div>
            <button
              onClick={handleRefinePrompt}
              disabled={isTyping}
              title="Refinar"
              className="p-2.5 rounded-xl transition-all flex-shrink-0 disabled:opacity-40 active:scale-90"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isTyping}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex-shrink-0 active:scale-95"
              style={{
                background: generated ? T.success : T.accent,
                color: generated ? '#fff' : T.accentText,
                opacity: isGenerating ? 0.6 : 1,
                boxShadow: `0 8px 22px ${T.accentGlow}`,
              }}
            >
              {isGenerating
                ? <><Loader2 className="animate-spin" size={12} /> Gerando...</>
                : generated
                ? <><Check size={12} /> Gerada!</>
                : <><Wand2 size={12} /> Gerar</>
              }
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="mb-1 px-1 text-[10px] font-semibold" style={{ color: T.textFaint }}>
            Direção da imagem
          </div>
          <div
            className="flex gap-2 items-center rounded-2xl p-2"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Descreva o que quer na imagem..."
              className="flex-1 bg-transparent border-none px-3 py-3 text-[15px] outline-none"
              style={{ color: T.textPrimary }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-20"
              style={{ background: T.accent, color: T.accentText, boxShadow: `0 8px 18px ${T.accentGlow}` }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageAgentChat;
