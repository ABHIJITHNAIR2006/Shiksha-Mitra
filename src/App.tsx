import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, 
  FileText, 
  Trash2, 
  RotateCcw, 
  Upload, 
  Loader2, 
  User, 
  Bot,
  BrainCircuit,
  GraduationCap,
  AlertCircle,
  FileCheck2,
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  Settings,
  X,
  Menu,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- TYPES ---
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  pdf?: PdfMetadata | null;
  timestamp: Date;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  source?: 'PDF' | 'GEMINI' | 'FALLBACK';
  timestamp: Date;
}

interface PdfMetadata {
  fileName: string;
  text: string;
}

interface UserPreferences {
  userName: string;
  autoSummary: boolean;
  modelTone: 'concise' | 'detailed' | 'creative';
  fontSize: 'sm' | 'md' | 'lg';
}

// --- CONSTANTS ---
const MAX_PDF_CONTEXT_CHARS = 5000;
const MAX_HISTORY = 6;
const STORAGE_KEY = 'shiksha-mitra-data';

// --- FALLBACK LOGIC ---
const RESPONSES: Record<string, string> = {
  "calculus": "### Calculus\nCalculus is the mathematical study of continuous change, involving:\n- **Derivatives**: Rates of change.\n- **Integrals**: Accumulation of quantities.",
  "algebra": "### Algebra\nAlgebra focuses on symbols and the rules for manipulating those symbols in equations.",
  "algorithm": "### Algorithms\nAn algorithm is a finite sequence of well-defined instructions to solve a specific problem efficiently.",
  "exam": "### Study Tips\n1. **Schedule**: Create a consistent study plan.\n2. **Practice**: Solve past papers.\n3. **Sleep**: Ensure at least 7-8 hours of rest."
};

const getFallbackResponse = (input: string) => {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return "I'm sorry, I couldn't find information on that topic in my offline database. Please check your internet connection.";
};

