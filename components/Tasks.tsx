
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, User, TeamMember, Project } from '../types';
import { Clock, User as UserIcon, Flag, Plus, Trash2, ChevronDown, ChevronRight, Layers, X, Calendar, FolderOpen, ArrowLeft, Pencil, CheckCircle2, Eye, Lock, Globe, Settings2, Users, Check, ArrowUpDown } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  projects: Project[]; 
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  searchQuery: string;
  currentUser?: User;
  openEditTask?: (task: Task) => void;
  team: TeamMember[];
}

type MainTab = 'PROJECTS' | 'TASKS';
type TaskFilterTab = 'ALL' | 'STATUS' | 'MINE';
type ViewMode = 'KANBAN' | 'LIST';
type SortCriteria = 'NAME' | 'COUNT' | 'ACTIVITY';

const PROJECT_COLORS = [
    { id: 'blue', label: 'Синий', class: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { id: 'emerald', label: 'Изумруд', class: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
    { id: 'violet', label: 'Фиолетовый', class: 'bg-gradient-to-br from-violet-500 to-violet-600' },
    { id: 'orange', label: 'Оранжевый', class: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { id: 'red', label: 'Красный', class: 'bg-gradient-to-br from-red-500 to-red-600' },
    { id: 'pink', label: 'Розовый', class: 'bg-gradient-to-br from-pink-500 to-pink-600' },
    { id: 'cyan', label: 'Бирюзовый', class: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
    { id: 'gold', label: 'Золотой', class: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { id: 'teal', label: 'Морской', class: 'bg-gradient-to-br from-teal-500 to-teal-600' },
    { id: 'gray', label: 'Серый', class: 'bg-gradient-to-br from-gray-600 to-gray-700' },
];

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

const Tasks: React.FC<TasksProps> = ({ tasks, projects, onUpdateTaskStatus, onAddTask, onDeleteTask, onAddProject, onUpdateProject, searchQuery, currentUser, openEditTask, team }) => {
  const statusColumns = Object.values(TaskStatus);
  
  const [mainTab, setMainTab] = useState<MainTab>('PROJECTS');
  const [taskFilterTab, setTaskFilterTab] = useState<TaskFilterTab>('ALL');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('NAME');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({});
  
  // Project Form State
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
      name: '',
      access: 'PUBLIC',
      allowedUsers: [],
      color: 'blue'
  });
  
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // --- Access Control Logic ---
  const accessibleProjects = projects.filter(p => {
      if (currentUser?.role === 'ADMIN') return true;
      if (p.access === 'PUBLIC') return true;
      if (p.access === 'PRIVATE' && p.allowedUsers.includes(currentUser?.id || '')) return true;
      if (p.access === 'CUSTOM' && p.allowedUsers.includes(currentUser?.id || '')) return true;
      return false;
  });

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
            matchesContext = t.assignee === currentUser?.name || t.assignee === 'Админ'; // Mock name check
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

  const getProjectGradient = (colorId?: string) => {
      const color = PROJECT_COLORS.find(c => c.id === colorId);
      return color ? color.class : PROJECT_COLORS[0].class;
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
              assignee: currentUser?.name || 'Админ',
              observer: '',
              dueDate: new Date().toISOString().split('T')[0],
              priority: 'Средний',
              title: '',
              description: ''
          });
      }
      setIsModalOpen(true);
  };

  const openProjectSettings = (project: Project) => {
      setProjectForm(project);
      setIsProjectSettingsOpen(true);
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
      if (!projectForm.name?.trim()) return;

      const projectData: Project = {
          id: projectForm.id || `p${Date.now()}`,
          name: projectForm.name,
          access: projectForm.access || 'PUBLIC',
          allowedUsers: projectForm.allowedUsers || [],
          color: projectForm.color || 'blue'
      };

      if (projectForm.id) {
          onUpdateProject(projectData);
      } else {
          onAddProject(projectData);
      }
      
      setProjectForm({ name: '', access: 'PUBLIC', allowedUsers: [], color: 'blue' });
      setIsProjectModalOpen(false);
      setIsProjectSettingsOpen(false);
  };

  const toggleUserAccess = (userId: string) => {
      setProjectForm(prev => {
          const current = prev.allowedUsers || [];
          if (current.includes(userId)) {
              return { ...prev, allowedUsers: current.filter(id => id !== userId) };
          } else {
              return { ...prev, allowedUsers: [...current, userId] };
          }
      });
  };

  // --- Sorting Logic ---
  const getProjectStats = (projectName: string) => {
      const projectTasks = tasks.filter(t => t.project === projectName);
      return {
          count: projectTasks.length,
          // Find latest due date as activity proxy
          lastActivity: projectTasks.length > 0 
              ? projectTasks.reduce((latest, t) => t.dueDate > latest ? t.dueDate : latest, '0000-00-00')
              : '0000-00-00'
      };
  };

  const sortedProjects = [...accessibleProjects].sort((a, b) => {
      if (sortCriteria === 'NAME') {
          return a.name.localeCompare(b.name);
      } else if (sortCriteria === 'COUNT') {
          return getProjectStats(b.name).count - getProjectStats(a.name).count;
      } else if (sortCriteria === 'ACTIVITY') {
          return getProjectStats(b.name).lastActivity.localeCompare(getProjectStats(a.name).lastActivity);
      }
      return 0;
  });

  // --- Renderers ---

  const renderProjectGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {sortedProjects.map((project) => {
        const projectTasks = tasks.filter(t => t.project === project.name);
        const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
        const total = projectTasks.length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
        const gradientClass = getProjectGradient(project.color);
        
        return (
          <div 
            key={project.id}
            onClick={() => setActiveProject(project.name)}
            className={`group relative ${gradientClass} rounded-2xl shadow-sm hover:shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 flex flex-col p-3`}
          >
            {/* Glass effect texture */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                   <div className={`p-1.5 bg-white/20 text-white backdrop-blur-md rounded-lg shadow-sm border border-white/10`}>
                       {project.access === 'PRIVATE' ? <Lock className="w-3.5 h-3.5"/> : <FolderOpen className="w-3.5 h-3.5"/>}
                   </div>
               </div>
               <div className="flex gap-1">
                   <button 
                        onClick={(e) => { e.stopPropagation(); openModal(undefined, undefined, project.name); }}
                        className="p-1 text-white hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        title="Добавить задачу"
                   >
                        <Plus className="w-3.5 h-3.5" />
                   </button>
                   {currentUser?.role === 'ADMIN' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openProjectSettings(project); }}
                        className="p-1 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                      >
                          <Settings2 className="w-3.5 h-3.5" />
                      </button>
                   )}
               </div>
            </div>
            
            <h3 className="relative z-10 text-lg font-extrabold text-white mb-0.5 truncate tracking-tight leading-tight">{project.name}</h3>
            <p className="relative z-10 text-[10px] text-white/70 mb-3 flex items-center gap-1 font-medium">
                Кол-во задач: {total}
            </p>
            
            <div className="relative z-10 mt-auto">
               <div className="flex justify-between text-[9px] font-bold text-white/80 mb-1 uppercase tracking-wider">
                  <span>{progress}%</span>
               </div>
               <div className="w-full bg-black/20 rounded-full h-1 overflow-hidden backdrop-blur-sm">
                  <div className="h-1 bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
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
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-auto flex-1 no-scrollbar pb-32 md:pb-0">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
          <tr>
            <th className="px-6 py-4 w-8"></th>
            <th className="px-6 py-4">Задача</th>
            <th className="px-6 py-4">Проект</th>
            <th className="px-6 py-4">Статус</th>
            <th className="px-6 py-4">Срок</th>
            <th className="px-6 py-4">Приоритет</th>
            <th className="px-6 py-4">Ответственный</th>
            <th className="px-6 py-4 text-right">Действия</th>
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
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {task.title}
                    <div className="text-xs font-normal text-gray-400 truncate max-w-xs mt-0.5">{task.description}</div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{task.project}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect 
                      currentStatus={task.status}
                      onChange={(s) => onUpdateTaskStatus(task.id, s)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                       {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {task.assignee.charAt(0)}
                          </div>
                          {task.assignee}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(undefined, task.id, task.project)} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Добавить подзадачу"><Layers className="w-4 h-4"/></button>
                    <button onClick={() => openModal(task)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                  </td>
               </tr>
               {/* Subtasks in List View */}
               {expandedTasks.has(task.id) && filteredTasks.filter(st => st.parentId === task.id).map(st => (
                  <tr key={st.id} className="bg-gray-50/50 dark:bg-gray-800/30 border-l-4 border-l-primary-500 cursor-pointer" onClick={() => openModal(st)}>
                     <td className="px-4 py-3 text-right"></td>
                     <td className="px-6 py-3 pl-4 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                       <ArrowLeft className="w-3 h-3 rotate-180 text-gray-400" />
                       {st.title}
                     </td>
                     <td className="px-6 py-3"></td> {/* Empty Project column for subtasks */}
                     <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect 
                          currentStatus={st.status}
                          onChange={(s) => onUpdateTaskStatus(st.id, s)}
                        />
                     </td>
                     <td className="px-6 py-3 text-gray-500 text-xs">{new Date(st.dueDate).toLocaleDateString()}</td>
                     <td className="px-6 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityColor(st.priority)}`}>{st.priority}</span></td>
                     <td className="px-6 py-3 text-gray-500 text-xs">{st.assignee}</td>
                     <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

      {/* Mobile List View - Custom Layout */}
      <div className="md:hidden flex-1 overflow-auto p-4 space-y-3">
         {filteredTasks.filter(t => !t.parentId).map(task => (
           <div key={task.id} onClick={() => openModal(task)} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{task.project}</p>
                 </div>
                 {/* Replaced Actions with Due Date for Mobile */}
                 <div className="flex flex-col items-end">
                     <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase mb-1 ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                     <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                     </span>
                 </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                     <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold">
                         {task.assignee.charAt(0)}
                     </div>
                     {task.assignee}
                  </div>
                  <StatusSelect currentStatus={task.status} onChange={(s) => onUpdateTaskStatus(task.id, s)} />
              </div>
           </div>
         ))}
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

  // Button Style Helpers
  const activeBtnStyle = "bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5";
  const inactiveBtnStyle = "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5";

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
               {activeProject ? (
                 <button 
                   onClick={() => setActiveProject(null)}
                   className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:-translate-x-1"
                 >
                   <ArrowLeft className="w-5 h-5" />
                 </button>
               ) : null}
               
               <div className="flex items-center gap-3 w-full justify-between md:justify-start">
                  {/* Left Side: Title or Tabs */}
                  {activeProject ? (
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                        {activeProject}
                      </h2>
                  ) : (
                      <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button onClick={() => setMainTab('PROJECTS')} className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${mainTab === 'PROJECTS' ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}>Проекты</button>
                        <button onClick={() => setMainTab('TASKS')} className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${mainTab === 'TASKS' ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}>Задачи</button>
                      </div>
                  )}
                  
                  {/* Sorting Dropdown */}
                  {!activeProject && mainTab === 'PROJECTS' && (
                      <div className="relative group">
                          <button className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 shadow-sm transition-all h-[42px]">
                              <ArrowUpDown className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">
                                  {sortCriteria === 'NAME' ? 'По имени' : sortCriteria === 'COUNT' ? 'По задачам' : 'По активности'}
                              </span>
                          </button>
                          <div className="absolute left-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 hidden group-hover:block p-1 animate-fade-in">
                              <button onClick={() => setSortCriteria('NAME')} className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between ${sortCriteria === 'NAME' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                  По имени {sortCriteria === 'NAME' && <Check className="w-3 h-3"/>}
                              </button>
                              <button onClick={() => setSortCriteria('COUNT')} className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between ${sortCriteria === 'COUNT' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                  По кол-ву задач {sortCriteria === 'COUNT' && <Check className="w-3 h-3"/>}
                              </button>
                              <button onClick={() => setSortCriteria('ACTIVITY')} className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between ${sortCriteria === 'ACTIVITY' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                  По активности {sortCriteria === 'ACTIVITY' && <Check className="w-3 h-3"/>}
                              </button>
                          </div>
                      </div>
                  )}
               </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {!activeProject && mainTab === 'PROJECTS' && (
                 <button 
                   onClick={() => { setProjectForm({color: 'blue'}); setIsProjectModalOpen(true); }}
                   className={activeBtnStyle}
                 >
                   <Plus className="w-4 h-4" /> Проект
                 </button>
              )}
              <button 
                onClick={() => openModal()}
                className={(mainTab === 'TASKS' || activeProject) ? activeBtnStyle : inactiveBtnStyle}
              >
                <Plus className="w-4 h-4" /> Задача
              </button>
            </div>
         </div>

         {/* Subtabs for Tasks */}
         {(mainTab === 'TASKS' || activeProject) && (
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-4 px-1 overflow-x-auto no-scrollbar">
                <button onClick={() => {setTaskFilterTab('ALL'); setViewMode('LIST')}} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${taskFilterTab === 'ALL' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Все задачи</button>
                <button onClick={() => {setTaskFilterTab('STATUS'); setViewMode('KANBAN')}} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${taskFilterTab === 'STATUS' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>По статусу</button>
                <button onClick={() => {setTaskFilterTab('MINE'); setViewMode('LIST')}} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${taskFilterTab === 'MINE' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Назначено мне</button>
            </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pb-6 min-w-0">
         {mainTab === 'PROJECTS' && !activeProject 
            ? renderProjectGrid() 
            : (viewMode === 'KANBAN' ? renderKanban() : renderList())
         }
      </div>

      {/* New Project Modal */}
      {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Новый проект</h3>
                   <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveProject} className="p-6 flex flex-col gap-5">
                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Название проекта</label>
                       <input 
                          value={projectForm.name || ''} 
                          onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                          placeholder="Например: Строительство А"
                          autoFocus
                          required
                       />
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Цвет обложки</label>
                       <div className="flex flex-wrap gap-2">
                           {PROJECT_COLORS.map(color => (
                               <button
                                  type="button"
                                  key={color.id}
                                  onClick={() => setProjectForm({...projectForm, color: color.id})}
                                  className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-gray-800 transition-all ${projectForm.color === color.id ? 'ring-gray-400 dark:ring-white scale-110' : 'ring-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                               >
                                   {projectForm.color === color.id && <Check className="w-4 h-4 text-white" />}
                               </button>
                           ))}
                       </div>
                   </div>

                   <button type="submit" className="w-full bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">Создать</button>
                </form>
             </div>
          </div>
      )}
      
      {/* Project Settings Modal */}
      {isProjectSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       <Settings2 className="w-5 h-5" /> Настройки проекта
                   </h3>
                   <button onClick={() => setIsProjectSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveProject} className="p-6 space-y-6">
                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Название</label>
                       <input 
                          value={projectForm.name || ''} 
                          onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all"
                       />
                   </div>

                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Цвет обложки</label>
                       <div className="flex flex-wrap gap-2">
                           {PROJECT_COLORS.map(color => (
                               <button
                                  type="button"
                                  key={color.id}
                                  onClick={() => setProjectForm({...projectForm, color: color.id})}
                                  className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-gray-800 transition-all ${projectForm.color === color.id ? 'ring-gray-400 dark:ring-white scale-110' : 'ring-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                               >
                                   {projectForm.color === color.id && <Check className="w-4 h-4 text-white" />}
                               </button>
                           ))}
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Доступ</label>
                       <div className="grid grid-cols-2 gap-3">
                           <button 
                             type="button"
                             onClick={() => setProjectForm({...projectForm, access: 'PUBLIC'})}
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${projectForm.access === 'PUBLIC' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'}`}
                           >
                               <Globe className="w-5 h-5" />
                               <span className="text-xs font-bold">Публичный</span>
                           </button>
                           <button 
                             type="button"
                             onClick={() => setProjectForm({...projectForm, access: 'PRIVATE'})}
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${projectForm.access === 'PRIVATE' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'}`}
                           >
                               <Lock className="w-5 h-5" />
                               <span className="text-xs font-bold">Приватный</span>
                           </button>
                       </div>
                   </div>
                   
                   {projectForm.access === 'PRIVATE' && (
                       <div>
                           <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Кому доступен</label>
                           <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                               {team.map(member => (
                                   <div key={member.id} onClick={() => toggleUserAccess(member.id)} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                       <div className="flex items-center gap-2">
                                           <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{member.name.charAt(0)}</div>
                                           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{member.name}</span>
                                       </div>
                                       <div className={`w-5 h-5 rounded border flex items-center justify-center ${projectForm.allowedUsers?.includes(member.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                           {projectForm.allowedUsers?.includes(member.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" onClick={() => setIsProjectSettingsOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Отмена</button>
                        <button type="submit" className="px-5 py-2 bg-primary-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">Сохранить</button>
                   </div>
                </form>
             </div>
          </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-[5px] rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700 overflow-hidden">
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
                    <select 
                        className="w-full pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white appearance-none cursor-pointer" 
                        value={newTaskData.project || ''} 
                        onChange={e => setNewTaskData({...newTaskData, project: e.target.value})} 
                    >
                        {accessibleProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
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
