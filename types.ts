
export enum ModuleType {
  HOME = 'HOME',
  CRM = 'CRM',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  DOCUMENTS = 'DOCUMENTS',
  KNOWLEDGE = 'KNOWLEDGE',
  SETTINGS = 'SETTINGS',
}

export enum TaskStatus {
  TODO = 'Новая',
  IN_PROGRESS = 'В работе',
  REVIEW = 'Проверка',
  DONE = 'Готово',
}

export enum DealStage {
  NEW = 'Заявка',
  NEGOTIATION = 'Переговоры',
  CONTRACT = 'Договор',
  WON = 'Успешно',
  LOST = 'Безуспешно',
}

export interface CrmColumn {
    key: string;
    label: string;
    visible: boolean;
    order: number;
}

export interface CrmUserSettings {
    dealsColumns: CrmColumn[];
    companiesColumns: CrmColumn[];
    contactsColumns: CrmColumn[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'ADMIN' | 'USER';
  crmSettings?: CrmUserSettings;
  company?: string;
  position?: string;
  phone?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department: string;
  avatar?: string;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
}

export interface Project {
  id: string;
  name: string;
  access: 'PUBLIC' | 'PRIVATE' | 'CUSTOM';
  allowedUsers: string[]; // User IDs
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  observer?: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'Высокий' | 'Средний' | 'Низкий';
  project: string; // Stores Project Name for display
  parentId?: string;
}

export interface Deal {
  id: string;
  clientName: string;
  title: string;
  value: number;
  stage: DealStage;
  contactId: string;
  expectedClose: string;
  assignee?: string;      // New: Responsible person
  projectId?: string;     // New: Linked Project Name
  statusComment?: string; // New: Status comment
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  phone: string;
  secondPhone?: string;
  email: string;
  secondEmail?: string;
  bin?: string;
  director?: string;
  website?: string;
  address?: string;
  createdAt?: string;
  inn?: string; 
  contactPerson?: string; 
}

export interface Contact {
  id: string;
  name: string;
  companyId: string;
  phone: string;
  secondPhone?: string;
  email: string;
  position: string;
  organization?: string;
  address?: string;
  lastContactDate?: string;
  extraPhone?: string; 
}

export interface CrmActivity {
  id: string;
  type: 'Звонок' | 'Встреча' | 'Email';
  subject: string;
  date: string;
  status: 'Запланировано' | 'Выполнено';
  relatedEntityId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  type: 'Встреча' | 'Задача';
  description?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'DWG' | 'DOCX' | 'XLSX';
  size: string;
  updatedAt: string;
  author: string;
  authorId?: string;
  source?: string;
  linkedEntityId?: string;
  folder?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
  type: 'WORK' | 'PERSONAL';
  author: string;
  authorId: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
}

// --- Permissions Types ---
export type PermissionAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT';
export type AppRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface RolePermissions {
    [module: string]: {
        [action in PermissionAction]?: boolean;
    };
}

export interface AppPermissions {
    ADMIN: RolePermissions;
    MANAGER: RolePermissions;
    EMPLOYEE: RolePermissions;
}

// --- Recycle Bin ---
export interface DeletedItem {
    id: string;
    originalId: string;
    collectionName: string;
    data: any;
    deletedAt: string;
    deletedBy: string;
    displayTitle: string; // Helper for UI
    typeLabel: string; // Helper for UI (e.g., "Сделка", "Задача")
}
