import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInAnonymously, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

type AuthMode = 'login' | 'register' | 'anonymous' | 'forgot_password';

export default function Login() {
  const { t: trans, language } = useLanguage();
  const t = trans.auth;
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const authErrors = (t as any).errors;

  const getAuthErrorMessage = (err: any) => {
    console.error('Authentication error details:', err);
    if (!authErrors) return t.error;

    switch (err.code) {
      case 'auth/invalid-email': return authErrors.invalidEmail;
      case 'auth/user-not-found': return authErrors.userNotFound;
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return authErrors.wrongPassword;
      case 'auth/email-already-in-use': return authErrors.emailInUse;
      case 'auth/weak-password': return authErrors.weakPassword;
      case 'auth/too-many-requests': return authErrors.tooManyRequests;
      case 'auth/network-request-failed': return authErrors.networkError;
      case 'auth/popup-closed-by-user': return authErrors.popupClosed;
      case 'auth/operation-not-allowed': return authErrors.operationNotAllowed;
      case 'auth/user-disabled': return authErrors.userDisabled;
      default:
        if (err.message?.includes('Missing or insufficient permissions')) {
          return authErrors.permissionDenied;
        }
        return t.error;
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'Estudante',
        email: user.email,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });

    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
        }

        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim() || 'Estudante',
          email: user.email,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage((t as any).resetSent || 'Reset link sent!');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      const guestName = name.trim() || (trans.nav.home === 'Início' ? 'Visitante' : 'Guest');

      await setDoc(doc(db, 'users', user.uid), {
        name: guestName,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isAnonymous: true
      }, { merge: true });

    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 selection:bg-yellow-400 selection:text-black transition-colors duration-300">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-400/20"
          >
            <BookOpen className="w-8 h-8 text-black" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">QuickBook</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[8px] mt-1">Estudos Sem Burocracia</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2.5rem] shadow-xl dark:shadow-2xl space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {mode === 'forgot_password' ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-left space-y-1 px-1">
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{(t as any).resetPassword || 'Redefinir Senha'}</h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Informe seu e-mail para receber o link de recuperação.</p>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                      required
                      type="email"
                      placeholder={t.email}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-sm"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3 px-4 rounded-xl font-bold">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] py-3 px-4 rounded-xl font-bold">
                      {successMessage}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-yellow-400 text-black rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-xl shadow-yellow-400/10 group disabled:opacity-50"
                  >
                    {loading ? '...' : ((t as any).resetPassword || 'Enviar Link')}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                    className="w-full py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-center"
                  >
                    {(t as any).backToLogin || 'Voltar para Login'}
                  </button>
                </form>
              ) : (
                <>
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {mode === 'register' && (
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" />
                        <input
                          required
                          type="text"
                          placeholder={trans.settings.userName}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-sm"
                        />
                      </div>
                    )}

                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" />
                      <input
                        required
                        type="email"
                        placeholder={t.email}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-sm"
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-yellow-500 transition-colors" />
                      <input
                        required
                        type="password"
                        placeholder={t.password}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700 text-sm"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3 px-4 rounded-xl font-bold">
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setMode('forgot_password'); setError(null); setSuccessMessage(null); }}
                        className="text-[10px] font-bold text-zinc-400 hover:text-yellow-500 transition-colors uppercase tracking-widest text-center"
                      >
                        {(t as any).forgotPassword || 'Esqueci a senha'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccessMessage(null); }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-1.5"
                      >
                        <span className="text-[8px] text-zinc-500 font-medium">
                          {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                        </span>
                        <span className="text-yellow-500 hover:text-yellow-600 transition-colors">
                          {mode === 'login' ? 'Criar Conta' : 'Fazer Login'}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-yellow-400 text-black rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-xl shadow-yellow-400/10 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '...' : (mode === 'login' ? t.login : t.register)}
                        {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnonymous()}
                        disabled={loading}
                        className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <ArrowRight className="w-3.5 h-3.5 rotate-45" />
                        {(t as any).guest || 'Entrar sem Login'}
                      </button>
                    </div>
                  </form>

                  <div className="relative flex items-center pt-2">
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-zinc-400 text-[8px] font-bold uppercase tracking-widest">Ou</span>
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pb-2">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                      {t.google}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-zinc-500 text-[8px] font-medium px-8 leading-relaxed uppercase tracking-[0.2em]">
            A entrada temporária não salva dados permanentemente.
        </p>
      </motion.div>
    </div>
  );
}
