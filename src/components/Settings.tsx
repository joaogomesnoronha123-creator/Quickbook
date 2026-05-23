import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, LogOut, Globe, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../lib/translations';
import { Sun, Moon } from 'lucide-react';

interface SettingsProps {
  userName: string;
  onUpdateName: (name: string) => void;
}

export default function Settings({ userName, onUpdateName }: SettingsProps) {
  const { language, setLanguage, t: trans } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = trans.settings;
  const [notifications, setNotifications] = useState(() => localStorage.getItem('quickbook_notifications') !== 'false');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    localStorage.setItem('quickbook_notifications', String(notifications));
  }, [notifications]);

  const handleClearHistory = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      const libraryRef = collection(db, 'users', auth.currentUser.uid, 'library');
      const snapshot = await getDocs(libraryRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setShowClearConfirm(false);
      alert('Sua biblioteca foi limpa com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error("Error clearing library:", error);
      alert("Erro ao limpar biblioteca.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSaveName = async () => {
    if (tempName.trim() && auth.currentUser) {
      setIsUpdating(true);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: tempName.trim()
        });
        onUpdateName(tempName.trim());
        setIsEditingName(false);
      } catch (error) {
        console.error("Error updating name:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const cycleLanguage = () => {
    const langs: Language[] = ['Português (BR)', 'English (US)'];
    const currentIndex = langs.indexOf(language);
    setLanguage(langs[(currentIndex + 1) % langs.length]);
  };

  const sections = [
    {
      title: t.profile,
      items: [
        { 
          icon: User, 
          label: t.userName, 
          value: userName,
          onClick: () => {
            setTempName(userName);
            setIsEditingName(true);
          }
        },
        { 
          icon: Globe, 
          label: t.appLanguage, 
          value: language,
          onClick: cycleLanguage
        },
        { 
          icon: theme === 'dark' ? Moon : Sun, 
          label: t.appTheme, 
          value: theme === 'dark' ? t.themeDark : t.themeLight,
          onClick: toggleTheme
        },
      ]
    },
    {
      title: t.preferences,
      items: [
        { 
          icon: Bell, 
          label: t.notifications, 
          type: 'toggle', 
          active: notifications,
          onClick: () => setNotifications(!notifications)
        },
      ]
    },
    {
      title: t.security,
      items: [
        { 
          icon: Trash2, 
          label: t.clearLibrary, 
          type: 'button', 
          danger: true,
          onClick: () => setShowClearConfirm(true)
        },
        { 
          icon: LogOut, 
          label: t.logout, 
          type: 'button', 
          danger: true,
          onClick: () => setShowLogoutConfirm(true)
        },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-yellow-400" /> {t.title}
        </h1>
        <p className="text-zinc-500 text-base md:text-lg">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-xs font-black text-yellow-500 uppercase tracking-[0.2em] px-2">
              {section.title}
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl dark:shadow-none backdrop-blur-sm">
              {section.items.map((item, i) => (
                <div 
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center justify-between p-5 md:p-6 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer group",
                    i !== section.items.length - 1 && "border-b border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl transition-all shadow-lg",
                      item.danger 
                        ? "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white" 
                        : "bg-white dark:bg-zinc-800 text-zinc-400 group-hover:bg-yellow-400 group-hover:text-black group-hover:rotate-6 border border-zinc-100 dark:border-transparent"
                    )}>
                      <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className={cn(
                      "font-bold tracking-tight text-base md:text-lg transition-colors", 
                      item.danger ? "text-red-500" : "text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white"
                    )}>
                      {item.label}
                    </span>
                  </div>
                  
                  {item.value && (
                    <span className="text-sm text-zinc-500 font-bold group-hover:text-zinc-800 dark:group-hover:text-zinc-300 transition-colors tracking-tight">{item.value}</span>
                  )}
                  
                  {item.type === 'toggle' && (
                    <div className={cn(
                      "w-12 h-6 md:w-14 md:h-7 rounded-full p-1 transition-all relative border border-transparent shadow-inner",
                      item.active ? "bg-yellow-400 border-yellow-500" : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                    )}>
                      <div className={cn(
                        "w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform shadow-md",
                        item.active ? "translate-x-6 md:translate-x-7 bg-black" : "translate-x-0"
                      )} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isEditingName && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[101] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl"
            >
              <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight">{t.editName}</h2>
              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-yellow-400 outline-none transition-all mb-6 font-bold"
                placeholder="Seu nome..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={handleSaveName}
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-yellow-400 text-black rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : t.save}
                </button>
                <button 
                  onClick={() => setIsEditingName(false)}
                  className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-black text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/20">
                <Trash2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="pt-10">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Limpar biblioteca?</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed">
                  Todos os seus resumos e chats salvos serão removidos permanentemente.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleClearHistory}
                    className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/10"
                  >
                    Sim, apagar tudo
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="w-full py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    Mudar de ideia
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[102] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-xl border border-zinc-200 dark:border-zinc-700">
                <LogOut className="w-10 h-10 text-yellow-400" />
              </div>
              
              <div className="pt-10">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Deseja sair?</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed">
                  Seus dados locais serão mantidos, mas você precisará entrar com seu nome novamente.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLogout}
                    className="w-full py-5 bg-yellow-400 text-black rounded-2xl font-black text-lg hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-400/10"
                  >
                    Sim, sair agora
                  </button>
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    Continuar estudando
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-24 text-center border-t border-zinc-900 pt-12">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">QuickBook AI Professional v1.0.0</p>
        <p className="text-xs text-zinc-700 mt-2 font-medium italic">Empowering deep study through intelligence</p>
      </div>
    </div>
  );
}
