
import React, { useState } from 'react';
import { User, Bell, Lock, Moon, Sun, LogOut, Activity, Smartphone, Type, Monitor, Send, Save, Users, Plus, Edit, Trash2, X, Laptop, Shield, Key, ArchiveRestore, RefreshCcw } from 'lucide-react';
import { SystemLog, ModuleType, User as UserType, TeamMember, AppRole, PermissionAction, AppPermissions, DeletedItem } from '../types';

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
  const [editForm, setEditForm] = useState({ name: currentUser.name, email: currentUser.email });
  
  // Team Edit State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<TeamMember>>({});

  // CRM Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

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

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (inviteEmail) {
          setInviteSent(true);
          setTimeout(() => { setInviteSent(false); setInviteEmail(''); }, 3000);
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

  // Mock Login History
  const loginHistory = [
      { id: 1, device: 'MacBook Pro', ip: '192.168.1.105', time: 'Сейчас', active: true },
      { id: 2, device: 'iPhone 14', ip: '10.0.0.5', time: '2 часа назад', active: false },
      { id: 3, device: 'Windows PC', ip: '172.16.0.23', time: 'Вчера, 14:30', active: false },
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
  
  // Tab styling helper
  const getTabStyle = (tab: string) => {
     return `px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all font-medium ${activeTab === tab ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`;
  };

  // Days left calculation helper
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <User className="w-5 h-5 text-primary-500" /> 
                </div>
                Профиль
              </h3>
              {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">Редактировать</button>
              )}
          </div>
          
          {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Имя</label>
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Email</label>
                      <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Отмена</button>
                      <button type="submit" className="px-5 py-2 bg-gradient-to-r from-primary-400 to-primary-500 text-gray-900 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"><Save className="w-4 h-4"/> Сохранить</button>
                  </div>
              </form>
          ) : (
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-3xl font-bold text-gray-900 shadow-xl shadow-primary-500/20 ring-4 ring-white dark:ring-gray-700">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-2xl">{currentUser.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">{currentUser.email}</p>
                  <div className="flex gap-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                        {currentUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                      </span>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Security / Login History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <Shield className="w-5 h-5 text-indigo-500" />
                </div>
                Безопасность
            </h3>
            
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">История входов</h4>
            <div className="space-y-4">
                {loginHistory.map(login => (
                    <div key={login.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                {login.device.includes('iPhone') || login.device.includes('Android') ? <Smartphone className="w-5 h-5 text-gray-500" /> : <Laptop className="w-5 h-5 text-gray-500" />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{login.device}</p>
                                <p className="text-xs text-gray-500">{login.ip} • {login.time}</p>
                            </div>
                        </div>
                        {login.active ? (
                            <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">Активен</span>
                        ) : (
                             <span className="text-xs font-medium text-gray-400">Завершен</span>
                        )}
                    </div>
                ))}
            </div>

             <div className="border-t border-gray-100 dark:border-gray-700 mt-6 pt-6">
                 <button 
                   onClick={onLogout}
                   className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold px-5 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full md:w-auto justify-center"
                 >
                    <LogOut className="w-5 h-5" /> Выйти из всех устройств
                 </button>
              </div>
        </div>
      </div>
      )}

      {activeTab === 'RIGHTS' && currentUser.role === 'ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
               <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary-500" /> Права доступа
                  </h3>
              </div>
              
              <div className="overflow-x-auto">
                  {/* Permissions Matrix with Premium Checkboxes */}
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs font-bold border-b border-gray-200 dark:border-gray-700">
                         <tr>
                             <th className="px-6 py-4">Модуль / Действие</th>
                             <th className="px-6 py-4 text-center">Администратор</th>
                             <th className="px-6 py-4 text-center">Менеджер</th>
                             <th className="px-6 py-4 text-center">Сотрудник</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                         {modulesForPermissions.map(module => (
                             <React.Fragment key={module}>
                                 <tr className="bg-gray-50/30 dark:bg-gray-800/30">
                                     <td colSpan={4} className="px-6 py-2 font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700">
                                         {module}
                                     </td>
                                 </tr>
                                 {actionsForPermissions.map(action => (
                                     <tr key={`${module}-${action.key}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                         <td className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium">{action.label}</td>
                                         <td className="px-6 py-3 text-center">
                                             <div className={`w-10 h-6 bg-primary-500 rounded-full p-1 transition-all mx-auto opacity-50 cursor-not-allowed`}>
                                                 <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-4"></div>
                                             </div>
                                         </td>
                                         <td className="px-6 py-3 text-center">
                                             <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={permissions?.MANAGER?.[module]?.[action.key] || false} 
                                                    onChange={() => togglePermission('MANAGER', module, action.key)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                              </label>
                                         </td>
                                         <td className="px-6 py-3 text-center">
                                              <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={permissions?.EMPLOYEE?.[module]?.[action.key] || false} 
                                                    onChange={() => togglePermission('EMPLOYEE', module, action.key)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                              </label>
                                         </td>
                                     </tr>
                                 ))}
                             </React.Fragment>
                         ))}
                     </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Recycle Bin Tab */}
      {activeTab === 'TRASH' && (
           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArchiveRestore className="w-5 h-5 text-orange-500" /> Корзина
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Удаленные элементы хранятся 30 дней.</p>
                </div>
                
                {(!trashItems || trashItems.length === 0) ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Trash2 className="w-12 h-12 mb-3 text-gray-300" />
                        <p>Корзина пуста</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs font-bold border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Элемент</th>
                                    <th className="px-6 py-4">Тип</th>
                                    <th className="px-6 py-4">Удалено</th>
                                    <th className="px-6 py-4">Удалил</th>
                                    <th className="px-6 py-4">Осталось</th>
                                    <th className="px-6 py-4 text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {trashItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.displayTitle}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.typeLabel}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(item.deletedAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.deletedBy}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                                                {getDaysLeft(item.deletedAt)} дн.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => onRestore && onRestore(item)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                    title="Восстановить"
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onPermanentDelete && onPermanentDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                    title="Удалить навсегда"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
           </div>
      )}

      {activeTab === 'TEAM' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" /> Команда
                  </h3>
                  <button onClick={() => openTeamModal()} className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-gray-900 px-4 py-2 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5 text-sm">
                      <Plus className="w-4 h-4" /> Добавить
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
                          <tr>
                              <th className="px-6 py-4">Имя</th>
                              <th className="px-6 py-4">Email</th>
                              <th className="px-6 py-4">Роль</th>
                              <th className="px-6 py-4">Отдел</th>
                              <th className="px-6 py-4">Статус</th>
                              <th className="px-6 py-4 text-right">Действия</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {team.map(member => (
                              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{member.name}</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">{member.email}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${member.role === 'ADMIN' ? 'bg-red-100 text-red-700' : member.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                          {member.role}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{member.department}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {member.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => openTeamModal(member)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                              <Edit className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => onDeleteTeamMember(member.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'APPEARANCE' && (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Monitor className="w-5 h-5 text-purple-500" /> 
                </div>
                Тема оформления
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Режим</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Переключение между светлой и темной темой</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-gray-600 text-gray-700 dark:text-white shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-500 transition-all flex items-center gap-2 font-medium"
                >
                   {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-500" />}
                   {isDarkMode ? 'Светлая' : 'Темная'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <Type className="w-5 h-5 text-indigo-500" /> 
                    </div>
                    Типографика
                </h3>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Размер шрифта</p>
                            <p className="text-sm text-gray-500 mt-1">Размер текста интерфейса</p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button onClick={() => onUpdateAppSettings({fontSize: 'small'})} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${appSettings.fontSize === 'small' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>S</button>
                            <button onClick={() => onUpdateAppSettings({fontSize: 'medium'})} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${appSettings.fontSize === 'medium' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>M</button>
                            <button onClick={() => onUpdateAppSettings({fontSize: 'large'})} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${appSettings.fontSize === 'large' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>L</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-6">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Шрифт</p>
                            <p className="text-sm text-gray-500 mt-1">Стиль отображения текста</p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button onClick={() => onUpdateAppSettings({fontFamily: 'sans'})} className={`px-4 py-1.5 text-sm rounded-lg font-sans transition-all ${appSettings.fontFamily === 'sans' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Sans</button>
                            <button onClick={() => onUpdateAppSettings({fontFamily: 'serif'})} className={`px-4 py-1.5 text-sm rounded-lg font-serif transition-all ${appSettings.fontFamily === 'serif' ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Serif</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'MOBILE' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Smartphone className="w-5 h-5 text-green-500" /> 
                  </div>
                  Мобильное меню
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Выберите пункты, которые будут отображаться в нижнем меню на мобильных устройствах (макс 5).</p>
              
              <div className="space-y-3">
                 {availableModules.map(m => (
                     <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                         <span className="text-gray-900 dark:text-white font-bold">{m.label}</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={mobileMenuConfig?.includes(m.id)}
                              onChange={() => toggleModule(m.id)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                         </label>
                     </div>
                 ))}
              </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" /> 
                  </div>
                  Журнал действий
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Время</th>
                    <th className="px-6 py-4">Пользователь</th>
                    <th className="px-6 py-4">Модуль</th>
                    <th className="px-6 py-4">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {logs.map(log => (
                    <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* Add/Edit Team Member Modal */}
      {isTeamModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700 overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {editingMember ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                      </h3>
                      <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={handleSaveTeamMember} className="p-6 space-y-5">
                      <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Имя</label>
                          <input 
                              value={teamForm.name || ''} 
                              onChange={e => setTeamForm({...teamForm, name: e.target.value})}
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                              required
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Email</label>
                          <input 
                              type="email"
                              value={teamForm.email || ''} 
                              onChange={e => setTeamForm({...teamForm, email: e.target.value})}
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                              required
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Роль</label>
                              <select 
                                  value={teamForm.role || 'EMPLOYEE'} 
                                  onChange={e => setTeamForm({...teamForm, role: e.target.value as any})}
                                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                              >
                                  <option value="EMPLOYEE">Сотрудник</option>
                                  <option value="MANAGER">Менеджер</option>
                                  <option value="ADMIN">Администратор</option>
                              </select>
                          </div>
                          <div className="space-y-1.5">
                              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Отдел</label>
                              <input 
                                  value={teamForm.department || ''} 
                                  onChange={e => setTeamForm({...teamForm, department: e.target.value})}
                                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                              />
                          </div>
                      </div>
                      <div className="flex justify-end pt-2">
                          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">Сохранить</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