// --- COMPONENT ---
export default function App() {
  // State for multi-chat support
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // UI State
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat');
  const [input, setInput] = useState('');
  
  // Preferences State
  const [prefs, setPrefs] = useState<UserPreferences>({
    userName: 'Scholar',
    autoSummary: true,
    modelTone: 'detailed',
    fontSize: 'md'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence: Load on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessions && parsed.sessions.length > 0) {
          // Convert string timestamps back to Date objects
          const restored = parsed.sessions.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
            messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          }));
          setSessions(restored);
          setCurrentSessionId(restored[0].id);
        }
        if (parsed.prefs) setPrefs(parsed.prefs);
      } catch (e) {
        console.error("Failed to restore sessions", e);
      }
    }
  }, []);

  // Persistence: Save on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, prefs }));
    }
  }, [sessions, prefs]);

  // Dark Mode detection
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isTyping]);

  // Derived state for current view
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;
  const messages = currentSession?.messages || [];
  const pdf = currentSession?.pdf || null;

  const createNewSession = (initialMsg?: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: initialMsg ? (initialMsg.slice(0, 30) + '...') : 'New Interaction',
      messages: [{
        id: 'welcome',
        role: 'bot',
        content: `# Namaste, ${prefs.userName}! 🎓\n\nI am **Shiksha Mitra**, here to assist your academic journey.\n\n${initialMsg ? `I've started a new session for your question: *"${initialMsg}"*` : 'How can I help you learn today?'}`,
        timestamp: new Date()
      }],
      timestamp: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveTab('chat');
    return newId;
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const updateCurrentSession = (updater: (s: ChatSession) => ChatSession) => {
    if (!currentSessionId) {
      const id = createNewSession();
      setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
      return;
    }
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updater(s) : s));
  };

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      updateCurrentSession(s => ({
        ...s,
        pdf: { fileName: data.fileName, text: data.text },
        messages: [...s.messages, {
          id: Date.now().toString(),
          role: 'bot',
          content: `### 📖 Source Integrated: ${data.fileName}\nI have indexed the technical content. Ready for questions based on this document.`,
          timestamp: new Date()
        }]
      }));
    } catch (err: any) {
      updateCurrentSession(s => ({
        ...s,
        messages: [...s.messages, {
          id: Date.now().toString(),
          role: 'bot',
          content: `### ⚠️ Technical Hitch\n${err.message}`,
          timestamp: new Date()
        }]
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    let targetId = currentSessionId;
    if (!targetId) {
      targetId = createNewSession(input);
    }

    const userInput = input;
    setInput('');
    setIsTyping(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    // Update session with user message and set title if it was default
    setSessions(prev => prev.map(s => s.id === targetId ? {
      ...s,
      title: s.messages.length <= 1 ? userInput.slice(0, 30) + '...' : s.title,
      messages: [...s.messages, userMessage]
    } : s));

    try {
      let answer = '';
      let source: Message['source'] = 'GEMINI';

      // Scope PDF check based on the session we are in
      const activeSession = sessions.find(s => s.id === targetId);
      const activePdf = activeSession?.pdf;

      if (activePdf) {
        const sentences = activePdf.text.split(/[.!?]+\s+/);
        const keywords = userInput.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        let bestSentence = '';
        let maxMatches = 0;

        sentences.forEach(s => {
          let matches = 0;
          keywords.forEach(k => { if (s.toLowerCase().includes(k)) matches++; });
          if (matches > maxMatches) {
            maxMatches = matches;
            bestSentence = s;
          }
        });

        if (maxMatches >= 3) {
          answer = `#### Relevant excerpt from ${activePdf.fileName}:\n${bestSentence}.`;
          source = 'PDF';
        }
      }

      if (!answer) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const history = (activeSession?.messages || []).slice(-MAX_HISTORY).map(m => 
            `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`
          ).join('\n');

          const pdfCtx = activePdf ? `\n\n--- PDF CONTENT START ---\n${activePdf.text.slice(0, MAX_PDF_CONTEXT_CHARS)}\n--- PDF CONTENT END ---\n` : "";
          
          const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `${history}\n\nQuestion: ${userInput}\n\nContext:\n${pdfCtx}`,
            config: {
              systemInstruction: `You are Shiksha Mitra. Tone: ${prefs.modelTone}. Format: Highly structured Markdown.`
            }
          });
          answer = result.text || "_No response._";
          source = 'GEMINI';
        } catch (e) {
          answer = getFallbackResponse(userInput);
          source = 'FALLBACK';
        }
      }

      setSessions(prev => prev.map(s => s.id === targetId ? {
        ...s,
        messages: [...s.messages, {
          id: Date.now().toString(),
          role: 'bot',
          content: answer,
          source,
          timestamp: new Date()
        }]
      } : s));
    } catch (err) {
       console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} flex font-sans text-slate-900 dark:text-slate-100`}>
      
      {/* SIDEBAR */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <GraduationCap size={24} />
            </div>
            {isSidebarOpen && <span className="font-bold text-lg">Shiksha Mitra</span>}
          </div>
        </div>

        <div className="p-4">
          <button 
            onClick={() => createNewSession()}
            className={`w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 ${!isSidebarOpen && 'p-0 h-10 w-10 mx-auto'}`}
          >
            <X size={20} className="rotate-45" />
            {isSidebarOpen && <span>New Session</span>}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<MessageSquare size={20}/>} 
            label="Interaction Room" 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            isOpen={isSidebarOpen} 
          />
          <SidebarItem 
            icon={<RotateCcw size={20}/>} 
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            isOpen={isSidebarOpen} 
          />
          <SidebarItem 
            icon={<Settings size={20}/>} 
            label="Preferences" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            isOpen={isSidebarOpen} 
          />
          
          {isSidebarOpen && sessions.length > 0 && (
            <div className="pt-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-3">Recent Interaction History</h4>
              <div className="space-y-1">
                {sessions.slice(0, 8).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); }}
                    className={`w-full group text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${currentSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <span className="truncate">{s.title}</span>
                    <Trash2 
                      size={14} 
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" 
                      onClick={(e) => deleteSession(e, s.id)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
             {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
             {isSidebarOpen && <span>{isDarkMode ? 'Solar View' : 'Lunar View'}</span>}
           </button>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
             <ChevronRight size={20} className={`transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
             {isSidebarOpen && <span>Collapse Shelf</span>}
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen transition-all">
        
        {/* VIEW: PREFERENCES */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Settings size={32} />
                </div>
                <h2 className="text-3xl font-black">Personalized Preferences</h2>
              </div>
              
              <div className="space-y-8">
                <div className="group">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 group-focus-within:text-indigo-500 transition-colors">Scholar Identity</label>
                  <input 
                    type="text" 
                    value={prefs.userName}
                    onChange={(e) => setPrefs({...prefs, userName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Mitra Response Tone</label>
                    <select 
                      value={prefs.modelTone}
                      onChange={(e) => setPrefs({...prefs, modelTone: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none appearance-none font-bold"
                    >
                      <option value="detailed">Exhaustive & Explanatory</option>
                      <option value="concise">Direct & Fast</option>
                      <option value="creative">Creative & Brainstorming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Readable Segregation</label>
                    <select 
                      value={prefs.fontSize}
                      onChange={(e) => setPrefs({...prefs, fontSize: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none appearance-none font-bold"
                    >
                      <option value="sm">Compact (Small)</option>
                      <option value="md">Standard (Medium)</option>
                      <option value="lg">Accessible (Large)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 font-black transition-all shadow-lg active:scale-[0.98]"
                  >
                    Save & Return to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-black mb-8">Interaction Archives</h2>
              {sessions.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <RotateCcw size={64} className="mx-auto mb-4" />
                  <p className="font-bold uppercase tracking-widest">No previous interactions found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map(s => (
                    <motion.div 
                      key={s.id}
                      whileHover={{ y: -5 }}
                      onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl group cursor-pointer hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                          <MessageSquare size={20} />
                        </div>
                        <Trash2 
                          size={18} 
                          className="text-slate-300 hover:text-red-500 transition-colors" 
                          onClick={(e) => deleteSession(e, s.id)}
                        />
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{s.title}</h3>
                      <p className="text-xs text-slate-400 font-medium mb-4">{s.messages.length} exchanges • {s.timestamp.toLocaleDateString()}</p>
                      {s.pdf && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                          <FileText size={12} /> Document Attached
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CHAT ROOM */}
        {activeTab === 'chat' && (
          <>
            {/* Header Area */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600/10 dark:bg-indigo-400/10 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 md:hidden">
                  <GraduationCap size={20} />
                </div>
                <div>
                   <h2 className="font-black text-sm md:text-base truncate max-w-[200px] md:max-w-[400px]">
                     {currentSession?.title || 'Draft Session'}
                   </h2>
                   {pdf && (
                     <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                       <FileCheck2 size={12} /> {pdf.fileName} Indexed
                     </div>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => createNewSession()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                   <RotateCcw size={20} />
                 </button>
                 <button className="md:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                   <Menu size={24} />
                 </button>
              </div>
            </div>

            {/* Chat Feed */}
            <div className={`flex-1 overflow-y-auto px-4 md:px-10 py-10 space-y-10 custom-scrollbar relative ${prefs.fontSize === 'sm' ? 'text-sm' : prefs.fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
              <AnimatePresence>
                {dragActive && (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="absolute inset-x-4 top-4 bottom-4 z-50 bg-indigo-600/90 rounded-3xl flex flex-col items-center justify-center text-white backdrop-blur-sm border-2 border-dashed border-white/40">
                    <Upload size={48} className="mb-4 animate-bounce" />
                    <h3 className="text-2xl font-black">Link Source to Session</h3>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-60">
                   <BrainCircuit size={64} className="mb-6" />
                   <h3 className="text-xl font-black uppercase tracking-widest">Neural Pathway Open</h3>
                   <p className="text-sm font-medium mt-2">Shiksha Mitra is currently in standby mode.</p>
                </div>
              )}

              {messages.map((m) => (
                <motion.div key={m.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-4 max-w-[90%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${m.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {m.source && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                          {m.source} ANALYTICS <ChevronRight size={10} />
                        </div>
                      )}
                      <div className={`p-6 rounded-3xl markdown-body transition-all shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white chat-bubble-user' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 chat-bubble-bot'}`}>
                        <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                   <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                       <Bot size={20} className="animate-pulse" />
                     </div>
                     <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 md:p-10 sticky bottom-0 z-10 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/90 dark:via-slate-950/90 to-transparent">
               <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-2 flex items-end gap-2 shadow-2xl shadow-indigo-100/50 dark:shadow-none transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 active:scale-[0.99]">
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-3xl transition-all h-14 w-14 flex items-center justify-center">
                    {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} accept=".pdf" className="hidden" />
                  
                  <div className="flex-1 min-h-[56px] flex items-center">
                    <textarea 
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                      placeholder={pdf ? "Ask about the document..." : "Type an academic query..."}
                      className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 resize-none outline-none font-bold text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-700"
                    />
                  </div>

                  <button onClick={handleSendMessage} disabled={!input.trim() || isTyping} className="h-14 w-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-3xl transition-all flex items-center justify-center shadow-lg active:scale-90">
                    <Send size={24} />
                  </button>
               </div>
               <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest mt-6">
                 Shiksha Mitra Academic Engine • Knowledge Mitra v2.1
               </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SidebarItem({ icon, label, active = false, onClick, isOpen = true }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, isOpen?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full group flex items-center gap-3 p-3.5 rounded-xl transition-all relative ${
      active 
        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
    } ${!isOpen && 'justify-center p-3.5'}`}>
      <div className={`${active ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110 transition-transform'}`}>{icon}</div>
      {isOpen && <span className={`font-bold text-sm ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>}
      {active && isOpen && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />}
    </button>
  );
}

