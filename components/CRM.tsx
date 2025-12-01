
import React, { useState, useRef, useEffect } from 'react';
import { Deal, DealStage, Company, Contact, CrmActivity, User, CrmUserSettings, CrmColumn } from '../types';
import { Plus, LayoutGrid, List, Trash2, Building, Filter, Pencil, ArrowUpDown, Phone, Mail, User as UserIcon, Download, Upload, Settings, Eye, Check } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Switch from './ui/Switch';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';

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
  onAddActivity: (activity: CrmActivity) => void;
  onDeleteActivity?: (id: string) => void;
  searchQuery: string;
  currentUser?: User;
  onUpdateCrmSettings?: (settings: CrmUserSettings) => void;
}

type CrmTab = 'DEALS' | 'COMPANIES' | 'PEOPLE' | 'ACTIVITIES';
type ViewMode = 'KANBAN' | 'LIST';
type SortConfig = { key: string, direction: 'asc' | 'desc' } | null;

const DEFAULT_SETTINGS: CrmUserSettings = {
    dealsColumns: [
        { key: 'title', label: 'Название', visible: true, order: 0 },
        { key: 'clientName', label: 'Клиент', visible: true, order: 1 },
        { key: 'value', label: 'Сумма', visible: true, order: 2 },
        { key: 'stage', label: 'Статус', visible: true, order: 3 }
    ],
    companiesColumns: [
        { key: 'name', label: 'Название', visible: true, order: 0 },
        { key: 'industry', label: 'Отрасль', visible: true, order: 1 },
        { key: 'phone', label: 'Телефон', visible: true, order: 2 },
        { key: 'email', label: 'Почта', visible: true, order: 3 },
        { key: 'address', label: 'Город', visible: true, order: 4 }
    ],
    contactsColumns: [
        { key: 'name', label: 'ФИО', visible: true, order: 0 },
        { key: 'position', label: 'Должность', visible: true, order: 1 },
        { key: 'organization', label: 'Компания', visible: true, order: 2 },
        { key: 'phone', label: 'Телефон', visible: true, order: 3 },
        { key: 'email', label: 'Почта', visible: true, order: 4 }
    ]
};

