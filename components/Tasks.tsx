import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, User } from '../types';
import { Clock, User as UserIcon, Flag, Plus, Trash2, ChevronDown, ChevronRight, Layers, X, Calendar, FolderOpen, ArrowLeft, Pencil } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  projects: string[]; 
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddProject: (name: string) => void;
  searchQuery: string;
  currentUser?: User;
  openEditTask?: (task: Task) => void; 
}

type MainTab = 'PROJECTS' | 'TASKS';
type TaskFilterTab = 'ALL' | 'STATUS' | 'MINE';
type ViewMode = 'KANBAN' | 'LIST';

// --- Custom Status Dropdown Component ---
const StatusSelect = ({ currentStatus, onChange }: { currentStatus: TaskStatus, onChange: (s: TaskStatus) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: any) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusColors = {
      [TaskStatus.TODO]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      [TaskStatus.REVIEW]: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      [TaskStatus.DONE]: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };

    const dotColors = {
      [TaskStatus.TODO]: 'bg-gray-400',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-500',
      [TaskStatus.REVIEW]: 'bg-purple-500',
      [TaskStatus.DONE]: 'bg-green-500',
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm ${statusColors[currentStatus]}`}
        >
          <span className={`w-2 h-2 rounded-full ${dotColors[currentStatus]}`} />
          {currentStatus}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
            {Object.values(TaskStatus).map((status) => (
              <div
                key={status}
                onClick={(e) => { e.stopPropagation(); onChange(status); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0
                  ${status === currentStatus 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                 <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
                 {status}
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

const Tasks: React.FC<TasksProps> = ({ tasks, projects, onUpdateTaskStatus, onAddTask, onDeleteTask, onAddProject, searchQuery, currentUser, openEditTask }) => {
  const statusColumns = Object.values(TaskStatus);
  
  const [mainTab, setMainTab] = useState<MainTab>('PROJECTS');
  const [taskFilterTab, setTaskFilterTab] = useState<TaskFilterTab>('ALL');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});
  const [newProjectName, setNewProjectName] = useState('');
  
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // --- Filtering Logic ---
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesContext = true;

    if (activeProject) {
        matchesContext = t.project === activeProject;
    } else if (mainTab === 'TASKS') {
        if (taskFilterTab === 'MINE') {
            matchesContext = t.assignee === 'Админ'; 
        }
    }

    return matchesSearch && matchesContext;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Высокий': return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-200';
      case 'Средний': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-200';
      case 'Низкий': return 'text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-200';
      default: return 'text-gray-500';
    }
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) newExpanded.delete(taskId);
    else newExpanded.add(taskId);
    setExpandedTasks(newExpanded);
  };

  const openModal = (taskToEdit?: Task, parentId?: string, project?: string) => {
      if (taskToEdit) {
          setEditingTask(taskToEdit);
          setNewTaskData(taskToEdit);
      } else {
          setEditingTask(null);
          setNewTaskData({
              parentId,
              project: project || activeProject || 'Общее',
              assignee: 'Админ',
              observer: '',
              dueDate: new Date().toISOString().split('T')[0],
              priority: 'Средний',
              title: '',
              description: ''
          });
      }
      setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: editingTask ? editingTask.id : `t${Date.now()}`,
      title: newTaskData.title || 'Новая задача',
      description: newTaskData.description || '',
      assignee: newTaskData.assignee || 'Админ',
      observer: newTaskData.observer,
      dueDate: newTaskData.dueDate || new Date().toISOString().split('T')[0],
      status: editingTask ? editingTask.status : TaskStatus.TODO,
      priority: (newTaskData.priority as Task['priority']) || 'Средний',
      project: newTaskData.project || 'Общее',
      parentId: newTaskData.parentId
    };

    if (editingTask) {
        onDeleteTask(task.id);
        onAddTask(task);
    } else {
        onAddTask(task);
    }

    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskData({});
  };

  const handleSaveProject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProjectName.trim()) return;
      onAddProject(newProjectName);
      setNewProjectName('');
      setIsProjectModalOpen(false);
  };

  // --- Renderers ---

  const renderProjectGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projects.map(project => {
        const projectTasks = tasks.filter(t => t.project === project);
        const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
        const total = projectTasks.length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return (
          <div 
            key={project}
            onClick={() => setActiveProject(project)}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                 <FolderOpen className="w-8 h-8" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {total} задач
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate">{project}</h3>
            
            <div className="mt-4">
               <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Прогресс</span>
                  <span>{progress}%</span>
               </div>
               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
             
            <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button 
                    onClick={(e) => { e.stopPropagation(); openModal(undefined, undefined, project); }}
                    className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Добавить задачу
                </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderKanban = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full no-scrollbar">
        {statusColumns.map((status) => (
          <div 
            key={status} 
            className="flex-none w-80 flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-full transition-colors"
          >
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center justify-between sticky top-0 bg-inherit z-10">
              {status}
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                {filteredTasks.filter(t => t.status === status && !t.parentId).length}
              </span>
            </h3>
            <div className="space-y-3 overflow-y-auto min-h-0 flex-1 pr-2">
              {filteredTasks.filter(t => t.status === status && !t.parentId).map(task => (
                 <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );

  const renderList = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="overflow-auto flex-1 no-scrollbar pb-32 md:pb-0">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
          <tr>
            <th className="px-4 md:px-6 py-3 w-8"></th>
            <th className="px-4 md:px-6 py-3">Задача</th>
            <th className="px-4 md:px-6 py-3">Статус</th>
            <th className="hidden md:table-cell px-6 py-3">Срок</th>
            <th className="hidden md:table-cell px-6 py-3">Приоритет</th>
            <th className="hidden md:table-cell px-6 py-3">Ответственный</th>
            <th className="px-4 md:px-6 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.filter(t => !t.parentId).map(task => (
             <React.Fragment key={task.id}>
               <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group" onClick={() => openModal(task)}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                     {filteredTasks.some(t => t.parentId === task.id) && (
                        <button onClick={() => toggleExpand(task.id)} className="text-gray-400 hover:text-primary-500">
                          {expandedTasks.has(task.id) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                        </button>
                     )}
                  </td>
                  <td className="px-4 md:px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {task.title}
                    <div className="text-xs text-gray-400 truncate max-w-xs hidden md:block">{task.description}</div>
                  </td>
                  <td className="px-4 md:px-6 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect 
                      currentStatus={task.status}
                      onChange={(s) => onUpdateTaskStatus(task.id, s)}
                    />
                  </td>
                  <td className="hidden md:table-cell px-6 py-3">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td className="hidden md:table-cell px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(task.priority)}`}>
                       {task.priority}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-3">{task.assignee}</td>
                  <td className="px-4 md:px-6 py-3 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(task, undefined, task.project)} className="text-gray-400 hover:text-green-500 hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity" title="Добавить подзадачу"><Layers className="w-4 h-4"/></button>
                    <button onClick={() => openModal(task)} className="text-gray-400 hover:text-primary-500"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => onDeleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </td>
               </tr>
               {/* Subtasks in List View */}
               {expandedTasks.has(task.id) && filteredTasks.filter(st => st.parentId === task.id).map(st => (
                  <tr key={st.id} className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700 cursor-pointer" onClick={() => openModal(st)}>
                     <td className="px-4 py-3 text-right"><div className="border-l-2 border-gray-300 h-full ml-auto mr-2"></div></td>
                     <td className="px-4 md:px-6 py-3 pl-10 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">Подзадача</span>
                       {st.title}
                     </td>
                     <td className="px-4 md:px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect 
                          currentStatus={st.status}
                          onChange={(s) => onUpdateTaskStatus(st.id, s)}
                        />
                     </td>
                     <td className="hidden md:table-cell px-6 py-3 text-gray-500">{new Date(st.dueDate).toLocaleDateString()}</td>
                     <td className="hidden md:table-cell px-6 py-3"><span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(st.priority)}`}>{st.priority}</span></td>
                     <td className="hidden md:table-cell px-6 py-3 text-gray-500">{st.assignee}</td>
                     <td className="px-4 md:px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openModal(st)} className="text-gray-400 hover:text-primary-500"><Pencil className="w-4 h-4"/></button>
                        <button onClick={() => onDeleteTask(st.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                     </td>
                  </tr>
               ))}
             </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );

  // Helper for Kanban Card
  const TaskCard: React.FC<{ task: Task; isSubtask?: boolean; }> = ({ task, isSubtask = false }) => {
    const subtasks = filteredTasks.filter(t => t.parentId === task.id);
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);

    return (
      <div 
        className={`${isSubtask ? 'ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3 mt-2' : ''}`}
      >
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all group`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               {hasSubtasks && (
                 <button onClick={() => toggleExpand(task.id)} className="text-gray-500 hover:text-primary-600">
                   {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                 </button>
               )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <h4 
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 cursor-pointer hover:text-primary-500" 
            onClick={() => openModal(task)}
          >
              {task.title}
          </h4>
          
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <UserIcon className="w-3 h-3" />
              {task.assignee}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <div className="flex gap-1">
                 <button onClick={() => openModal(task)} className="text-gray-400 hover:text-primary-600" title="Редактировать">
                    <Pencil className="w-4 h-4" />
                 </button>
                 <button onClick={() => onDeleteTask(task.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                 </button>
             </div>
             <div className="flex gap-2">
              {task.status !== TaskStatus.DONE && (
                <button 
                  onClick={() => {
                     const idx = statusColumns.indexOf(task.status);
                     onUpdateTaskStatus(task.id, statusColumns[idx + 1]);
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  &gt;
                </button>
              )}
             </div>
          </div>
        </div>
        {hasSubtasks && isExpanded && (
          <div className="mt-2 space-y-2">
            {subtasks.map(st => <TaskCard key={st.id} task={st} isSubtask={true} />)}
          </div>
        )}
      </div>
    );
  };

  if (openEditTask) {
      (window as any).triggerTaskEdit = openModal;
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-4">
               {activeProject ? (
                 <button 
                   onClick={() => setActiveProject(null)}
                   className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                 >
                   <ArrowLeft className="w-5 h-5" />
                 </button>
               ) : null}
               
               <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     {activeProject ? activeProject : (mainTab === 'PROJECTS' ? 'Проекты' : 'Задачи')}
                  </h2>
               </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                 <button onClick={() => setMainTab('PROJECTS')} className={`px-4 py-2 text-sm rounded ${mainTab === 'PROJECTS' ? 'bg-white dark:bg-gray-700 shadow font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Проекты</button>
                 <button onClick={() => setMainTab('TASKS')} className={`px-4 py-2 text-sm rounded ${mainTab === 'TASKS' ? 'bg-white dark:bg-gray-700 shadow font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Задачи</button>
              </div>
              
              {!activeProject && mainTab === 'PROJECTS' && (
                 <button 
                   onClick={() => setIsProjectModalOpen(true)}
                   className="bg-primary-500 hover:bg-primary-400 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                 >
                   <Plus className="w-4 h-4" /> Добавить проект
                 </button>
              )}
              <button 
                onClick={() => openModal()}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Добавить задачу
              </button>
            </div>
         </div>

         {/* Subtabs for Tasks */}
         {mainTab === 'TASKS' && (
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => {setTaskFilterTab('ALL'); setViewMode('LIST')}} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${taskFilterTab === 'ALL' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Все задачи</button>
                <button onClick={() => {setTaskFilterTab('STATUS'); setViewMode('KANBAN')}} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${taskFilterTab === 'STATUS' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>По статусу</button>
                <button onClick={() => {setTaskFilterTab('MINE'); setViewMode('LIST')}} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${taskFilterTab === 'MINE' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Назначено мне</button>
            </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pb-6 min-w-0">
         {mainTab === 'PROJECTS' && !activeProject 
            ? renderProjectGrid() 
            : (viewMode === 'KANBAN' ? renderKanban() : renderList())
         }
      </div>

      {/* Project Modal */}
      {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новый проект</h3>
                   <button onClick={() => setIsProjectModalOpen(false)}><X className="text-gray-500" /></button>
                </div>
                <form onSubmit={handleSaveProject} className="p-6 flex flex-col gap-4">
                   <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Название проекта</label>
                       <input 
                          value={newProjectName} 
                          onChange={e => setNewProjectName(e.target.value)} 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white"
                          placeholder="Например: Строительство А"
                          autoFocus
                          required
                       />
                   </div>
                   <button type="submit" className="w-full bg-primary-500 text-gray-900 font-bold py-2 rounded-lg hover:bg-primary-400">Создать</button>
                </form>
             </div>
          </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                   {editingTask ? 'Редактирование задачи' : (newTaskData.parentId ? 'Новая подзадача' : 'Новая задача')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 flex flex-col gap-4">
              <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Заголовок <span className="text-red-500">*</span></label>
                  <input 
                    placeholder="Введите название задачи" 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" 
                    value={newTaskData.title || ''} 
                    onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} 
                    autoFocus
                    required 
                  />
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Описание</label>
                  <textarea 
                    placeholder="Добавьте детали..." 
                    rows={3}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-gray-900 dark:text-white" 
                    value={newTaskData.description || ''} 
                    onChange={e => setNewTaskData({...newTaskData, description: e.target.value})} 
                  />
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Проект (или 'Общее')</label>
                  <input 
                    type="text" 
                    list="project-list"
                    placeholder="Например: Офис А, Стройка Б" 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" 
                    value={newTaskData.project || ''} 
                    onChange={e => setNewTaskData({...newTaskData, project: e.target.value})} 
                  />
                  <datalist id="project-list">
                     {projects.map(p => <option key={p} value={p} />)}
                  </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Исполнитель</label>
                      <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                          <input 
                            type="text" 
                            className="w-full pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" 
                            value={newTaskData.assignee || ''} 
                            onChange={e => setNewTaskData({...newTaskData, assignee: e.target.value})} 
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Наблюдатель</label>
                      <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/> 
                          {/* Note: Used Calendar icon for Observer temporarily or Eye */}
                          <input 
                            type="text" 
                            className="w-full pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" 
                            value={newTaskData.observer || ''} 
                            onChange={e => setNewTaskData({...newTaskData, observer: e.target.value})} 
                          />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Приоритет</label>
                    <div className="relative">
                        <Flag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <select 
                            className="w-full pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none text-gray-900 dark:text-white" 
                            value={newTaskData.priority}
                            onChange={e => setNewTaskData({...newTaskData, priority: e.target.value as Task['priority']})}
                        >
                            <option value="Средний">Средний</option>
                            <option value="Высокий">Высокий</option>
                            <option value="Низкий">Низкий</option>
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Крайний срок</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            type="date" 
                            className="w-full pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white" 
                            value={newTaskData.dueDate || ''} 
                            onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})} 
                        />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Отмена</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary-500 text-gray-900 rounded-lg hover:bg-primary-400 transition-colors shadow-sm">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;