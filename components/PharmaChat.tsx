
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, AlertTriangle, Trash2, Minus, Maximize2, PlusCircle } from 'lucide-react';
import { getPharmaChatResponse } from '../services/geminiService';
import { DrugRecord } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface PharmaChatProps {
  drugs: DrugRecord[];
}

const PharmaChat: React.FC<PharmaChatProps> = ({ drugs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      history.push({ role: 'user', parts: [{ text: userMessage }] });
      
      const response = await getPharmaChatResponse(history, drugs);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema ao processar sua dúvida. Tente novamente mais tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Deseja apagar o histórico do chat atual?")) {
      setMessages([]);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {(!isOpen || isMinimized) && (
        <button 
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform relative"
        >
          <MessageSquare />
          {messages.length > 0 && isMinimized && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {isOpen && !isMinimized && (
        <div className="w-80 md:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-accent" />
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest">PharmaChat</h3>
                <span className="text-[10px] text-slate-400 font-black uppercase">IA Balconista</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} title="Limpar conversa" className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
              <button onClick={toggleMinimize} title="Minimizar" className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <Minus size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} title="Fechar" className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <div className="text-center py-12 px-6">
                <Bot className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">Novo Chat Iniciado</p>
                <p className="text-xs text-slate-400">Olá! Estou pronto para ajudar com dúvidas sobre medicamentos, interações e posologia.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-accent text-white rounded-tr-none shadow-lg shadow-accent/10' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-sm">
                  <Loader2 className="animate-spin text-accent" size={16} />
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/10 px-4 py-2 flex items-center gap-2 border-t border-amber-100 dark:border-amber-900/30 shrink-0">
            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-tight">Consulte sempre o farmacêutico em caso de dúvida crítica.</p>
          </div>

          {/* Input */}
          <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Dúvida técnica..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold dark:text-white focus:ring-2 focus:ring-accent outline-none"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-slate-900 dark:bg-accent text-white p-3 rounded-xl disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors shadow-lg"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmaChat;
