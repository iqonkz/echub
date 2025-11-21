
import React from 'react';
import { ModuleType } from '../types';
import { LayoutDashboard, Briefcase, FolderKanban, FileText, Book, Settings, Calendar, Home } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onNavigate, onLogout }) => {
  const navItems = [
    { id: ModuleType.HOME, label: 'Главная', icon: Home },
    { id: ModuleType.CRM, label: 'CRM', icon: Briefcase },
    { id: ModuleType.PROJECTS, label: 'Задачи и Проекты', icon: FolderKanban },
    { id: ModuleType.CALENDAR, label: 'Календарь', icon: Calendar },
    { id: ModuleType.DOCUMENTS, label: 'Документы', icon: FileText },
    { id: ModuleType.KNOWLEDGE, label: 'База знаний', icon: Book },
    { id: ModuleType.SETTINGS, label: 'Настройки', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-colors duration-200 fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
          <div className="bg-primary-500 text-gray-900 p-1.5 rounded-lg">
             <Settings className="w-6 h-6" />
          </div>
          <span className="uppercase tracking-tight font-extrabold">EC HUB</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-gray-900 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-center text-gray-400 dark:text-gray-500">
         Версия 0.1.3
      </div>
    </aside>
  );
};

export default Sidebar;
