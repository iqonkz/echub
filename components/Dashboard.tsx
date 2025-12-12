


import React from 'react';
import { Task, Deal, DealStage, TaskStatus, ModuleType, CrmActivity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, AlertCircle, Flame, FolderKanban, Zap, Phone, Calendar } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  deals: Deal[];
  activities?: CrmActivity[];
  onNavigate: (module: ModuleType) => void;
}

const COLORS = ['#eab308', '#22c55e', '#f59e0b', '#ef4444']; 

const Dashboard: React.FC<DashboardProps> = ({ tasks, deals, activities = [], onNavigate }) => {
  // Calculate metrics
  const totalRevenue = deals.reduce((acc, deal) => deal.stage === DealStage.WON ? acc + deal.value : acc, 0);
  const potentialRevenue = deals.reduce((acc, deal) => deal.stage !== DealStage.WON ? acc + deal.value : acc, 0);
  const pendingTasks = tasks.filter(t => t.status !== TaskStatus.DONE).length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  
  const importantTasks = tasks.filter(t => t.priority === 'Высокий' && t.status !== TaskStatus.DONE);
  const pendingActivities = activities.filter(a => a.status !== 'Выполнено').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Dynamic Revenue Growth Calculation
  const calculateGrowth = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();

      const currentMonthRevenue = deals
          .filter(d => d.stage === DealStage.WON && new Date(d.expectedClose).getMonth() === currentMonth && new Date(d.expectedClose).getFullYear() === currentYear)
          .reduce((acc, d) => acc + d.value, 0);

      const prevMonthRevenue = deals
          .filter(d => d.stage === DealStage.WON && new Date(d.expectedClose).getMonth() === prevMonth && new Date(d.expectedClose).getFullYear() === prevYear)
          .reduce((acc, d) => acc + d.value, 0);

      if (prevMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
      
      return Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
  };

  const revenueGrowth = calculateGrowth();

  // Chart Data Preparation
  const dealStageData = Object.values(DealStage).map(stage => ({
    name: stage,
    value: deals.filter(d => d.stage === stage).length
  }));

  const taskStatusData = Object.values(TaskStatus).map(status => ({
    name: status,
    value: tasks.filter(t => t.status === status).length
  }));

  const StatCard = ({ title, value, icon: Icon, color, subtext, subtextClass }: any) => (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl ${color} shadow-lg shadow-gray-200 dark:shadow-none group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
        </div>
      </div>
      <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
         <span className={`px-1.5 md:px-2 py-0.5 rounded-md font-bold text-[9px] md:text-[10px] ${subtextClass || 'text-gray-500 bg-gray-100'}`}>
             {subtext.includes('+') ? '▲' : subtext.includes('-') ? '▼' : '●'}
         </span>
         {subtext}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Обзор</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Сводка ключевых показателей компании</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hidden md:block">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Выручка" 
          value={`₸${(totalRevenue / 1000000).toFixed(1)}М`} 
          icon={DollarSign} 
          color="bg-gradient-to-br from-green-500 to-green-600" 
          subtext={`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%`}
          subtextClass={revenueGrowth >= 0 ? "text-green-500 bg-green-50 dark:bg-green-900/20" : "text-red-500 bg-red-50 dark:bg-red-900/20"}
        />
        <StatCard 
          title="В воронке" 
          value={`₸${(potentialRevenue / 1000000).toFixed(1)}М`} 
          icon={Clock} 
          color="bg-gradient-to-br from-yellow-500 to-yellow-600" 
          subtext={`${deals.length} активных`}
          subtextClass="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
        />
        <StatCard 
          title="В работе" 
          value={pendingTasks} 
          icon={AlertCircle} 
          color="bg-gradient-to-br from-orange-500 to-orange-600" 
          subtext={`${importantTasks.length} важных`}
          subtextClass="text-orange-600 bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard 
          title="Завершено" 
          value={completedTasks} 
          icon={CheckCircle} 
          color="bg-gradient-to-br from-purple-500 to-purple-600" 
          subtext="В этом месяце"
          subtextClass="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Activities & Important Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        
        {/* CRM Activities List (Replaces Hot Tasks) */}
        <div 
          onClick={() => onNavigate(ModuleType.CRM)}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:border-primary-200 transition-colors"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Zap className="w-5 h-5 text-blue-500" />
            </div>
            Список дел (CRM)
          </h3>
          {pendingActivities.length > 0 ? (
            <div className="space-y-3">
              {pendingActivities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white dark:bg-gray-600 rounded-full shadow-sm">
                        {act.type === 'Звонок' ? <Phone className="w-3.5 h-3.5 text-green-500" /> : <Calendar className="w-3.5 h-3.5 text-purple-500" />}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">{act.subject}</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{act.date}</p>
                     </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-lg shadow-sm">
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-500 font-medium">Нет запланированных дел!</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Deal Pipeline */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Воронка продаж</h3>
          <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealStageData} margin={{ left: -20, right: 0 }}>
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
                   itemStyle={{ color: '#fff' }}
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
