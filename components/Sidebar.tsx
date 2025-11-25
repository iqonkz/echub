
import React from 'react';
import { ModuleType } from '../types';
import { Briefcase, FolderKanban, FileText, Book, Settings, Calendar, Home } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onNavigate, onLogout }) => {
  // Removed Settings from the main list to render it separately at bottom
  const navItems = [
    { id: ModuleType.HOME, label: 'Главная', icon: Home },
    { id: ModuleType.PROJECTS, label: 'Проекты и задачи', icon: FolderKanban },
    { id: ModuleType.CRM, label: 'CRM', icon: Briefcase },
    { id: ModuleType.CALENDAR, label: 'Календарь', icon: Calendar },
    { id: ModuleType.DOCUMENTS, label: 'Документы', icon: FileText },
    { id: ModuleType.KNOWLEDGE, label: 'База знаний', icon: Book },
  ];

  const getActiveStyle = (id: ModuleType) => {
    switch (id) {
      case ModuleType.HOME: return 'bg-gradient-to-r from-primary-400 to-primary-500 text-gray-900 shadow-lg shadow-primary-500/20'; 
      case ModuleType.CRM: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30';
      case ModuleType.PROJECTS: return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
      case ModuleType.CALENDAR: return 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/30';
      case ModuleType.DOCUMENTS: return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30';
      case ModuleType.KNOWLEDGE: return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30';
      case ModuleType.SETTINGS: return 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-700/30';
      default: return 'bg-primary-500 text-gray-900';
    }
  };

  const renderButton = (item: any) => {
    const isActive = activeModule === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 group ${
          isActive
            ? getActiveStyle(item.id)
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        {item.label}
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col h-screen transition-colors duration-200 fixed left-0 top-0 z-20 hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header aligned with main content header (h-16) */}
      <div className="h-20 flex items-center justify-center px-6">
        <div className="flex items-center justify-center w-full">
           {/* SVG Logo */}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 517.26 72" className="h-8 w-auto">
              <g>
                <rect width="324" height="72" fill="#111827"/> {/* Using dark gray/black for background */}
                <rect x="324" width="193.26" height="72" fill="#f6c218"/>
              </g>
              <g>
                {/* ENGINEERING Text (Yellow) */}
                <path fill="#f6c218" d="M17.09,48.48h15.04v3.95H13V19.53H31.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                <path fill="#f6c218" d="M59.93,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                <path fill="#f6c218" d="M85.46,36.12h17.62c-.09,4.95-1.67,9-4.72,12.15s-6.96,4.72-11.73,4.72-8.81-1.61-11.96-4.82c-3.15-3.21-4.72-7.28-4.72-12.2s1.57-8.94,4.72-12.15c3.15-3.21,7.1-4.82,11.87-4.82,2.63,0,5.08,.51,7.36,1.53,2.27,1.02,4.17,2.44,5.69,4.25,1.52,1.82,2.51,3.89,2.98,6.2h-4.23c-.47-1.57-1.27-2.95-2.4-4.16-1.13-1.21-2.5-2.14-4.11-2.8-1.61-.66-3.34-.99-5.19-.99-2.38,0-4.52,.55-6.42,1.65-1.9,1.1-3.38,2.63-4.44,4.61-1.07,1.97-1.6,4.2-1.6,6.67,0,3.82,1.15,6.94,3.45,9.35,2.3,2.41,5.3,3.62,9,3.62,2,0,3.85-.38,5.52-1.13,1.68-.75,3.07-1.8,4.18-3.15,1.11-1.35,1.87-2.9,2.28-4.65h-13.16v-3.9Z"/>
                <path fill="#f6c218" d="M108.88,52.43V19.53h4.09V52.43h-4.09Z"/>
                <path fill="#f6c218" d="M143.2,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                <path fill="#f6c218" d="M159.38,48.48h15.04v3.95h-19.13V19.53h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                <path fill="#f6c218" d="M184.12,48.48h15.04v3.95h-19.13V19.53h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                <path fill="#f6c218" d="M223.91,52.43l-7.52-12.88h-7.52v12.88h-4.09V19.53h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                <path fill="#f6c218" d="M234.2,52.43V19.53h4.09V52.43h-4.09Z"/>
                <path fill="#f6c218" d="M268.53,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                <path fill="#f6c218" d="M294.06,36.12h17.62c-.09,4.95-1.67,9-4.72,12.15s-6.96,4.72-11.73,4.72-8.81-1.61-11.96-4.82c-3.15-3.21-4.72-7.28-4.72-12.2s1.57-8.94,4.72-12.15c3.15-3.21,7.1-4.82,11.87-4.82,2.63,0,5.08,.51,7.36,1.53,2.27,1.02,4.17,2.44,5.69,4.25,1.52,1.82,2.51,3.89,2.98,6.2h-4.23c-.47-1.57-1.27-2.95-2.4-4.16-1.13-1.21-2.5-2.14-4.11-2.8-1.61-.66-3.34-.99-5.19-.99-2.38,0-4.52,.55-6.42,1.65-1.9,1.1-3.38,2.63-4.44,4.61-1.07,1.97-1.6,4.2-1.6,6.67,0,3.82,1.15,6.94,3.45,9.35,2.3,2.41,5.3,3.62,9,3.62,2,0,3.85-.38,5.52-1.13,1.68-.75,3.07-1.8,4.18-3.15,1.11-1.35,1.87-2.9,2.28-4.65h-13.16v-3.9Z"/>
              </g>
              <g>
                {/* CENTRE Text (Dark) */}
                <path fill="#111827" d="M351.31,52.97c-4.89,0-8.92-1.6-12.1-4.79-3.18-3.2-4.77-7.25-4.77-12.17s1.59-8.98,4.77-12.17c3.18-3.2,7.21-4.79,12.1-4.79,2.51,0,4.83,.48,6.98,1.43,2.15,.96,3.96,2.31,5.45,4.07,1.49,1.75,2.53,3.81,3.13,6.16h-4.18c-.88-2.38-2.32-4.25-4.32-5.59-2.01-1.35-4.36-2.02-7.05-2.02-3.7,0-6.73,1.21-9.09,3.64-2.37,2.43-3.55,5.53-3.55,9.31s1.18,6.87,3.55,9.28c2.37,2.41,5.4,3.62,9.09,3.62,2.76,0,5.15-.71,7.19-2.14,2.04-1.43,3.48-3.41,4.32-5.95h4.23c-.94,3.73-2.83,6.68-5.66,8.86-2.84,2.18-6.2,3.27-10.08,3.27Z"/>
                <path fill="#111827" d="M376.52,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                <path fill="#111827" d="M419.36,19.55h4.04V52.45h-3.48l-18.75-25.66v25.66h-3.99V19.55h3.71l18.47,25.38V19.55Z"/>
                <path fill="#111827" d="M451.99,19.55v3.85h-10.01v29.05h-4.14V23.4h-10.01v-3.85h24.16Z"/>
                <path fill="#111827" d="M475.55,52.45l-7.52-12.88h-7.52v12.88h-4.09V19.55h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                <path fill="#111827" d="M489.96,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
              </g>
           </svg>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => renderButton(item))}
      </nav>

      {/* Settings at the bottom */}
      <div className="px-4 py-4 space-y-2">
         {renderButton({ id: ModuleType.SETTINGS, label: 'Настройки', icon: Settings })}
      </div>
      
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-[10px] text-center text-gray-400 dark:text-gray-600 font-medium">
         Engineering Centre v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
