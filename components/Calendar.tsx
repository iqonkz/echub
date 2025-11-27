
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, CrmActivity } from '../types';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Zap, X, Settings, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
  tasks: Task[];
  onAddTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onAddActivity?: (activity: CrmActivity) => void;
}

type ViewMode = 'MONTH' | 'WEEK';

const Calendar: React.FC<CalendarProps> = ({ tasks, onAddTask, onEditTask, onAddActivity }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [popoverDate, setPopoverDate] = useState<string | null>(null);

  // Working Days State (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Default: Mon(1) to Fri(5)
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivityData, setNewActivityData] = useState<Partial<CrmActivity>>({});

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const dayNamesShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Helper: Get Local Date String (YYYY-MM-DD) to fix "tomorrow" bug
  const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  // Helper: Get Days for Month View
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Adjust logic to start grid on Monday (1) instead of Sunday (0)
    let firstDayOfMonth = new Date(year, month, 1).getDay();
    // Convert Sunday(0) to 7 for easier math if we want Mon-Sun
    // However, JS Date.getDay() is 0=Sun. 
    // Let's standard: Grid always starts Mon (index 0 for our grid logic) -> Sun (index 6)
    // Map JS Day: 0(Sun)->6, 1(Mon)->0, 2(Tue)->1...
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    return { daysInMonth, startOffset };
  };

  // Helper: Get Days for Week View
  const getWeekDays = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay(); // 0-6 (Sun-Sat)
    // Align to Monday start
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
    
    const weekStart = new Date(current.setDate(diff));
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return days;
  };

  const changeDate = (offset: number) => {
    if (viewMode === 'MONTH') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    } else {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
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

  const toggleWorkingDay = (dayIndex: number) => {
      if (workingDays.includes(dayIndex)) {
          // Prevent removing all days
          if (workingDays.length > 1) {
              setWorkingDays(workingDays.filter(d => d !== dayIndex));
          }
      } else {
          setWorkingDays([...workingDays, dayIndex].sort());
      }
  };

  // --- Render Logic ---

  // Generate the days to display based on view mode
  const getVisibleDays = () => {
      if (viewMode === 'MONTH') {
          // Month view always shows Mon-Sun structure (7 cols) for alignment
          const { daysInMonth, startOffset } = getMonthDays(currentDate);
          
          // Blanks before start
          const blanks = Array.from({ length: startOffset }, (_, i) => ({ type: 'blank', key: `blank-${i}` }));
          
          // Actual Days
          const days = Array.from({ length: daysInMonth }, (_, i) => {
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
              return { type: 'day', date: d, key: toLocalISOString(d) };
          });
          
          return [...blanks, ...days];
      } else {
          // Week view: Only show WORKING days
          const allWeekDays = getWeekDays(currentDate);
          return allWeekDays
             .filter(d => workingDays.includes(d.getDay()))
             .map(d => ({ type: 'day', date: d, key: toLocalISOString(d) }));
      }
  };

  const visibleCells = getVisibleDays();

  // Define Columns Logic
  const gridColumnsCount = viewMode === 'MONTH' ? 7 : workingDays.length;

  // Header Labels
  const orderedDayIndices = [1, 2, 3, 4, 5, 6, 0]; 
  
  const visibleHeaderIndices = viewMode === 'MONTH' 
     ? orderedDayIndices 
     : orderedDayIndices.filter(d => workingDays.includes(d));

  const renderCell = (cell: any, isWeekView = false) => {
    if (cell.type === 'blank') {
        return <div key={cell.key} className="bg-gray-50/30 dark:bg-gray-900/20 min-h-[120px] border border-gray-100 dark:border-gray-800/50"></div>;
    }

    const date: Date = cell.date;
    const dateStr = toLocalISOString(date);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== TaskStatus.DONE);
    
    // Correct "Today" check using local strings
    const todayStr = toLocalISOString(new Date());
    const isToday = todayStr === dateStr;

    return (
      <div key={cell.key} className={`bg-white/50 dark:bg-gray-800/50 p-2 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all group relative backdrop-blur-sm ${isWeekView ? 'min-h-[400px]' : 'min-h-[120px]'}`}>
        <div className="flex justify-between items-start mb-2">
           <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
             isToday ? 'bg-primary-500 text-gray-900 shadow-md' : 'text-gray-700 dark:text-gray-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-600'
           }`}>{date.getDate()}</span>
        </div>
        
        <div className="space-y-1.5">
           {dayTasks.map(task => (
             <div 
                key={task.id} 
                onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                className={`text-[10px] px-2 py-1.5 rounded-lg border truncate cursor-pointer font-medium shadow-sm transition-transform hover:-translate-y-0.5 ${
                task.priority === 'Высокий' 
                ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' 
                : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
             }`}>
                {task.title}
             </div>
           ))}
        </div>

        {/* Hover Add Button / Popover */}
        <div className="absolute top-2 right-2">
            <button 
              onClick={() => setPopoverDate(popoverDate === dateStr ? null : dateStr)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all"
            >
               <Plus className="w-4 h-4" />
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
         <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-4">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-1">
                  <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
                  <span className="px-4 font-bold min-w-[160px] text-center text-sm md:text-base text-gray-900 dark:text-white">
                      {viewMode === 'MONTH' 
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` 
                        : `Неделя ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
                      }
                  </span>
                  <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"><ChevronRight className="w-5 h-5" /></button>
                </div>
             </h2>

            {/* Working Days Settings - Modal Trigger */}
             <div className="relative">
                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                 >
                     <Settings className="w-5 h-5" />
                 </button>
             </div>
         </div>

         <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button 
                onClick={() => setViewMode('WEEK')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'WEEK' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
                Неделя
            </button>
            <button 
                onClick={() => setViewMode('MONTH')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'MONTH' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
                Месяц
            </button>
         </div>
      </div>

      <div className="flex flex-col bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex-1">
         <div 
            className="grid gap-px flex-1 overflow-y-auto min-h-0 bg-gray-200 dark:bg-gray-700"
            style={{ gridTemplateColumns: `repeat(${gridColumnsCount}, minmax(0, 1fr))` }}
         >
             {/* Sticky Headers */}
             {visibleHeaderIndices.map(d => (
                 <div key={`header-${d}`} className="sticky top-0 z-10 bg-white dark:bg-gray-800 py-3 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shadow-sm">
                     {dayNamesShort[d]}
                 </div>
             ))}

             {/* Cells */}
             {visibleCells.map(cell => renderCell(cell, viewMode === 'WEEK'))}
         </div>
      </div>

      {/* Settings Modal (Centered Overlay) */}
      {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 dark:border-gray-700 overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5" /> Рабочие дни
                      </h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 space-y-2">
                      {orderedDayIndices.map(dayIndex => (
                         <label key={dayIndex} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{dayNamesShort[dayIndex]}</span>
                             <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${workingDays.includes(dayIndex) ? 'bg-primary-500 border-primary-500 scale-105' : 'border-gray-300 dark:border-gray-600'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={workingDays.includes(dayIndex)}
                                  onChange={() => toggleWorkingDay(dayIndex)}
                                  className="hidden"
                                />
                                {workingDays.includes(dayIndex) && <CheckSquare className="w-4 h-4 text-white" />}
                             </div>
                         </label>
                      ))}
                      <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Закрыть</button>
                  </div>
              </div>
          </div>
      )}

      {/* Activity Modal */}
      {isActivityModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новое действие</h3>
                    <button onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSaveActivity} className="p-6 space-y-5">
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Тема</label>
                       <input 
                          value={newActivityData.subject || ''} 
                          onChange={e => setNewActivityData({...newActivityData, subject: e.target.value})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 dark:text-white" 
                          autoFocus
                          required
                       />
                   </div>
                   <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Тип</label>
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
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Дата</label>
                       <input 
                          type="date"
                          value={newActivityData.date || ''} 
                          onChange={e => setNewActivityData({...newActivityData, date: e.target.value})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 dark:text-white" 
                          required
                       />
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

export default Calendar;
