import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';
import { renderFormattedText } from '../../utils/formatters';
import { GoogleGenAI } from "@google/genai";
import { ThemeTokens, DARK_FALLBACK } from '../../constants/theme';

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
  T?: ThemeTokens;
}

const QUICK_ACTIONS = [
  { label: 'Roteiro 8 frames', prompt: 'Quero um roteiro para 8 frames com gancho forte.' },
  { label: 'Versão polêmica', prompt: 'Crie uma versão mais polêmica desse tema.' },
  { label: '3 CTAs finais', prompt: 'Me dê 3 opções de CTA final.' },
];


const AgentChat: React.FC<AgentChatProps> = ({ isOpen, onClose, onApplyText, T: TProp }) => {
  const T = TProp || DARK_FALLBACK;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animação de entrada/saída
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
    if (isOpen && !chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Você é um estrategista especialista em carrosséis virais para redes sociais.

## SUA REGRA NÚMERO 1:
FAÇA APENAS UMA PERGUNTA POR VEZ. Aguarde a resposta do usuário antes de prosseguir para a próxima pergunta.

## REGRAS DE FORMATAÇÃO:
NUNCA use colchetes [ ] ou chaves { } nos valores dos textos. Os textos devem vir limpos.

## FLUXO DE CONVERSA:
1. Comece saudando e pergunte: "Qual o tema ou história principal do seu carrossel?"
2. Após ele responder o tema, pergunte sobre NÚMEROS: "Você tem números específicos (valores R$, anos, porcentagens) ou quer que eu sugira dados impactantes sobre o tema?"
3. Após ele responder os números, pergunte a QUANTIDADE DE FRAMES: "Quantos frames (cards) você prefere no carrossel? (Recomendo entre 8 e 10 para máxima retenção)."
4. Após ele responder a quantidade, gere o roteiro final usando fórmulas de headline virais comprovadas.

## FORMATO DE ENTREGA FINAL:
Apenas quando tiver todas as respostas, entregue o roteiro exatamente neste formato:
💾 ROTEIRO PRONTO — @Kaique.Editor

texto 1 - headline do slide 1
texto 2 - rótulo/contexto curto do slide 2
texto 3 - narrativa principal (grande) do slide 2
...
texto X - CTA final`,
        },
      });
      if (messages.length === 0) {
        setMessages([{
          role: 'model',
          text: 'Olá! Sou seu Agente Estrategista.\n\nVamos construir seu próximo carrossel viral passo a passo.\n\n**Qual o tema ou história principal que você quer focar hoje?**'
        }]);
      }
    }
  }, [isOpen]);

  const sendMessage = async (overrideText?: string) => {
    const textToSubmit = overrideText || input;
    if (!textToSubmit.trim() || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSubmit }]);
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessage({ message: textToSubmit });
      setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro na conexão. Tente novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApply = (rawText: string) => {
    const match = rawText.match(/texto 1 -[\s\S]*/i);
    onApplyText(match ? match[0].trim() : rawText);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop semitransparente — NÃO bloqueia o slide */}
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

      {/* Drawer lateral — desliza da direita */}
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
              style={{ background: T.accent, boxShadow: `0 8px 22px ${T.accentGlow}`, color: T.accentText }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-black text-[24px] leading-none" style={{ color: T.textPrimary }}>Agente de Texto</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px] font-semibold" style={{ color: T.success }}>Estrategista Viral</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl transition-all active:scale-90 active:opacity-70"
            style={{ color: T.textDim, background: T.glass, border: `1px solid ${T.border}` }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-3.5 flex flex-wrap gap-2 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.01)' }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={isTyping}
              className="px-3.5 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textSub }}
            >
              {action.label}
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
                    : {
                        background: T.glass,
                        color: T.textSub,
                        border: `1px solid ${T.border}`,
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {m.role === 'model' && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: T.textFaint }}>
                    <Sparkles size={10} />
                    Assistente
                  </div>
                )}
                {renderFormattedText(m.text)}
              </div>
              {m.role === 'model' && (m.text.toLowerCase().includes('texto 1 -') || m.text.toLowerCase().includes('roteiro pronto')) && (
                <button
                  onClick={() => handleApply(m.text)}
                  className="mt-3 flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: T.accent,
                    color: T.accentText,
                    boxShadow: `0 8px 22px ${T.accentGlow}`,
                  }}
                >
                  <ArrowRight size={14} /> Aplicar ao editor
                </button>
              )}
            </div>
          ))}
          {isTyping && (
            <div
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full animate-pulse"
              style={{ color: T.textDim, background: T.glass, border: `1px solid ${T.border}` }}
            >
              <Loader2 className="animate-spin" size={14} /> Estrategista pensando...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="mb-1 px-1 text-[10px] font-semibold" style={{ color: T.textFaint }}>
            Pergunta atual
          </div>
          <div className="flex gap-2 items-center rounded-2xl p-2" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Responda ao estrategista..."
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

export default AgentChat;