const CRM: React.FC<CRMProps> = ({ 
  deals, companies, contacts, activities,
  onUpdateDeal, onAddDeal, onDeleteDeal,
  onAddCompany, onUpdateCompany, onDeleteCompany,
  onAddContact, onUpdateContact, onDeleteContact,
  onAddActivity, onDeleteActivity,
  searchQuery, currentUser, onUpdateCrmSettings
}) => {
  const [activeTab, setActiveTab] = useState<CrmTab>('DEALS');
  const [viewMode, setViewMode] = useState<ViewMode>('KANBAN');
  const [filterValue, setFilterValue] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  // Drag and Drop State
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [formData, setFormData] = useState<any>({});

  // Linking contacts state
  const [linkedContacts, setLinkedContacts] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [currentSettings, setCurrentSettings] = useState<CrmUserSettings>(currentUser?.crmSettings || DEFAULT_SETTINGS);

  useEffect(() => {
     if (currentUser?.crmSettings) {
         setCurrentSettings(currentUser.crmSettings);
     }
  }, [currentUser]);

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

  const filteredDeals = deals.filter(d => (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredCompanies = sortData(companies.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.bin && c.bin.includes(searchQuery));
    const matchesFilter = filterValue === 'ALL' || c.industry === filterValue;
    return matchesSearch && matchesFilter;
  }));

  const filteredContacts = sortData(contacts.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.organization || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterValue === 'ALL' || c.organization === filterValue || companies.find(comp => comp.id === c.companyId)?.name === filterValue;
    return matchesSearch && matchesFilter;
  }));

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedDealId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStage: DealStage) => {
    e.preventDefault();
    if (!draggedDealId) return;

    const deal = deals.find(d => d.id === draggedDealId);
    if (deal && deal.stage !== newStage) {
      onUpdateDeal({ ...deal, stage: newStage });
    }
    setDraggedDealId(null);
  };

  const openModal = (item?: any) => {
      setEditingItem(item || null);
      setFormData(item || {});
      
      // If editing company, prep linked contacts
      if (activeTab === 'COMPANIES' && item) {
          const linked = contacts.filter(c => c.companyId === item.id).map(c => c.id);
          setLinkedContacts(linked);
      } else {
          setLinkedContacts([]);
      }

      setIsModalOpen(true);
  };

  const openDetailModal = (item: any) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDeleteActivityAction = () => {
    if (editingItem && onDeleteActivity) {
      onDeleteActivity(editingItem.id);
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  // --- Export / Import Handlers ---
  const handleExport = () => {
    let dataToExport: any[] = [];
    let filename = '';

    if (activeTab === 'COMPANIES') {
        dataToExport = filteredCompanies;
        filename = 'companies_export.json';
    } else if (activeTab === 'PEOPLE') {
        dataToExport = filteredContacts;
        filename = 'contacts_export.json';
    } else if (activeTab === 'DEALS') {
        dataToExport = filteredDeals;
        filename = 'deals_export.json';
    } else {
        alert('Экспорт для этой вкладки не поддерживается');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if (Array.isArray(json)) {
                  if (activeTab === 'COMPANIES') {
                      json.forEach((item: Company) => onAddCompany({...item, id: `c${Date.now()}_${Math.random()}`}));
                  } else if (activeTab === 'PEOPLE') {
                      json.forEach((item: Contact) => onAddContact({...item, id: `ct${Date.now()}_${Math.random()}`}));
                  } else if (activeTab === 'DEALS') {
                      json.forEach((item: Deal) => onAddDeal({...item, id: `d${Date.now()}_${Math.random()}`}));
                  }
                  alert(`Успешно импортировано ${json.length} записей.`);
              } else {
                  alert('Неверный формат файла. Ожидается массив JSON.');
              }
          } catch (error) {
              console.error(error);
              alert('Ошибка при чтении файла');
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  const toggleLinkedContact = (contactId: string) => {
      setLinkedContacts(prev => 
         prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const id = isEdit ? editingItem.id : Date.now().toString();

    const sanitize = (val: any) => (val === undefined || val === null) ? '' : val;

    if (activeTab === 'DEALS') {
       // Find client name based on ID if selected
       let clientName = formData.clientName || 'Клиент';
       let contactId = 'ct1'; // Default fallback
       
       if (formData.linkedCompanyId) {
          const comp = companies.find(c => c.id === formData.linkedCompanyId);
          if (comp) clientName = comp.name;
       } else if (formData.linkedContactId) {
           const cont = contacts.find(c => c.id === formData.linkedContactId);
           if (cont) {
             clientName = cont.name;
             contactId = cont.id;
           }
       }

       const dealData = {
        id: isEdit ? id : `d${id}`,
        title: sanitize(formData.title) || 'Новая сделка',
        clientName: clientName,
        value: Number(formData.value) || 0,
        stage: isEdit ? formData.stage : DealStage.NEW,
        contactId: contactId,
        expectedClose: sanitize(formData.expectedClose) || new Date().toISOString().split('T')[0]
      };
      isEdit ? onUpdateDeal(dealData) : onAddDeal(dealData);

    } else if (activeTab === 'COMPANIES') {
      const companyId = isEdit ? id : `c${id}`;
      const companyData = {
        id: companyId,
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
      
      if (isEdit) {
          onUpdateCompany(companyData);
      } else {
          onAddCompany(companyData);
      }

      // Update linked contacts logic
      // 1. Get all contacts that were previously linked
      const prevLinked = contacts.filter(c => c.companyId === companyId);
      // 2. Unlink those that are not in current linkedContacts list
      prevLinked.forEach(c => {
          if (!linkedContacts.includes(c.id)) {
              onUpdateContact({...c, companyId: '', organization: ''});
          }
      });
      // 3. Link new ones
      linkedContacts.forEach(cid => {
          const contact = contacts.find(c => c.id === cid);
          if (contact) {
              onUpdateContact({...contact, companyId: companyId, organization: companyData.name});
          }
      });


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
        const activityData: CrmActivity = {
            id: isEdit ? id : `a${id}`,
            type: formData.type || 'Звонок',
            subject: formData.subject || 'Новое действие',
            date: formData.date || new Date().toISOString().split('T')[0],
            status: isEdit ? formData.status : 'Запланировано',
            relatedEntityId: formData.relatedEntityId || ''
        };
        // Use generic handler since activities are simple here
        onAddActivity(activityData); 
    }

    setIsModalOpen(false);
    setFormData({});
    setEditingItem(null);
  };

  const renderSortIcon = (key: string) => {
      if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
      return <ArrowUpDown className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'text-primary-600' : 'text-primary-400'}`} />;
  };

  // --- Settings Handlers ---
  const toggleColumn = (tab: 'DEALS' | 'COMPANIES' | 'PEOPLE', key: string) => {
      const newSettings = { ...currentSettings };
      const prop = tab === 'DEALS' ? 'dealsColumns' : tab === 'COMPANIES' ? 'companiesColumns' : 'contactsColumns';
      
      newSettings[prop] = newSettings[prop].map(col => 
          col.key === key ? { ...col, visible: !col.visible } : col
      );
      
      setCurrentSettings(newSettings);
      if (onUpdateCrmSettings) onUpdateCrmSettings(newSettings);
  };

  const moveColumn = (tab: 'DEALS' | 'COMPANIES' | 'PEOPLE', index: number, direction: 'UP' | 'DOWN') => {
      const newSettings = { ...currentSettings };
      const prop = tab === 'DEALS' ? 'dealsColumns' : tab === 'COMPANIES' ? 'companiesColumns' : 'contactsColumns';
      const cols = [...newSettings[prop]];
      
      if (direction === 'UP' && index > 0) {
          [cols[index], cols[index - 1]] = [cols[index - 1], cols[index]];
      } else if (direction === 'DOWN' && index < cols.length - 1) {
          [cols[index], cols[index + 1]] = [cols[index + 1], cols[index]];
      }
      
      // Update order property
      cols.forEach((c, i) => c.order = i);
      newSettings[prop] = cols;
      
      setCurrentSettings(newSettings);
      if (onUpdateCrmSettings) onUpdateCrmSettings(newSettings);
  };

  // --- Render Methods ---
  const renderDealsKanban = () => (
    <div className="flex gap-6 min-w-max h-full pb-6 px-1">
      {Object.values(DealStage).map((stage) => (
        <div 
          key={stage} 
          className="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 dark:bg-gray-800/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage as DealStage)}
        >
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
              <div 
                key={deal.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, deal.id)}
                className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 border border-gray-100 dark:border-gray-700/50 group relative cursor-grab active:cursor-grabbing transform hover:-translate-y-1 ${draggedDealId === deal.id ? 'opacity-50 border-primary-300 border-dashed' : ''}`}
                onClick={() => openDetailModal(deal)}
              >
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
    let columns: CrmColumn[] = [];

    if (activeTab === 'DEALS') {
      data = filteredDeals;
      onDelete = onDeleteDeal;
      columns = currentSettings.dealsColumns.filter(c => c.visible);
    } else if (activeTab === 'COMPANIES') {
      data = filteredCompanies;
      onDelete = onDeleteCompany;
      columns = currentSettings.companiesColumns.filter(c => c.visible);
    } else if (activeTab === 'PEOPLE') {
      data = filteredContacts;
      onDelete = onDeleteContact;
      columns = currentSettings.contactsColumns.filter(c => c.visible);
    } else if (activeTab === 'ACTIVITIES') {
      data = activities;
      columns = [
        {label: 'Тема', key: 'subject', visible: true, order: 0},
        {label: 'Тип', key: 'type', visible: true, order: 1},
        {label: 'Дата', key: 'date', visible: true, order: 2},
        {label: 'Статус', key: 'status', visible: true, order: 3}
      ];
      onDelete = onDeleteActivity;
    }

    // Helper to get City from Address
    const getCityFromAddress = (address?: string) => address ? address.split(',')[0].trim() : '';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-auto flex-1">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {columns.map(col => (
                    <th key={col.key} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" onClick={() => handleSort(col.key)}>
                        <div className="flex items-center gap-2">
                            {col.label}
                            {renderSortIcon(col.key)}
                        </div>
                    </th>
                ))}
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.map((item: any) => (
                <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group" onClick={() => openDetailModal(item)}>
                  {columns.map(col => {
                     const val = item[col.key];
                     let content = val;
                     
                     // Custom Render Logic based on key
                     if (col.key === 'title' || col.key === 'name' || col.key === 'subject') {
                         content = <span className="font-bold text-gray-900 dark:text-white">{val}</span>;
                     } else if (col.key === 'phone') {
                         content = <a href={`tel:${val}`} onClick={e => e.stopPropagation()} className="text-primary-600 hover:underline">{val}</a>;
                     } else if (col.key === 'email') {
                         content = <a href={`mailto:${val}`} onClick={e => e.stopPropagation()} className="text-primary-600 hover:underline">{val}</a>;
                     } else if (col.key === 'value') {
                         content = `₸${Number(val).toLocaleString()}`;
                     } else if (col.key === 'stage' || col.key === 'status') {
                         content = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{val}</span>;
                     } else if (col.key === 'address') {
                         content = getCityFromAddress(val);
                     }

                     return <td key={col.key} className="px-4 py-4 whitespace-nowrap">{content}</td>;
                  })}
                  
                  <td className="px-4 py-4 text-right flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openModal(item)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {onDelete && (
                      <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View - Compact */}
        <div className="md:hidden flex-1 overflow-auto p-4 space-y-3 pb-24">
           {data.map((item: any) => (
             <div key={item.id} onClick={() => openDetailModal(item)} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
                <div className="flex justify-between items-start">
                   <div className="flex-1 mr-2 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.title || item.name || item.subject}</h4>
                      {activeTab === 'COMPANIES' && <p className="text-[10px] text-gray-500">{item.industry}</p>}
                      {activeTab === 'PEOPLE' && <p className="text-[10px] text-gray-500 truncate">{item.position} • {item.organization}</p>}
                   </div>
                   {activeTab === 'DEALS' && <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-md flex-shrink-0">{Number(item.value).toLocaleString()}</span>}
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
               className={`px-3 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${
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
           {/* Settings Trigger */}
           {activeTab !== 'ACTIVITIES' && (
               <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white shadow-sm"
               >
                  <Settings className="w-4 h-4" />
               </button>
           )}

           {/* Filter Dropdown */}
           {(activeTab === 'COMPANIES' || activeTab === 'PEOPLE') && (
              <div className="relative min-w-[150px]">
                  <Select 
                    icon={<Filter className="w-4 h-4" />}
                    value={filterValue} 
                    onChange={(e) => setFilterValue(e.target.value)}
                    options={[
                        { value: "ALL", label: "Все" },
                        ...(activeTab === 'COMPANIES' 
                            ? uniqueIndustries.map(ind => ({ value: ind, label: ind }))
                            : uniqueOrganizations.map(org => ({ value: org, label: org }))
                        )
                    ]}
                  />
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
           
           <Button 
              onClick={() => openModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              {activeTab === 'ACTIVITIES' ? 'Новое действие' : 'Добавить'}
            </Button>
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

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5"/> Настройки CRM
          </div>
        }
      >
        <div className="space-y-6">
            {/* Import/Export Section */}
            {currentUser?.role === 'ADMIN' && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Обмен данными</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExport} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all gap-2 group">
                            <Download className="w-6 h-6 text-primary-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Экспорт</span>
                        </button>
                        <button onClick={triggerImport} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all gap-2 group">
                            <Upload className="w-6 h-6 text-primary-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Импорт</span>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                    </div>
                </div>
            )}

            {/* Columns Configuration */}
            {(activeTab === 'DEALS' || activeTab === 'COMPANIES' || activeTab === 'PEOPLE') && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Настройка столбцов</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Выберите и упорядочьте столбцы для списка</p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                        {(activeTab === 'DEALS' ? currentSettings.dealsColumns : activeTab === 'COMPANIES' ? currentSettings.companiesColumns : currentSettings.contactsColumns).map((col, idx) => (
                            <div key={col.key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Switch 
                                        checked={col.visible} 
                                        onChange={() => toggleColumn(activeTab as any, col.key)}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{col.label}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <button onClick={() => moveColumn(activeTab as any, idx, 'UP')} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUpDown className="w-3 h-3 rotate-180" /></button>
                                    <button onClick={() => moveColumn(activeTab as any, idx, 'DOWN')} disabled={idx === (activeTab === 'DEALS' ? currentSettings.dealsColumns.length : activeTab === 'COMPANIES' ? currentSettings.companiesColumns.length : currentSettings.contactsColumns.length) - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUpDown className="w-3 h-3" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </Modal>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingItem ? 'Редактировать' : 'Добавить'} ${activeTab === 'DEALS' ? 'сделку' : activeTab === 'COMPANIES' ? 'компанию' : activeTab === 'PEOPLE' ? 'человека' : 'действие'}`}
        footer={
          <>
             <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Отмена</Button>
             <Button onClick={handleSubmit}>{editingItem ? 'Сохранить' : 'Добавить'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'DEALS' && (
                <>
                  <Input 
                    label="Название сделки*"
                    value={formData.title || ''} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                  
                  {/* Select Company or Contact */}
                  <div className="grid grid-cols-2 gap-4">
                     <Select 
                        label="Компания"
                        icon={<Building className="w-3 h-3"/>}
                        value={formData.linkedCompanyId || ''} 
                        onChange={e => setFormData({...formData, linkedCompanyId: e.target.value, linkedContactId: '', clientName: ''})}
                     >
                        <option value="">Выберите...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </Select>

                     <Select 
                        label="Человек"
                        icon={<UserIcon className="w-3 h-3"/>}
                        value={formData.linkedContactId || ''} 
                        onChange={e => setFormData({...formData, linkedContactId: e.target.value, linkedCompanyId: '', clientName: ''})}
                     >
                        <option value="">Выберите...</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </Select>
                  </div>

                  <Input 
                    label="Сумма"
                    type="number"
                    value={formData.value || ''} 
                    onChange={e => setFormData({...formData, value: e.target.value})} 
                    required 
                    icon={<span className="text-gray-500 font-bold">₸</span>}
                  />
                </>
              )}
              {activeTab === 'ACTIVITIES' && (
                 <>
                   <Input 
                     label="Тема действия*"
                     value={formData.subject || ''} 
                     onChange={e => setFormData({...formData, subject: e.target.value})} 
                     required 
                   />
                   <Select 
                      label="Тип"
                      value={formData.type || 'Звонок'} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      options={[
                          { value: "Звонок", label: "Звонок" },
                          { value: "Встреча", label: "Встреча" },
                          { value: "Email", label: "Email" }
                      ]}
                   />
                   <Input 
                     label="Дата"
                     type="date"
                     value={formData.date || ''} 
                     onChange={e => setFormData({...formData, date: e.target.value})} 
                     onClick={(e) => e.stopPropagation()} // Fix calendar click issue
                   />
                   
                   {editingItem && onDeleteActivity && (
                       <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                           <button 
                             type="button" 
                             onClick={handleDeleteActivityAction}
                             className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"
                           >
                               <Trash2 className="w-4 h-4"/> Удалить действие
                           </button>
                       </div>
                   )}
                 </>
              )}
              {activeTab === 'COMPANIES' && (
                 <>
                  <Input 
                    label="Название*"
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                  <Input 
                     label="Отрасль*"
                     list="industry-suggestions"
                     value={formData.industry || ''} 
                     onChange={e => setFormData({...formData, industry: e.target.value})} 
                     placeholder="Выберите или введите..."
                     required 
                  />
                  <datalist id="industry-suggestions">
                         {uniqueIndustries.map(ind => <option key={ind} value={ind} />)}
                  </datalist>

                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Телефон*"
                        value={formData.phone || ''} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        required 
                      />
                      <Input 
                        label="2-й Телефон"
                        value={formData.secondPhone || ''} 
                        onChange={e => setFormData({...formData, secondPhone: e.target.value})} 
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Почта*"
                        type="email"
                        value={formData.email || ''} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                      />
                      <Input 
                        label="2-я Почта"
                        type="email"
                        value={formData.secondEmail || ''} 
                        onChange={e => setFormData({...formData, secondEmail: e.target.value})} 
                      />
                  </div>
                  
                  {/* Linked Contacts Selector */}
                  <div className="space-y-1.5">
                       <label className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300">Связанные люди</label>
                       <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
                           {contacts.map(contact => (
                               <div key={contact.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer" onClick={() => toggleLinkedContact(contact.id)}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${linkedContacts.includes(contact.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                        {linkedContacts.includes(contact.id) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{contact.name}</span>
                                    {contact.companyId && contact.companyId !== editingItem?.id && (
                                        <span className="text-xs text-gray-400 ml-auto">(уже связан)</span>
                                    )}
                               </div>
                           ))}
                       </div>
                  </div>

                  <Input 
                    label="Руководитель"
                    value={formData.director || ''} 
                    onChange={e => setFormData({...formData, director: e.target.value})} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="БИН"
                        value={formData.bin || ''} 
                        onChange={e => setFormData({...formData, bin: e.target.value})} 
                      />
                      <Input 
                        label="Сайт"
                        value={formData.website || ''} 
                        onChange={e => setFormData({...formData, website: e.target.value})} 
                      />
                  </div>
                  <Input 
                    label="Адрес"
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                 </>
              )}
              {activeTab === 'PEOPLE' && (
                 <>
                  <Input 
                    label="ФИО*"
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="Должность"
                    value={formData.position || ''} 
                    onChange={e => setFormData({...formData, position: e.target.value})} 
                  />
                  <Input 
                     label="Связанная компания"
                     list="company-suggestions"
                     value={formData.organization || ''} 
                     onChange={e => setFormData({...formData, organization: e.target.value})} 
                     placeholder="Выберите или введите..."
                  />
                  <datalist id="company-suggestions">
                         {uniqueOrganizations.map(org => <option key={org} value={org} />)}
                  </datalist>

                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Телефон*"
                        value={formData.phone || ''} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        required 
                      />
                      <Input 
                        label="2-й Телефон"
                        value={formData.secondPhone || ''} 
                        onChange={e => setFormData({...formData, secondPhone: e.target.value})} 
                      />
                  </div>
                  <Input 
                    label="Почта"
                    type="email"
                    value={formData.email || ''} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                 </>
              )}
        </form>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedItem?.title || selectedItem?.name || selectedItem?.subject || 'Детали'}
        footer={
           <div className="flex gap-3 w-full">
             <Button variant="secondary" onClick={() => { setIsDetailModalOpen(false); openModal(selectedItem); }} className="flex-1">Редактировать</Button>
             {selectedItem?.phone && (
                 <a href={`tel:${selectedItem.phone}`} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all text-center flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4"/> Позвонить
                 </a>
             )}
           </div>
        }
      >
               <div className="space-y-6">
                  {/* Basic Info */}
                   <div className="grid grid-cols-2 gap-6">
                      {selectedItem && Object.entries(selectedItem).map(([key, value]) => {
                          if (['id', 'companyId', 'contactId', 'relatedEntityId', 'inn'].includes(key) || value === undefined || value === null || value === '') return null;
                          if (key === 'phone' || key === 'secondPhone') {
                             return (
                                 <div key={key}>
                                     <span className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase block mb-1">{key === 'phone' ? 'Телефон' : '2-й Телефон'}</span>
                                     <a href={`tel:${value}`} className="font-medium text-primary-600 hover:underline flex items-center gap-1"><Phone className="w-3 h-3"/> {String(value)}</a>
                                 </div>
                             );
                          }
                          if (key === 'email' || key === 'secondEmail') {
                              return (
                                  <div key={key}>
                                      <span className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase block mb-1">{key === 'email' ? 'Почта' : '2-я Почта'}</span>
                                      <a href={`mailto:${value}`} className="font-medium text-primary-600 hover:underline flex items-center gap-1"><Mail className="w-3 h-3"/> {String(value)}</a>
                                  </div>
                              );
                          }
                          // Friendly Labels
                          const labelMap: any = { title: 'Название', clientName: 'Клиент', value: 'Сумма', stage: 'Статус', name: 'Имя', industry: 'Отрасль', address: 'Адрес', bin: 'БИН', website: 'Сайт', director: 'Руководитель', position: 'Должность', organization: 'Компания', subject: 'Тема', type: 'Тип', date: 'Дата', status: 'Статус', createdAt: 'Дата создания', lastContactDate: 'Последний контакт', expectedClose: 'Ожидаемое закрытие' };
                          
                          return (
                              <div key={key} className="col-span-1">
                                  <span className="text-xs font-bold text-gray-900 dark:text-gray-300 uppercase block mb-1">{labelMap[key] || key}</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{key === 'value' ? `₸${Number(value).toLocaleString()}` : String(value)}</span>
                              </div>
                          );
                      })}
                   </div>

                   {/* Linked Contacts Logic (if Company) */}
                   {activeTab === 'COMPANIES' && selectedItem && (
                       <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                           <h4 className="font-bold text-gray-900 dark:text-white mb-3">Связанные люди</h4>
                           <div className="space-y-2">
                               {getLinkedContacts(selectedItem.id).map(c => (
                                   <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center">
                                       <div>
                                           <div className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</div>
                                           <div className="text-xs text-gray-500">{c.position}</div>
                                       </div>
                                       <a href={`tel:${c.phone}`} className="p-2 bg-white dark:bg-gray-600 rounded-full shadow-sm text-primary-600"><Phone className="w-3 h-3"/></a>
                                   </div>
                               ))}
                               {getLinkedContacts(selectedItem.id).length === 0 && <span className="text-sm text-gray-400">Нет связанных людей</span>}
                           </div>
                       </div>
                   )}
               </div>
      </Modal>
    </div>
  );
};

export default CRM;
