
import React, { useState } from 'react';
import { User, Bell, Lock, Moon, Sun, LogOut, Activity, Smartphone } from 'lucide-react';
import { SystemLog, ModuleType } from '../types';

interface SettingsProps {
  currentUser: any;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  logs: SystemLog[];
  mobileMenuConfig?: ModuleType[];
  onUpdateMobileConfig?: (modules: ModuleType[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onLogout, isDarkMode, toggleTheme, logs, mobileMenuConfig, onUpdateMobileConfig }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'LOGS' | 'MOBILE'>('PROFILE');

  const toggleModule = (module: ModuleType) => {
     if (!mobileMenuConfig || !onUpdateMobileConfig) return;
     if (mobileMenuConfig.includes(module)) {
        onUpdateMobileConfig(mobileMenuConfig.filter(m => m !== module));
     } else {
        onUpdateMobileConfig([...mobileMenuConfig, module]);
     }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button onClick={() => setActiveTab('PROFILE')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'PROFILE' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Профиль</button>
          <button onClick={() => setActiveTab('MOBILE')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'MOBILE' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Мобильное меню</button>
          <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-1.5 text-sm rounded-md ${activeTab === 'LOGS' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Логи</button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" /> Профиль
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-xl font-bold text-gray-900">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{currentUser.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                {currentUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary-500" /> Внешний вид
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Тема оформления</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Переключение между светлой и темной темой</p>
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

      {activeTab === 'MOBILE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary-500" /> Мобильное меню
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выберите пункты, которые будут отображаться в нижнем меню на мобильных устройствах (макс 5).</p>
              
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
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Время</th>
                    <th className="px-6 py-3">Пользователь</th>
                    <th className="px-6 py-3">Модуль</th>
                    <th className="px-6 py-3">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
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
    </div>
  );
};

export default Settings;
