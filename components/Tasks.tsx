
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, User, TeamMember } from '../types';
import { Clock, User as UserIcon, Flag, Plus, Trash2, ChevronDown, ChevronRight, Layers, X, Calendar, FolderOpen, ArrowLeft, Pencil, CheckCircle2, Eye } from 'lucide-react';

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
  team: TeamMember[];
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
      [TaskStatus.TODO]: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      [TaskStatus.REVIEW]: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      [TaskStatus.DONE]: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm hover:shadow-md ${statusColors[currentStatus]}`}
        >
          <span className={`w-2 h-2 rounded-full shadow-sm ${dotColors[currentStatus]}`} />
          {currentStatus}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in ring-1 ring-black/5">
            {Object.values(TaskStatus).map((status) => (
              <div
                key={status}
                onClick={(e) => { e.stopPropagation(); onChange(status); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0
                  ${status === currentStatus 
                    ? 'bg-gray-50 dark:bg-gray-700 font-bold text-gray-900 dark:text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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

const Tasks: React.FC<TasksProps> = ({ tasks, projects, onUpdateTaskStatus, onAddTask, onDeleteTask, onAddProject, searchQuery, currentUser, openEditTask, team }) => {
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
      case 'Высокий': return 'text-red-600 bg-red-100 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-900/50';
      case 'Средний': return 'text-yellow-600 bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-900/50';
      case 'Низкий': return 'text-green-600 bg-green-100 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-900/50';
      default: return 'text-gray-500 border border-gray-200';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, idx) => {
        const projectTasks = tasks.filter(t => t.project === project);
        const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
        const total = projectTasks.length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        // Generate a deterministic gradient for the project based on its name length/index
        const gradients = [
            'from-blue-500 to-indigo-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-amber-600',
            'from-pink-500 to-rose-600',
            'from-violet-500 to-purple-600'
        ];
        const gradient = gradients[idx % gradients.length];

        return (
          <div 
            key={project}
            onClick={() => setActiveProject(project)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${gradient}`}></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                     <FolderOpen className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                             U{i}
                          </div>
                      ))}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{project}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{total} задач · {completed} завершено</p>
                
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span>Прогресс</span>
                      <span>{progress}%</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${gradient}`} style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
                 
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); openModal(undefined, undefined, project); }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg"
                    >
                        <Plus className="w-3.5 h-3.5" /> Добавить задачу
                    </button>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderKanban = () => (
    <div className="flex gap-6 overflow-x-auto pb-6 h-full px-1">
        {statusColumns.map((status) => (
          <div 
            key={status} 
            className="flex-none w-80 flex flex-col bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 h-full transition-colors backdrop-blur-sm"
          >
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-0 flex items-center justify-between sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 z-10 p-4 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
              {status}
              <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full shadow-sm font-bold border border-gray-100 dark:border-gray-600">
                {filteredTasks.filter(t => t.status === status && !t.parentId).length}
              </span>
            </h3>
            <div className="p-4 space-y-3 overflow-y-auto min-h-0 flex-1">
              {filteredTasks.filter(t => t.status === status && !t.parentId).map(task => (
                 <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );

  const renderList = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="overflow-auto flex-1 no-scrollbar pb-32 md:pb-0">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
          <tr>
            <th className="px-4 md:px-6 py-4 w-8"></th>
            <th className="px-4 md:px-6 py-4">Задача</th>
            <th className="px-4 md:px-6 py-4">Статус</th>
            <th className="hidden md:table-cell px-6 py-4">Срок</th>
            <th className="hidden md:table-cell px-6 py-4">Приоритет</th>
            <th className="hidden md:table-cell px-6 py-4">Ответственный</th>
            <th className="px-4 md:px-6 py-4 text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredTasks.filter(t => !t.parentId).map(task => (
             <React.Fragment key={task.id}>
               <tr className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group" onClick={() => openModal(task)}>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                     {filteredTasks.some(t => t.parentId === task.id) && (
                        <button onClick={() => toggleExpand(task.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-primary-500 transition-colors">
                          {expandedTasks.has(task.id) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                        </button>
                     )}
                  </td>
                  <td className="px-4 md:px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {task.title}
                    <div className="text-xs font-normal text-gray-400 truncate max-w-xs hidden md:block mt-0.5">{task.description}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect 
                      currentStatus={task.status}
                      onChange={(s) => onUpdateTaskStatus(task.id, s)}
                    />
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 font-medium">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                       {task.priority}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {task.assignee.charAt(0)}
                          </div>
                          {task.assignee}
                      </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(task, undefined, task.project)} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg hidden md:inline-block opacity-0 group-hover:opacity-100 transition-all" title="Добавить подзадачу"><Layers className="w-4 h-4"/></button>
                    <button onClick={() => openModal(task)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                  </td>
               </tr>
               {/* Subtasks in List View */}
               {expandedTasks.has(task.id) && filteredTasks.filter(st => st.parentId === task.id).map(st => (
                  <tr key={st.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-l-4 border-l-primary-500 cursor-pointer" onClick={() => openModal(st)}>
                     <td className="px-4 py-3 text-right"></td>
                     <td className="px-4 md:px-6 py-3 pl-4 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       <ArrowLeft className="w-3 h-3 rotate-180 text-gray-400" />
                       {st.title}
                     </td>
                     <td className="px-4 md:px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect 
                          currentStatus={st.status}
                          onChange={(s) => onUpdateTaskStatus(st.id, s)}
                        />
                     </td>
                     <td className="hidden md:table-cell px-6 py-3 text-gray-500 text-xs">{new Date(st.dueDate).toLocaleDateString()}</td>
                     <td className="hidden md:table-cell px-6 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityColor(st.priority)}`}>{st.priority}</span></td>
                     <td className="hidden md:table-cell px-6 py-3 text-gray-500 text-xs">{st.assignee}</td>
                     <td className="px-4 md:px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openModal(st)} className="text-gray-400 hover:text-primary-500 mr-2"><Pencil className="w-3 h-3"/></button>
                        <button onClick={() => onDeleteTask(st.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
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
        className={`${isSubtask ? 'ml-4 pl-2 mt-2 border-l-2 border-gray-200 dark:border-gray-600' : ''}`}
      >
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5`}>
          {/* Priority Indicator Line */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'Высокий' ? 'bg-red-500' : task.priority === 'Средний' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          
          <div className="pl-2">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1">
                    {task.status === TaskStatus.DONE && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                {hasSubtasks && (
                    <button onClick={(e) => {e.stopPropagation(); toggleExpand(task.id)}} className="text-gray-400 hover:text-primary-600 p-1 hover:bg-gray-100 rounded">
                    {isExpanded ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                    </button>
                )}
            </div>
            
            <h4 
                className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 leading-snug hover:text-primary-600 transition-colors" 
                onClick={() => openModal(task)}
            >
                {task.title}
            </h4>
            
            <div className="flex items-center justify-between mt-3">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500">
                        {task.assignee.charAt(0)}
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                </div>
            </div>

            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => {e.stopPropagation(); openModal(task);}} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 hover:text-primary-600">
                    <Pencil className="w-3 h-3" />
                </button>
                <button onClick={(e) => {e.stopPropagation(); onDeleteTask(task.id);}} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                </button>
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
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
               {activeProject ? (
                 <button 
                   onClick={() => setActiveProject(null)}
                   className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:-translate-x-1"
                 >
                   <ArrowLeft className="w-5 h-5" />
                 </button>
               ) : null}
               
               <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                     {activeProject ? activeProject : (mainTab === 'PROJECTS' ? 'Проекты' : 'Задачи')}
                  </h2>
               </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                 <button onClick={() => setMainTab('PROJECTS')} className={`px-4 py-2 text-sm rounded-lg transition-all ${mainTab === 'PROJECTS' ? 'bg-white dark:bg-gray-700 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500 font-medium hover:text-gray-700'}`}>Проекты</button>
                 <button onClick={() => setMainTab('TASKS')} className={`px-4 py-2 text-sm rounded-lg transition-all ${mainTab === 'TASKS' ? 'bg-white dark:bg-gray-700 shadow-sm font-bold text-gray-900 dark:text-white' : 'text-gray-500 font-medium hover:text-gray-700'}`}>Задачи</button>
              </div>
              
              {!activeProject && mainTab === 'PROJECTS' && (
                 <button 
                   onClick={() => setIsProjectModalOpen(true)}
                   className="bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5"
                 >
                   <Plus className="w-4 h-4" /> Добавить проект
                 </button>
              )}
              <button 
                onClick={() => openModal()}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Добавить задачу
              </button>
            </div>
         </div>

         {/* Subtabs for Tasks */}
         {mainTab === 'TASKS' && (
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-4 px-1">
                <button onClick={() => {setTaskFilterTab('ALL'); setViewMode('LIST')}} className={`pb-3 text-sm font-bold border-b-2 transition-all ${taskFilterTab === 'ALL' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Все задачи</button>
                <button onClick={() => {setTaskFilterTab('STATUS'); setViewMode('KANBAN')}} className={`pb-3 text-sm font-bold border-b-2 transition-all ${taskFilterTab === 'STATUS' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>По статусу</button>
                <button onClick={() => {setTaskFilterTab('MINE'); setViewMode('LIST')}} className={`pb-3 text-sm font-bold border-b-2 transition-all ${taskFilterTab === 'MINE' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Назначено мне</button>
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новый проект</h3>
                   <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveProject} className="p-6 flex flex-col gap-5">
                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Название проекта</label>
                       <input 
                          value={newProjectName} 
                          onChange={e => setNewProjectName(e.target.value)} 
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                          placeholder="Например: Строительство А"
                          autoFocus
                          required
                       />
                   </div>
                   <button type="submit" className="w-full bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">Создать</button>
                </form>
             </div>
          </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                   {editingTask ? 'Редактирование задачи' : (newTaskData.parentId ? 'Новая подзадача' : 'Новая задача')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 flex flex-col gap-5">
              <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Заголовок <span className="text-red-500">*</span></label>
                  <input 
                    placeholder="Введите название задачи" 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white" 
                    value={newTaskData.title || ''} 
                    onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} 
                    autoFocus
                    required 
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Описание</label>
                  <textarea 
                    placeholder="Добавьте детали..." 
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none text-gray-900 dark:text-white" 
                    value={newTaskData.description || ''} 
                    onChange={e => setNewTaskData({...newTaskData, description: e.target.value})} 
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Проект</label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                    <input 
                        type="text" 
                        list="project-list"
                        placeholder="Например: Офис А, Стройка Б" 
                        className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white" 
                        value={newTaskData.project || ''} 
                        onChange={e => setNewTaskData({...newTaskData, project: e.target.value})} 
                    />
                  </div>
                  <datalist id="project-list">
                     {projects.map(p => <option key={p} value={p} />)}
                  </datalist>
              </div>

              <div className="grid grid-cols-2 gap-5">
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Исполнитель</label>
                      <div className="relative">
                          <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                          <select
                            className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white appearance-none cursor-pointer" 
                            value={newTaskData.assignee || ''} 
                            onChange={e => setNewTaskData({...newTaskData, assignee: e.target.value})} 
                          >
                            <option value="">Выберите...</option>
                            {team.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                            ))}
                            {/* Fallback if current assignee is not in team list */}
                            {newTaskData.assignee && !team.some(m => m.name === newTaskData.assignee) && (
                                <option value={newTaskData.assignee}>{newTaskData.assignee}</option>
                            )}
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Наблюдатель</label>
                      <div className="relative">
                          <Eye className="absolute left-3 top-3 w-4 h-4 text-gray-400"/> 
                          <select
                            className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white appearance-none cursor-pointer" 
                            value={newTaskData.observer || ''} 
                            onChange={e => setNewTaskData({...newTaskData, observer: e.target.value})} 
                          >
                            <option value="">Выберите...</option>
                            {team.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                            ))}
                             {/* Fallback if current observer is not in team list */}
                             {newTaskData.observer && !team.some(m => m.name === newTaskData.observer) && (
                                <option value={newTaskData.observer}>{newTaskData.observer}</option>
                            )}
                          </select>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Приоритет</label>
                    <div className="relative">
                        <Flag className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                        <select 
                            className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none text-gray-900 dark:text-white cursor-pointer" 
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
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Крайний срок</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                        <input 
                            type="date" 
                            className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white" 
                            value={newTaskData.dueDate || ''} 
                            onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})} 
                        />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Отмена</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
