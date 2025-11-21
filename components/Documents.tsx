import React, { useState } from 'react';
import { DocumentItem, User } from '../types';
import { FileText, Download, HardDrive, File, Image, Trash2, ExternalLink, Info, Upload, X } from 'lucide-react';

interface DocumentsProps {
  docs: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  searchQuery: string;
  currentUser: User;
}

const Documents: React.FC<DocumentsProps> = ({ docs, onAddDocument, onDeleteDocument, searchQuery, currentUser }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFile, setNewFile] = useState<{name: string, source: string}>({ name: '', source: '' });

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-8 h-8 text-red-500" />;
      case 'DWG': return <Image className="w-8 h-8 text-primary-500" />;
      case 'XLSX': return <FileText className="w-8 h-8 text-green-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleUpload = (e: React.FormEvent) => {
      e.preventDefault();
      const typeMap: any = { 'pdf': 'PDF', 'dwg': 'DWG', 'xlsx': 'XLSX', 'docx': 'DOCX' };
      const ext = newFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      
      const newDoc: DocumentItem = {
          id: `doc${Date.now()}`,
          name: newFile.name,
          type: typeMap[ext] || 'PDF',
          size: '1.2 MB',
          updatedAt: new Date().toISOString(),
          author: currentUser.name,
          authorId: currentUser.id,
          source: newFile.source || 'Ручная загрузка'
      };
      onAddDocument(newDoc);
      setIsUploadModalOpen(false);
      setNewFile({ name: '', source: '' });
  };

  const canDelete = (doc: DocumentItem) => {
      return currentUser.role === 'ADMIN' || doc.authorId === currentUser.id;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Документооборот</h2>
        <button 
           onClick={() => setIsUploadModalOpen(true)}
           className="bg-primary-500 text-gray-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-400 transition-colors"
        >
            <Upload className="w-4 h-4" /> Загрузить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
         {/* Quick Access Folders */}
         {['Чертежи', 'Договоры', 'Бухгалтерия', 'HR'].map((folder) => (
           <div key={folder} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                <HardDrive className="w-6 h-6 text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{folder}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">12 файлов</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-5">Имя</div>
          <div className="col-span-3">Источник</div>
          <div className="col-span-2">Автор</div>
          <div className="col-span-1">Размер</div>
          <div className="col-span-1 text-right">Действие</div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group relative">
              <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                {getIcon(doc.type)}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 md:hidden mt-1">
                     <span className="text-xs text-gray-500">{doc.size}</span>
                     <span className="text-xs text-gray-400">•</span>
                     <span className="text-xs text-gray-500">{doc.author}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Columns */}
              <div className="hidden md:block col-span-3 text-sm text-gray-600 dark:text-gray-300">
                 {doc.source && (
                    <div className="flex items-center gap-1 group/source cursor-help relative w-fit">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-[150px]">{doc.source}</span>
                        {/* Tooltip/Link */}
                        <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-gray-900 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover/source:opacity-100 transition-opacity pointer-events-none z-10">
                             Прикреплено к: {doc.source}
                        </div>
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-2 text-sm text-gray-600 dark:text-gray-300">{doc.author}</div>
              <div className="hidden md:block col-span-1 text-sm text-gray-600 dark:text-gray-300">{doc.size}</div>
              
              <div className="col-span-12 md:col-span-1 flex justify-end gap-2 mt-2 md:mt-0">
                <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Скачать">
                  <Download className="w-5 h-5" />
                </button>
                {canDelete(doc) && (
                    <button 
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                )}
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">Файлы не найдены</div>}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Загрузка документа</h3>
                   <button onClick={() => setIsUploadModalOpen(false)}><X className="text-gray-500" /></button>
               </div>
               <form onSubmit={handleUpload} className="p-6 space-y-4">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Имя файла</label>
                      <input 
                        value={newFile.name} 
                        onChange={e => setNewFile({...newFile, name: e.target.value})}
                        placeholder="contract_draft.pdf"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" 
                        required
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Источник / Контекст</label>
                      <input 
                        value={newFile.source} 
                        onChange={e => setNewFile({...newFile, source: e.target.value})}
                        placeholder="Например: Проект Альфа"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" 
                      />
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="px-4 py-2 bg-primary-500 text-gray-900 rounded font-bold hover:bg-primary-400">Загрузить</button>
                  </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Documents;