




import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { BookOpen, ChevronRight, Plus, Trash2, MoreVertical, Pencil, Search, Bold, Italic, List, Heading, Link as LinkIcon, Image as ImageIcon, Table, Code, Quote, ListOrdered, CheckSquare, Strikethrough, Eye, Edit3, X } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface KBProps {
  articles: Article[];
  onAddArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  searchQuery: string;
  currentUser?: any;
}

type KbTab = 'WORK' | 'PERSONAL';
type EditorMode = 'EDIT' | 'PREVIEW';

const KnowledgeBase: React.FC<KBProps> = ({ articles, onAddArticle, onDeleteArticle, searchQuery, currentUser }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<KbTab>('WORK');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Editor State
  const [editorMode, setEditorMode] = useState<EditorMode>('EDIT');
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
    ((a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      const article: Article = {
          id: selectedArticle ? selectedArticle.id : `kb${Date.now()}`,
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
      setEditorMode('EDIT');
  };

  const canDelete = (article: Article) => {
      return article.authorId === currentUser?.id || currentUser?.role === 'ADMIN';
  };

  const handleEdit = (article: Article) => {
      setSelectedArticle(article);
      setNewArticle({
          title: article.title,
          category: article.category,
          content: article.content
      });
      setIsModalOpen(true);
      setEditorMode('EDIT');
      setOpenMenuId(null);
  }

  const handleDelete = () => {
    if (selectedArticle) {
      onDeleteArticle(selectedArticle.id);
      setSelectedArticle(null);
      setOpenMenuId(null);
    }
  }

  // --- MARKDOWN EDITOR LOGIC ---

  const insertMarkdown = (type: string) => {
      if (!textAreaRef.current) return;
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = newArticle.content;
      const selected = text.substring(start, end);
      
      let prefix = '';
      let suffix = '';
      let placeholder = '';

      switch (type) {
          case 'bold': prefix = '**'; suffix = '**'; placeholder = 'жирный текст'; break;
          case 'italic': prefix = '_'; suffix = '_'; placeholder = 'курсив'; break;
          case 'strike': prefix = '~~'; suffix = '~~'; placeholder = 'зачеркнутый'; break;
          case 'h1': prefix = '# '; placeholder = 'Заголовок 1'; break;
          case 'h2': prefix = '## '; placeholder = 'Заголовок 2'; break;
          case 'h3': prefix = '### '; placeholder = 'Заголовок 3'; break;
          case 'ul': prefix = '\n- '; placeholder = 'Элемент списка'; break;
          case 'ol': prefix = '\n1. '; placeholder = 'Элемент списка'; break;
          case 'check': prefix = '\n- [ ] '; placeholder = 'Задача'; break;
          case 'quote': prefix = '\n> '; placeholder = 'Цитата'; break;
          case 'code': prefix = '\n```\n'; suffix = '\n```'; placeholder = 'код'; break;
          case 'link': prefix = '['; suffix = '](url)'; placeholder = 'текст ссылки'; break;
          case 'image': prefix = '!['; suffix = '](https://example.com/image.png)'; placeholder = 'описание'; break;
          case 'table': 
              prefix = '\n| Заголовок 1 | Заголовок 2 |\n| ----------- | ----------- |\n| Ячейка 1    | Ячейка 2    |\n'; 
              break;
      }

      const newText = text.substring(0, start) + prefix + (selected || placeholder) + suffix + text.substring(end);
      
      // Update state
      setNewArticle({ ...newArticle, content: newText });
      
      // Restore focus and cursor position (approximate)
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              const newCursorPos = start + prefix.length + (selected || placeholder).length + suffix.length;
              textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);
  };

  // --- MARKDOWN PARSER (CUSTOM) ---
  const renderMarkdown = (markdown: string) => {
      if (!markdown) return null;

      let html = markdown
        // Escape HTML to prevent XSS (basic)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        
        // Code Blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-sm font-mono"><code>$1</code></pre>')
        
        // Inline Code
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-500">$1</code>')

        // Images: ![alt](url)
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-4 shadow-sm border border-gray-200 dark:border-gray-700" />')
        
        // Links: [text](url)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">$1</a>')
        
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Italic: _text_
        .replace(/_(.*?)_/g, '<em>$1</em>')
        
        // Strikethrough: ~~text~~
        .replace(/~~(.*?)~~/g, '<del>$1</del>')

        // Headings
        .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-6 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-5 mb-3 text-gray-800 dark:text-gray-100">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h3>')
        
        // Blockquotes
        .replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4 bg-gray-50 dark:bg-gray-800/50 py-2 pr-2 rounded-r-lg">$1</blockquote>')
        
        // Checkboxes
        .replace(/^\- \[ \] (.*$)/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded border-gray-300" /> <span>$1</span></div>')
        .replace(/^\- \[x\] (.*$)/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded border-gray-300" /> <span class="line-through text-gray-400">$1</span></div>')

        // Lists (Unordered) - Simple replacement
        .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
        // Lists (Ordered) - Simple replacement
        .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')

        // Horizontal Rule
        .replace(/^---$/gm, '<hr class="my-6 border-gray-200 dark:border-gray-700" />');
        
      // Tables (Basic support for | col | col | syntax)
      const lines = html.split('\n');
      let inTable = false;
      let tableHtml = '';
      let processedLines = [];

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('|') && line.endsWith('|')) {
              if (!inTable) {
                  inTable = true;
                  tableHtml += '<div class="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700"><table class="w-full text-sm text-left">';
              }
              
              const cols = line.split('|').filter((c: string) => c.trim() !== ''); // Basic split
              
              if (line.includes('---')) {
                  continue; 
              }

              const reallyHeader = tableHtml.endsWith('<table class="w-full text-sm text-left">');

              tableHtml += reallyHeader ? '<thead class="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-bold text-gray-500 dark:text-gray-400"><tr>' : '<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">';
              
              cols.forEach((col: string) => {
                  tableHtml += reallyHeader 
                      ? `<th class="px-6 py-3">${col.trim()}</th>` 
                      : `<td class="px-6 py-4">${col.trim()}</td>`;
              });

              tableHtml += reallyHeader ? '</tr></thead><tbody>' : '</tr>';

          } else {
              if (inTable) {
                  inTable = false;
                  tableHtml += '</tbody></table></div>';
                  processedLines.push(tableHtml);
                  tableHtml = '';
              }
              processedLines.push(line);
          }
      }
      if (inTable) {
          tableHtml += '</tbody></table></div>';
          processedLines.push(tableHtml);
      }
      
      // Reassemble
      html = processedLines.join('<br/>');

      // Clean up multiple <br/> around block elements and specifically FIX LISTS
      html = html.replace(/(<br\/>\s*){2,}/g, '<br/>');
      
      // FIX: Remove <br/> created by join if it falls between list items
      html = html.replace(/<\/li><br\/><li/g, '</li><li');
      // Fix potential break after ul close/start (though not wrapping in ul here, browser handles loose li, but let's be cleaner if we added ul)
      // Since we are using loose <li>, the <br> is what causes the double spacing.
      // Removing <br> between </li> and <li> solves the list spacing.

      return <div dangerouslySetInnerHTML={{__html: html}} className="markdown-body" />;
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
          <Button 
             onClick={() => { setSelectedArticle(null); setNewArticle({title: '', category: '', content: ''}); setIsModalOpen(true); }}
             icon={<Plus className="w-5 h-5" />}
          >
             <span className="hidden md:inline">Добавить статью</span>
          </Button>
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
             <article className="max-w-none">
               {/* Compact Header */}
               <div className="flex justify-between items-start mb-3 relative">
                   <button onClick={() => setSelectedArticle(null)} className="md:hidden text-sm font-bold text-gray-500 flex items-center gap-1">
                       &larr; Назад
                   </button>
                   
                   {/* Combined Category & Menu */}
                   <div className="flex items-center gap-3 w-full justify-between md:justify-start">
                       <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                         <div className="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                         </div>
                         <span className="text-xs font-bold uppercase tracking-wide">
                            {selectedArticle.category}
                         </span>
                       </div>

                       {canDelete(selectedArticle) && (
                           <div className="relative ml-auto">
                               <button 
                                 onClick={() => setOpenMenuId(openMenuId === selectedArticle.id ? null : selectedArticle.id)}
                                 className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                               >
                                   <MoreVertical className="w-4 h-4" />
                               </button>
                               {openMenuId === selectedArticle.id && (
                                   <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-2 animate-fade-in overflow-hidden">
                                       <button 
                                          onClick={() => handleEdit(selectedArticle)}
                                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium"
                                       >
                                           <Pencil className="w-4 h-4" /> Редактировать
                                       </button>
                                       <button 
                                          onClick={handleDelete}
                                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 font-medium"
                                       >
                                           <Trash2 className="w-4 h-4" /> Удалить
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                   </div>
               </div>
               
               <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">{selectedArticle.title}</h1>
               
               <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-300">
                         {selectedArticle.author.charAt(0)}
                     </div>
                     <span className="font-medium">{selectedArticle.author}</span>
                 </div>
                 <span>{new Date(selectedArticle.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
               </div>
               
               <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg markdown-content">
                 {renderMarkdown(selectedArticle.content)}
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

      {/* Add/Edit Modal (Full Featured Editor) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedArticle ? "Редактировать статью" : "Новая статья"}
        size="xl"
        footer={
           <Button onClick={handleAdd}>Сохранить</Button>
        }
      >
               <form onSubmit={handleAdd} className="space-y-4 h-full flex flex-col">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                           <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Заголовок</label>
                           <input 
                             value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} 
                             className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" required 
                           />
                       </div>
                       <div className="space-y-1.5">
                           <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Категория</label>
                           <input 
                             value={newArticle.category} onChange={e => setNewArticle({...newArticle, category: e.target.value})} 
                             placeholder="Например: HR, IT, Инструкции"
                             className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" required 
                           />
                       </div>
                   </div>
                   
                   <div className="flex-1 flex flex-col min-h-[400px]">
                       <div className="flex items-center justify-between mb-2">
                           <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Содержание</label>
                           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                               <button 
                                 type="button" 
                                 onClick={() => setEditorMode('EDIT')} 
                                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${editorMode === 'EDIT' ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm' : 'text-gray-500'}`}
                               >
                                   <Edit3 className="w-3 h-3" /> Редактор
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => setEditorMode('PREVIEW')} 
                                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${editorMode === 'PREVIEW' ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm' : 'text-gray-500'}`}
                               >
                                   <Eye className="w-3 h-3" /> Просмотр
                               </button>
                           </div>
                       </div>
                       
                       <div className="flex-1 relative border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden flex flex-col">
                           {/* Toolbar */}
                           {editorMode === 'EDIT' && (
                               <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 flex flex-wrap gap-1">
                                   <ToolbarBtn onClick={() => insertMarkdown('h1')} icon={<Heading className="w-4 h-4" />} title="Заголовок 1" />
                                   <ToolbarBtn onClick={() => insertMarkdown('h2')} icon={<span className="font-bold text-xs">H2</span>} title="Заголовок 2" />
                                   <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                   <ToolbarBtn onClick={() => insertMarkdown('bold')} icon={<Bold className="w-4 h-4" />} title="Жирный" />
                                   <ToolbarBtn onClick={() => insertMarkdown('italic')} icon={<Italic className="w-4 h-4" />} title="Курсив" />
                                   <ToolbarBtn onClick={() => insertMarkdown('strike')} icon={<Strikethrough className="w-4 h-4" />} title="Зачеркнутый" />
                                   <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                   <ToolbarBtn onClick={() => insertMarkdown('ul')} icon={<List className="w-4 h-4" />} title="Список" />
                                   <ToolbarBtn onClick={() => insertMarkdown('ol')} icon={<ListOrdered className="w-4 h-4" />} title="Нумерованный список" />
                                   <ToolbarBtn onClick={() => insertMarkdown('check')} icon={<CheckSquare className="w-4 h-4" />} title="Чеклист" />
                                   <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                   <ToolbarBtn onClick={() => insertMarkdown('quote')} icon={<Quote className="w-4 h-4" />} title="Цитата" />
                                   <ToolbarBtn onClick={() => insertMarkdown('code')} icon={<Code className="w-4 h-4" />} title="Код" />
                                   <ToolbarBtn onClick={() => insertMarkdown('table')} icon={<Table className="w-4 h-4" />} title="Таблица" />
                                   <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                   <ToolbarBtn onClick={() => insertMarkdown('link')} icon={<LinkIcon className="w-4 h-4" />} title="Ссылка" />
                                   <ToolbarBtn onClick={() => insertMarkdown('image')} icon={<ImageIcon className="w-4 h-4" />} title="Изображение" />
                               </div>
                           )}

                           {editorMode === 'EDIT' ? (
                               <textarea 
                                 ref={textAreaRef}
                                 value={newArticle.content} 
                                 onChange={e => setNewArticle({...newArticle, content: e.target.value})} 
                                 className="flex-1 w-full p-4 bg-white dark:bg-gray-800 text-sm focus:outline-none resize-none font-mono text-gray-800 dark:text-gray-200" 
                                 placeholder="# Начните писать здесь..."
                               />
                           ) : (
                               <div className="flex-1 w-full p-6 bg-white dark:bg-gray-800 overflow-y-auto text-gray-800 dark:text-gray-200">
                                   {newArticle.content ? renderMarkdown(newArticle.content) : <p className="text-gray-400 italic">Пусто...</p>}
                               </div>
                           )}
                       </div>
                       <p className="text-xs text-gray-400 mt-2 text-right">Поддерживается Markdown разметка</p>
                   </div>
               </form>
      </Modal>
    </div>
  );
};

const ToolbarBtn = ({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) => (
    <button 
        type="button" 
        onClick={onClick} 
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors" 
        title={title}
    >
        {icon}
    </button>
);

export default KnowledgeBase;
