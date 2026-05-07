import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { generalChatStream } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AssistantView() {
  const { t: trans } = useLanguage();
  const t = (trans as any).chat;
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    
    // Add assistant placeholder
    const messagesWithPlaceholder = [...newMessages, { role: 'model' as const, text: '' }];
    setMessages(messagesWithPlaceholder);
    
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const stream = await generalChatStream(userMsg, history);
      
      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = { 
                ...updated[updated.length - 1], 
                text: fullText 
              };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { 
            ...updated[updated.length - 1], 
            text: 'Desculpe, tive um problema técnico. Pode repetir?' 
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{t.title}</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Sua inteligência de estudos</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-xl border border-green-500/20 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Online & Pronto</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden flex flex-col relative group">
        
        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide"
        >
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center max-w-sm mx-auto space-y-8"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-yellow-400 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-400/20 group-hover:scale-105 transition-transform duration-500">
                  <Bot className="w-12 h-12 text-black" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">O que vamos explorar?</h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  {t.welcome}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2 pt-4">
                {[
                  "Como fazer resumos melhores?",
                  "Me dê dicas de foco para leitura",
                  "O que é o método Feynman?",
                  "Explique a curva do esquecimento"
                ].map((hint, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(hint)}
                    className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-left text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-yellow-400 dark:hover:border-yellow-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "flex gap-4 md:gap-6",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all",
                  msg.role === 'user' ? "bg-yellow-400 text-black shadow-yellow-400/20" : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 md:w-6 md:h-6" /> : <Bot className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <div className={cn(
                  "p-5 md:p-6 rounded-3xl text-sm md:text-base leading-relaxed max-w-[85%] md:max-w-[75%] shadow-sm",
                  msg.role === 'user' 
                    ? "bg-yellow-400 text-zinc-900 font-semibold rounded-tr-none" 
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-white border border-zinc-100 dark:border-zinc-800/50 rounded-tl-none backdrop-blur-sm"
                )}>
                  <div className={cn("prose prose-sm md:prose-base max-w-none", msg.role === 'user' ? "prose-zinc font-bold" : "dark:prose-invert")}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-yellow-500 animate-pulse" />
              </div>
              <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-xl">
          <form onSubmit={handleSend} className="relative max-w-3xl mx-auto group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="w-full pl-6 pr-16 py-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl text-zinc-900 dark:text-white text-sm md:text-base focus:ring-[12px] focus:ring-yellow-400/10 focus:border-yellow-400 outline-none transition-all shadow-xl shadow-black/[0.02] font-bold placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-yellow-400 text-black rounded-2xl hover:bg-yellow-500 disabled:opacity-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 group-hover:scale-105"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.send}
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter">Powered by Gemini 3 Flash AI</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
