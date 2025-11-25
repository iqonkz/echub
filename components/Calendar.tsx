
import React, { useState } from 'react';
import { Task, TaskStatus, CrmActivity } from '../types';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Zap, X } from 'lucide-react';

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

  // New Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivityData, setNewActivityData] = useState<Partial<CrmActivity>>({});

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  // Helper: Get Days for Month View
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    return { daysInMonth, startOffset };
  };

  // Helper: Get Days for Week View
  const getWeekDays = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    
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
          // Trigger the task modal
          onEditTask({
              id: '', // Empty ID signals new task
              title: '',
              description: '',
              assignee: 'Админ',
              dueDate: dateStr,
              status: TaskStatus.TODO,
              priority: 'Средний',
              project: 'Общее'
          });
      } else if (type === 'Activity') {
          // Open activity modal
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
              relatedEntityId: '' // Optional or linked later
          };
          onAddActivity(activity);
      }
      setIsActivityModalOpen(false);
  };

  const renderCell = (date: Date, isWeekView = false) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== TaskStatus.DONE);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    return (
      <div key={dateStr} className={`bg-white/50 dark:bg-gray-800/50 p-2 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all group relative backdrop-blur-sm ${isWeekView ? 'min-h-[400px]' : 'min-h-[120px]'}`}>
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

  const renderMonth = () => {
      const { daysInMonth, startOffset } = getMonthDays(currentDate);
      const blanks = Array.from({ length: startOffset }, (_, i) => (
        <div key={`blank-${i}`} className="bg-gray-50/30 dark:bg-gray-900/20 min-h-[120px] border border-gray-100 dark:border-gray-800/50"></div>
      ));
      const days = Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
          return renderCell(d);
      });
      return [...blanks, ...days];
  };

  const renderWeek = () => {
      const days = getWeekDays(currentDate);
      return days.map(d => renderCell(d, true));
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
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
         <div className="grid grid-cols-7 gap-px flex-shrink-0">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="bg-white dark:bg-gray-800 py-3 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {d}
            </div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-px flex-1 overflow-y-auto min-h-0">
             {viewMode === 'MONTH' ? renderMonth() : renderWeek()}
         </div>
      </div>

      {/* Activity Modal */}
      {isActivityModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новое действие</h3>
                    <button onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Тема</label>
                        <input 
                            value={newActivityData.subject || ''}
                            onChange={e => setNewActivityData({...newActivityData, subject: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Тип</label>
                        <select 
                             value={newActivityData.type || 'Звонок'}
                             onChange={e => setNewActivityData({...newActivityData, type: e.target.value as any})}
                             className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                        >
                            <option value="Звонок">Звонок</option>
                            <option value="Встреча">Встреча</option>
                            <option value="Email">Email</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Дата</label>
                        <input 
                             type="date"
                             value={newActivityData.date || ''}
                             onChange={e => setNewActivityData({...newActivityData, date: e.target.value})}
                             className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                        />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all mt-2">Сохранить</button>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default Calendar;
