
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
  const deleteActivity = (id: string) => handleDelete('activities', id, 'Действие', activities.find(a => a.id === id));

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
        <header className="h-16 md:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
           
           {/* Left / Center - Logo or Search Field */}
           <div className={`flex-1 flex items-center ${isSearchActive ? 'absolute inset-0 bg-white dark:bg-gray-800 px-4 z-20 md:static md:bg-transparent md:px-0' : ''}`}>
              
              {/* Mobile: Logo (Hidden if search active) */}
              {!isSearchActive && (
                 <div className="md:hidden mr-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 517.26 72" className="h-7 w-auto">
                        <g>
                          <rect width="324" height="72" fill="#111827"/> {/* Using dark gray/black for background */}
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
                          <path fill="#111827" d="M351.31,52.97c-4.89,0-8.92-1.6-12.1-4.79-3.18-3.2-4.77-7.25-4.77-12.17s1.59-8.98,4.77-12.17c3.18-3.2,7.21-4.79,12.1-4.79,2.51,0,4.83,.48,6.98,1.43,2.15,.96,3.96,2.31,5.45,4.07,1.49,1.75,2.53,3.81,3.13,6.16h-4.18c-.88-2.38-2.32-4.25-4.32-5.59-2.01-1.35-4.36-2.02-7.05-2.02-3.7,0-6.73,1.21-9.09,3.64-2.37,2.43-3.55,5.53-3.55,9.31s1.18,6.87,3.55,9.28c2.37,2.41,5.4,3.62,9.09,3.62,2.76,0,5.15-.71,7.19-2.14,2.04-1.43,3.48-3.41,4.32-5.95h4.23c-.94,3.73-2.83,6.68-5.66,8.86-2.84,2.18-6.2,3.27-10.08,3.27Z"/>
                          <path fill="#111827" d="M376.52,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                          <path fill="#111827" d="M419.36,19.55h4.04V52.45h-3.48l-18.75-25.66v25.66h-3.99V19.55h3.71l18.47,25.38V19.55Z"/>
                          <path fill="#111827" d="M451.99,19.55v3.85h-10.01v29.05h-4.14V23.4h-10.01v-3.85h24.16Z"/>
                          <path fill="#111827" d="M475.55,52.45l-7.52-12.88h-7.52v12.88h-4.09V19.55h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                          <path fill="#111827" d="M489.96,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        </g>
                     </svg>
                 </div>
              )}

              {/* Mobile: Icon Logo (Shown when search is active) */}
              {isSearchActive && (
                 <div className="md:hidden mr-3">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" className="h-8 w-8">
                        <g>
                          <path fill="#111827" className="dark:fill-gray-100" d="M36,0V72H12c-6.63,0-12-5.37-12-12V12C0,5.37,5.37,0,12,0h24Z"/>
                          <path fill="#f6c218" d="M72,12V60c0,6.63-5.37,12-12,12h-24V0h24c6.63,0,12,5.37,12,12Z"/>
                        </g>
                     </svg>
                 </div>
              )}

              {/* Search Bar Container */}
              <div className={`relative transition-all duration-300 ${isSearchActive ? 'flex-1' : 'w-64 hidden md:block'}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Поиск..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white"
                    autoFocus={isSearchActive}
                  />
                  {isSearchActive && (
                      <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 md:hidden">
                          <X className="w-5 h-5" />
                      </button>
                  )}
              </div>
           </div>

           {/* Right Side Controls */}
           <div className={`flex items-center gap-2 md:gap-4 transition-all ${isSearchActive ? 'hidden' : 'flex'}`}>
              
              {/* Mobile Search Trigger Button */}
              <button onClick={() => setIsSearchActive(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                  <Search className="w-5 h-5" />
              </button>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                      <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{currentUser.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentUser.role === 'ADMIN' ? 'Admin' : 'User'}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-gray-900 font-bold shadow-md overflow-hidden">
                          {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover"/> : currentUser.name.charAt(0)}
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
           {activeModule === ModuleType.HOME && <Dashboard tasks={tasks} deals={deals} onNavigate={setActiveModule} activities={activities} />}
           {activeModule === ModuleType.TASKS && <Tasks 
                tasks={tasks} 
                projects={projects}
                onUpdateTaskStatus={updateTaskStatus} 
                onAddTask={addTask} 
                onUpdateTask={updateTask}
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
                onUpdateTask={updateTask}
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
                onDeleteActivity={deleteActivity}
                searchQuery={searchQuery}
                currentUser={currentUser}
           />}
           {activeModule === ModuleType.CALENDAR && <Calendar 
                tasks={tasks}
                onEditTask={(task) => {
                    // Switch to tasks and open modal (simulated by passing prop or state management)
                    setActiveModule(ModuleType.TASKS);
                    // In a real app, use a context or global state store to trigger the modal
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
