import React, { useState } from 'react';
import { User, Bell, Lock, Moon, Sun, LogOut, Activity, Smartphone, Type, Monitor, Send, Save, Users, Plus, Edit, Trash2, X } from 'lucide-react';
import { SystemLog, ModuleType, User as UserType, TeamMember } from '../types';

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
}

const Settings: React.FC<SettingsProps> = ({ 
    currentUser, onUpdateProfile, onLogout, isDarkMode, toggleTheme, logs, mobileMenuConfig, onUpdateMobileConfig,
    appSettings, onUpdateAppSettings, team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'APPEARANCE' | 'TEAM' | 'LOGS' | 'MOBILE'>('PROFILE');
  
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

  const availableModules = [
    { id: ModuleType.HOME, label: 'Главная' },
    { id: ModuleType.PROJECTS, label: 'Проекты' },
    { id: ModuleType.CRM, label: 'CRM' },
    { id: ModuleType.CALENDAR, label: 'Календарь' },
    { id: ModuleType.DOCUMENTS, label: 'Документы' },
    { id: ModuleType.KNOWLEDGE, label: 'База знаний' }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
          <button onClick={() => setActiveTab('PROFILE')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${activeTab === 'PROFILE' ? 'bg-white dark:bg-gray-600 shadow font-medium' : 'text-gray-600 dark:text-gray-300'}`}>Профиль</button>
          <button onClick={() => setActiveTab('TEAM')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${activeTab === 'TEAM' ? 'bg-white dark:bg-gray-600 shadow font-medium' : 'text-gray-600 dark:text-gray-300'}`}>Команда</button>
          <button onClick={() => setActiveTab('APPEARANCE')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${activeTab === 'APPEARANCE' ? 'bg-white dark:bg-gray-600 shadow font-medium' : 'text-gray-600 dark:text-gray-300'}`}>Внешний вид</button>
          <button onClick={() => setActiveTab('MOBILE')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${activeTab === 'MOBILE' ? 'bg-white dark:bg-gray-600 shadow font-medium' : 'text-gray-600 dark:text-gray-300'}`}>Меню</button>
          <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${activeTab === 'LOGS' ? 'bg-white dark:bg-gray-600 shadow font-medium' : 'text-gray-600 dark:text-gray-300'}`}>Логи</button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" /> Профиль
              </h3>
              {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="text-primary-600 hover:underline">Редактировать</button>
              )}
          </div>
          
          {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                      <label className="block font-medium text-gray-500 mb-1">Имя</label>
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div>
                      <label className="block font-medium text-gray-500 mb-1">Email</label>
                      <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-3 py-2 text-gray-600 dark:text-gray-400">Отмена</button>
                      <button type="submit" className="px-3 py-2 bg-primary-500 text-gray-900 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Сохранить</button>
                  </div>
              </form>
          ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-xl font-bold text-gray-900 shadow-md border-2 border-primary-400">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{currentUser.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                  <div className="mt-1 flex gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {currentUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Руководитель проектов
                      </span>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* CRM Invite Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-500" /> Пригласить в CRM
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Отправьте приглашение коллеге для доступа к системе.</p>
            <form onSubmit={handleInvite} className="flex gap-2">
                <input 
                   type="email" 
                   placeholder="colleague@engineering-centre.com" 
                   value={inviteEmail}
                   onChange={(e) => setInviteEmail(e.target.value)}
                   className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-primary-500"
                   required 
                />
                <button type="submit" className="bg-gray-900 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors">
                    Отправить
                </button>
            </form>
            {inviteSent && <p className="text-sm text-green-500 mt-2">Приглашение успешно отправлено!</p>}
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-500" /> Безопасность
          </h3>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
             <button 
               onClick={onLogout}
               className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
             >
                <LogOut className="w-5 h-5" /> Выйти из аккаунта
             </button>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'TEAM' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" /> Управление командой
                  </h3>
                  <button onClick={() => openTeamModal()} className="flex items-center gap-2 bg-primary-500 text-gray-900 px-3 py-1.5 rounded-lg font-bold hover:bg-primary-400 transition-colors text-sm">
                      <Plus className="w-4 h-4" /> Добавить
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                          <tr>
                              <th className="px-6 py-3">Имя</th>
                              <th className="px-6 py-3">Email</th>
                              <th className="px-6 py-3">Роль</th>
                              <th className="px-6 py-3">Отдел</th>
                              <th className="px-6 py-3">Статус</th>
                              <th className="px-6 py-3 text-right">Действия</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {team.map(member => (
                              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{member.email}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${member.role === 'ADMIN' ? 'bg-red-100 text-red-800' : member.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                          {member.role}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{member.department}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                          {member.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => openTeamModal(member)} className="text-gray-400 hover:text-primary-500">
                                              <Edit className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => onDeleteTeamMember(member.id)} className="text-gray-400 hover:text-red-500">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary-500" /> Тема оформления
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Режим</p>
                  <p className="text-gray-500 dark:text-gray-400">Переключение между светлой и темной темой</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                   {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                   {isDarkMode ? 'Светлая' : 'Темная'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary-500" /> Типографика
                </h3>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Размер шрифта</p>
                            <p className="text-gray-500">Размер текста интерфейса</p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => onUpdateAppSettings({fontSize: 'small'})} className={`px-3 py-1 rounded transition-all ${appSettings.fontSize === 'small' ? 'bg-white dark:bg-gray-600 shadow font-bold' : ''}`}>Компактный</button>
                            <button onClick={() => onUpdateAppSettings({fontSize: 'medium'})} className={`px-3 py-1 rounded transition-all ${appSettings.fontSize === 'medium' ? 'bg-white dark:bg-gray-600 shadow font-bold' : ''}`}>Средний</button>
                            <button onClick={() => onUpdateAppSettings({fontSize: 'large'})} className={`px-3 py-1 rounded transition-all ${appSettings.fontSize === 'large' ? 'bg-white dark:bg-gray-600 shadow font-bold' : ''}`}>Большой</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Шрифт</p>
                            <p className="text-gray-500">Стиль отображения текста</p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => onUpdateAppSettings({fontFamily: 'sans'})} className={`px-3 py-1 rounded font-sans transition-all ${appSettings.fontFamily === 'sans' ? 'bg-white dark:bg-gray-600 shadow font-bold' : ''}`}>Без засечек</button>
                            <button onClick={() => onUpdateAppSettings({fontFamily: 'serif'})} className={`px-3 py-1 rounded font-serif transition-all ${appSettings.fontFamily === 'serif' ? 'bg-white dark:bg-gray-600 shadow font-bold' : ''}`}>С засечками</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'MOBILE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary-500" /> Мобильное меню
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Выберите пункты, которые будут отображаться в нижнем меню на мобильных устройствах (макс 5).</p>
              
              <div className="space-y-3">
                 {availableModules.map(m => (
                     <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                         <span className="text-gray-900 dark:text-white font-medium">{m.label}</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={mobileMenuConfig?.includes(m.id)}
                              onChange={() => toggleModule(m.id)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                         </label>
                     </div>
                 ))}
              </div>
          </div>
      )}

      {activeTab === 'LOGS' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" /> Журнал действий
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3">Время</th>
                    <th className="px-6 py-3">Пользователь</th>
                    <th className="px-6 py-3">Модуль</th>
                    <th className="px-6 py-3">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      <td className="px-6 py-4 font-mono">{log.timestamp}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* Add/Edit Team Member Modal */}
      {isTeamModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {editingMember ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                      </h3>
                      <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={handleSaveTeamMember} className="p-6 space-y-4">
                      <div>
                          <label className="block font-medium text-gray-500 mb-1">Имя</label>
                          <input 
                              value={teamForm.name || ''} 
                              onChange={e => setTeamForm({...teamForm, name: e.target.value})}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" 
                              required
                          />
                      </div>
                      <div>
                          <label className="block font-medium text-gray-500 mb-1">Email</label>
                          <input 
                              type="email"
                              value={teamForm.email || ''} 
                              onChange={e => setTeamForm({...teamForm, email: e.target.value})}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" 
                              required
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block font-medium text-gray-500 mb-1">Роль</label>
                              <select 
                                  value={teamForm.role || 'EMPLOYEE'} 
                                  onChange={e => setTeamForm({...teamForm, role: e.target.value as any})}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                              >
                                  <option value="EMPLOYEE">Сотрудник</option>
                                  <option value="MANAGER">Менеджер</option>
                                  <option value="ADMIN">Администратор</option>
                              </select>
                          </div>
                          <div>
                              <label className="block font-medium text-gray-500 mb-1">Отдел</label>
                              <input 
                                  value={teamForm.department || ''} 
                                  onChange={e => setTeamForm({...teamForm, department: e.target.value})}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" 
                              />
                          </div>
                      </div>
                      <div className="flex justify-end pt-2">
                          <button type="submit" className="px-4 py-2 bg-primary-500 text-gray-900 rounded font-bold hover:bg-primary-400 shadow-sm">Сохранить</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;