
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
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';

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
             role: 'USER', 
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

  // 2. Data Syncing (Only when authenticated)
  useEffect(() => {
      if (!isAuthenticated) return;

      const unsubs = [
          onSnapshot(collection(db, 'tasks'), (snap) => setTasks(snap.docs.map(d => ({id: d.id, ...d.data()} as Task)))),
          onSnapshot(collection(db, 'projects'), (snap) => setProjects(snap.docs.map(d => ({id: d.id, ...d.data()} as Project)))),
          onSnapshot(collection(db, 'deals'), (snap) => setDeals(snap.docs.map(d => ({id: d.id, ...d.data()} as Deal)))),
          onSnapshot(collection(db, 'companies'), (snap) => setCompanies(snap.docs.map(d => ({id: d.id, ...d.data()} as Company)))),
          onSnapshot(collection(db, 'contacts'), (snap) => setContacts(snap.docs.map(d => ({id: d.id, ...d.data()} as Contact)))),
          onSnapshot(collection(db, 'activities'), (snap) => setActivities(snap.docs.map(d => ({id: d.id, ...d.data()} as CrmActivity)))),
          onSnapshot(collection(db, 'documents'), (snap) => setDocs(snap.docs.map(d => ({id: d.id, ...d.data()} as DocumentItem)))),
          onSnapshot(collection(db, 'articles'), (snap) => setArticles(snap.docs.map(d => ({id: d.id, ...d.data()} as Article)))),
          onSnapshot(collection(db, 'team'), (snap) => setTeam(snap.docs.map(d => ({id: d.id, ...d.data()} as TeamMember)))),
          onSnapshot(collection(db, 'trash'), (snap) => setTrashItems(snap.docs.map(d => ({id: d.id, ...d.data()} as DeletedItem)))),
          // onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => setLogs(snap.docs.map(d => ({id: d.id, ...d.data()} as SystemLog))))
      ];

      return () => unsubs.forEach(u => u());
  }, [isAuthenticated]);

  // 3. Dark Mode Effect
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // --- CRUD Operations Handlers ---
  
  const handleAdd = async (collectionName: string, data: any) => {
      try {
          // Use setDoc with specific ID if provided, else addDoc
          if (data.id && !data.id.startsWith('temp')) {
              await setDoc(doc(db, collectionName, data.id), sanitizeForFirestore(data));
          } else {
              const { id, ...rest } = data; // Remove temp ID
              await addDoc(collection(db, collectionName), sanitizeForFirestore(rest));
          }
          logAction(`Created item in ${collectionName}`);
      } catch (e) {
          console.error("Error adding document: ", e);
      }
  };

  const handleUpdate = async (collectionName: string, data: any) => {
      try {
          await updateDoc(doc(db, collectionName, data.id), sanitizeForFirestore(data));
          logAction(`Updated item in ${collectionName}`);
      } catch (e) {
          console.error("Error updating document: ", e);
      }
  };

  const handleDelete = async (collectionName: string, id: string, typeLabel: string, data?: any) => {
      try {
          // Soft delete -> Move to trash
          const item = data || { id };
          const deletedItem: DeletedItem = {
              id: `del_${id}`,
              originalId: id,
              collectionName,
              data: item,
              deletedAt: new Date().toISOString(),
              deletedBy: currentUser.name,
              displayTitle: item.title || item.name || item.subject || 'Unknown',
              typeLabel
          };
          
          await setDoc(doc(db, 'trash', deletedItem.id), sanitizeForFirestore(deletedItem));
          await deleteDoc(doc(db, collectionName, id));
          
          logAction(`Deleted ${typeLabel}: ${id}`);
      } catch (e) {
          console.error("Error deleting document: ", e);
      }
  };

  const logAction = (action: string) => {
      // Mock log for now, could be firestore
      const newLog: SystemLog = {
          id: `l${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          user: currentUser.name,
          action,
          module: 'SYSTEM'
      };
      setLogs(prev => [newLog, ...prev]);
  };

  // --- Specific Handlers Wrapper ---
  // Tasks
  const addTask = (t: Task) => handleAdd('tasks', t);
  const updateTask = (t: Task) => handleUpdate('tasks', t); // Full update
  const updateTaskStatus = (id: string, status: TaskStatus) => updateDoc(doc(db, 'tasks', id), { status });
  const deleteTask = (id: string) => handleDelete('tasks', id, 'Задача', tasks.find(t => t.id === id));

  // Projects
  const addProject = (p: Project) => handleAdd('projects', p);
  const updateProject = (p: Project) => handleUpdate('projects', p);
  
  // CRM
  const addDeal = (d: Deal) => handleAdd('deals', d);
  const updateDeal = (d: Deal) => handleUpdate('deals', d);
  const deleteDeal = (id: string) => handleDelete('deals', id, 'Сделка', deals.find(d => d.id === id));
  
  const addCompany = (c: Company) => handleAdd('companies', c);
  const updateCompany = (c: Company) => handleUpdate('companies', c);
  const deleteCompany = (id: string) => handleDelete('companies', id, 'Компания', companies.find(c => c.id === id));

  const addContact = (c: Contact) => handleAdd('contacts', c);
  const updateContact = (c: Contact) => handleUpdate('contacts', c);
  const deleteContact = (id: string) => handleDelete('contacts', id, 'Контакт', contacts.find(c => c.id === id));

  const addActivity = (a: CrmActivity) => handleAdd('activities', a);

  // Docs
  const addDocItem = (d: DocumentItem) => handleAdd('documents', d);
  const deleteDocItem = (id: string) => handleDelete('documents', id, 'Документ', docs.find(d => d.id === id));

  // KB
  const addArticle = (a: Article) => handleAdd('articles', a);

  // Settings / Team
  const updateProfile = async (data: Partial<User>) => {
      if (currentUser.id) {
          await updateDoc(doc(db, 'users', currentUser.id), data);
          setCurrentUser(prev => ({...prev, ...data}));
      }
  };

  const addTeamMember = (m: TeamMember) => handleAdd('team', m);
  const updateTeamMember = (m: TeamMember) => handleUpdate('team', m);
  const deleteTeamMember = (id: string) => handleDelete('team', id, 'Сотрудник', team.find(t => t.id === id));

  const updatePermissions = (p: AppPermissions) => setPermissions(p); // Local state for now
  
  // Trash
  const restoreItem = async (item: DeletedItem) => {
      try {
          await setDoc(doc(db, item.collectionName, item.originalId), item.data);
          await deleteDoc(doc(db, 'trash', item.id));
          logAction(`Restored item: ${item.displayTitle}`);
      } catch (e) {
          console.error("Restore failed", e);
      }
  };
  
  const permanentDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'trash', id));
          logAction(`Permanently deleted item`);
      } catch (e) {
          console.error("Permanent delete failed", e);
      }
  };


  // --- Render ---

  if (authLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Login onLogin={() => {}} />;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} font-${appSettings.fontFamily} text-${appSettings.fontSize}`}>
      
      {/* Desktop Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onNavigate={setActiveModule} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} relative`}>
        
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10 sticky top-0">
           {/* Mobile Search Toggle */}
           <div className={`flex-1 flex items-center transition-all ${isSearchActive ? 'absolute inset-0 bg-white dark:bg-gray-800 px-4 z-20' : ''}`}>
              {isSearchActive && (
                  <button onClick={() => setIsSearchActive(false)} className="mr-2 md:hidden">
                      <X className="w-6 h-6 text-gray-500" />
                  </button>
              )}
              <div className={`relative ${isSearchActive ? 'w-full' : 'w-64 hidden md:block'}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Поиск..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white"
                  />
              </div>
              {!isSearchActive && (
                  <button onClick={() => setIsSearchActive(true)} className="md:hidden p-2 text-gray-500">
                      <Search className="w-6 h-6" />
                  </button>
              )}
           </div>

           <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                      <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{currentUser.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentUser.role === 'ADMIN' ? 'Admin' : 'User'}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md">
                          {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover"/> : currentUser.name.charAt(0)}
                      </div>
                  </button>

                  {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-fade-in z-50">
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">Мой аккаунт</p>
                              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                          </div>
                          <button onClick={() => { setActiveModule(ModuleType.SETTINGS); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                              <UserIcon className="w-4 h-4" /> Профиль
                          </button>
                          <button onClick={() => { setActiveModule(ModuleType.SETTINGS); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                              <SettingsIcon className="w-4 h-4" /> Настройки
                          </button>
                          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                          <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                              <LogOut className="w-4 h-4" /> Выйти
                          </button>
                      </div>
                  )}
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           {activeModule === ModuleType.HOME && <Dashboard tasks={tasks} deals={deals} onNavigate={setActiveModule} />}
           {activeModule === ModuleType.TASKS && <Tasks 
                tasks={tasks} 
                projects={projects}
                onUpdateTaskStatus={updateTaskStatus} 
                onAddTask={addTask} 
                onDeleteTask={deleteTask}
                onAddProject={addProject}
                onUpdateProject={updateProject}
                searchQuery={searchQuery}
                currentUser={currentUser}
                team={team}
                initialTab="TASKS"
           />} 
           {/* Tasks component handles both Projects and Tasks now, redirect PROJECTS to TASKS view */}
           {activeModule === ModuleType.PROJECTS && <Tasks 
                tasks={tasks} 
                projects={projects}
                onUpdateTaskStatus={updateTaskStatus} 
                onAddTask={addTask} 
                onDeleteTask={deleteTask}
                onAddProject={addProject}
                onUpdateProject={updateProject}
                searchQuery={searchQuery}
                currentUser={currentUser}
                team={team}
                initialTab="PROJECTS"
           />}
           {activeModule === ModuleType.CRM && <CRM 
                deals={deals} 
                companies={companies}
                contacts={contacts}
                activities={activities}
                onAddDeal={addDeal} 
                onUpdateDeal={updateDeal} 
                onDeleteDeal={deleteDeal}
                onAddCompany={addCompany}
                onUpdateCompany={updateCompany}
                onDeleteCompany={deleteCompany}
                onAddContact={addContact}
                onUpdateContact={updateContact}
                onDeleteContact={deleteContact}
                onAddActivity={addActivity}
                searchQuery={searchQuery}
                currentUser={currentUser}
           />}
           {activeModule === ModuleType.CALENDAR && <Calendar 
                tasks={tasks}
                onEditTask={(task) => {
                    // Switch to tasks and open modal (simulated by passing prop or state management)
                    setActiveModule(ModuleType.TASKS);
                    // In a real app, use a context or global state store to trigger the modal
                    // For now, we just navigate
                }}
                onAddActivity={addActivity}
           />}
           {activeModule === ModuleType.DOCUMENTS && <Documents 
                docs={docs} 
                onAddDocument={addDocItem} 
                onDeleteDocument={deleteDocItem}
                searchQuery={searchQuery}
                currentUser={currentUser}
           />}
           {activeModule === ModuleType.KNOWLEDGE && <KnowledgeBase 
                articles={articles} 
                onAddArticle={addArticle}
                searchQuery={searchQuery}
                currentUser={currentUser}
           />}
           {activeModule === ModuleType.SETTINGS && <Settings 
                currentUser={currentUser} 
                onUpdateProfile={updateProfile} 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                logs={logs}
                mobileMenuConfig={mobileMenuConfig}
                onUpdateMobileConfig={setMobileMenuConfig}
                appSettings={appSettings}
                onUpdateAppSettings={(s) => setAppSettings({...appSettings, ...s})}
                team={team}
                onAddTeamMember={addTeamMember}
                onUpdateTeamMember={updateTeamMember}
                onDeleteTeamMember={deleteTeamMember}
                permissions={permissions}
                onUpdatePermissions={updatePermissions}
                trashItems={trashItems}
                onRestore={restoreItem}
                onPermanentDelete={permanentDelete}
           />}
        </div>

        {/* Mobile Navigation Bar */}
        <MobileNav 
            activeModule={activeModule} 
            onNavigate={setActiveModule} 
            visibleModules={mobileMenuConfig} 
        />

        {/* Confirmation Dialog Overlay - Using Generic Modal */}
        <Modal
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog({...confirmDialog, isOpen: false})}
            title={confirmDialog.title}
            size="sm"
            footer={
                <div className="flex gap-2 w-full">
                    <Button variant="ghost" onClick={() => setConfirmDialog({...confirmDialog, isOpen: false})} className="flex-1">Отмена</Button>
                    <Button variant="danger" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({...confirmDialog, isOpen: false}); }} className="flex-1">Подтвердить</Button>
                </div>
            }
        >
             <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                     <AlertTriangle className="w-6 h-6" />
                 </div>
                 <p className="text-gray-500 dark:text-gray-400">{confirmDialog.message}</p>
             </div>
        </Modal>

      </main>
    </div>
  );
};

export default App;