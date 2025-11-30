
import React from 'react';
import { ModuleType } from '../types';
import { Briefcase, FolderKanban, FileText, Book, Settings, Calendar, Home } from 'lucide-react';

interface MobileNavProps {
  activeModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
  visibleModules: ModuleType[];
}

const MobileNav: React.FC<MobileNavProps> = ({ activeModule, onNavigate, visibleModules }) => {
  const allNavItems = [
    { id: ModuleType.HOME, label: 'Главная', icon: Home },
    { id: ModuleType.PROJECTS, label: 'Проекты', icon: FolderKanban },
    { id: ModuleType.CRM, label: 'CRM', icon: Briefcase },
    { id: ModuleType.CALENDAR, label: 'Календарь', icon: Calendar },
    { id: ModuleType.DOCUMENTS, label: 'Документы', icon: FileText },
    { id: ModuleType.KNOWLEDGE, label: 'База знаний', icon: Book },
    { id: ModuleType.SETTINGS, label: 'Настройки', icon: Settings },
  ];

  // Always include Settings to allow user to change config back if they hide everything
  const displayedItems = allNavItems.filter(item => visibleModules.includes(item.id) || item.id === ModuleType.SETTINGS);

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 px-2 pb-1 pt-1">
       <div className="flex justify-around items-center">
          {displayedItems.slice(0, 5).map((item) => {
             const isActive = activeModule === item.id;
             return (
                 <button 
                   key={item.id}
                   onClick={() => onNavigate(item.id)}
                   className="flex flex-col items-center gap-0.5 p-1 min-w-[60px]"
                 >
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                       <item.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-500'}`}>
                        {item.label}
                    </span>
                 </button>
             )
          })}
       </div>
    </div>
  );
};

export default MobileNav;
