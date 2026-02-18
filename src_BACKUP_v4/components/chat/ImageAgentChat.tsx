import React, { useState, useRef, useEffect } from 'react';
import { Palette, X, Send, Loader2, Sparkles, Wand2, RefreshCw, Check } from 'lucide-react';
import { ThemeTokens } from '../../constants/theme';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { useStore } from '../../store';
import { GoogleGenAI } from '@google/genai';

interface ImageAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string | null;
  T: ThemeTokens;
}

interface Msg {
  role: 'user' | 'agent';
  text: string;
  isPrompt?: boolean; // marca quando é um prompt final
}

const STYLE_TAGS = [
  { label: 'Cinemático', prompt: 'cinematic photography, dramatic lighting, anamorphic lens' },
  { label: 'Minimalista', prompt: 'minimalist, clean white background, negative space, simple shapes' },
  { label: 'Abstrato', prompt: 'abstract art, bold colors, geometric shapes, modern design' },
  { label: 'Fotorrealista', prompt: 'photorealistic, 8K, hyper detailed, DSLR photography' },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const sections = useStore(state => state.sections);
  const { generate } = useImageGeneration();

  const section = sections.find(s => s.id === sectionId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && sectionId && section) {
      // Reset state
      setMessages([]);
      setGenerated(false);
      setCurrentPrompt(section.imagePrompt || section.title || '');
      chatRef.current = null;

      // Init Gemini chat
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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

      // Initial message
      const initialPrompt = section.imagePrompt || section.title;
      const greeting = `🎨 **Agente de Imagem**

Vou te ajudar a criar a imagem perfeita para este slide!

**Slide:** "${section.title}"

${section.imagePrompt ? `**Prompt atual:** "${section.imagePrompt}"` : '**Ainda sem prompt de imagem.**'}

Como quer a imagem? Pode me descrever o estilo, humor e o que quer mostrar — ou escolha um estilo rápido abaixo.`;

      setMessages([{ role: 'agent', text: greeting }]);
      setCurrentPrompt(initialPrompt);
    }
  }, [isOpen, sectionId]);

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isTyping) return;
    setInput('');

    const userMsg: Msg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessage({ message: text });
      const responseText = result.text;

      // Extract prompt if present
      const promptMatch = responseText.match(/\[PROMPT\]([\s\S]*?)\[\/PROMPT\]/i);
      if (promptMatch) {
        const extracted = promptMatch[1].trim();
        setCurrentPrompt(extracted);
        setMessages(prev => [...prev, {
          role: 'agent',
          text: responseText.replace(/\[PROMPT\][\s\S]*?\[\/PROMPT\]/i, '').trim(),
          isPrompt: false,
        }, {
          role: 'agent',
          text: extracted,
          isPrompt: true,
        }]);
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
      setMessages(prev => [...prev, {
        role: 'agent',
        text: '✅ Imagem gerada com sucesso! Confira no slide ao lado.',
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: '❌ Erro ao gerar imagem. Tente novamente.',
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePrompt = () => {
    sendMessage('Refine o prompt, deixe mais criativo e impactante para carrossel viral do Instagram.');
  };

  if (!isOpen) return null;

  const isDark = T.bg === '#000000';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg flex flex-col rounded-[2.5rem] overflow-hidden animate-fade-in"
        style={{
          background: T.sidebar,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadowStrong,
          maxHeight: '85vh',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: T.accent, boxShadow: `0 4px 16px ${T.accentGlow}` }}
            >
              <Palette size={22} style={{ color: T.accentText }} />
            </div>
            <div>
              <h3 className="font-black text-lg" style={{ color: T.textPrimary }}>Agente de Imagem</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                IA Visual · {section?.title ? `"${section.title.slice(0, 22)}${section.title.length > 22 ? '…' : ''}"` : 'Slide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl transition-all"
            style={{ color: T.textDim }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textPrimary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Style tags ── */}
        <div className="px-6 py-4 flex gap-2 flex-wrap" style={{ borderBottom: `1px solid ${T.border}` }}>
          {STYLE_TAGS.map(tag => (
            <button
              key={tag.label}
              onClick={() => handleStyleTag(tag)}
              disabled={isTyping}
              className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all"
              style={{
                background: T.glass,
                border: `1px solid ${T.border}`,
                color: T.textDim,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = T.glassMd;
                (e.currentTarget as HTMLElement).style.color = T.textPrimary;
                (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = T.glass;
                (e.currentTarget as HTMLElement).style.color = T.textDim;
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* ── Messages ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar"
          style={{ minHeight: 0 }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.isPrompt ? (
                // Prompt card
                <div
                  className="w-full rounded-2xl p-4"
                  style={{
                    background: T.glassMd,
                    border: `1px solid ${T.borderStrong}`,
                  }}
                >
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textDim }}>
                    ✨ Prompt gerado
                  </p>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: T.textPrimary, fontFamily: 'monospace' }}>
                    {m.text}
                  </p>
                </div>
              ) : (
                <div
                  className="max-w-[90%] px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === 'user'
                      ? { background: T.accent, color: T.accentText, borderBottomRightRadius: 4 }
                      : { background: T.glass, color: T.textSub, border: `1px solid ${T.border}`, borderBottomLeftRadius: 4 }
                  }
                >
                  {m.text}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 px-2" style={{ color: T.textDim }}>
              <Loader2 className="animate-spin" size={14} />
              <span className="text-xs font-bold">Pensando...</span>
            </div>
          )}
        </div>

        {/* ── Current prompt preview + generate ── */}
        {currentPrompt && (
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderTop: `1px solid ${T.border}`, background: T.glass }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: T.textFaint }}>Prompt ativo</p>
              <p className="text-[11px] truncate font-medium" style={{ color: T.textDim }}>
                {currentPrompt}
              </p>
            </div>
            <button
              onClick={handleRefinePrompt}
              disabled={isTyping}
              title="Refinar prompt"
              className="p-2.5 rounded-xl transition-all flex-shrink-0"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textDim }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textPrimary}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isTyping}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all flex-shrink-0"
              style={{
                background: generated ? T.success : T.accent,
                color: generated ? '#fff' : T.accentText,
                opacity: isGenerating ? 0.6 : 1,
                boxShadow: `0 4px 16px ${T.accentGlow}`,
              }}
            >
              {isGenerating
                ? <><Loader2 className="animate-spin" size={13} /> Gerando...</>
                : generated
                ? <><Check size={13} /> Gerada!</>
                : <><Wand2 size={13} /> Gerar</>
              }
            </button>
          </div>
        )}

        {/* ── Input ── */}
        <div
          className="p-4"
          style={{ borderTop: `1px solid ${T.border}` }}
        >
          <div
            className="flex gap-3 items-center rounded-2xl p-2"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Descreva o que quer na imagem..."
              className="flex-1 bg-transparent border-none px-3 py-3 text-sm outline-none"
              style={{
                color: T.textPrimary,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="p-3 rounded-xl transition-all"
              style={{
                background: T.accent,
                color: T.accentText,
                opacity: !input.trim() || isTyping ? 0.3 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAgentChat;
