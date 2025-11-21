import React, { useState } from 'react';
import { Deal, DealStage, Company, Contact, CrmActivity } from '../types';
import { Plus, DollarSign, Calendar, LayoutGrid, List, Trash2, Building, User, Filter, X, Pencil, ArrowUpDown, Check } from 'lucide-react';

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

type CrmTab = 'DEALS' | 'COMPANIES' | 'CONTACTS' | 'ACTIVITIES';
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
  const [inlineData, setInlineData] = useState<any>({});

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
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.inn?.includes(searchQuery);
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

    if (activeTab === 'DEALS') {
       const dealData = {
        id: isEdit ? id : `d${id}`,
        title: formData.title || 'Новая сделка',
        clientName: formData.clientName || 'Клиент',
        value: Number(formData.value) || 0,
        stage: isEdit ? formData.stage : DealStage.NEW,
        contactId: 'ct1',
        expectedClose: formData.expectedClose || new Date().toISOString().split('T')[0]
      };
      isEdit ? onUpdateDeal(dealData) : onAddDeal(dealData);

    } else if (activeTab === 'COMPANIES') {
      const companyData = {
        id: isEdit ? id : `c${id}`,
        name: formData.name,
        inn: formData.inn,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        extraPhone: formData.extraPhone,
        website: formData.website,
        address: formData.address,
        industry: formData.industry || 'General',
        email: formData.email || ''
      };
      isEdit ? onUpdateCompany(companyData) : onAddCompany(companyData);

    } else if (activeTab === 'CONTACTS') {
      const contactData = {
        id: isEdit ? id : `ct${id}`,
        name: formData.name,
        organization: formData.organization,
        companyId: companies.find(c => c.name === formData.organization)?.id || '',
        phone: formData.phone,
        extraPhone: formData.extraPhone,
        email: formData.email,
        address: formData.address,
        position: formData.position
      };
      isEdit ? onUpdateContact(contactData) : onAddContact(contactData);
    } else if (activeTab === 'ACTIVITIES') {
        console.log("Activity Saved", formData);
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
    <div className="flex gap-4 min-w-max h-full pb-4">
      {Object.values(DealStage).map((stage) => (
        <div key={stage} className="w-72 md:w-80 flex-shrink-0 flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl">
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stage === DealStage.WON ? 'bg-green-500' : 'bg-primary-500'}`} />
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{stage}</h3>
            </div>
            <span className="text-xs font-medium bg-white dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400">
                {filteredDeals.filter(d => d.stage === stage).length}
            </span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {filteredDeals.filter(d => d.stage === stage).map(deal => (
              <div key={deal.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm cursor-pointer hover:text-primary-500" onClick={() => openDetailModal(deal)}>{deal.title}</h4>
                  <div className="flex gap-1">
                      <button onClick={() => openModal(deal)} className="text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDeleteDeal(deal.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                      </button>
                  </div>
                </div>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-3">{deal.clientName}</p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 font-bold">₸</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{(deal.value).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{deal.expectedClose}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-3">
                    <button onClick={() => moveDealStage(deal, 'prev')} className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 text-gray-700 dark:text-gray-200 text-xs">&lt;</button>
                    <button onClick={() => moveDealStage(deal, 'next')} className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 text-gray-700 dark:text-gray-200 text-xs">&gt;</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl text-xs text-center text-gray-500 dark:text-gray-400">
            Сумма: ₸{(filteredDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0)).toLocaleString()}
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
          {label: 'ИНН', key: 'inn'},
          {label: 'Телефон', key: 'phone'},
          {label: 'Сайт', key: 'website'}
      ];
    } else if (activeTab === 'CONTACTS') {
      data = filteredContacts;
      onDelete = onDeleteContact;
      columns = [
          {label: 'Имя', key: 'name'},
          {label: 'Должность', key: 'position'},
          {label: 'Организация', key: 'organization'},
          {label: 'Email', key: 'email'}
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-auto flex-1">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
              <tr>
                {columns.map(col => (
                    <th key={col.key} className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort(col.key)}>
                        <div className="flex items-center gap-1">
                            {col.label}
                            {renderSortIcon(col.key)}
                        </div>
                    </th>
                ))}
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any) => (
                <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => openDetailModal(item)}>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {item.title || item.name || item.subject}
                  </td>
                  <td className="px-6 py-4">
                    {activeTab === 'COMPANIES' ? item.inn : 
                     activeTab === 'CONTACTS' ? item.position :
                     activeTab === 'DEALS' ? item.clientName : item.type}
                  </td>
                  <td className="px-6 py-4">
                     {activeTab === 'DEALS' ? `₸${item.value.toLocaleString()}` :
                      activeTab === 'CONTACTS' ? item.organization :
                      activeTab === 'COMPANIES' ? item.phone : item.date}
                  </td>
                  <td className="px-6 py-4">
                    {activeTab === 'DEALS' ? <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{item.stage}</span> : 
                     activeTab === 'COMPANIES' ? item.website : item.email || item.status}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openModal(item)} className="text-gray-400 hover:text-primary-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500">
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
             <div key={item.id} onClick={() => openDetailModal(item)} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title || item.name || item.subject}</h4>
                      {activeTab === 'COMPANIES' && <p className="text-xs text-gray-500">{item.address ? item.address.split(',')[0] : 'Нет адреса'}</p>}
                   </div>
                   {activeTab === 'DEALS' && <span className="text-sm font-bold text-primary-600">{item.value.toLocaleString()}</span>}
                </div>
             </div>
           ))}
        </div>
        
        {/* Excel-like Inline Adding (Desktop Only) */}
        {(activeTab === 'COMPANIES' || activeTab === 'CONTACTS') && (
            <div className="hidden md:block border-t border-gray-200 dark:border-gray-700 p-2 bg-primary-50 dark:bg-gray-800/50">
                 <div className="text-center text-xs text-gray-500 cursor-pointer hover:text-primary-600" onClick={() => openModal()}>
                    + Быстрое добавление (нажмите для модального окна)
                 </div>
            </div>
        )}
      </div>
    );
  };

  const getLinkedContacts = (companyId: string) => {
    return contacts.filter(c => c.companyId === companyId);
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar">
          {(['DEALS', 'COMPANIES', 'CONTACTS', 'ACTIVITIES'] as CrmTab[]).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                 activeTab === tab 
                 ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm' 
                 : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
               }`}
             >
               {tab === 'DEALS' ? 'Сделки' : tab === 'COMPANIES' ? 'Компании' : tab === 'CONTACTS' ? 'Контакты' : 'Дела'}
             </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
           {/* Filter Dropdown */}
           {(activeTab === 'COMPANIES' || activeTab === 'CONTACTS') && (
              <div className="relative">
                  <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5">
                      <Filter className="w-4 h-4 text-gray-500 mr-2"/>
                      <select 
                          value={filterValue} 
                          onChange={(e) => setFilterValue(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 w-32"
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
             <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
               <button onClick={() => setViewMode('KANBAN')} className={`p-2 rounded ${viewMode === 'KANBAN' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                 <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-300" />
               </button>
               <button onClick={() => setViewMode('LIST')} className={`p-2 rounded ${viewMode === 'LIST' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                 <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
               </button>
             </div>
           )}
           
           <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-gray-900 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-bold whitespace-nowrap"
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                 {editingItem ? 'Редактировать' : 'Добавить'} {activeTab === 'DEALS' ? 'сделку' : activeTab === 'COMPANIES' ? 'организацию' : activeTab === 'CONTACTS' ? 'контакт' : 'действие'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {activeTab === 'DEALS' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Название сделки*</label>
                    <input value={formData.title || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Клиент</label>
                    <input value={formData.clientName || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, clientName: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Сумма</label>
                    <input type="number" value={formData.value || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, value: e.target.value})} required />
                  </div>
                </>
              )}
              {activeTab === 'ACTIVITIES' && (
                 <>
                   <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Тема действия*</label>
                     <input value={formData.subject || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, subject: e.target.value})} required />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Тип</label>
                     <select value={formData.type || 'Звонок'} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="Звонок">Звонок</option>
                        <option value="Встреча">Встреча</option>
                        <option value="Email">Email</option>
                     </select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Дата</label>
                     <input type="date" value={formData.date || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, date: e.target.value})} />
                   </div>
                 </>
              )}
              {activeTab === 'COMPANIES' && (
                 <>
                  <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Название*</label>
                     <input value={formData.name || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">ИНН</label>
                     <input value={formData.inn || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, inn: e.target.value})} />
                  </div>
                 </>
              )}
              {activeTab === 'CONTACTS' && (
                 <>
                   <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Имя*</label>
                     <input value={formData.name || ''} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-gray-500 dark:text-gray-400">Организация</label>
                     <input 
                       list="company-suggestions"
                       value={formData.organization || ''} 
                       className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:border-primary-500 outline-none text-gray-900 dark:text-white" 
                       onChange={e => setFormData({...formData, organization: e.target.value})} 
                     />
                  </div>
                 </>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-primary-500 text-gray-900 rounded hover:bg-primary-400 transition-colors font-bold shadow-sm">
                  {editingItem ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-start p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItem.title || selectedItem.name || selectedItem.subject}</h2>
                   </div>
                   <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X /></button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Basic Info */}
                   <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedItem).map(([key, value]) => {
                          if (['id', 'companyId', 'contactId', 'relatedEntityId'].includes(key) || !value) return null;
                          return (
                              <div key={key} className="col-span-2 sm:col-span-1">
                                  <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1 block">{key}</label>
                                  <div className="text-sm text-gray-900 dark:text-white break-words">{String(value)}</div>
                              </div>
                          )
                      })}
                   </div>

                   {/* Linked Contacts for Company */}
                   {activeTab === 'COMPANIES' && (
                     <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Связанные контакты</h3>
                        <div className="space-y-2">
                           {getLinkedContacts(selectedItem.id).length > 0 ? (
                             getLinkedContacts(selectedItem.id).map(contact => (
                               <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs">
                                        {contact.name.charAt(0)}
                                     </div>
                                     <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.position}</p>
                                     </div>
                                  </div>
                                  <a href={`tel:${contact.phone}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">{contact.phone}</a>
                               </div>
                             ))
                           ) : (
                             <p className="text-xs text-gray-500 italic">Нет связанных контактов.</p>
                           )}
                        </div>
                     </div>
                   )}
               </div>

               <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                   <button 
                     onClick={() => { setIsDetailModalOpen(false); openModal(selectedItem); }}
                     className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
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