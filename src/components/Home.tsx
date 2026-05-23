import React, { useState } from 'react';
import { PlusCircle, Library as LibraryIcon, Sparkles, ShieldCheck, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider } from '../lib/firebase';
import { linkWithPopup, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
  onNavigate: (view: 'summarizer' | 'library' | 'assistant') => void;
  userName: string;
  user: FirebaseUser;
}

export default function Home({ onNavigate, userName, user }: HomeProps) {
  const { t: trans } = useLanguage();
  const t = trans.home;
  const tc = (trans as any).chat;
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedSuccess, setLinkedSuccess] = useState(false);

  const isAnonymous = user?.isAnonymous;

  const handleLinkAccount = async () => {
    setLinking(true);
    setError(null);
    try {
      // Tenta vincular a conta anônima atual com o Google
      const result = await linkWithPopup(user, googleProvider);
      const linkedUser = result.user;
      
      // Atualiza o perfil no Firestore com os dados do Google, mas mantém os livros existentes
      await setDoc(doc(db, 'users', linkedUser.uid), {
        name: linkedUser.displayName || userName,
        email: linkedUser.email,
        lastActive: serverTimestamp(),
        isLinked: true
      }, { merge: true });

      setLinkedSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        setError('Este e-mail já está vinculado a outra conta. Tente sair e entrar com Google diretamente.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Safe to ignore
      } else if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/auth-domain-config-required') {
        setError(`Domínio não autorizado: Adicione "${window.location.hostname}" nos domínios autorizados das configurações de Autenticação do Console Firebase.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Provedor não ativado: Certifique-se de ativar o Google Sign-In no console de Autenticação do Firebase.");
      } else {
        setError('Erro ao vincular conta. Devido ao frame do AI Studio, tente abrir o app em uma NOVA ABA no canto superior direito do preview.');
      }
    } finally {
      setLinking(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto pt-4 md:pt-12 pb-12 px-6">
      {/* Sistema de Vinculação / Alerta de Segurança */}
      <AnimatePresence>
        {isAnonymous && !linkedSuccess && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-yellow-500" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-zinc-900 dark:text-white font-black text-base tracking-tight mb-1">{t.protectBooks}</h3>
                  <p className="text-zinc-500 text-[10px] font-medium leading-relaxed max-w-md">
                    {t.protectSubtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={handleLinkAccount}
                    disabled={linking}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-xl transition-all active:scale-95 disabled:opacity-50 text-xs"
                  >
                    {linking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        {t.linkGoogle}
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold justify-center md:justify-start">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Minimalista */}
      <header className="mb-12 md:mb-20">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-2xl md:rounded-[24px] mb-6 flex items-center justify-center shadow-2xl shadow-yellow-400/30"
        >
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-black" />
        </motion.div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.85] mb-4">
          {t.greeting}, <span className="text-yellow-400">{userName}</span>.<br />{t.question}
        </h1>
        <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-sm">{t.subtitle}</p>
      </header>

      {/* Ações Diretas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.button
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('summarizer')}
          className="w-full p-6 md:p-8 bg-yellow-400 rounded-[32px] flex flex-col items-start gap-4 md:gap-6 group shadow-xl shadow-yellow-400/10 transition-all border-4 border-transparent hover:border-black/5"
        >
          <div className="p-4 bg-black/10 rounded-2xl group-hover:scale-110 transition-transform">
            <PlusCircle className="w-8 h-8 text-black" />
          </div>
          <div className="text-left">
            <span className="block font-black text-black text-base md:text-xl tracking-tighter mb-1">{t.newSummary}</span>
            <span className="text-black/60 text-[10px] md:text-xs font-bold uppercase tracking-wider">{t.createStudy}</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('library')}
          className="w-full p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] flex flex-col items-start gap-4 md:gap-6 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xl dark:shadow-none"
        >
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
            <LibraryIcon className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-left">
            <span className="block font-black text-zinc-900 dark:text-white text-base md:text-xl tracking-tighter mb-1">{t.library}</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">{t.accessSaved}</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('assistant')}
          className="w-full p-6 md:p-8 bg-yellow-400 rounded-[32px] flex flex-col items-start gap-4 md:gap-6 group shadow-xl shadow-yellow-400/10 transition-all border-4 border-transparent hover:border-black/5"
        >
          <div className="p-4 bg-black/10 rounded-2xl group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <div className="text-left">
            <span className="block font-black text-black text-base md:text-xl tracking-tighter mb-1">{tc.title}</span>
            <span className="text-black/60 text-[10px] md:text-xs font-bold uppercase tracking-wider">Pergunte à IA</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
