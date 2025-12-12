
import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Calendar, CheckSquare, Briefcase, Phone, Clock } from 'lucide-react';
import { Task, Deal, CrmActivity, ModuleType, TaskStatus, DealStage } from '../types';

interface NotificationsPopoverProps {
  tasks: Task[];
  deals: Deal[];
  activities: CrmActivity[];
  onNavigate: (module: ModuleType) => void;
  onOpenTask?: (taskId: string) => void;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ tasks, deals, activities, onNavigate, onOpenTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());

  // --- Filtering Logic ---
  
  // Helper to check if a task is an orphan (parent deleted)
  const isOrphan = (t: Task) => t.parentId && !tasks.some(parent => parent.id === t.parentId);

  // 1. Overdue Tasks (Due date < today AND not done)
  const overdueTasks = tasks.filter(t => 
      t && t.id &&
      !isOrphan(t) &&
      t.dueDate < todayStr && 
      t.status !== TaskStatus.DONE
  );

  // 2. Tasks Due Today
  const todayTasks = tasks.filter(t => 
      t && t.id &&
      !isOrphan(t) &&
      t.dueDate === todayStr && 
      t.status !== TaskStatus.DONE
  );

  // 3. Deals closing Today
  const todayDeals = deals.filter(d => 
      d && d.id &&
      d.expectedClose === todayStr && 
      d.stage !== DealStage.WON && 
      d.stage !== DealStage.LOST
  );

  // 4. Activities for Today
  const todayActivities = activities.filter(a => 
      a && a.id &&
      a.date === todayStr && 
      a.status !== 'Выполнено'
  );

  const totalCount = overdueTasks.length + todayTasks.length + todayDeals.length + todayActivities.length;

  const handleItemClick = (module: ModuleType, taskId?: string) => {
      if (module === ModuleType.TASKS && taskId && onOpenTask) {
          onOpenTask(taskId);
      } else {
          onNavigate(module);
      }
      setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all relative ${isOpen ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
      >
        <Bell className={`w-5 h-5 ${totalCount > 0 ? 'animate-pulse-slow' : ''}`} />
        {totalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-[5px] rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden z-50 animate-fade-in origin-top-right ring-1 ring-black/5">
            <div className="p-4 border-b border-gray-100/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Уведомления</h3>
                {totalCount > 0 ? (
                    <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-primary-500/30">{totalCount} новых</span>
                ) : (
                    <span className="text-xs text-gray-500">Нет новых событий</span>
                )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-4">
                {totalCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p>Все чисто! Хорошая работа.</p>
                    </div>
                )}

                {/* Overdue Section */}
                {overdueTasks.length > 0 && (
                    <div className="space-y-2">
                        <p className="px-2 text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Просрочено
                        </p>
                        {overdueTasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => handleItemClick(ModuleType.TASKS, task.id)}
                                className="p-3 bg-red-50/80 dark:bg-red-900/20 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 bg-white dark:bg-red-900/50 rounded-lg text-red-500 shadow-sm">
                                        <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{task.title}</p>
                                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">Срок: {new Date(task.dueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Today Section */}
                {(todayTasks.length > 0 || todayDeals.length > 0 || todayActivities.length > 0) && (
                     <div className="space-y-2">
                        <p className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Сегодня
                        </p>
                        
                        {/* Activities */}
                        {todayActivities.map(act => (
                            <div 
                                key={act.id} 
                                onClick={() => handleItemClick(ModuleType.CALENDAR)}
                                className="p-3 bg-white/50 dark:bg-gray-700/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 flex items-start gap-3 group backdrop-blur-sm"
                            >
                                <div className="mt-0.5 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors">
                                    <Phone className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{act.subject}</p>
                                    <p className="text-xs text-gray-500 mt-1">CRM: {act.type}</p>
                                </div>
                            </div>
                        ))}

                        {/* Deals */}
                        {todayDeals.map(deal => (
                            <div 
                                key={deal.id} 
                                onClick={() => handleItemClick(ModuleType.CRM)}
                                className="p-3 bg-white/50 dark:bg-gray-700/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 flex items-start gap-3 group backdrop-blur-sm"
                            >
                                <div className="mt-0.5 p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                                    <Briefcase className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{deal.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">Закрытие сделки: {deal.clientName}</p>
                                </div>
                            </div>
                        ))}

                        {/* Tasks */}
                        {todayTasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => handleItemClick(ModuleType.TASKS, task.id)}
                                className="p-3 bg-white/50 dark:bg-gray-700/40 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 flex items-start gap-3 group backdrop-blur-sm"
                            >
                                <div className="mt-0.5 p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-500 group-hover:bg-purple-100 transition-colors">
                                    <CheckSquare className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{task.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">Задача в проекте {task.project}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </div>
            
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-center backdrop-blur-sm">
                <button onClick={() => {onNavigate(ModuleType.TASKS); setIsOpen(false);}} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                    Перейти к задачам
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPopover;
