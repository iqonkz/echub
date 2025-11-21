
export enum ModuleType {
  HOME = 'HOME',
  CRM = 'CRM',
  PROJECTS = 'PROJECTS',
  CALENDAR = 'CALENDAR',
  DOCUMENTS = 'DOCUMENTS',
  KNOWLEDGE = 'KNOWLEDGE',
  SETTINGS = 'SETTINGS',
}

export enum TaskStatus {
  TODO = 'Нужно сделать',
  IN_PROGRESS = 'В работе',
  REVIEW = 'На проверке',
  DONE = 'Готово',
}

export enum DealStage {
  NEW = 'Новая заявка',
  ESTIMATION = 'Оценка',
  NEGOTIATION = 'Переговоры',
  CONTRACT = 'Договор',
  WON = 'Сделка успешна',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'ADMIN' | 'USER';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  observer?: string; // New field
  dueDate: string;
  status: TaskStatus;
  priority: 'Высокий' | 'Средний' | 'Низкий';
  project: string;
  parentId?: string; // For subtasks
}

export interface Deal {
  id: string;
  clientName: string;
  title: string;
  value: number;
  stage: DealStage;
  contactId: string;
  expectedClose: string;
}

// New CRM Entities
export interface Company {
  id: string;
  name: string;
  industry: string; // Used as description or category
  phone: string;
  email: string;
  // New fields
  inn?: string;
  contactPerson?: string;
  extraPhone?: string;
  website?: string;
  address?: string;
}

export interface Contact {
  id: string;
  name: string;
  companyId: string;
  phone: string;
  email: string;
  position: string;
  // New fields
  organization?: string; // Text field if companyId not linked
  extraPhone?: string;
  address?: string;
}

export interface CrmActivity {
  id: string;
  type: 'Звонок' | 'Встреча' | 'Email';
  subject: string;
  date: string;
  status: 'Запланировано' | 'Выполнено';
  relatedEntityId: string; // Deal or Contact ID
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO Date string
  type: 'Встреча' | 'Задача';
  description?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'DWG' | 'DOCX' | 'XLSX';
  size: string;
  updatedAt: string;
  author: string; // Name of uploader
  authorId?: string; // ID for permission check
  source?: string; // "CRM: Deal Name" or "Project: Name"
  linkedEntityId?: string; // ID to open on click
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
