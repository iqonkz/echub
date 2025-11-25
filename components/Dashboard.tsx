
import React from 'react';
import { Task, Deal, DealStage, TaskStatus, ModuleType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, AlertCircle, Flame, FolderKanban } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-gray-200 dark:shadow-none group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
         <span className="text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md font-bold text-[10px]">{subtext.includes('+') ? '▲' : '●'}</span>
         {subtext}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Обзор</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Сводка ключевых показателей компании</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hidden md:block">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Закрытая выручка" 
          value={`₸${(totalRevenue / 1000000).toFixed(1)}М`} 
          icon={DollarSign} 
          color="bg-gradient-to-br from-green-500 to-green-600" 
          subtext="+12% к прошлому месяцу"
        />
        <StatCard 
          title="В воронке" 
          value={`₸${(potentialRevenue / 1000000).toFixed(1)}М`} 
          icon={Clock} 
          color="bg-gradient-to-br from-yellow-500 to-yellow-600" 
          subtext={`${deals.length} активных сделок`}
        />
        <StatCard 
          title="Задачи в работе" 
          value={pendingTasks} 
          icon={AlertCircle} 
          color="bg-gradient-to-br from-orange-500 to-orange-600" 
          subtext={`${importantTasks.length} важных`}
        />
        <StatCard 
          title="Завершено задач" 
          value={completedTasks} 
          icon={CheckCircle} 
          color="bg-gradient-to-br from-purple-500 to-purple-600" 
          subtext="В этом месяце"
        />
      </div>

      {/* Critical Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <Flame className="w-5 h-5 text-red-500" />
            </div>
            Горящие задачи
          </h3>
          {overdueTasks.length > 0 ? (
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">Срок: {task.dueDate}</p>
                  </div>
                  <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
                    {task.assignee}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-500 font-medium">Нет просроченных задач! Отличная работа.</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            Важные задачи
          </h3>
          <div className="space-y-3">
             {importantTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        {task.project}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                    {task.status}
                  </span>
                </div>
             ))}
             {importantTasks.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Нет задач с высоким приоритетом.</p>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deal Pipeline */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Воронка продаж</h3>
          <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false} 
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#eab308" radius={[6, 6, 0, 0]} barSize={40}>
                      {dealStageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#eab308', '#22c55e', '#ef4444'][index % 5]} />
                      ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Статус задач</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value, entry: any) => <span className="text-gray-600 dark:text-gray-300 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
