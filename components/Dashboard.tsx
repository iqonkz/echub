import React from 'react';
import { Task, Deal, DealStage, TaskStatus, ModuleType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, AlertCircle, Flame, FolderKanban, Briefcase, Calendar, FileText } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  deals: Deal[];
  onNavigate: (module: ModuleType) => void;
}

const COLORS = ['#eab308', '#22c55e', '#f59e0b', '#ef4444']; 

const Dashboard: React.FC<DashboardProps> = ({ tasks, deals, onNavigate }) => {
  // Calculate metrics
  const totalRevenue = deals.reduce((acc, deal) => deal.stage === DealStage.WON ? acc + deal.value : acc, 0);
  const potentialRevenue = deals.reduce((acc, deal) => deal.stage !== DealStage.WON ? acc + deal.value : acc, 0);
  const pendingTasks = tasks.filter(t => t.status !== TaskStatus.DONE).length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  
  // New Logic: Overdue & Important
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE);
  const importantTasks = tasks.filter(t => t.priority === 'Высокий' && t.status !== TaskStatus.DONE);

  // Chart Data Preparation
  const dealStageData = Object.values(DealStage).map(stage => ({
    name: stage,
    value: deals.filter(d => d.stage === stage).length
  }));

  const taskStatusData = Object.values(TaskStatus).map(status => ({
    name: status,
    value: tasks.filter(t => t.status === status).length
  }));

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
    </div>
  );

  const QuickNavButton = ({ label, icon: Icon, module }: any) => (
      <button 
        onClick={() => onNavigate(module)}
        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group"
      >
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-2 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
             <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{label}</span>
      </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Главная</h2>
        <span className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <QuickNavButton label="Задачи" icon={FolderKanban} module={ModuleType.PROJECTS} />
         <QuickNavButton label="CRM" icon={Briefcase} module={ModuleType.CRM} />
         <QuickNavButton label="Календарь" icon={Calendar} module={ModuleType.CALENDAR} />
         <QuickNavButton label="Документы" icon={FileText} module={ModuleType.DOCUMENTS} />
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 my-2"></div>
      
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Обзор компании</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Закрытая выручка" 
          value={`₸${(totalRevenue / 1000000).toFixed(1)}М`} 
          icon={DollarSign} 
          color="bg-green-600" 
          subtext="+12% к прошлому месяцу"
        />
        <StatCard 
          title="В воронке" 
          value={`₸${(potentialRevenue / 1000000).toFixed(1)}М`} 
          icon={Clock} 
          color="bg-yellow-600" 
          subtext={`${deals.length} активных сделок`}
        />
        <StatCard 
          title="Задачи в работе" 
          value={pendingTasks} 
          icon={AlertCircle} 
          color="bg-orange-500" 
          subtext={`${importantTasks.length} важных`}
        />
        <StatCard 
          title="Завершено задач" 
          value={completedTasks} 
          icon={CheckCircle} 
          color="bg-purple-500" 
          subtext="В этом месяце"
        />
      </div>

      {/* Critical Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            Горящие задачи (Просрочено)
          </h3>
          {overdueTasks.length > 0 ? (
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Срок: {task.dueDate}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {task.assignee}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Нет просроченных задач! Отличная работа.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Важные задачи
          </h3>
          <div className="space-y-3">
             {importantTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{task.project}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {task.status}
                  </span>
                </div>
             ))}
             {importantTasks.length === 0 && <p className="text-gray-500 text-sm">Нет задач с высоким приоритетом.</p>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Pipeline */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Воронка продаж</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} interval={0} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Статус задач</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;