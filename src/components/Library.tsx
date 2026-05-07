import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

import { User as FirebaseUser } from 'firebase/auth';

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  summary: string;
  createdAt: any;
}

interface LibraryProps {
  user: FirebaseUser;
  onSelectBook: (book: BookSummary) => void;
}

export default function Library({ user, onSelectBook }: LibraryProps) {
  const { language, t: trans } = useLanguage();
  const t = trans.library;
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const libraryPath = `users/${user.uid}/library`;
    const q = query(collection(db, libraryPath), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookSummary[];
      setBooks(booksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, libraryPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (book.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const deleteBook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const bookPath = `users/${user.uid}/library/${id}`;
    try {
      await deleteDoc(doc(db, bookPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, bookPath);
    }
  };

  const formatDate = (timestamp: any) => {
    const locale = language === 'English (US)' ? 'en-US' : 'pt-BR';
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString(locale);
    }
    return new Date().toLocaleDateString(locale);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">{t.title}</h1>
        <p className="text-zinc-500 text-base">{t.subtitle}</p>
      </header>

      <div className="mb-10">
        <div className="relative w-full max-w-2xl mx-auto md:mx-0">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 transition-colors group-focus-within:text-yellow-400" />
          <input
            type="text"
            placeholder={language === 'English (US)' ? 'Search your library...' : 'Pesquisar na sua biblioteca...'}
            className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-900 dark:text-white text-base focus:outline-none focus:ring-4 focus:ring-yellow-400/10 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{language === 'English (US)' ? 'Loading Library...' : 'Carregando Biblioteca...'}</p>
            </div>
          ) : filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onSelectBook(book)}
                className="group bg-zinc-50 dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-400/5 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-18 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-transparent rounded-2xl flex items-center justify-center text-zinc-300 dark:text-zinc-600 group-hover:bg-yellow-400 group-hover:text-black transition-all rotate-[-3deg] group-hover:rotate-0 shadow-sm">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <button
                    onClick={(e) => deleteBook(book.id, e)}
                    className="p-3 text-zinc-400 dark:text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-1 group-hover:text-yellow-400 dark:group-hover:text-yellow-400 transition-colors leading-tight">{book.title}</h3>
                  <p className="text-sm text-zinc-500 font-medium mb-6">{book.author}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        {formatDate(book.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all text-yellow-400">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <BookOpen className="w-20 h-20 text-zinc-200 dark:text-zinc-800 mx-auto mb-6" />
              <p className="text-zinc-400 dark:text-zinc-500 text-xl font-black tracking-tight">{t.noBooks}</p>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-2 font-medium">{t.startStudy}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
