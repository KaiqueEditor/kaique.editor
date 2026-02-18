import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../../types';
import { renderFormattedText } from '../../utils/formatters';
import { GoogleGenAI } from "@google/genai";
import { ThemeTokens } from '../../constants/theme';

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
  T?: ThemeTokens;
}

// Fallback dark tokens for backward compat
const DARK_FALLBACK: ThemeTokens = {
  bg: '#000000', bgCanvas: '#000000', sidebar: '#0a0a0a', card: '#111111', cardHover: '#1a1a1a',
  glass: 'rgba(255,255,255,0.04)', glassMd: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.15)',
  accent: '#ffffff', accentText: '#000000', accentHover: 'rgba(255,255,255,0.9)', accentGlow: 'rgba(255,255,255,0.12)',
  textPrimary: '#ffffff', textSub: 'rgba(255,255,255,0.7)', textDim: 'rgba(255,255,255,0.4)', textFaint: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.08)', inputFocus: 'rgba(255,255,255,0.3)',
  success: '#30d158', shadow: '0 4px 24px rgba(0,0,0,0.6)', shadowStrong: '0 20px 60px rgba(0,0,0,0.8)',
};

const AgentChat: React.FC<AgentChatProps> = ({ isOpen, onClose, onApplyText, T: TProp }) => {
  const T = TProp || DARK_FALLBACK;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
3. Após ele responder os números, pergunte a QUANTIDADE DE SLIDES: "Quantos slides você prefere? (Recomendo entre 8 e 10 para máxima retenção)."
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
          text: 'Olá! Sou seu Agente Estrategista.\n\nVamos construir seu próximo carrossel viral passo a passo.\n\nPara começarmos: **Qual o tema ou história principal que você quer focar hoje?**'
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
    const scriptBlockRegex = /texto 1 -[\s\S]*/i;
    const match = rawText.match(scriptBlockRegex);
    if (match) {
      onApplyText(match[0].trim());
    } else {
      onApplyText(rawText);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
      <div
        className="w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-fade-in"
        style={{ background: T.sidebar, border: `1px solid ${T.border}` }}
      >
        {/* Header */}
        <div className="px-10 py-8 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-6">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: T.accent, color: T.accentText }}
            >
              <Bot size={28} />
            </div>
            <div>
              <h3 className="font-black text-2xl italic" style={{ color: T.textPrimary }}>Agente de Texto</h3>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: T.success }}>Estrategista Viral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 transition-all rounded-xl"
            style={{ color: T.textDim }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textPrimary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textDim}
          >
            <X size={28} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className="max-w-[92%] px-7 py-6 rounded-[2rem] text-[15px] leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === 'user'
                    ? { background: T.accent, color: T.accentText, borderBottomRightRadius: 6 }
                    : { background: T.glass, color: T.textSub, border: `1px solid ${T.border}`, borderBottomLeftRadius: 6 }
                }
              >
                {renderFormattedText(m.text)}
              </div>
              {m.role === 'model' && (m.text.toLowerCase().includes('texto 1 -') || m.text.toLowerCase().includes('roteiro pronto')) && (
                <button
                  onClick={() => handleApply(m.text)}
                  className="mt-5 flex items-center gap-4 px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    background: T.accent,
                    color: T.accentText,
                    boxShadow: `0 8px 24px ${T.accentGlow}`,
                    border: `1px solid ${T.borderStrong}`,
                  }}
                >
                  <ArrowRight size={18} /> Alimentar Editor Principal
                </button>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-3 text-sm font-bold animate-pulse px-4" style={{ color: T.textDim }}>
              <Loader2 className="animate-spin" size={18} /> Estrategista pensando...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6" style={{ background: T.glass, borderTop: `1px solid ${T.border}` }}>
          <div
            className="flex gap-3 items-center p-2 rounded-[2rem]"
            style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Responda ao estrategista..."
              className="flex-1 bg-transparent border-none px-5 py-4 text-[15px] outline-none"
              style={{ color: T.textPrimary }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="p-4 rounded-full hover:scale-105 transition-all shadow-lg disabled:opacity-20"
              style={{ background: T.accent, color: T.accentText }}
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
