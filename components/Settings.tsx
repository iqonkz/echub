
import React, { useState, useRef } from 'react';
import { User, Bell, Lock, Moon, Sun, LogOut, Activity, Smartphone, Type, Monitor, Send, Save, Users, Plus, Edit, Trash2, X, Laptop, Shield, Key, ArchiveRestore, RefreshCcw, FileText, Check, Upload, Eye } from 'lucide-react';
import { SystemLog, ModuleType, User as UserType, TeamMember, AppRole, PermissionAction, AppPermissions, DeletedItem } from '../types';
import Switch from './ui/Switch';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface SettingsProps {
  currentUser: UserType;
  onUpdateProfile: (updatedUser: Partial<UserType>) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  logs: SystemLog[];
  mobileMenuConfig?: ModuleType[];
  onUpdateMobileConfig?: (modules: ModuleType[]) => void;
  appSettings: {
      fontSize: 'small' | 'medium' | 'large';
      fontFamily: 'sans' | 'serif';
  };
  onUpdateAppSettings: (settings: any) => void;
  team: TeamMember[];
  onAddTeamMember: (member: TeamMember) => void;
  onUpdateTeamMember: (member: TeamMember) => void;
  onDeleteTeamMember: (id: string) => void;
  permissions?: AppPermissions;
  onUpdatePermissions?: (permissions: AppPermissions) => void;
  trashItems?: DeletedItem[];
  onRestore?: (item: DeletedItem) => void;
  onPermanentDelete?: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    currentUser, onUpdateProfile, onLogout, isDarkMode, toggleTheme, logs, mobileMenuConfig, onUpdateMobileConfig,
    appSettings, onUpdateAppSettings, team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember, permissions, onUpdatePermissions,
    trashItems, onRestore, onPermanentDelete
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'APPEARANCE' | 'TEAM' | 'RIGHTS' | 'TRASH' | 'LOGS' | 'MOBILE'>('PROFILE');
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: currentUser.name, 
    email: currentUser.email,
    company: currentUser.company || '',
    position: currentUser.position || '',
    phone: currentUser.phone || ''
  });
  
  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  // Team Edit State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<TeamMember>>({});

  const toggleModule = (module: ModuleType) => {
     if (!mobileMenuConfig || !onUpdateMobileConfig) return;
     if (mobileMenuConfig.includes(module)) {
        onUpdateMobileConfig(mobileMenuConfig.filter(m => m !== module));
     } else {
        onUpdateMobileConfig([...mobileMenuConfig, module]);
     }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateProfile(editForm);
      setIsEditingProfile(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64 = reader.result as string;
             onUpdateProfile({ avatar: base64 });
          };
          reader.readAsDataURL(file);
      }
  };

  // Team Handlers
  const openTeamModal = (member?: TeamMember) => {
      if (member) {
          setEditingMember(member);
          setTeamForm(member);
      } else {
          setEditingMember(null);
          setTeamForm({ role: 'EMPLOYEE', status: 'ACTIVE', department: '' });
      }
      setIsTeamModalOpen(true);
  };

  const handleSaveTeamMember = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingMember) {
          onUpdateTeamMember({ ...editingMember, ...teamForm } as TeamMember);
      } else {
          const newMember: TeamMember = {
              id: `u${Date.now()}`,
              name: teamForm.name || 'Новый сотрудник',
              email: teamForm.email || '',
              role: teamForm.role || 'EMPLOYEE',
              department: teamForm.department || '',
              status: 'ACTIVE',
              avatar: ''
          };
          onAddTeamMember(newMember);
      }
      setIsTeamModalOpen(false);
  };

  // Permission Handlers
  const togglePermission = (role: AppRole, module: string, action: PermissionAction) => {
      if (!permissions || !onUpdatePermissions) return;
      
      const newPermissions = { ...permissions };
      const rolePerms = { ...newPermissions[role] };
      const modulePerms = { ...rolePerms[module] };
      
      modulePerms[action] = !modulePerms[action];
      rolePerms[module] = modulePerms;
      newPermissions[role] = rolePerms;

      onUpdatePermissions(newPermissions);
  };

  const availableModules = [
    { id: ModuleType.HOME, label: 'Главная' },
    { id: ModuleType.PROJECTS, label: 'Проекты' },
    { id: ModuleType.CRM, label: 'CRM' },
    { id: ModuleType.CALENDAR, label: 'Календарь' },
    { id: ModuleType.DOCUMENTS, label: 'Документы' },
    { id: ModuleType.KNOWLEDGE, label: 'База знаний' }
  ];

  const modulesForPermissions = ['CRM', 'PROJECTS', 'DOCUMENTS', 'SETTINGS'];
  const actionsForPermissions: {key: PermissionAction, label: string}[] = [
      {key: 'READ', label: 'Чтение'},
      {key: 'CREATE', label: 'Добавление'},
      {key: 'UPDATE', label: 'Изменение'},
      {key: 'DELETE', label: 'Удаление'},
      {key: 'EXPORT', label: 'Экспорт'},
      {key: 'IMPORT', label: 'Импорт'}
  ];
  
  const getTabStyle = (tab: string) => {
     return `px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all font-medium ${activeTab === tab ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`;
  };

  const getDaysLeft = (deletedAt: string) => {
      const deleteDate = new Date(deletedAt);
      const expirationDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const now = new Date();
      const diffTime = expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Настройки</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Управление аккаунтом и системой</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar shadow-sm border border-gray-200 dark:border-gray-700">
          <button onClick={() => setActiveTab('PROFILE')} className={getTabStyle('PROFILE')}>Профиль</button>
          {currentUser.role === 'ADMIN' && (
              <>
                <button onClick={() => setActiveTab('TEAM')} className={getTabStyle('TEAM')}>Команда</button>
                <button onClick={() => setActiveTab('RIGHTS')} className={getTabStyle('RIGHTS')}>Права</button>
              </>
          )}
          <button onClick={() => setActiveTab('APPEARANCE')} className={getTabStyle('APPEARANCE')}>Внешний вид</button>
          <button onClick={() => setActiveTab('TRASH')} className={getTabStyle('TRASH')}>Корзина</button>
          <button onClick={() => setActiveTab('MOBILE')} className={getTabStyle('MOBILE')}>Меню</button>
          <button onClick={() => setActiveTab('LOGS')} className={getTabStyle('LOGS')}>Логи</button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" /> Личная информация
              </h3>
              <Button size="sm" variant={isEditingProfile ? 'secondary' : 'primary'} onClick={() => setIsEditingProfile(!isEditingProfile)} icon={<Edit className="w-4 h-4"/>}>
                  {isEditingProfile ? 'Отмена' : 'Изменить'}
              </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Column */}
              <div className="flex flex-col items-center gap-3">
                  <div 
                      onClick={() => currentUser.avatar && setIsAvatarPreviewOpen(true)}
                      className={`w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary-500/30 overflow-hidden relative group ${currentUser.avatar ? 'cursor-pointer' : ''}`}
                  >
                      {currentUser.avatar ? (
                          <>
                            <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-8 h-8 text-white" />
                            </div>
                          </>
                      ) : currentUser.name.charAt(0)}
                  </div>
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                      Изменить фото
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>

              {/* Form Column */}
              <div className="flex-1 w-full">
                  {isEditingProfile ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input label="Имя" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                              <Input label="Email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input label="Компания" value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} placeholder="Название компании" />
                              <Input label="Должность" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} placeholder="Ваша должность" />
                          </div>
                          <Input label="Телефон" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} placeholder="+7 (___) ___-__-__" />
                          
                          <div className="flex justify-end pt-2">
                              <Button type="submit" icon={<Save className="w-4 h-4"/>}>Сохранить</Button>
                          </div>
                      </form>
                  ) : (
                      <div className="space-y-4">
                          <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">ФИО</p>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">{currentUser.name}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{currentUser.email}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Телефон</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{currentUser.phone || 'Не указан'}</p>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Компания</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{currentUser.company || 'Не указана'}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Должность</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{currentUser.position || 'Не указана'}</p>
                              </div>
                          </div>
                          <div className="pt-2">
                              <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-md uppercase tracking-wider">{currentUser.role}</span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* Security / Logout */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-gray-500" /> Безопасность
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Текущая сессия: {navigator.userAgent}</p>
            </div>
            <Button variant="danger" onClick={onLogout} icon={<LogOut className="w-4 h-4"/>}>Выйти из аккаунта</Button>
        </div>
      </div>
      )}

      {/* Other tabs content (same as before) */}
      {activeTab === 'APPEARANCE' && (
          <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                      <Monitor className="w-5 h-5 text-purple-500" /> Интерфейс
                  </h3>
                  
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-100 text-orange-500'}`}>
                                  {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">Тема оформления</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{isDarkMode ? 'Темная' : 'Светлая'} тема</p>
                              </div>
                          </div>
                          <Switch checked={isDarkMode} onChange={toggleTheme} />
                      </div>

                      <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  <Type className="w-6 h-6" />
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">Размер шрифта</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Глобальный размер текста</p>
                              </div>
                           </div>
                           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                               {(['small', 'medium', 'large'] as const).map(size => (
                                   <button 
                                      key={size}
                                      onClick={() => onUpdateAppSettings({fontSize: size})}
                                      className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${appSettings.fontSize === size ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                   >
                                       {size}
                                   </button>
                               ))}
                           </div>
                      </div>

                      <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  <Type className="w-6 h-6" />
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">Шрифт</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Стиль шрифта</p>
                              </div>
                           </div>
                           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                               {(['sans', 'serif'] as const).map(font => (
                                   <button 
                                      key={font}
                                      onClick={() => onUpdateAppSettings({fontFamily: font})}
                                      className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${appSettings.fontFamily === font ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                   >
                                       {font}
                                   </button>
                               ))}
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'TEAM' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       <Users className="w-5 h-5 text-blue-500" /> Команда ({team.length})
                   </h3>
                   <Button onClick={() => openTeamModal()} icon={<Plus className="w-4 h-4"/>}>Добавить</Button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                              <tr>
                                  <th className="px-4 py-3">Сотрудник</th>
                                  <th className="px-4 py-3 hidden md:table-cell">Роль</th>
                                  <th className="px-4 py-3 hidden md:table-cell">Отдел</th>
                                  <th className="px-4 py-3">Статус</th>
                                  <th className="px-4 py-3 text-right"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {team.map(member => (
                                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                      <td className="px-4 py-2">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                  {member.name.charAt(0)}
                                              </div>
                                              <div className="min-w-0">
                                                  <div className="font-bold text-gray-900 dark:text-white truncate">{member.name}</div>
                                                  <div className="text-xs text-gray-500 truncate max-w-[120px]">{member.email}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-2 hidden md:table-cell">
                                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                              {member.role}
                                          </span>
                                      </td>
                                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300 hidden md:table-cell">{member.department}</td>
                                      <td className="px-4 py-2">
                                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                              {member.status}
                                          </span>
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                          <div className="flex justify-end gap-1">
                                              <button onClick={() => openTeamModal(member)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-primary-500"><Edit className="w-4 h-4"/></button>
                                              <button onClick={() => onDeleteTeamMember(member.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'RIGHTS' && permissions && onUpdatePermissions && (
          <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                      <Shield className="w-5 h-5 text-green-500" /> Управление доступом
                  </h3>
                  
                  <div className="space-y-8">
                      {(['MANAGER', 'EMPLOYEE'] as AppRole[]).map(role => (
                          <div key={role} className="space-y-4">
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase text-sm border-b border-gray-100 dark:border-gray-700 pb-2">{role === 'MANAGER' ? 'Менеджеры' : 'Сотрудники'}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {modulesForPermissions.map(module => (
                                      <div key={module} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                                          <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-3">{module}</h5>
                                          <div className="space-y-2">
                                              {actionsForPermissions.map(action => (
                                                  <div key={action.key} className="flex items-center justify-between">
                                                      <span className="text-xs text-gray-600 dark:text-gray-400">{action.label}</span>
                                                      <Switch 
                                                          checked={permissions[role]?.[module]?.[action.key] || false} 
                                                          onChange={() => togglePermission(role, module, action.key)}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'TRASH' && trashItems && (
          <div className="space-y-6">
               <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                       <Trash2 className="w-5 h-5 text-red-500" /> Корзина ({trashItems.length})
                   </h3>
                   <div className="space-y-2">
                       {trashItems.map(item => (
                           <div key={item.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                       <FileText className="w-4 h-4 text-gray-500" />
                                   </div>
                                   <div>
                                       <p className="font-bold text-sm text-gray-900 dark:text-white">{item.displayTitle}</p>
                                       <p className="text-xs text-gray-500 flex items-center gap-2">
                                           <span className="font-medium">{item.typeLabel}</span> • Удален {new Date(item.deletedAt).toLocaleDateString()} • {item.deletedBy}
                                       </p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-3">
                                   <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                       {getDaysLeft(item.deletedAt)} дн.
                                   </span>
                                   <div className="flex gap-1">
                                       <button onClick={() => onRestore && onRestore(item)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-green-600" title="Восстановить">
                                           <ArchiveRestore className="w-4 h-4" />
                                       </button>
                                       <button onClick={() => onPermanentDelete && onPermanentDelete(item.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600" title="Удалить навсегда">
                                           <X className="w-4 h-4" />
                                       </button>
                                   </div>
                               </div>
                           </div>
                       ))}
                       {trashItems.length === 0 && <p className="text-gray-500 text-center py-8">Корзина пуста</p>}
                   </div>
               </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-blue-500" /> Системный журнал
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {logs.map((log) => (
                          <div key={log.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                              <div className="flex gap-3">
                                  <div className="mt-1">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.user} • {log.module}</p>
                                  </div>
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">{log.timestamp}</span>
                          </div>
                      ))}
                      {logs.length === 0 && <p className="text-gray-500 text-center py-8">Журнал пуст</p>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'MOBILE' && mobileMenuConfig && onUpdateMobileConfig && (
          <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <Smartphone className="w-5 h-5 text-indigo-500" /> Мобильное меню
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Выберите модули, которые будут отображаться в нижней навигации на мобильных устройствах.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {availableModules.map(module => (
                          <div 
                              key={module.id} 
                              onClick={() => toggleModule(module.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${mobileMenuConfig.includes(module.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'}`}
                          >
                              <span className={`font-medium text-sm ${mobileMenuConfig.includes(module.id) ? 'text-primary-900 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}>{module.label}</span>
                              {mobileMenuConfig.includes(module.id) && <Check className="w-4 h-4 text-primary-500" />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Team Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title={editingMember ? 'Редактирование сотрудника' : 'Новый сотрудник'}
        footer={
           <Button onClick={handleSaveTeamMember}>Сохранить</Button>
        }
      >
          <form onSubmit={handleSaveTeamMember} className="space-y-4">
              <Input label="ФИО" value={teamForm.name || ''} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required />
              <Input label="Email" type="email" value={teamForm.email || ''} onChange={e => setTeamForm({...teamForm, email: e.target.value})} required />
              <Input label="Отдел" value={teamForm.department || ''} onChange={e => setTeamForm({...teamForm, department: e.target.value})} />
              <Select label="Роль" value={teamForm.role || 'EMPLOYEE'} onChange={e => setTeamForm({...teamForm, role: e.target.value as any})}>
                  <option value="ADMIN">Администратор</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="EMPLOYEE">Сотрудник</option>
              </Select>
              <Select label="Статус" value={teamForm.status || 'ACTIVE'} onChange={e => setTeamForm({...teamForm, status: e.target.value as any})}>
                  <option value="ACTIVE">Активен</option>
                  <option value="INVITED">Приглашен</option>
                  <option value="DISABLED">Отключен</option>
              </Select>
          </form>
      </Modal>

      {/* Avatar Preview Modal */}
      <Modal
        isOpen={isAvatarPreviewOpen}
        onClose={() => setIsAvatarPreviewOpen(false)}
        title="Просмотр фото"
        size="sm"
      >
        <div className="flex justify-center p-4">
            {currentUser.avatar && (
                <img src={currentUser.avatar} alt="Full Avatar" className="max-w-full max-h-[60vh] rounded-xl shadow-lg"/>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
