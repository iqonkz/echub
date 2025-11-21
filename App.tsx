import React, { useState, useEffect, useRef } from 'react';
import { ModuleType, Task, Deal, DocumentItem, Article, SystemLog, TaskStatus, Company, Contact, CrmActivity, User, TeamMember } from './types';
import { INITIAL_TASKS, INITIAL_DEALS, INITIAL_DOCS, INITIAL_KB, INITIAL_LOGS, INITIAL_COMPANIES, INITIAL_CONTACTS, INITIAL_ACTIVITIES, INITIAL_TEAM } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Documents from './components/Documents';
import KnowledgeBase from './components/KnowledgeBase';
import Settings from './components/Settings';
import Login from './components/Login';
import MobileNav from './components/MobileNav';
import { Bell, Search, Sun, Moon, Menu, X, User as UserIcon, Settings as SettingsIcon, LogOut, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
      id: 'u1', 
      name: 'Madi Seitzhapbar', 
      email: 'madi@engineering-centre.com', 
      role: 'ADMIN', 
      avatar: '' 
  });
  
  // App Settings State
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appSettings, setAppSettings] = useState({
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      fontFamily: 'sans' as 'sans' | 'serif'
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Config State
  const [mobileMenuConfig, setMobileMenuConfig] = useState<ModuleType[]>([
     ModuleType.HOME, ModuleType.PROJECTS, ModuleType.CRM, ModuleType.CALENDAR
  ]);

  // Data State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [projects, setProjects] = useState<string[]>(() => Array.from(new Set(INITIAL_TASKS.map(t => t.project))).sort());
  
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activities] = useState<CrmActivity[]>(INITIAL_ACTIVITIES);
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [articles, setArticles] = useState<Article[]>(INITIAL_KB);
  const [logs, setLogs] = useState<SystemLog[]>(INITIAL_LOGS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsUserMenuOpen(false);
  };

  const addLog = (action: string, module: string) => {
    const newLog: SystemLog = {
      id: `l${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: currentUser.name,
      action,
      module
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateProfile = (updatedData: Partial<User>) => {
      setCurrentUser(prev => ({...prev, ...updatedData}));
      addLog('Обновил данные профиля', 'SETTINGS');
  };

  const handleUpdateAppSettings = (newSettings: any) => {
      setAppSettings(prev => ({...prev, ...newSettings}));
  };

  // --- Team Handlers ---
  const handleAddTeamMember = (member: TeamMember) => {
      setTeam(prev => [...prev, member]);
      addLog(`Добавлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleUpdateTeamMember = (member: TeamMember) => {
      setTeam(prev => prev.map(m => m.id === member.id ? member : m));
      addLog(`Обновлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleDeleteTeamMember = (id: string) => {
      setTeam(prev => prev.filter(m => m.id !== id));
      addLog(`Удален сотрудник: ${id}`, 'SETTINGS');
  };

  // --- Task & Project Handlers ---
  const handleAddProject = (name: string) => {
      if (!projects.includes(name)) {
          setProjects(prev => [...prev, name].sort());
          addLog(`Создан проект: ${name}`, 'PROJECTS');
      }
  };

  const handleTaskUpdate = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    addLog(`Статус задачи ${taskId} изменен на ${newStatus}`, 'PROJECTS');
  };
  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    if (!projects.includes(newTask.project)) {
        setProjects(prev => [...prev, newTask.project].sort());
    }
    addLog(`Создана новая задача: ${newTask.title}`, 'PROJECTS');
  };
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId && t.parentId !== taskId));
    addLog(`Удалена задача ${taskId}`, 'PROJECTS');
  };

  const handleEditTaskRequest = (task: Task) => {
    setActiveModule(ModuleType.PROJECTS);
    setTimeout(() => {
        if ((window as any).triggerTaskEdit) {
            (window as any).triggerTaskEdit(task);
        }
    }, 100);
  };

  // --- CRM Handlers ---
  const handleDealUpdate = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
    addLog(`Обновлен этап сделки ${updatedDeal.title}`, 'CRM');
  };
  const handleAddDeal = (newDeal: Deal) => {
    setDeals(prev => [...prev, newDeal]);
    addLog(`Создана сделка: ${newDeal.title}`, 'CRM');
  };
  const handleDeleteDeal = (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    addLog(`Удалена сделка ${id}`, 'CRM');
  };
  
  const handleAddCompany = (newComp: Company) => {
    setCompanies(prev => [...prev, newComp]);
    addLog(`Создана компания: ${newComp.name}`, 'CRM');
  };
  const handleUpdateCompany = (updatedComp: Company) => {
    setCompanies(prev => prev.map(c => c.id === updatedComp.id ? updatedComp : c));
    addLog(`Обновлена компания: ${updatedComp.name}`, 'CRM');
  };
  const handleDeleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    addLog(`Удалена компания ${id}`, 'CRM');
  };

  const handleAddContact = (newCont: Contact) => {
    setContacts(prev => [...prev, newCont]);
    addLog(`Создан контакт: ${newCont.name}`, 'CRM');
  };
  const handleUpdateContact = (updatedCont: Contact) => {
    setContacts(prev => prev.map(c => c.id === updatedCont.id ? updatedCont : c));
    addLog(`Обновлен контакт: ${updatedCont.name}`, 'CRM');
  };
  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    addLog(`Удален контакт ${id}`, 'CRM');
  };

  // --- Document Handlers ---
  const handleAddDocument = (doc: DocumentItem) => {
     setDocs(prev => [...prev, { ...doc, author: currentUser.name, authorId: currentUser.id }]);
     addLog(`Загружен документ: ${doc.name}`, 'DOCUMENTS');
  };

  const handleDeleteDocument = (id: string) => {
     setDocs(prev => prev.filter(d => d.id !== id));
     addLog(`Удален документ: ${id}`, 'DOCUMENTS');
  };

  // --- KB Handlers ---
  const handleAddArticle = (article: Article) => {
    setArticles(prev => [...prev, article]);
    addLog(`Добавлена статья: ${article.title}`, 'KNOWLEDGE');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeModule) {
      case ModuleType.HOME:
        return <Dashboard tasks={tasks} deals={deals} onNavigate={setActiveModule} />;
      case ModuleType.CRM:
        return (
          <CRM 
            deals={deals} companies={companies} contacts={contacts} activities={activities}
            onUpdateDeal={handleDealUpdate} onAddDeal={handleAddDeal} onDeleteDeal={handleDeleteDeal}
            onAddCompany={handleAddCompany} onUpdateCompany={handleUpdateCompany} onDeleteCompany={handleDeleteCompany}
            onAddContact={handleAddContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact}
            searchQuery={searchQuery}
          />
        );
      case ModuleType.PROJECTS:
        return <Tasks 
           tasks={tasks} 
           projects={projects}
           onUpdateTaskStatus={handleTaskUpdate} 
           onAddTask={handleAddTask} 
           onDeleteTask={handleDeleteTask} 
           onAddProject={handleAddProject}
           searchQuery={searchQuery} 
           currentUser={currentUser} 
        />;
      case ModuleType.CALENDAR:
        return <Calendar tasks={tasks} onAddTask={handleAddTask} onEditTask={handleEditTaskRequest} />;
      case ModuleType.DOCUMENTS:
        return <Documents docs={docs} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} searchQuery={searchQuery} currentUser={currentUser} />;
      case ModuleType.KNOWLEDGE:
        return <KnowledgeBase articles={articles} onAddArticle={handleAddArticle} searchQuery={searchQuery} currentUser={currentUser} />;
      case ModuleType.SETTINGS:
        return <Settings 
           currentUser={currentUser} 
           onUpdateProfile={handleUpdateProfile}
           onLogout={handleLogout} 
           isDarkMode={isDarkMode} 
           toggleTheme={() => setIsDarkMode(!isDarkMode)} 
           logs={logs} 
           mobileMenuConfig={mobileMenuConfig}
           onUpdateMobileConfig={setMobileMenuConfig}
           appSettings={appSettings}
           onUpdateAppSettings={handleUpdateAppSettings}
           team={team}
           onAddTeamMember={handleAddTeamMember}
           onUpdateTeamMember={handleUpdateTeamMember}
           onDeleteTeamMember={handleDeleteTeamMember}
        />;
      default:
        return <div>Модуль не найден</div>;
    }
  };

  const fontClass = appSettings.fontFamily === 'serif' ? 'font-serif' : 'font-sans';
  const sizeClass = appSettings.fontSize === 'small' ? 'text-sm' : appSettings.fontSize === 'large' ? 'text-lg' : 'text-base';

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden ${fontClass} ${sizeClass} transition-all duration-200`}>
      
      {/* Sidebar (Desktop Only) */}
      <div className="hidden md:block">
         <Sidebar activeModule={activeModule} onNavigate={setActiveModule} onLogout={handleLogout} />
      </div>

      {/* Mobile Navigation (Bottom) */}
      <MobileNav activeModule={activeModule} onNavigate={setActiveModule} visibleModules={mobileMenuConfig} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 min-h-[64px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-20">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide truncate max-w-[150px] md:max-w-none">
               {activeModule === ModuleType.HOME ? 'Главная' : 
                activeModule === ModuleType.CRM ? 'CRM Система' : 
                activeModule === ModuleType.PROJECTS ? 'Задачи и Проекты' :
                activeModule === ModuleType.CALENDAR ? 'Календарь' :
                activeModule === ModuleType.DOCUMENTS ? 'Документы' :
                activeModule === ModuleType.KNOWLEDGE ? 'База знаний' : 
                activeModule === ModuleType.SETTINGS ? 'Настройки' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1.5 border border-transparent focus-within:border-primary-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm ml-2 text-gray-700 dark:text-gray-200 w-64 placeholder-gray-400" 
              />
            </div>
            
            <button className="md:hidden p-2 text-gray-600 dark:text-gray-300">
               <Search className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors hidden md:block"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button 
                 onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                 className="flex items-center gap-3 pl-2 md:pl-4 focus:outline-none"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Руководитель проектов</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md border-2 border-primary-400">
                  {currentUser.name.charAt(0)}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 md:hidden">
                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                  </div>
                  <button onClick={() => { setActiveModule(ModuleType.SETTINGS); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Настройки
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Сменить аккаунт
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 no-scrollbar pb-20 md:pb-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;