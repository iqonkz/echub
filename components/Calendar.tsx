
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { ChevronLeft, ChevronRight, Plus, Briefcase, CheckSquare } from 'lucide-react';

interface CalendarProps {
  tasks: Task[];
  onAddTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

type ViewMode = 'MONTH' | 'WEEK';

const Calendar: React.FC<CalendarProps> = ({ tasks, onAddTask, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [popoverDate, setPopoverDate] = useState<string | null>(null);

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

  const handleQuickAdd = (type: 'Task' | 'Meeting', dateStr: string) => {
      setPopoverDate(null);
      if (type === 'Task' && onEditTask) {
          // Trigger the full modal by passing a pseudo-task with the correct date
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
      } else {
          alert(`Создание встречи на ${dateStr} пока не реализовано в демо.`);
      }
  };

  const renderCell = (date: Date, isWeekView = false) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== TaskStatus.DONE);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    return (
      <div key={dateStr} className={`bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group relative ${isWeekView ? 'min-h-[400px]' : 'min-h-[120px]'}`}>
        <div className="flex justify-between items-start">
           <span className={`text-sm font-semibold ${
             isToday ? 'bg-primary-500 text-gray-900 w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-700 dark:text-gray-300'
           }`}>{date.getDate()}</span>
        </div>
        
        <div className="mt-2 space-y-1">
           {dayTasks.map(task => (
             <div 
                key={task.id} 
                onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                className={`text-xs p-1 rounded border truncate cursor-pointer ${
                task.priority === 'Высокий' 
                ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' 
                : 'bg-primary-50 border-primary-200 text-gray-800 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-200'
             }`}>
                {task.title}
             </div>
           ))}
        </div>

        {/* Hover Add Button / Popover */}
        <div className="absolute bottom-2 right-2">
            <button 
              onClick={() => setPopoverDate(popoverDate === dateStr ? null : dateStr)}
              className="p-1 rounded-full bg-primary-500 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
               <Plus className="w-3 h-3" />
            </button>
            
            {popoverDate === dateStr && (
                <div className="absolute bottom-8 right-0 bg-white dark:bg-gray-900 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-2 z-20 w-32 flex flex-col gap-1 animate-fade-in">
                    <button onClick={() => handleQuickAdd('Task', dateStr)} className="text-left text-xs px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <CheckSquare className="w-3 h-3" /> Задача
                    </button>
                    <button onClick={() => handleQuickAdd('Meeting', dateStr)} className="text-left text-xs px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Briefcase className="w-3 h-3" /> Встреча
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
        <div key={`blank-${i}`} className="bg-gray-50 dark:bg-gray-900/50 min-h-[120px] border border-gray-100 dark:border-gray-800"></div>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"><ChevronLeft className="w-5 h-5" /></button>
              <span className="px-4 font-medium min-w-[150px] text-center text-sm md:text-base">
                  {viewMode === 'MONTH' 
                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` 
                    : `Неделя ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
                  }
              </span>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
         </h2>
         <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setViewMode('WEEK')}
                className={`flex-1 md:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors ${viewMode === 'WEEK' ? 'bg-primary-500 text-gray-900 border-primary-500 font-medium' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
                Неделя
            </button>
            <button 
                onClick={() => setViewMode('MONTH')}
                className={`flex-1 md:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors ${viewMode === 'MONTH' ? 'bg-primary-500 text-gray-900 border-primary-500 font-medium' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
                Месяц
            </button>
         </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1">
         {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
           <div key={d} className="bg-gray-50 dark:bg-gray-800 py-2 text-center text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
             {d}
           </div>
         ))}
         {viewMode === 'MONTH' ? renderMonth() : renderWeek()}
      </div>
    </div>
  );
};

export default Calendar;
