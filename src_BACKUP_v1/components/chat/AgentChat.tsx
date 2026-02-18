import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../../types';
import { renderFormattedText } from '../../utils/formatters';
import { GoogleGenAI } from "@google/genai";

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ isOpen, onClose, onApplyText }) => {
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
          systemInstruction: `Você é um estrategista MyHub de carrosséis virais.

## SUA REGRA NÚMERO 1:
FAÇA APENAS UMA PERGUNTA POR VEZ. Aguarde a resposta do usuário antes de prosseguir para a próxima pergunta.

## REGRAS DE FORMATAÇÃO:
NUNCA use colchetes [ ] ou chaves { } nos valores dos textos. Os textos devem vir limpos.

## FLUXO DE CONVERSA:
1. Comece saudando e pergunte: "Qual o tema ou história principal do seu carrossel?"
2. Após ele responder o tema, pergunte sobre NÚMEROS: "Você tem números específicos (valores R$, anos, porcentagens) ou quer que eu sugira dados impactantes sobre o tema?"
3. Após ele responder os números, pergunte a QUANTIDADE DE SLIDES: "Quantos slides você prefere? (Recomendo entre 8 e 10 para máxima retenção)."
4. Após ele responder a quantidade, gere o roteiro final usando uma das 6 fórmulas de headline MyHub.

## FORMATO DE ENTREGA FINAL:
Apenas quando tiver todas as respostas, entregue o roteiro exatamente neste formato:
💾 ROTEIRO PRONTO PARA O MYHUB

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
          text: 'Olá! Sou seu Agente IA Estrategista.\n\nVamos construir seu próximo carrossel viral passo a passo.\n\nPara começarmos: **Qual o tema ou história principal que você quer focar hoje?**'
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
    const myHubBlockRegex = /texto 1 -[\s\S]*/i;
    const match = rawText.match(myHubBlockRegex);
    if (match) {
      onApplyText(match[0].trim());
    } else {
      onApplyText(rawText);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
      <div className="w-full max-w-2xl bg-[#080808] border border-white/10 rounded-[3.5rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white text-black rounded-3xl flex items-center justify-center shadow-lg">
              <Bot size={28} />
            </div>
            <div>
              <h3 className="text-white font-black text-2xl italic">Agente MyHub</h3>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-1">Passo a Passo Viral</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-all">
            <X size={32} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[92%] px-8 py-7 rounded-[2.5rem] text-[15px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white/5 text-slate-100 border border-white/10 rounded-tl-none'
              }`}>
                {renderFormattedText(m.text)}
              </div>
              {m.role === 'model' && (m.text.toLowerCase().includes('texto 1 -') || m.text.toLowerCase().includes('roteiro pronto')) && (
                <button
                  onClick={() => handleApply(m.text)}
                  className="mt-6 flex items-center gap-4 px-10 py-5 bg-indigo-600 hover:bg-white text-white hover:text-black rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] border border-indigo-400/50 active:scale-95"
                >
                  <ArrowRight size={18} /> Alimentar Editor Principal
                </button>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-3 text-indigo-400 text-sm font-bold animate-pulse px-4">
              <Loader2 className="animate-spin" size={18} /> Estrategista pensando...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-8 bg-black/40 border-t border-white/5">
          <div className="flex gap-4 items-center bg-white/5 p-2 rounded-[2.5rem] border border-white/10">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Responda ao estrategista..."
              className="flex-1 bg-transparent border-none px-6 py-5 text-white text-[15px] outline-none placeholder:text-slate-600"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="p-5 bg-white text-black rounded-full hover:scale-110 transition-all shadow-xl disabled:opacity-20"
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
