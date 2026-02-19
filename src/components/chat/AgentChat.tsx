import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, ArrowRight } from 'lucide-react';
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
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
        onClick={onClose}
      />

      {/* Drawer lateral — desliza da direita */}
      <div
        className="fixed right-0 top-0 h-screen z-[150] flex flex-col"
        style={{
          width: 'min(400px, 92vw)',
          background: T.sidebar,
          borderLeft: `1px solid ${T.border}`,
          boxShadow: T.shadowStrong,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: T.accent, color: T.accentText }}
            >
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-black text-base" style={{ color: T.textPrimary }}>Agente de Texto</h3>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.success }}>Estrategista Viral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl transition-all active:scale-90 active:opacity-70"
            style={{ color: T.textDim }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar" style={{ minHeight: 0 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className="max-w-[90%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === 'user'
                    ? { background: T.accent, color: T.accentText, borderBottomRightRadius: 4 }
                    : { background: T.glass, color: T.textSub, border: `1px solid ${T.border}`, borderBottomLeftRadius: 4 }
                }
              >
                {renderFormattedText(m.text)}
              </div>
              {m.role === 'model' && (m.text.toLowerCase().includes('texto 1 -') || m.text.toLowerCase().includes('roteiro pronto')) && (
                <button
                  onClick={() => handleApply(m.text)}
                  className="mt-3 flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    background: T.accent,
                    color: T.accentText,
                    boxShadow: `0 4px 16px ${T.accentGlow}`,
                  }}
                >
                  <ArrowRight size={14} /> Aplicar ao editor
                </button>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-sm font-bold animate-pulse px-2" style={{ color: T.textDim }}>
              <Loader2 className="animate-spin" size={14} /> Estrategista pensando...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
          <div
            className="flex gap-2 items-center rounded-2xl p-2"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Responda ao estrategista..."
              className="flex-1 bg-transparent border-none px-3 py-3 text-sm outline-none"
              style={{ color: T.textPrimary }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-20"
              style={{ background: T.accent, color: T.accentText }}
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
