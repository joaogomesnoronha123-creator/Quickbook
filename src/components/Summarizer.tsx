import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, XCircle, Mic, MicOff } from 'lucide-react';
import { summarizeBook } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { User as FirebaseUser } from 'firebase/auth';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SummarizerProps {
  user: FirebaseUser;
  onSummaryComplete: (book: any) => void;
}

export default function Summarizer({ user, onSummaryComplete }: SummarizerProps) {
  const { language, t: trans } = useLanguage();
  const t = trans.summarizer;
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'English (US)' ? 'en-US' : 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Use a simple strategy to avoid double text in common messy recognition events
        if (event.results[event.resultIndex].isFinal) {
           setContent(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t.voiceNotSupported);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;

    if (isListening) recognitionRef.current?.stop();

    setLoading(true);
    try {
      // Truncate content if extremely large to prevent API errors
      const maxContentLength = 150000;
      const contentToSummarize = content.length > maxContentLength 
        ? content.slice(0, maxContentLength) + '... [Conteúdo truncado por ser muito longo]'
        : content;

      const summaryText = await summarizeBook(title, contentToSummarize);
      
      const bookData = {
        title,
        author: author || (language === 'English (US)' ? 'Unknown Author' : 'Autor Desconhecido'),
        summary: summaryText,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      };

      const libraryPath = `users/${user.uid}/library`;
      const newBookRef = doc(collection(db, libraryPath));
      
      await setDoc(newBookRef, bookData).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, newBookRef.path);
        throw err;
      });
      
      onSummaryComplete({
        id: newBookRef.id,
        ...bookData,
        createdAt: new Date().toISOString()
      });

      setTitle('');
      setAuthor('');
      setContent('');
      setFileStatus('idle');
    } catch (error) {
      console.error('Summarization failed:', error);
      alert((t as any).summarizeError || t.fileError);
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    console.log('Extracting text from PDF:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str || ''))
        .join(' ');
      fullText += pageText + '\n';
    }
    const cleanText = fullText.trim();
    console.log('PDF extraction complete, length:', cleanText.length);
    return cleanText;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    console.log('File detected:', file.name, 'type:', file.type);
    
    setIsProcessingFile(true);
    setFileStatus('idle');

    if (!title) {
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setTitle(nameWithoutExt);
    }

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        if (text.length === 0) {
          console.warn('Extracted PDF text is empty');
          alert((t as any).pdfNoText || 'No text found in PDF');
          setFileStatus('error');
        } else {
          setContent(text);
          setFileStatus('success');
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        console.log('Reading text file...');
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result;
          if (typeof text === 'string') {
            console.log('Text file read complete, length:', text.length);
            setContent(text);
            setFileStatus('success');
          } else {
            console.error('Text conversion failed');
            setFileStatus('error');
          }
          setIsProcessingFile(false);
        };
        reader.onerror = () => {
          console.error('FileReader error');
          setFileStatus('error');
          setIsProcessingFile(false);
        };
        reader.readAsText(file);
        return; 
      } else {
        console.warn('Unsupported file type:', file.type);
        setFileStatus('error');
      }
    } catch (error) {
      console.error('File load error:', error);
      setFileStatus('error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8 pb-24 px-6">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-2">
          {t.title}
        </h1>
        <p className="text-zinc-500 text-xs md:text-base font-medium">{t.subtitle}</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Compact Upload Area */}
        <div 
          className={cn(
            "relative group cursor-pointer transition-all duration-300",
            dragActive ? "scale-[1.01]" : "scale-100",
            isProcessingFile ? "opacity-50 cursor-wait" : ""
          )}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          onClick={() => !isProcessingFile && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".txt,.md,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <div className={cn(
            "w-full py-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-4 transition-all px-6",
            fileStatus === 'success' ? "bg-green-500/5 border-green-500/30 text-green-600" : 
            fileStatus === 'error' ? "bg-red-500/5 border-red-500/30 text-red-600" :
            dragActive ? "bg-yellow-400/10 border-yellow-400 text-yellow-600" : 
            "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-yellow-400/50"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
              fileStatus === 'success' ? "bg-green-500 text-white" :
              fileStatus === 'error' ? "bg-red-500 text-white" :
              "bg-yellow-400 text-black group-hover:rotate-6 shadow-lg shadow-yellow-400/20"
            )}>
              {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin" /> :
               fileStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               fileStatus === 'error' ? <XCircle className="w-5 h-5" /> :
               <Upload className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-sm tracking-tight">
                {isProcessingFile ? "Processando..." :
                 fileStatus === 'success' ? t.fileSuccess : 
                 fileStatus === 'error' ? t.fileError : 
                 t.upload}
              </p>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">{t.maxSize}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSummarize} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-4">
                {language === 'English (US)' ? 'Book Identity' : 'Identidade do Livro'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-1.5 shadow-sm">
                <div className="flex items-center px-4 py-2.5 gap-3 group focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all rounded-2xl">
                  <FileText className="w-4 h-4 text-zinc-400 group-focus-within:text-yellow-400" />
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-bold text-sm"
                    placeholder={language === 'English (US)' ? 'Title' : 'Título'}
                  />
                </div>
                <div className="flex items-center px-4 py-2.5 gap-3 group focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all rounded-2xl">
                  <Sparkles className="w-4 h-4 text-zinc-400 group-focus-within:text-yellow-400" />
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-transparent text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-bold text-sm"
                    placeholder={language === 'English (US)' ? 'Author' : 'Autor'}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between ml-4">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                  {t.pasteText}
                </label>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    isListening 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-yellow-500"
                  )}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {isListening ? t.voiceStop : t.voiceStart}
                </button>
              </div>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[220px] px-6 py-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-zinc-900 dark:text-white focus:ring-4 focus:ring-yellow-400/10 outline-none resize-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium text-sm shadow-sm"
                  placeholder={t.placeholder}
                />
                {content.length > 0 && (
                  <div className="absolute bottom-4 right-6 text-[10px] font-bold text-zinc-400 pointer-events-none">
                    {content.length.toLocaleString()} caracteres
                  </div>
                )}
              </div>
            </div>

          <button
            disabled={loading || !title || !content}
            type="submit"
            className="w-full py-5 bg-yellow-400 text-black rounded-2xl font-black text-lg shadow-xl shadow-yellow-400/10 hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                {t.generate}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

