
import React, { useState, useEffect, useRef } from 'react';
import { ModuleType, Task, Deal, DocumentItem, Article, SystemLog, TaskStatus, Company, Contact, CrmActivity, User, TeamMember, Project, AppPermissions, CrmUserSettings, DeletedItem } from './types';
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
import { Search, Sun, Moon, User as UserIcon, Settings as SettingsIcon, LogOut, RefreshCw, Loader2, X, AlertTriangle } from 'lucide-react';
import { INITIAL_PERMISSIONS, INITIAL_PROJECTS } from './constants';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appSettings, setAppSettings] = useState({
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      fontFamily: 'sans' as 'sans' | 'serif'
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false); // Mobile search state

  // Mobile Config State
  const [mobileMenuConfig, setMobileMenuConfig] = useState<ModuleType[]>([
     ModuleType.HOME, ModuleType.PROJECTS, ModuleType.CRM, ModuleType.CALENDAR
  ]);

  // Data State (From Firestore)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); 
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  
  // Trash State
  const [trashItems, setTrashItems] = useState<DeletedItem[]>([]);

  // Permissions State (Local for now, or synced)
  const [permissions, setPermissions] = useState<AppPermissions>(INITIAL_PERMISSIONS);

  // Global Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Helper to remove undefined fields before sending to Firestore
  const sanitizeForFirestore = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = sanitizeForFirestore(val);
      }
    });
    return newObj;
  };

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

    // Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });

    // Projects
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        if (!snapshot.empty) {
            setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
        } else {
             setProjects(INITIAL_PROJECTS);
        }
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

    // Activities
    const unsubActivities = onSnapshot(collection(db, 'activities'), (snapshot) => {
        setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CrmActivity)));
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
    
    // Trash
    const unsubTrash = onSnapshot(query(collection(db, 'trash'), orderBy('deletedAt', 'desc')), (snapshot) => {
        setTrashItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DeletedItem)));
    });

    // Logs (Ordered by timestamp)
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog)));
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubDeals();
      unsubCompanies();
      unsubContacts();
      unsubActivities();
      unsubDocs();
      unsubKB();
      unsubTeam();
      unsubTrash();
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

  // --- Safe Delete Logic ---
  const requestDelete = (title: string, message: string, onConfirm: () => void) => {
      setConfirmDialog({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
              onConfirm();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const handleSafeDelete = async (collectionName: string, id: string, data: any, displayTitle: string, typeLabel: string) => {
      try {
          // 1. Add to Trash
          await addDoc(collection(db, 'trash'), {
              originalId: id,
              collectionName,
              data: sanitizeForFirestore(data),
              deletedAt: new Date().toISOString(),
              deletedBy: currentUser.name || currentUser.email,
              displayTitle,
              typeLabel
          });

          // 2. Remove from original collection
          await deleteDoc(doc(db, collectionName, id));
          
          addLog(`Перемещено в корзину: ${displayTitle} (${typeLabel})`, 'SYSTEM');
      } catch (error) {
          console.error("Safe delete failed:", error);
          alert("Ошибка при удалении");
      }
  };

  const handleRestore = async (item: DeletedItem) => {
      try {
          // 1. Restore to original collection
          await setDoc(doc(db, item.collectionName, item.originalId), item.data);
          
          // 2. Remove from trash
          await deleteDoc(doc(db, 'trash', item.id));
          
          addLog(`Восстановлено из корзины: ${item.displayTitle}`, 'SYSTEM');
      } catch (error) {
          console.error("Restore failed:", error);
          alert("Ошибка при восстановлении");
      }
  };

  const handlePermanentDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'trash', id));
          addLog(`Удалено навсегда из корзины`, 'SYSTEM');
      } catch (error) {
          console.error("Permanent delete failed:", error);
      }
  };


  const handleUpdateProfile = async (updatedData: Partial<User>) => {
      if (!currentUser.id) return;
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, sanitizeForFirestore(updatedData));
      setCurrentUser(prev => ({...prev, ...updatedData}));
      addLog('Обновил данные профиля', 'SETTINGS');
  };

  const handleUpdateCrmSettings = async (settings: CrmUserSettings) => {
      if (!currentUser.id) return;
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { crmSettings: settings });
      setCurrentUser(prev => ({...prev, crmSettings: settings}));
      addLog('Обновил настройки таблиц CRM', 'CRM');
  };

  const handleUpdatePermissions = (newPermissions: AppPermissions) => {
      setPermissions(newPermissions);
      addLog('Обновил права доступа ролей', 'SETTINGS');
  };

  const handleUpdateAppSettings = (newSettings: any) => {
      setAppSettings(prev => ({...prev, ...newSettings}));
  };

  // --- Team Handlers ---
  const handleAddTeamMember = async (member: TeamMember) => {
      const { id, ...data } = member; 
      await addDoc(collection(db, 'team'), sanitizeForFirestore(data));
      addLog(`Добавлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleUpdateTeamMember = async (member: TeamMember) => {
      const memberRef = doc(db, 'team', member.id);
      const { id, ...data } = member;
      await updateDoc(memberRef, sanitizeForFirestore(data));
      addLog(`Обновлен сотрудник: ${member.name}`, 'SETTINGS');
  };

  const handleDeleteTeamMember = (id: string) => {
      const member = team.find(m => m.id === id);
      if (!member) return;
      requestDelete(
          "Удалить сотрудника?",
          `Вы уверены, что хотите удалить сотрудника "${member.name}"? Это действие переместит его в корзину.`,
          () => handleSafeDelete('team', id, member, member.name, 'Сотрудник')
      );
  };

  // --- Task & Project Handlers ---
  const handleAddProject = async (project: Project) => {
      const { id, ...data } = project;
      await addDoc(collection(db, 'projects'), sanitizeForFirestore(data));
      addLog(`Создан проект: ${project.name}`, 'PROJECTS');
  };
  
  const handleUpdateProject = async (project: Project) => {
      const ref = doc(db, 'projects', project.id);
      const { id, ...data } = project;
      await updateDoc(ref, sanitizeForFirestore(data));
      addLog(`Обновлен проект: ${project.name}`, 'PROJECTS');
  };

  const handleTaskUpdate = async (taskId: string, newStatus: TaskStatus) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
    addLog(`Статус задачи изменен на ${newStatus}`, 'PROJECTS');
  };

  const handleAddTask = async (newTask: Task) => {
    const { id, ...data } = newTask;
    await addDoc(collection(db, 'tasks'), sanitizeForFirestore(data));
    addLog(`Создана новая задача: ${newTask.title}`, 'PROJECTS');
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    requestDelete(
        "Удалить задачу?",
        `Задача "${task.title}" будет перемещена в корзину.`,
        () => handleSafeDelete('tasks', taskId, task, task.title, 'Задача')
    );
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
    await updateDoc(dealRef, sanitizeForFirestore(data));
    addLog(`Обновлен этап сделки ${updatedDeal.title}`, 'CRM');
  };
  const handleAddDeal = async (newDeal: Deal) => {
    const { id, ...data } = newDeal;
    await addDoc(collection(db, 'deals'), sanitizeForFirestore(data));
    addLog(`Создана сделка: ${newDeal.title}`, 'CRM');
  };
  const handleDeleteDeal = (id: string) => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return;
    requestDelete(
        "Удалить сделку?",
        `Сделка "${deal.title}" будет перемещена в корзину.`,
        () => handleSafeDelete('deals', id, deal, deal.title, 'Сделка')
    );
  };
  
  const handleAddCompany = async (newComp: Company) => {
    const { id, ...data } = newComp;
    await addDoc(collection(db, 'companies'), sanitizeForFirestore(data));
    addLog(`Создана компания: ${newComp.name}`, 'CRM');
  };
  const handleUpdateCompany = async (updatedComp: Company) => {
    const ref = doc(db, 'companies', updatedComp.id);
    const { id, ...data } = updatedComp;
    await updateDoc(ref, sanitizeForFirestore(data));
    addLog(`Обновлена компания: ${updatedComp.name}`, 'CRM');
  };
  const handleDeleteCompany = (id: string) => {
    const comp = companies.find(c => c.id === id);
    if (!comp) return;
    requestDelete(
        "Удалить компанию?",
        `Компания "${comp.name}" будет перемещена в корзину.`,
        () => handleSafeDelete('companies', id, comp, comp.name, 'Компания')
    );
  };

  const handleAddContact = async (newCont: Contact) => {
    const { id, ...data } = newCont;
    await addDoc(collection(db, 'contacts'), sanitizeForFirestore(data));
    addLog(`Создан контакт: ${newCont.name}`, 'CRM');
  };
  const handleUpdateContact = async (updatedCont: Contact) => {
    const ref = doc(db, 'contacts', updatedCont.id);
    const { id, ...data } = updatedCont;
    await updateDoc(ref, sanitizeForFirestore(data));
    addLog(`Обновлен контакт: ${updatedCont.name}`, 'CRM');
  };
  const handleDeleteContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    requestDelete(
        "Удалить контакт?",
        `Контакт "${contact.name}" будет перемещен в корзину.`,
        () => handleSafeDelete('contacts', id, contact, contact.name, 'Контакт')
    );
  };
  
  const handleAddActivity = async (activity: CrmActivity) => {
      const { id, ...data } = activity;
      await addDoc(collection(db, 'activities'), sanitizeForFirestore(data));
      addLog(`Создано действие: ${activity.subject}`, 'CRM');
  };

  // --- Document Handlers ---
  const handleAddDocument = async (docItem: DocumentItem) => {
     const { id, ...data } = docItem;
     const docData = { ...data, author: currentUser.name, authorId: currentUser.id };
     await addDoc(collection(db, 'docs'), sanitizeForFirestore(docData));
     addLog(`Загружен документ: ${docItem.name}`, 'DOCUMENTS');
  };

  const handleDeleteDocument = (id: string) => {
     const docItem = docs.find(d => d.id === id);
     if (!docItem) return;
     requestDelete(
        "Удалить документ?",
        `Документ "${docItem.name}" будет перемещен в корзину.`,
        () => handleSafeDelete('docs', id, docItem, docItem.name, 'Документ')
     );
  };

  // --- KB Handlers ---
  const handleAddArticle = async (article: Article) => {
    const { id, ...data } = article;
    await addDoc(collection(db, 'articles'), sanitizeForFirestore(data));
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
    return <Login onLogin={() => {}} />; 
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
            onAddActivity={handleAddActivity}
            searchQuery={searchQuery}
            currentUser={currentUser}
            onUpdateCrmSettings={handleUpdateCrmSettings}
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
           onUpdateProject={handleUpdateProject}
           searchQuery={searchQuery} 
           currentUser={currentUser} 
           openEditTask={handleEditTaskRequest}
           team={team}
        />;
      case ModuleType.CALENDAR:
        return <Calendar tasks={tasks} onAddTask={handleAddTask} onEditTask={handleEditTaskRequest} onAddActivity={handleAddActivity} />;
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
           permissions={permissions}
           onUpdatePermissions={handleUpdatePermissions}
           trashItems={trashItems}
           onRestore={handleRestore}
           onPermanentDelete={handlePermanentDelete}
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
         <Sidebar 
            activeModule={activeModule} 
            onNavigate={setActiveModule} 
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
         />
      </div>

      {/* Mobile Navigation (Bottom) */}
      <MobileNav activeModule={activeModule} onNavigate={setActiveModule} visibleModules={mobileMenuConfig} />

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} flex flex-col h-screen overflow-hidden relative transition-all duration-300`}>
        {/* Header */}
        <header className="h-16 min-h-[64px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-20">
          
          {/* Mobile Header Logic */}
          <div className="flex md:hidden items-center gap-2 w-full">
              {isSearchActive ? (
                 <div className="flex items-center w-full gap-2 animate-fade-in">
                     {/* Small Icon */}
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" className="h-8 w-8 flex-shrink-0">
                        <g>
                           <path fill="#111827" className="dark:fill-gray-100" d="M36,0V72H12c-6.63,0-12-5.37-12-12V12C0,5.37,5.37,0,12,0h24Z"/>
                           <path fill="#f6c218" d="M72,12V60c0,6.63-5.37,12-12,12h-24V0h24c6.63,0,12,5.37,12,12Z"/>
                        </g>
                        <path fill="#111827" className="dark:fill-gray-100" d="M66.06,51.99c-1.61,.8-4.82,1.61-8.94,1.61-9.55,0-16.73-6.03-16.73-17.13s7.19-17.79,17.69-17.79c4.22,0,6.88,.9,8.04,1.51l-1.06,3.57c-1.66-.81-4.02-1.41-6.83-1.41-7.94,0-13.22,5.08-13.22,13.97,0,8.29,4.77,13.62,13.01,13.62,2.66,0,5.38-.55,7.14-1.41l.9,3.47Z"/>
                        <path fill="#f6c218" d="M26.54,37.19H13.37v12.21h14.67v3.67H9V19.2H27.29v3.67H13.37v10.7h13.16v3.62Z"/>
                     </svg>
                     <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5 border border-transparent focus-within:border-primary-500">
                        <input 
                           type="text" 
                           placeholder="Поиск..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400" 
                           autoFocus
                        />
                     </div>
                     <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-1 text-gray-500">
                         <X className="w-6 h-6" />
                     </button>
                 </div>
              ) : (
                 <div className="flex items-center justify-between w-full animate-fade-in">
                      {/* Full Logo */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 517.26 72" className="h-6 w-auto">
                        <g>
                          <rect width="324" height="72" className="fill-gray-900 dark:fill-gray-100"/> 
                          <rect x="324" width="193.26" height="72" fill="#f6c218"/>
                        </g>
                        <g>
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
                          <path className="fill-gray-900 dark:fill-gray-100" d="M351.31,52.97c-4.89,0-8.92-1.6-12.1-4.79-3.18-3.2-4.77-7.25-4.77-12.17s1.59-8.98,4.77-12.17c3.18-3.2,7.21-4.79,12.1-4.79,2.51,0,4.83,.48,6.98,1.43,2.15,.96,3.96,2.31,5.45,4.07,1.49,1.75,2.53,3.81,3.13,6.16h-4.18c-.88-2.38-2.32-4.25-4.32-5.59-2.01-1.35-4.36-2.02-7.05-2.02-3.7,0-6.73,1.21-9.09,3.64-2.37,2.43-3.55,5.53-3.55,9.31s1.18,6.87,3.55,9.28c2.37,2.41,5.4,3.62,9.09,3.62,2.76,0,5.15-.71,7.19-2.14,2.04-1.43,3.48-3.41,4.32-5.95h4.23c-.94,3.73-2.83,6.68-5.66,8.86-2.84,2.18-6.2,3.27-10.08,3.27Z"/>
                          <path className="fill-gray-900 dark:fill-gray-100" d="M376.52,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                          <path className="fill-gray-900 dark:fill-gray-100" d="M419.36,19.55h4.04V52.45h-3.48l-18.75-25.66v25.66h-3.99V19.55h3.71l18.47,25.38V19.55Z"/>
                          <path className="fill-gray-900 dark:fill-gray-100" d="M451.99,19.55v3.85h-10.01v29.05h-4.14V23.4h-10.01v-3.85h24.16Z"/>
                          <path className="fill-gray-900 dark:fill-gray-100" d="M475.55,52.45l-7.52-12.88h-7.52v12.88h-4.09V19.55h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                          <path className="fill-gray-900 dark:fill-gray-100" d="M489.96,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        </g>
                      </svg>
                      
                      <div className="flex items-center gap-2">
                          <button onClick={() => setIsSearchActive(true)} className="p-2 text-gray-600 dark:text-gray-300">
                             <Search className="w-5 h-5" />
                          </button>
                          
                          <div className="relative" ref={userMenuRef}>
                            <button 
                               onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                               className="flex items-center gap-3 focus:outline-none"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md border-2 border-primary-400">
                                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            </button>
                          </div>
                      </div>
                 </div>
              )}
          </div>


          {/* Desktop Header Content */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1.5 border border-transparent focus-within:border-primary-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Поиск..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm ml-2 text-gray-700 dark:text-gray-200 w-32 placeholder-gray-400" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative" ref={userMenuRef}>
                <button 
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className="flex items-center gap-3 pl-4 focus:outline-none"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name || 'Пользователь'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right truncate max-w-[150px]">{currentUser.email}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md border-2 border-primary-400">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* User Menu Dropdown (Shared) */}
          {isUserMenuOpen && (
              <div className="absolute right-4 top-16 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 md:hidden">
                  <p className="font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
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
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 no-scrollbar pb-20 md:pb-6">
          {renderContent()}
        </div>
      </main>

      {/* Global Confirmation Dialog */}
      {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden transform scale-100 transition-all">
                  <div className="p-6 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{confirmDialog.message}</p>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                            onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Отмена
                          </button>
                          <button 
                            onClick={confirmDialog.onConfirm}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all"
                          >
                            Удалить
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
