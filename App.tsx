import React, { useState, useEffect, useRef } from 'react';
import { ModuleType, Task, Deal, DocumentItem, Article, SystemLog, TaskStatus, Company, Contact, CrmActivity, User, TeamMember } from './types';
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
import { Search, Sun, Moon, User as UserIcon, Settings as SettingsIcon, LogOut, RefreshCw, Loader2 } from 'lucide-react';

// Firebase Imports
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  getDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>({
      id: '', 
      name: '', 
      email: '', 
      role: 'USER', 
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

  // Data State (From Firestore)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Check if user exists in 'users' collection, if not create basic profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
           setCurrentUser({ id: user.uid, ...userSnap.data() } as User);
        } else {
           // Initialize new user
           const newUser: User = {
             id: user.uid,
             name: user.displayName || 'User',
             email: user.email || '',
             role: 'USER', // Default role
             avatar: user.photoURL || ''
           };
           await setDoc(userRef, newUser);
           setCurrentUser(newUser);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser({ id: '', name: '', email: '', role: 'USER', avatar: '' });
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listeners (Real-time updates from Firestore)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Tasks & Projects
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasksData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      setTasks(tasksData);
      const uniqueProjects = Array.from(new Set(tasksData.map(t => t.project).filter(Boolean))).sort();
      setProjects(uniqueProjects);
    });

    // Deals
    const unsubDeals = onSnapshot(collection(db, 'deals'), (snapshot) => {
      setDeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deal)));
    });

    // Companies
    const unsubCompanies = onSnapshot(collection(db, 'companies'), (snapshot) => {
      setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
    });

    // Contacts
    const unsubContacts = onSnapshot(collection(db, 'contacts'), (snapshot) => {
      setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
    });

    // Documents
    const unsubDocs = onSnapshot(collection(db, 'docs'), (snapshot) => {
      setDocs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
    });

    // Knowledge Base
    const unsubKB = onSnapshot(collection(db, 'articles'), (snapshot) => {
      setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
    });

    // Team
    const unsubTeam = onSnapshot(collection(db, 'team'), (snapshot) => {
      setTeam(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)));
    });

    // Logs (Ordered by timestamp)
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog)));
    });

    return () => {
      unsubTasks();
      unsubDeals();
      unsubCompanies();
      unsubContacts();
      unsubDocs();
      unsubKB();
      unsubTeam();
      unsubLogs();
    };
  }, [isAuthenticated]);

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

  // --- Handlers interacting with Firestore ---

  const handleLogout = async () => {
    await signOut(auth);
    setIsUserMenuOpen(false);
  };

  const addLog = async (action: string, module: string) => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: currentUser.name || currentUser.email,
        action,
        module,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding log: ", e);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<User>) => {
      if (!currentUser.id) return;
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, updatedData);
      setCurrentUser(prev => ({...prev, ...updatedData}));
      addLog('Обновил данные профиля', 'SETTINGS');
  };

  const handleUpdateAppSettings = (newSettings: any) => {
      setAppSettings(prev => ({...prev, ...newSettings}));
  };

  // --- Team Handlers ---
  const handleAddTeamMember = async (member: TeamMember) => {
      const { id, ...data } = member; // Let Firestore generate ID or use provided
      await addDoc(collection(db, 'team'), data);
      addLog(`Добавлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleUpdateTeamMember = async (member: TeamMember) => {
      const memberRef = doc(db, 'team', member.id);
      const { id, ...data } = member;
      await updateDoc(memberRef, data);
      addLog(`Обновлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleDeleteTeamMember = async (id: string) => {
      await deleteDoc(doc(db, 'team', id));
      addLog(`Удален сотрудник`, 'SETTINGS');
  };

  // --- Task & Project Handlers ---
  const handleAddProject = (name: string) => {
      // In this simplified model, projects are derived from tasks. 
      // To explicitely add a project, we can create a dummy task or just handle it in UI state until a task is added.
      // For now, we'll just log it, as projects state is derived from tasks.
      if (!projects.includes(name)) {
          setProjects(prev => [...prev, name].sort());
          addLog(`Создан проект (локально): ${name}`, 'PROJECTS');
      }
  };

  const handleTaskUpdate = async (taskId: string, newStatus: TaskStatus) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
    addLog(`Статус задачи изменен на ${newStatus}`, 'PROJECTS');
  };

  const handleAddTask = async (newTask: Task) => {
    const { id, ...data } = newTask; // Remove ID to let Firestore generate it, or keep if specific logic needed
    // Note: If using optimistic UI, we might use the ID. Here we let Firestore handle it mostly.
    await addDoc(collection(db, 'tasks'), data);
    addLog(`Создана новая задача: ${newTask.title}`, 'PROJECTS');
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
    addLog(`Удалена задача`, 'PROJECTS');
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
  const handleDealUpdate = async (updatedDeal: Deal) => {
    const dealRef = doc(db, 'deals', updatedDeal.id);
    const { id, ...data } = updatedDeal;
    await updateDoc(dealRef, data);
    addLog(`Обновлен этап сделки ${updatedDeal.title}`, 'CRM');
  };
  const handleAddDeal = async (newDeal: Deal) => {
    const { id, ...data } = newDeal;
    await addDoc(collection(db, 'deals'), data);
    addLog(`Создана сделка: ${newDeal.title}`, 'CRM');
  };
  const handleDeleteDeal = async (id: string) => {
    await deleteDoc(doc(db, 'deals', id));
    addLog(`Удалена сделка`, 'CRM');
  };
  
  const handleAddCompany = async (newComp: Company) => {
    const { id, ...data } = newComp;
    await addDoc(collection(db, 'companies'), data);
    addLog(`Создана компания: ${newComp.name}`, 'CRM');
  };
  const handleUpdateCompany = async (updatedComp: Company) => {
    const ref = doc(db, 'companies', updatedComp.id);
    const { id, ...data } = updatedComp;
    await updateDoc(ref, data);
    addLog(`Обновлена компания: ${updatedComp.name}`, 'CRM');
  };
  const handleDeleteCompany = async (id: string) => {
    await deleteDoc(doc(db, 'companies', id));
    addLog(`Удалена компания`, 'CRM');
  };

  const handleAddContact = async (newCont: Contact) => {
    const { id, ...data } = newCont;
    await addDoc(collection(db, 'contacts'), data);
    addLog(`Создан контакт: ${newCont.name}`, 'CRM');
  };
  const handleUpdateContact = async (updatedCont: Contact) => {
    const ref = doc(db, 'contacts', updatedCont.id);
    const { id, ...data } = updatedCont;
    await updateDoc(ref, data);
    addLog(`Обновлен контакт: ${updatedCont.name}`, 'CRM');
  };
  const handleDeleteContact = async (id: string) => {
    await deleteDoc(doc(db, 'contacts', id));
    addLog(`Удален контакт`, 'CRM');
  };

  // --- Document Handlers ---
  const handleAddDocument = async (docItem: DocumentItem) => {
     const { id, ...data } = docItem;
     const docData = { ...data, author: currentUser.name, authorId: currentUser.id };
     await addDoc(collection(db, 'docs'), docData);
     addLog(`Загружен документ: ${docItem.name}`, 'DOCUMENTS');
  };

  const handleDeleteDocument = async (id: string) => {
     await deleteDoc(doc(db, 'docs', id));
     addLog(`Удален документ`, 'DOCUMENTS');
  };

  // --- KB Handlers ---
  const handleAddArticle = async (article: Article) => {
    const { id, ...data } = article;
    await addDoc(collection(db, 'articles'), data);
    addLog(`Добавлена статья: ${article.title}`, 'KNOWLEDGE');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
           <p className="text-gray-500">Загрузка системы...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />; // Login component handles auth internally via firebase
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name || 'Пользователь'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right truncate max-w-[100px]">{currentUser.email}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md border-2 border-primary-400">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 md:hidden">
                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                  </div>
                  <button onClick={() => { setActiveModule(ModuleType.SETTINGS); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Настройки
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Сменить аккаунт
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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