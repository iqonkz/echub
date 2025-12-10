
import React, { useState } from 'react';
import { Task, TaskStatus, CrmActivity } from '../types';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Zap, Settings2, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface CalendarProps {
  tasks: Task[];
  onAddTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onAddActivity?: (activity: CrmActivity) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, onAddTask, onEditTask, onAddActivity }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [showWeekends, setShowWeekends] = useState(true); // Default to showing weekends
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivityData, setNewActivityData] = useState<Partial<CrmActivity>>({});

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const dayNamesShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Helper: Get Local Date String (YYYY-MM-DD)
  const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const changeDate = (offset: number) => {
    if (viewMode === 'MONTH') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    } else {
        // Shift by 7 days for week view
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentDate(newDate);
    }
  };

  const handleQuickAdd = (type: 'Task' | 'Activity', dateStr: string) => {
      setPopoverDate(null);
      if (type === 'Task' && onEditTask) {
          onEditTask({
              id: '', 
              title: '',
              description: '',
              assignee: 'Админ',
              dueDate: dateStr,
              status: TaskStatus.TODO,
              priority: 'Средний',
              project: 'Общее'
          });
      } else if (type === 'Activity') {
          setNewActivityData({
              date: dateStr,
              status: 'Запланировано',
              type: 'Звонок',
              subject: ''
          });
          setIsActivityModalOpen(true);
      }
  };

  const handleSaveActivity = (e: React.FormEvent) => {
      e.preventDefault();
      if (onAddActivity) {
          const activity: CrmActivity = {
              id: `act${Date.now()}`,
              type: newActivityData.type || 'Звонок',
              subject: newActivityData.subject || 'Новое действие',
              date: newActivityData.date || new Date().toISOString().split('T')[0],
              status: 'Запланировано',
              relatedEntityId: ''
          };
          onAddActivity(activity);
      }
      setIsActivityModalOpen(false);
  };

  // --- Logic for Month View ---
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayOfMonth = new Date(year, month, 1).getDay();
    // Start on Monday (1). 0 is Sunday.
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Blanks
    const blanks = Array.from({ length: startOffset }, (_, i) => ({ type: 'blank', key: `blank-${i}` }));
    // Days
    const days = Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(year, month, i + 1);
          return { type: 'day', date: d, key: toLocalISOString(d) };
    });
    return [...blanks, ...days];
  };

  // --- Logic for Week View ---
  const getWeekDays = (date: Date) => {
      // Find Monday of the current week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(date.setDate(diff));

      const days = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          
          // If weekends are hidden, skip Sat(6) and Sun(0)
          if (!showWeekends && (d.getDay() === 0 || d.getDay() === 6)) {
              continue;
          }
          
          days.push({ type: 'day', date: d, key: toLocalISOString(d) });
      }
      return days;
  };

  const visibleCells = viewMode === 'MONTH' ? getMonthDays(currentDate) : getWeekDays(currentDate);
  
  // Headers depend on view and showWeekends
  let headers = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  if (viewMode === 'WEEK' && !showWeekends) {
      headers = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
  }

  // Dynamic grid cols
  const gridColsClass = (viewMode === 'WEEK' && !showWeekends) ? 'grid-cols-5' : 'grid-cols-7';

  const renderCell = (cell: any) => {
    if (cell.type === 'blank') {
        return <div key={cell.key} className="bg-gray-50/30 dark:bg-gray-900/20 min-h-[80px] md:min-h-[120px] border border-gray-100 dark:border-gray-800/50"></div>;
    }

    const date: Date = cell.date;
    const dateStr = toLocalISOString(date);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== TaskStatus.DONE);
    const isToday = toLocalISOString(new Date()) === dateStr;
    const isWeekView = viewMode === 'WEEK';

    return (
      <div 
        key={cell.key} 
        className={`bg-white/50 dark:bg-gray-800/50 p-1 md:p-2 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all group relative backdrop-blur-sm ${isWeekView ? 'min-h-[500px]' : 'min-h-[120px]'}`}
      >
        <div className="flex justify-between items-start mb-1 md:mb-2">
           <div className={`flex flex-col items-center justify-center rounded-lg w-8 h-8 md:w-auto md:h-auto md:px-2 md:py-1 ${
             isToday ? 'bg-primary-500 text-gray-900 shadow-md' : 'text-gray-700 dark:text-gray-300'
           }`}>
               <span className="text-sm font-bold">{date.getDate()}</span>
               {isWeekView && <span className="text-[9px] uppercase opacity-70">{dayNamesShort[date.getDay()]}</span>}
           </div>
        </div>
        
        <div className="space-y-1">
           {dayTasks.map(task => (
             <div 
                key={task.id} 
                onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                className={`text-[8px] md:text-[10px] px-1 md:px-2 py-1.5 rounded-lg border truncate cursor-pointer font-medium shadow-sm transition-transform hover:-translate-y-0.5 ${
                task.priority === 'Высокий' 
                ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' 
                : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
             }`}>
                {task.title}
             </div>
           ))}
        </div>

        {/* Hover Add Button */}
        <div className="absolute top-1 right-1 md:top-2 md:right-2">
            <button 
              onClick={() => setPopoverDate(popoverDate === dateStr ? null : dateStr)}
              className="p-1 md:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all"
            >
               <Plus className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            
            {popoverDate === dateStr && (
                <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 p-1.5 z-20 w-36 flex flex-col gap-1 animate-fade-in">
                    <button onClick={() => handleQuickAdd('Task', dateStr)} className="text-left text-xs px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium transition-colors">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> Задача
                    </button>
                    <button onClick={() => handleQuickAdd('Activity', dateStr)} className="text-left text-xs px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium transition-colors">
                        <Zap className="w-3.5 h-3.5 text-orange-500" /> Действие
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
         <div className="flex items-center gap-3 w-full justify-between md:justify-start">
             
             {/* Date Navigation */}
             <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-1">
                  <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
                  <span className="px-4 font-bold min-w-[120px] md:min-w-[160px] text-center text-sm md:text-base text-gray-900 dark:text-white truncate">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronRight className="w-5 h-5" /></button>
             </div>

             {/* View Controls */}
             <div className="flex items-center gap-2">
                 <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <button onClick={() => setViewMode('MONTH')} className={`p-2 rounded-lg transition-all ${viewMode === 'MONTH' ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`} title="Месяц">
                       <CalendarIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('WEEK')} className={`p-2 rounded-lg transition-all ${viewMode === 'WEEK' ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`} title="Неделя">
                       <LayoutGrid className="w-4 h-4" />
                    </button>
                 </div>

                 {/* Settings Toggle */}
                 <div className="relative">
                    <button 
                       onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                       className={`p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors ${isSettingsOpen ? 'text-primary-600 border-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                    
                    {isSettingsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 p-3 animate-fade-in">
                            <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 px-1">Рабочие дни</h4>
                            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Показывать выходные</span>
                                <input 
                                   type="checkbox" 
                                   checked={showWeekends} 
                                   onChange={(e) => setShowWeekends(e.target.checked)} 
                                   className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </label>
                        </div>
                    )}
                 </div>
             </div>
         </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex-1">
         <div 
            className={`grid flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 pb-24 md:pb-0 ${gridColsClass}`}
         >
             {/* Sticky Headers */}
             {headers.map((day, index) => (
                 <div key={`header-${index}`} className="sticky top-0 z-10 bg-white dark:bg-gray-800 py-2 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shadow-sm border-b border-gray-100 dark:border-gray-700">
                     {day}
                 </div>
             ))}

             {/* Cells */}
             {visibleCells.map(cell => renderCell(cell))}
         </div>
      </div>

      {/* Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Новое действие"
        footer={
           <Button onClick={handleSaveActivity}>Сохранить</Button>
        }
      >
                <form onSubmit={handleSaveActivity} className="space-y-5">
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Тема</label>
                       <input 
                          value={newActivityData.subject || ''} 
                          onChange={e => setNewActivityData({...newActivityData, subject: e.target.value})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 dark:text-white" 
                          autoFocus
                          required
                       />
                   </div>
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Тип</label>
                       <select 
                          value={newActivityData.type || 'Звонок'} 
                          onChange={e => setNewActivityData({...newActivityData, type: e.target.value as any})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 dark:text-white"
                       >
                           <option value="Звонок">Звонок</option>
                           <option value="Встреча">Встреча</option>
                           <option value="Email">Email</option>
                       </select>
                   </div>
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Дата</label>
                       <input 
                          type="date"
                          value={newActivityData.date || ''} 
                          onChange={e => setNewActivityData({...newActivityData, date: e.target.value})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 dark:text-white" 
                          required
                       />
                   </div>
                </form>
      </Modal>
    </div>
  );
};

export default Calendar;
