
import React, { useState, useRef, useEffect } from 'react';
import { DocumentItem, User } from '../types';
import { FileText, Download, HardDrive, File as FileIcon, Image, Trash2, Info, Upload, X, Search, FileUp, Eye } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DocumentsProps {
  docs: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  searchQuery: string;
  currentUser: User;
}

const Documents: React.FC<DocumentsProps> = ({ docs, onAddDocument, onDeleteDocument, searchQuery, currentUser }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceContext, setSourceContext] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Local file registry to store actual File objects for session preview/download
  const [fileRegistry, setFileRegistry] = useState<Record<string, File>>({});

  useEffect(() => {
     // Auto-fill context/type if a folder is active when opening upload modal
     if (isUploadModalOpen && activeFilter) {
         if (activeFilter === 'Чертежи') setSourceContext('Чертежи');
         else if (activeFilter === 'Договоры') setSourceContext('Договор');
         else if (activeFilter === 'Бухгалтерия') setSourceContext('Финансы');
         else if (activeFilter !== 'Все') setSourceContext(activeFilter);
     } else if (!isUploadModalOpen) {
         setSourceContext('');
         setSelectedFile(null);
     }
  }, [isUploadModalOpen, activeFilter]);


  // Filter Logic
  const filteredDocs = docs.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter ? (
          activeFilter === 'Чертежи' ? d.type === 'DWG' :
          activeFilter === 'Договоры' ? (d.type === 'PDF' && d.name.toLowerCase().includes('договор')) : // heuristic
          activeFilter === 'Бухгалтерия' ? d.type === 'XLSX' :
          true // HR not mapped strictly in this example
      ) : true;
      return matchesSearch && matchesFilter;
  });

  // Count files for folders (mock logic based on types)
  const getCount = (folder: string) => {
      if (folder === 'Чертежи') return docs.filter(d => d.type === 'DWG').length;
      if (folder === 'Договоры') return docs.filter(d => d.type === 'PDF').length; // simple proxy
      if (folder === 'Бухгалтерия') return docs.filter(d => d.type === 'XLSX').length;
      return docs.length;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600"><FileText className="w-6 h-6" /></div>;
      case 'DWG': return <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600"><Image className="w-6 h-6" /></div>;
      case 'XLSX': return <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600"><FileText className="w-6 h-6" /></div>;
      default: return <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600"><FileIcon className="w-6 h-6" /></div>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) return;

      const typeMap: any = { 'pdf': 'PDF', 'dwg': 'DWG', 'xlsx': 'XLSX', 'docx': 'DOCX' };
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'file';
      
      // Determine type based on filter if not obvious from ext, or default to ext
      let type = typeMap[ext] || ext.toUpperCase().substring(0, 4);
      if (activeFilter === 'Чертежи') type = 'DWG';
      
      const newDocId = `doc${Date.now()}`;

      const newDoc: DocumentItem = {
          id: newDocId,
          name: selectedFile.name,
          type: type,
          size: formatFileSize(selectedFile.size),
          updatedAt: new Date().toISOString(),
          author: currentUser.name,
          authorId: currentUser.id,
          source: sourceContext || 'Ручная загрузка'
      };

      // Store file in local registry for this session
      setFileRegistry(prev => ({...prev, [newDocId]: selectedFile}));

      onAddDocument(newDoc);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSourceContext('');
  };

  // Permission Check: Only Admin or the Author can delete a file
  const canDelete = (doc: DocumentItem) => {
      const isAdmin = currentUser.role === 'ADMIN';
      const isAuthor = doc.authorId === currentUser.id;
      return isAdmin || isAuthor;
  };

  const handleDownload = (doc: DocumentItem) => {
      const file = fileRegistry[doc.id];
      if (file) {
          // Download actual file
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } else {
          // Create dummy file for mock data
          const text = `Это пример содержимого файла "${doc.name}".\n\nВ реальном приложении здесь был бы бинарный контент.`;
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.name}.txt`; // Append txt to show it's a dummy
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('Скачан пример файла (так как реальный файл отсутствует на сервере).');
      }
  };

  const handlePreview = (doc: DocumentItem) => {
      if (doc.type === 'PDF') {
          setPreviewDoc(doc);
          setIsPreviewModalOpen(true);
      } else {
          alert('Предпросмотр доступен только для PDF файлов');
      }
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Документооборот</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Управление файлами и архивами</p>
        </div>
        <Button 
           onClick={() => setIsUploadModalOpen(true)}
           icon={<Upload className="w-5 h-5" />}
        >
            Загрузить файл
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
         {/* Quick Access Folders - Clickable Filters */}
         {['Чертежи', 'Договоры', 'Бухгалтерия', 'Все'].map((folder, idx) => (
           <div 
             key={folder} 
             onClick={() => setActiveFilter(folder === 'Все' ? null : folder)}
             className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${
               (activeFilter === folder || (folder === 'Все' && activeFilter === null))
               ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 ring-1 ring-primary-500'
               : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50 hover:shadow-xl'
             }`}
           >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${
                  idx === 0 ? 'from-blue-100 to-blue-200 text-blue-600' :
                  idx === 1 ? 'from-purple-100 to-purple-200 text-purple-600' :
                  idx === 2 ? 'from-green-100 to-green-200 text-green-600' :
                  'from-gray-100 to-gray-200 text-gray-600'
              } dark:bg-opacity-10 dark:text-opacity-90`}>
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{folder}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getCount(folder)} файлов</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider backdrop-blur-sm">
          <div className="col-span-5 pl-2">Имя файла</div>
          <div className="col-span-3">Источник</div>
          <div className="col-span-2">Автор</div>
          <div className="col-span-1">Размер</div>
          <div className="col-span-1 text-right">Действие</div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group relative cursor-pointer">
              <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                {getIcon(doc.type)}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 md:hidden">{doc.size} • {doc.author}</p>
                </div>
              </div>
              
              {/* Desktop Columns */}
              <div className="hidden md:block col-span-3 text-sm text-gray-600 dark:text-gray-300">
                 {doc.source && (
                    <div className="flex items-center gap-2 group/source cursor-help relative w-fit px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[150px] text-xs font-medium">{doc.source}</span>
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">{doc.author}</div>
              <div className="hidden md:block col-span-1 text-sm text-gray-500 dark:text-gray-400 font-mono">{doc.size}</div>
              
              <div className="col-span-12 md:col-span-1 flex justify-end gap-2 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                 {doc.type === 'PDF' && (
                     <button onClick={() => handlePreview(doc)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Предпросмотр">
                         <Eye className="w-5 h-5" />
                     </button>
                 )}
                <button onClick={() => handleDownload(doc)} className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Скачать">
                  <Download className="w-5 h-5" />
                </button>
                {canDelete(doc) && (
                    <button 
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                )}
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && <div className="p-12 text-center text-gray-500 text-sm">Файлы не найдены</div>}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setSelectedFile(null); }}
        title="Загрузка документа"
      >
               <form onSubmit={handleUpload} className="flex flex-col gap-5">
                  {/* Drag and Drop Area */}
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                  >
                     <input 
                       ref={inputRef}
                       type="file" 
                       className="hidden" 
                       onChange={handleChange}
                     />
                     <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-4">
                        <FileUp className="w-8 h-8 text-primary-500" />
                     </div>
                     {selectedFile ? (
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white">{selectedFile.name}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatFileSize(selectedFile.size)}</p>
                           <p className="text-xs text-green-500 font-bold mt-2">Файл выбран</p>
                        </div>
                     ) : (
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white">Перетащите файл сюда</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">или нажмите для выбора</p>
                        </div>
                     )}
                  </div>

                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Источник / Контекст</label>
                      <input 
                        value={sourceContext} 
                        onChange={e => setSourceContext(e.target.value)}
                        placeholder="Например: Проект Альфа"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" 
                      />
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button 
                        type="submit" 
                        disabled={!selectedFile}
                      >
                        Загрузить
                      </Button>
                  </div>
               </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen && !!previewDoc}
        onClose={() => setIsPreviewModalOpen(false)}
        title={
            <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> Предпросмотр: {previewDoc?.name}
            </div>
        }
        size="xl"
      >
                  <div className="flex-1 bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-4 min-h-[60vh]">
                      {previewDoc && fileRegistry[previewDoc.id] ? (
                          <iframe 
                              src={URL.createObjectURL(fileRegistry[previewDoc.id])} 
                              className="w-full h-full bg-white rounded-lg shadow-inner min-h-[60vh]" 
                              title="PDF Preview"
                          />
                      ) : (
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 mb-4 font-bold">Файл отсутствует на сервере</p>
                            <p className="text-sm text-gray-400 max-w-md">Это демонстрационная версия. Реальный предпросмотр работает только для файлов, загруженных в текущей сессии.</p>
                        </div>
                      )}
                  </div>
      </Modal>
    </div>
  );
};

export default Documents;
