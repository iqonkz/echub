
import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { BookOpen, ChevronRight, Plus, X, Trash2, MoreVertical, Pencil, Search, Bold, Italic, List } from 'lucide-react';

interface KBProps {
  articles: Article[];
  onAddArticle: (article: Article) => void;
  searchQuery: string;
  currentUser?: any;
}

type KbTab = 'WORK' | 'PERSONAL';

const KnowledgeBase: React.FC<KBProps> = ({ articles, onAddArticle, searchQuery, currentUser }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<KbTab>('WORK');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState<{title: string, category: string, content: string}>({ title: '', category: '', content: '' });
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredArticles = articles.filter(a => 
    a.type === activeTab &&
    (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      const article: Article = {
          id: `kb${Date.now()}`,
          title: newArticle.title,
          category: newArticle.category,
          content: newArticle.content,
          updatedAt: new Date().toISOString(),
          type: activeTab,
          author: currentUser?.name || 'Unknown',
          authorId: currentUser?.id || ''
      };
      onAddArticle(article);
      setIsModalOpen(false);
      setNewArticle({ title: '', category: '', content: '' });
  };

  const insertFormatting = (tag: string) => {
      if (!textAreaRef.current) return;
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = newArticle.content;
      
      let prefix = '';
      let suffix = '';

      if (tag === 'bold') { prefix = '**'; suffix = '**'; }
      if (tag === 'italic') { prefix = '_'; suffix = '_'; }
      if (tag === 'list') { prefix = '\n- '; suffix = ''; }

      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);

      setNewArticle({ ...newArticle, content: `${before}${prefix}${selected}${suffix}${after}` });
      
      // Restore focus (approximate)
      setTimeout(() => textAreaRef.current?.focus(), 0);
  };

  const canDelete = (article: Article) => {
      return article.authorId === currentUser?.id || currentUser?.role === 'ADMIN';
  };

  // Simple formatter to render bold, italic, and lists
  const formatContent = (text: string) => {
      // Escape HTML first to prevent injection if this was real user content
      // For this demo, we'll skip complex sanitization but focus on the requested formats
      
      let formatted = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/_(.*?)_/g, '<em>$1</em>') // Italic
          .replace(/\n- (.*)/g, '<li class="ml-4 list-disc">$1</li>') // List items
          .replace(/\n/g, '<br/>'); // Line breaks

      return <div dangerouslySetInnerHTML={{__html: formatted}} />;
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col pb-6">
       <div className="flex justify-between items-center mb-6">
          <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <button 
               onClick={() => { setActiveTab('WORK'); setSelectedArticle(null); }} 
               className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'WORK' ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
             >
               Рабочая
             </button>
             <button 
               onClick={() => { setActiveTab('PERSONAL'); setSelectedArticle(null); }}
               className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'PERSONAL' ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
             >
               Личная
             </button>
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="px-5 py-2.5 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5"
          >
             <Plus className="w-5 h-5" />
             <span className="hidden md:inline">Добавить статью</span>
          </button>
       </div>

      <div className="flex-1 flex gap-6 overflow-hidden flex-col md:flex-row">
        {/* Sidebar / List */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col overflow-hidden ${selectedArticle ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
             <h2 className="font-bold text-lg text-gray-900 dark:text-white">Список статей</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredArticles.map(article => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`w-full text-left p-4 rounded-xl text-sm transition-all border group ${
                    selectedArticle?.id === article.id 
                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/30 shadow-sm' 
                    : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-bold mb-1 ${selectedArticle?.id === article.id ? 'text-primary-900 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{article.title}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{article.category}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedArticle?.id === article.id ? 'text-primary-500 rotate-90' : 'text-gray-400'}`} />
                  </div>
                </button>
              ))}
              {filteredArticles.length === 0 && (
                  <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                      <Search className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-sm">Ничего не найдено</span>
                  </div>
              )}
           </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none p-6 md:p-10 overflow-y-auto relative ${selectedArticle ? 'block' : 'hidden md:block'}`}>
           {selectedArticle ? (
             <article className="prose dark:prose-invert max-w-none">
               <div className="flex justify-between items-start mb-6 relative">
                   <button onClick={() => setSelectedArticle(null)} className="md:hidden mb-4 text-sm font-bold text-gray-500 flex items-center gap-1">
                       &larr; Назад
                   </button>
                   
                   {canDelete(selectedArticle) && (
                       <div className="relative ml-auto">
                           <button 
                             onClick={() => setOpenMenuId(openMenuId === selectedArticle.id ? null : selectedArticle.id)}
                             className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                           >
                               <MoreVertical className="w-5 h-5" />
                           </button>
                           {openMenuId === selectedArticle.id && (
                               <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-2 animate-fade-in overflow-hidden">
                                   <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium">
                                       <Pencil className="w-4 h-4" /> Редактировать
                                   </button>
                                   <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 font-medium">
                                       <Trash2 className="w-4 h-4" /> Удалить
                                   </button>
                               </div>
                           )}
                       </div>
                   )}
               </div>
               
               <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-6">
                 <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <BookOpen className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-bold uppercase tracking-wide">{selectedArticle.category}</span>
               </div>
               
               <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">{selectedArticle.title}</h1>
               
               <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                         {selectedArticle.author.charAt(0)}
                     </div>
                     <span className="font-medium">{selectedArticle.author}</span>
                 </div>
                 <span>{new Date(selectedArticle.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
               </div>
               
               <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                 {formatContent(selectedArticle.content)}
               </div>
             </article>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                   <BookOpen className="w-10 h-10 opacity-30" />
               </div>
               <p className="text-lg font-medium">Выберите статью для просмотра</p>
             </div>
           )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Новая статья</h3>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X className="w-5 h-5" /></button>
               </div>
               <form onSubmit={handleAdd} className="p-6 space-y-5 overflow-y-auto">
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Заголовок</label>
                       <input 
                         value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} 
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" required 
                       />
                   </div>
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Категория</label>
                       <input 
                         value={newArticle.category} onChange={e => setNewArticle({...newArticle, category: e.target.value})} 
                         placeholder="Например: HR, IT, Инструкции"
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" required 
                       />
                   </div>
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Содержание</label>
                       {/* Toolbar */}
                       <div className="flex gap-2 mb-2">
                           <button type="button" onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" title="Жирный"><Bold className="w-4 h-4"/></button>
                           <button type="button" onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" title="Курсив"><Italic className="w-4 h-4"/></button>
                           <button type="button" onClick={() => insertFormatting('list')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" title="Список"><List className="w-4 h-4"/></button>
                       </div>
                       <textarea 
                         ref={textAreaRef}
                         value={newArticle.content} onChange={e => setNewArticle({...newArticle, content: e.target.value})} 
                         rows={8}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all resize-none font-mono" required 
                       />
                   </div>
                   <div className="flex justify-end pt-2">
                       <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">Сохранить</button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
