
import React, { useState } from 'react';
import { Deal, DealStage, Company, Contact, CrmActivity } from '../types';
import { Plus, LayoutGrid, List, Trash2, Building, Filter, X, Pencil, ArrowUpDown, Phone, Mail, } from 'lucide-react';

interface CRMProps {
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  activities: CrmActivity[];
  onUpdateDeal: (deal: Deal) => void;
  onAddDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
  onAddCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  searchQuery: string;
}

type CrmTab = 'DEALS' | 'COMPANIES' | 'PEOPLE' | 'ACTIVITIES';
type ViewMode = 'KANBAN' | 'LIST';
type SortConfig = { key: string, direction: 'asc' | 'desc' } | null;

const CRM: React.FC<CRMProps> = ({ 
  deals, companies, contacts, activities,
  onUpdateDeal, onAddDeal, onDeleteDeal,
  onAddCompany, onUpdateCompany, onDeleteCompany,
  onAddContact, onUpdateContact, onDeleteContact,
  searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<CrmTab>('DEALS');
  const [viewMode, setViewMode] = useState<ViewMode>('KANBAN');
  const [filterValue, setFilterValue] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [formData, setFormData] = useState<any>({});

  // --- Filtering Logic ---
  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry))).filter(Boolean);
  const uniqueOrganizations = Array.from(new Set(companies.map(c => c.name))).sort();

  React.useEffect(() => {
    setFilterValue('ALL');
    setSortConfig(null);
  }, [activeTab]);

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortData = (data: any[]) => {
      if (!sortConfig) return data;
      return [...data].sort((a, b) => {
          const aValue = a[sortConfig.key] || '';
          const bValue = b[sortConfig.key] || '';
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  };

  const filteredDeals = deals.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredCompanies = sortData(companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.bin && c.bin.includes(searchQuery));
    const matchesFilter = filterValue === 'ALL' || c.industry === filterValue;
    return matchesSearch && matchesFilter;
  }));

  const filteredContacts = sortData(contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.organization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterValue === 'ALL' || c.organization === filterValue || companies.find(comp => comp.id === c.companyId)?.name === filterValue;
    return matchesSearch && matchesFilter;
  }));

  const openModal = (item?: any) => {
      setEditingItem(item || null);
      setFormData(item || {});
      setIsModalOpen(true);
  };

  const openDetailModal = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const id = isEdit ? editingItem.id : Date.now().toString();

    const sanitize = (val: any) => (val === undefined || val === null) ? '' : val;

    if (activeTab === 'DEALS') {
       const dealData = {
        id: isEdit ? id : `d${id}`,
        title: sanitize(formData.title) || 'Новая сделка',
        clientName: sanitize(formData.clientName) || 'Клиент',
        value: Number(formData.value) || 0,
        stage: isEdit ? formData.stage : DealStage.NEW,
        contactId: 'ct1',
        expectedClose: sanitize(formData.expectedClose) || new Date().toISOString().split('T')[0]
      };
      isEdit ? onUpdateDeal(dealData) : onAddDeal(dealData);

    } else if (activeTab === 'COMPANIES') {
      const companyData = {
        id: isEdit ? id : `c${id}`,
        name: sanitize(formData.name),
        industry: sanitize(formData.industry),
        phone: sanitize(formData.phone),
        secondPhone: sanitize(formData.secondPhone),
        email: sanitize(formData.email),
        secondEmail: sanitize(formData.secondEmail),
        address: sanitize(formData.address),
        bin: sanitize(formData.bin),
        website: sanitize(formData.website),
        director: sanitize(formData.director),
        createdAt: isEdit ? formData.createdAt : new Date().toISOString().split('T')[0]
      };
      isEdit ? onUpdateCompany(companyData) : onAddCompany(companyData);

    } else if (activeTab === 'PEOPLE') {
      const company = companies.find(c => c.name === formData.organization);
      const contactData = {
        id: isEdit ? id : `ct${id}`,
        name: sanitize(formData.name),
        position: sanitize(formData.position),
        organization: sanitize(formData.organization),
        companyId: company ? company.id : (isEdit ? formData.companyId : ''),
        phone: sanitize(formData.phone),
        secondPhone: sanitize(formData.secondPhone),
        email: sanitize(formData.email),
        address: sanitize(formData.address),
        lastContactDate: isEdit ? formData.lastContactDate : new Date().toISOString().split('T')[0]
      };
      isEdit ? onUpdateContact(contactData) : onAddContact(contactData);
    } else if (activeTab === 'ACTIVITIES') {
        // ...
    }
    setIsModalOpen(false);
    setFormData({});
    setEditingItem(null);
  };

  const moveDealStage = (deal: Deal, direction: 'next' | 'prev') => {
    const stages = Object.values(DealStage);
    const currentIndex = stages.indexOf(deal.stage);
    let newIndex = currentIndex;
    if (direction === 'next' && currentIndex < stages.length - 1) newIndex++;
    if (direction === 'prev' && currentIndex > 0) newIndex--;
    
    if (newIndex !== currentIndex) {
      onUpdateDeal({ ...deal, stage: stages[newIndex] });
    }
  };

  const renderSortIcon = (key: string) => {
      if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
      return <ArrowUpDown className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'text-primary-600' : 'text-primary-400'}`} />;
  };

  // Render Methods
  const renderDealsKanban = () => (
    <div className="flex gap-6 min-w-max h-full pb-6 px-1">
      {Object.values(DealStage).map((stage) => (
        <div key={stage} className="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 dark:bg-gray-800/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/80 rounded-t-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-700 shadow-sm ${stage === DealStage.WON ? 'bg-green-500' : 'bg-primary-500'}`} />
                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">{stage}</h3>
            </div>
            <span className="text-xs font-bold bg-white dark:bg-gray-700 px-2.5 py-1 rounded-full text-gray-500 dark:text-gray-400 shadow-sm">
                {filteredDeals.filter(d => d.stage === stage).length}
            </span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {filteredDeals.filter(d => d.stage === stage).map(deal => (
              <div key={deal.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 border border-gray-100 dark:border-gray-700/50 group relative cursor-pointer transform hover:-translate-y-1" onClick={() => openDetailModal(deal)}>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm hover:text-primary-600 transition-colors">{deal.title}</h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => {e.stopPropagation(); openModal(deal);}} className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded">
                          <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); onDeleteDeal(deal.id);}} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                      </button>
                  </div>
                </div>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-3 flex items-center gap-1">
                   <Building className="w-3 h-3" />
                   {deal.clientName}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Бюджет</span>
                     <span className="font-bold text-sm text-gray-800 dark:text-gray-200">₸{(deal.value).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Дата</span>
                     <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{deal.expectedClose}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={(e) => {e.stopPropagation(); moveDealStage(deal, 'prev');}} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30">&larr;</button>
                    <button onClick={(e) => {e.stopPropagation(); moveDealStage(deal, 'next');}} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30">&rarr;</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl text-xs font-medium text-center text-gray-500 dark:text-gray-400">
            Итого: ₸{(filteredDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0)).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => {
    let data: any[] = [];
    let onDelete: any = null;
    let columns: {label: string, key: string}[] = [];

    if (activeTab === 'DEALS') {
      data = filteredDeals;
      onDelete = onDeleteDeal;
      columns = [
          {label: 'Название', key: 'title'},
          {label: 'Клиент', key: 'clientName'},
          {label: 'Сумма', key: 'value'},
          {label: 'Статус', key: 'stage'}
      ];
    } else if (activeTab === 'COMPANIES') {
      data = filteredCompanies;
      onDelete = onDeleteCompany;
      columns = [
          {label: 'Название', key: 'name'},
          {label: 'Отрасль', key: 'industry'},
          {label: 'Руководитель', key: 'director'},
          {label: 'Телефон', key: 'phone'}
      ];
    } else if (activeTab === 'PEOPLE') {
      data = filteredContacts;
      onDelete = onDeleteContact;
      columns = [
          {label: 'ФИО', key: 'name'},
          {label: 'Должность', key: 'position'},
          {label: 'Компания', key: 'organization'},
          {label: 'Телефон', key: 'phone'}
      ];
    } else if (activeTab === 'ACTIVITIES') {
      data = activities;
      columns = [
        {label: 'Тема', key: 'subject'},
        {label: 'Тип', key: 'type'},
        {label: 'Дата', key: 'date'},
        {label: 'Статус', key: 'status'}
      ];
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-auto flex-1">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {columns.map(col => (
                    <th key={col.key} className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" onClick={() => handleSort(col.key)}>
                        <div className="flex items-center gap-2">
                            {col.label}
                            {renderSortIcon(col.key)}
                        </div>
                    </th>
                ))}
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.map((item: any) => (
                <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group" onClick={() => openDetailModal(item)}>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {item.title || item.name || item.subject}
                  </td>
                  <td className="px-6 py-4">
                    {activeTab === 'COMPANIES' ? item.industry : 
                     activeTab === 'PEOPLE' ? item.position :
                     activeTab === 'DEALS' ? item.clientName : item.type}
                  </td>
                  <td className="px-6 py-4 font-medium">
                     {activeTab === 'DEALS' ? `₸${item.value.toLocaleString()}` :
                      activeTab === 'PEOPLE' ? item.organization :
                      activeTab === 'COMPANIES' ? item.director : item.date}
                  </td>
                  <td className="px-6 py-4">
                    {activeTab === 'DEALS' ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{item.stage}</span> : 
                     activeTab === 'COMPANIES' ? <a href={`tel:${item.phone}`} onClick={e => e.stopPropagation()} className="text-primary-600 hover:underline">{item.phone}</a> :
                     activeTab === 'PEOPLE' ? <a href={`tel:${item.phone}`} onClick={e => e.stopPropagation()} className="text-primary-600 hover:underline">{item.phone}</a> : item.status}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openModal(item)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden flex-1 overflow-auto p-4 space-y-3">
           {data.map((item: any) => (
             <div key={item.id} onClick={() => openDetailModal(item)} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title || item.name || item.subject}</h4>
                      {activeTab === 'COMPANIES' && <p className="text-xs text-gray-500">{item.industry}</p>}
                      {activeTab === 'PEOPLE' && <p className="text-xs text-gray-500">{item.position} • {item.organization}</p>}
                   </div>
                   {activeTab === 'DEALS' && <span className="text-sm font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md">{item.value.toLocaleString()}</span>}
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const getLinkedContacts = (companyId: string) => {
    return contacts.filter(c => c.companyId === companyId);
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-1 bg-white dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto w-full md:w-auto no-scrollbar border border-gray-200 dark:border-gray-700 shadow-sm">
          {(['DEALS', 'COMPANIES', 'PEOPLE', 'ACTIVITIES'] as CrmTab[]).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${
                 activeTab === tab 
                 ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 shadow-md' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
               }`}
             >
               {tab === 'DEALS' ? 'Сделки' : tab === 'COMPANIES' ? 'Компании' : tab === 'PEOPLE' ? 'Люди' : 'Дела'}
             </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
           {/* Filter Dropdown */}
           {(activeTab === 'COMPANIES' || activeTab === 'PEOPLE') && (
              <div className="relative">
                  <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-sm hover:border-primary-500 transition-colors">
                      <Filter className="w-4 h-4 text-gray-500 mr-2"/>
                      <select 
                          value={filterValue} 
                          onChange={(e) => setFilterValue(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 w-32 font-medium cursor-pointer"
                      >
                          <option value="ALL">Все</option>
                          {activeTab === 'COMPANIES' 
                              ? uniqueIndustries.map(ind => <option key={ind} value={ind}>{ind}</option>)
                              : uniqueOrganizations.map(org => <option key={org} value={org}>{org}</option>)
                          }
                      </select>
                  </div>
              </div>
           )}

           {activeTab === 'DEALS' && (
             <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
               <button onClick={() => setViewMode('KANBAN')} className={`p-2 rounded-lg transition-all ${viewMode === 'KANBAN' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-500'}`}>
                 <LayoutGrid className="w-4 h-4" />
               </button>
               <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-500'}`}>
                 <List className="w-4 h-4" />
               </button>
             </div>
           )}
           
           <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 text-sm font-bold whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'ACTIVITIES' ? 'Новое действие' : 'Добавить'}
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'DEALS' && viewMode === 'KANBAN' ? (
            <div className="h-full overflow-x-auto no-scrollbar">
                {renderDealsKanban()}
            </div>
        ) : renderListView()}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                 {editingItem ? 'Редактировать' : 'Добавить'} {activeTab === 'DEALS' ? 'сделку' : activeTab === 'COMPANIES' ? 'компанию' : activeTab === 'PEOPLE' ? 'человека' : 'действие'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {activeTab === 'DEALS' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Название сделки*</label>
                    <input value={formData.title || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Клиент</label>
                    <input value={formData.clientName || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, clientName: e.target.value})} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Сумма</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₸</span>
                        <input type="number" value={formData.value || ''} className="w-full pl-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, value: e.target.value})} required />
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'ACTIVITIES' && (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Тема действия*</label>
                     <input value={formData.subject || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, subject: e.target.value})} required />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Тип</label>
                     <select value={formData.type || 'Звонок'} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="Звонок">Звонок</option>
                        <option value="Встреча">Встреча</option>
                        <option value="Email">Email</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Дата</label>
                     <input type="date" value={formData.date || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, date: e.target.value})} />
                   </div>
                 </>
              )}
              {activeTab === 'COMPANIES' && (
                 <>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Название*</label>
                     <input value={formData.name || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Отрасль*</label>
                     <input 
                        list="industry-suggestions"
                        value={formData.industry || ''} 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" 
                        onChange={e => setFormData({...formData, industry: e.target.value})} 
                        placeholder="Выберите или введите..."
                        required 
                     />
                     <datalist id="industry-suggestions">
                         {uniqueIndustries.map(ind => <option key={ind} value={ind} />)}
                     </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Телефон*</label>
                        <input value={formData.phone || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">2-й Телефон</label>
                        <input value={formData.secondPhone || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, secondPhone: e.target.value})} />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Почта*</label>
                        <input type="email" value={formData.email || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">2-я Почта</label>
                        <input type="email" value={formData.secondEmail || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, secondEmail: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Руководитель</label>
                     <input value={formData.director || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, director: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">БИН</label>
                        <input value={formData.bin || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, bin: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Сайт</label>
                        <input value={formData.website || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, website: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Адрес</label>
                     <input value={formData.address || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                 </>
              )}
              {activeTab === 'PEOPLE' && (
                 <>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">ФИО*</label>
                     <input value={formData.name || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Должность</label>
                     <input value={formData.position || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, position: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Связанная компания</label>
                     <input 
                       list="company-suggestions"
                       value={formData.organization || ''} 
                       className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" 
                       onChange={e => setFormData({...formData, organization: e.target.value})} 
                       placeholder="Выберите или введите..."
                     />
                     <datalist id="company-suggestions">
                         {uniqueOrganizations.map(org => <option key={org} value={org} />)}
                     </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Телефон*</label>
                         <input value={formData.phone || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">2-й Телефон</label>
                         <input value={formData.secondPhone || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, secondPhone: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Почта</label>
                     <input type="email" value={formData.email || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                 </>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">Отмена</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all font-bold">
                  {editingItem ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-start p-6 bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                   <div>
                      <span className="text-xs font-bold uppercase text-primary-500 tracking-wider mb-1 block">Детали</span>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItem.title || selectedItem.name || selectedItem.subject}</h2>
                   </div>
                   <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X /></button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Basic Info */}
                   <div className="grid grid-cols-2 gap-6">
                      {Object.entries(selectedItem).map(([key, value]) => {
                          if (['id', 'companyId', 'contactId', 'relatedEntityId', 'inn'].includes(key) || value === undefined || value === null || value === '') return null;
                          if (key === 'phone' || key === 'secondPhone') {
                              return (
                                <div key={key} className="col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5 block tracking-wider flex items-center gap-1"><Phone className="w-3 h-3"/> {key === 'phone' ? 'Телефон' : '2-й Телефон'}</label>
                                    <a href={`tel:${value}`} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline break-words p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 block hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm">{String(value)}</a>
                                </div>
                              );
                          }
                          if (key === 'email' || key === 'secondEmail') {
                              return (
                                <div key={key} className="col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5 block tracking-wider flex items-center gap-1"><Mail className="w-3 h-3"/> {key === 'email' ? 'Email' : '2-й Email'}</label>
                                    <a href={`mailto:${value}`} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline break-words p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 block hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm">{String(value)}</a>
                                </div>
                              );
                          }
                          // Custom labels
                          let label = key;
                          if(key === 'bin') label = 'БИН';
                          if(key === 'director') label = 'Руководитель';
                          if(key === 'industry') label = 'Отрасль';
                          if(key === 'address') label = 'Адрес';
                          if(key === 'website') label = 'Сайт';
                          if(key === 'createdAt') label = 'Дата создания';
                          if(key === 'lastContactDate') label = 'Последняя связь';
                          if(key === 'organization') label = 'Компания';
                          if(key === 'position') label = 'Должность';
                          if(key === 'clientName') label = 'Клиент';
                          if(key === 'title') label = 'Название';
                          if(key === 'value') label = 'Сумма';
                          if(key === 'stage') label = 'Этап';
                          if(key === 'expectedClose') label = 'Ожидаемая дата';


                          return (
                              <div key={key} className="col-span-2 sm:col-span-1">
                                  <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5 block tracking-wider">{label}</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">{String(value)}</div>
                              </div>
                          )
                      })}
                   </div>

                   {/* Linked Contacts for Company */}
                   {activeTab === 'COMPANIES' && (
                     <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Связанные контакты</h3>
                        <div className="space-y-3">
                           {getLinkedContacts(selectedItem.id).length > 0 ? (
                             getLinkedContacts(selectedItem.id).map(contact => (
                               <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-500/30 transition-colors shadow-sm">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm shadow-inner">
                                        {contact.name.charAt(0)}
                                     </div>
                                     <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{contact.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.position}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <a href={`tel:${contact.phone}`} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"><Phone className="w-3.5 h-3.5"/></a>
                                      <a href={`mailto:${contact.email}`} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"><Mail className="w-3.5 h-3.5"/></a>
                                  </div>
                               </div>
                             ))
                           ) : (
                             <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">Нет связанных контактов.</p>
                           )}
                        </div>
                     </div>
                   )}
               </div>

               <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
                   <button 
                     onClick={() => { setIsDetailModalOpen(false); openModal(selectedItem); }}
                     className="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 shadow-sm border border-gray-200 dark:border-gray-600 transition-all font-medium"
                   >
                       <Pencil className="w-4 h-4" /> Редактировать
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
