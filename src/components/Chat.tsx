import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { chatWithBook } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from '../lib/utils';

interface ChatProps {
  user: FirebaseUser;
  book: any;
  onBack: () => void;
}

export default function Chat({ user, book, onBack }: ChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !book.id) return;

    const chatPath = `users/${user.uid}/library/${book.id}/chat`;
    const q = query(collection(db, chatPath), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        role: doc.data().role,
        text: doc.data().text
      })) as { role: 'user' | 'model', text: string }[];
      
      setMessages(msgs);
      setInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, chatPath);
      setInitialLoading(false);
    });

    return () => unsubscribe();
  }, [user, book.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const chatPath = `users/${user.uid}/library/${book.id}/chat`;

    try {
      // 1. Save user message to Firestore
      await addDoc(collection(db, chatPath), {
        role: 'user',
        text: userMsg,
        timestamp: serverTimestamp()
      });

      // 2. Get AI response
      // Convert messages to history format for Gemini if needed, 
      // but chatWithBook currently takes [] for history in this app template.
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithBook(book.summary, userMsg, history);
      const botText = response || 'Desculpe, não consegui processar sua dúvida.';

      // 3. Save bot response to Firestore
      await addDoc(collection(db, chatPath), {
        role: 'model',
        text: botText,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error(error);
      // Optional: Add a client-side only error message if Firestore fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white dark:bg-black rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-colors duration-300">
      <header className="p-5 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all text-yellow-400 group">
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="font-black text-zinc-900 dark:text-white text-lg md:text-xl tracking-tight leading-tight">{book.title}</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Assistente Inteligente de Leitura</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">IA Conectada</span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
            <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recuperando histórico de estudo...</p>
          </div>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-50 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 mb-4 backdrop-blur-sm relative group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400/50" />
              <h3 className="text-xs font-black text-yellow-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" /> Resumo Estruturado
              </h3>
              <div className="prose dark:prose-invert prose-sm md:prose-base text-zinc-700 dark:text-zinc-300 max-w-none leading-relaxed">
                <ReactMarkdown>{book.summary}</ReactMarkdown>
              </div>
            </motion.div>

            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Inicie uma conversa para aprofundar seu conhecimento
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-[85%] md:max-w-[75%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl",
                    msg.role === 'user' ? "bg-yellow-400 text-black px-0" : "bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700"
                  )}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-black" /> : <Bot className="w-5 h-5 px-0" />}
                  </div>
                  <div className={cn(
                    "p-5 md:p-6 rounded-[2rem] text-sm md:text-base leading-relaxed shadow-sm dark:shadow-lg",
                    msg.role === 'user' 
                      ? "bg-yellow-400 text-black font-semibold rounded-tr-none" 
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                  )}>
                    <div className={cn("prose prose-sm md:prose-base max-w-none", msg.role === 'user' ? "prose-zinc font-semibold" : "dark:prose-invert")}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-2">
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">IA está analisando</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 md:p-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre este conhecimento..."
            className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-zinc-900 dark:text-white text-base focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-bold"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-5 bg-yellow-400 text-black rounded-3xl hover:bg-yellow-500 disabled:opacity-50 transition-all shadow-2xl shadow-yellow-400/30 active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}
