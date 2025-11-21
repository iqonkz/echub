import React, { useState } from 'react';
import { Article } from '../types';
import { BookOpen, ChevronRight, Plus, X, Trash2 } from 'lucide-react';

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

  // Permission Logic
  // Work: Creator can delete.
  // Personal: Creator can edit/delete.
  const canDelete = (article: Article) => {
      return article.authorId === currentUser?.id || currentUser?.role === 'ADMIN';
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
       <div className="flex justify-between items-center mb-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
             <button 
               onClick={() => { setActiveTab('WORK'); setSelectedArticle(null); }} 
               className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'WORK' ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
             >
               Рабочая
             </button>
             <button 
               onClick={() => { setActiveTab('PERSONAL'); setSelectedArticle(null); }}
               className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'PERSONAL' ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
             >
               Личная
             </button>
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="p-2 md:px-4 md:py-2 bg-primary-500 text-gray-900 rounded-lg flex items-center gap-2 font-bold hover:bg-primary-400"
          >
             <Plus className="w-4 h-4" />
             <span className="hidden md:inline">Добавить статью</span>
          </button>
       </div>

      <div className="flex-1 flex gap-6 overflow-hidden flex-col md:flex-row">
        {/* Sidebar / List */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden ${selectedArticle ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
             <h2 className="font-bold text-lg text-gray-800 dark:text-white">Статьи</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredArticles.map(article => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex justify-between items-center ${
                    selectedArticle?.id === article.id 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">{article.title}</div>
                    <div className="text-xs opacity-70 mt-1">{article.category}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
              {filteredArticles.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">Ничего не найдено</div>}
           </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-8 overflow-y-auto ${selectedArticle ? 'block' : 'hidden md:block'}`}>
           {selectedArticle ? (
             <article className="prose dark:prose-invert max-w-none">
               <div className="flex justify-between items-start mb-4">
                   <button onClick={() => setSelectedArticle(null)} className="md:hidden mb-4 text-sm text-primary-600 flex items-center gap-1">
                       &larr; Назад к списку
                   </button>
                   {canDelete(selectedArticle) && (
                       <button className="text-gray-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5" /></button>
                   )}
               </div>
               
               <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-4">
                 <BookOpen className="w-5 h-5" />
                 <span className="text-sm font-medium uppercase tracking-wide">{selectedArticle.category}</span>
               </div>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{selectedArticle.title}</h1>
               <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                 <span>Автор: {selectedArticle.author}</span>
                 <span>Обновлено: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
               </div>
               <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                 {selectedArticle.content}
               </div>
             </article>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
               <BookOpen className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-lg">Выберите статью для просмотра</p>
             </div>
           )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новая статья ({activeTab === 'WORK' ? 'Рабочая' : 'Личная'})</h3>
                   <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500" /></button>
               </div>
               <form onSubmit={handleAdd} className="p-6 space-y-4 overflow-y-auto">
                   <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Заголовок</label>
                       <input 
                         value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} 
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" required 
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Категория</label>
                       <input 
                         value={newArticle.category} onChange={e => setNewArticle({...newArticle, category: e.target.value})} 
                         placeholder="Например: HR, IT, Инструкции"
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" required 
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Содержание</label>
                       <textarea 
                         value={newArticle.content} onChange={e => setNewArticle({...newArticle, content: e.target.value})} 
                         rows={8}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" required 
                       />
                   </div>
                   <div className="flex justify-end">
                       <button type="submit" className="px-4 py-2 bg-primary-500 text-gray-900 rounded font-bold hover:bg-primary-400">Сохранить</button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;