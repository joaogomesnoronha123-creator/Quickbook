import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Settings as SettingsIcon, Library as LibraryIcon, Home as HomeIcon, Loader2, Sparkles } from 'lucide-react';
import Library, { BookSummary } from './components/Library';
import Summarizer from './components/Summarizer';
import Chat from './components/Chat';
import Settings from './components/Settings';
import Home from './components/Home';
import Login from './components/Login';
import AssistantView from './components/AssistantView';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from './contexts/LanguageContext';

type View = 'welcome' | 'library' | 'summarizer' | 'chat' | 'settings' | 'assistant';

export default function App() {
  const { t: trans } = useLanguage();
  const t = trans.nav;
  const [activeView, setActiveView] = useState<View>('welcome');
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('Estudante');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().name);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setUserName('Estudante');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateName = (name: string) => {
    setUserName(name);
  };

  const navItems = [
    { id: 'welcome', icon: HomeIcon, label: t.home },
    { id: 'library', icon: LibraryIcon, label: t.library },
    { id: 'summarizer', icon: PlusCircle, label: t.summarizer },
    { id: 'assistant', icon: Sparkles, label: (t as any).assistant || 'Assistente' },
    { id: 'settings', icon: SettingsIcon, label: t.settings },
  ];

  const handleSelectBook = (book: BookSummary) => {
    setSelectedBook(book);
    setActiveView('chat');
  };

  const handleSummaryComplete = (book: BookSummary) => {
    setSelectedBook(book);
    setActiveView('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white font-sans selection:bg-yellow-400 selection:text-black transition-colors duration-300">
      {/* Navigation */}
      <nav className={cn(
        "fixed z-50 transition-all duration-300",
        // Mobile: Floating bottom bar
        "bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md md:left-0 md:translate-x-0 md:w-auto",
        // Desktop: Professional Sidebar
        "md:top-0 md:bottom-0 md:h-screen md:w-20 lg:w-64 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 md:border-t-0 md:border-r flex md:flex-col items-center py-2 md:py-8 px-3 md:px-2 lg:px-6 rounded-3xl md:rounded-none shadow-xl dark:shadow-none"
      )}>
        <div className="hidden md:flex items-center gap-3 mb-12 lg:w-full px-2 cursor-pointer" onClick={() => setActiveView('welcome')}>
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20 shrink-0">
            <BookOpen className="text-black w-6 h-6" />
          </div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter text-yellow-400 truncate">QuickBook AI</span>
        </div>

        <div className="flex-1 flex md:flex-col w-full justify-around md:justify-start gap-2 md:gap-3 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (activeView === 'chat' && item.id === 'library');
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={cn(
                  "flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2.5 lg:px-4 lg:py-3.5 rounded-2xl transition-all md:w-full group relative",
                  isActive
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20" 
                    : "text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 lg:w-6 lg:h-6 transition-transform group-hover:scale-110", isActive ? "text-black" : "")} />
                <span className="text-[10px] lg:text-sm font-black lg:font-bold uppercase lg:normal-case tracking-widest lg:tracking-normal">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="hidden lg:block absolute left-0 w-1 h-6 bg-black rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-32 md:pb-8 md:pl-20 lg:pl-64 min-h-screen">
        <div className="container mx-auto px-6 py-8 md:py-12 max-w-7xl">
          <AnimatePresence mode="wait">
            {activeView === 'welcome' && (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Home user={user} userName={userName} onNavigate={(view) => setActiveView(view)} />
              </motion.div>
            )}

            {activeView === 'library' && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Library user={user} onSelectBook={handleSelectBook} />
              </motion.div>
            )}
            
            {activeView === 'summarizer' && (
              <motion.div key="summarizer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Summarizer user={user} onSummaryComplete={handleSummaryComplete} />
              </motion.div>
            )}
            
            {activeView === 'chat' && selectedBook && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Chat 
                  user={user}
                  book={selectedBook} 
                  onBack={() => setActiveView('library')} 
                />
              </motion.div>
            )}
            
            {activeView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Settings userName={userName} onUpdateName={handleUpdateName} />
              </motion.div>
            )}

            {activeView === 'assistant' && (
              <motion.div key="assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AssistantView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
