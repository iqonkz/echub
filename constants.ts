import { Task, TaskStatus, Deal, DealStage, DocumentItem, Article, SystemLog, Company, Contact, CrmActivity } from './types';

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Схемы ОВК (HVAC)', description: 'Доработать схемы вентиляции для ТЦ Риверсайд.', assignee: 'Алексей М.', observer: 'Админ', dueDate: '2023-11-15', status: TaskStatus.IN_PROGRESS, priority: 'Высокий', project: 'ТЦ Риверсайд' },
  { id: 't1-1', title: 'Проверка воздуховодов', description: 'Подзадача для схем ОВК', assignee: 'Алексей М.', observer: 'Админ', dueDate: '2023-11-14', status: TaskStatus.TODO, priority: 'Средний', project: 'ТЦ Риверсайд', parentId: 't1' },
  { id: 't2', title: 'Проверка прочности конструкций', description: 'Расчет нагрузки на опорные балки.', assignee: 'Светлана К.', dueDate: '2023-11-20', status: TaskStatus.REVIEW, priority: 'Высокий', project: 'Городской Мост' },
  { id: 't3', title: 'Подготовка к встрече', description: 'Слайды для отчета за 4 квартал.', assignee: 'Иван Д.', dueDate: '2023-11-12', status: TaskStatus.TODO, priority: 'Средний', project: 'Внутренние' },
  { id: 't4', title: 'Обновление инструкций ТБ', description: 'Пересмотр руководства по безопасности 2024.', assignee: 'Михаил Р.', dueDate: '2023-10-01', status: TaskStatus.DONE, priority: 'Низкий', project: 'Комплаенс' },
];

export const INITIAL_COMPANIES: Company[] = [
  { id: 'c1', name: 'TechCorp Industries', industry: 'Технологии', phone: '+7 (495) 123-45-67', email: 'info@techcorp.ru', address: 'Москва, ул. Ленина, 1', inn: '7701234567', website: 'techcorp.ru' },
  { id: 'c2', name: 'Департамент Градостроительства', industry: 'Госсектор', phone: '+7 (495) 987-65-43', email: 'planning@city.ru', address: 'Москва, пл. Революции, 5', inn: '7709876543', website: 'mos.ru' },
];

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'ct1', name: 'Алиса Смирнова', companyId: 'c1', organization: 'TechCorp Industries', phone: '+7 (900) 111-22-33', email: 'alice@techcorp.ru', position: 'Директор по закупкам', address: 'ул. Ленина, 1, оф. 20' },
  { id: 'ct2', name: 'Боб Грин', companyId: 'c2', organization: 'Департамент Градостроительства', phone: '+7 (900) 444-55-66', email: 'bob@city.ru', position: 'Главный инженер', address: 'пл. Революции, 5' },
];

export const INITIAL_DEALS: Deal[] = [
  { id: 'd1', clientName: 'TechCorp Industries', title: 'Вентиляция нового штаба', value: 15000000, stage: DealStage.NEGOTIATION, contactId: 'ct1', expectedClose: '2023-12-15' },
  { id: 'd2', clientName: 'Деп. Градостроительства', title: 'Реновация моста', value: 450000000, stage: DealStage.ESTIMATION, contactId: 'ct2', expectedClose: '2024-03-01' },
  { id: 'd3', clientName: 'Green Energy Co', title: 'Изыскания под солнечную ферму', value: 7500000, stage: DealStage.WON, contactId: 'ct2', expectedClose: '2023-10-01' },
];

export const INITIAL_ACTIVITIES: CrmActivity[] = [
  { id: 'a1', type: 'Звонок', subject: 'Уточнение ТЗ', date: '2023-11-14', status: 'Запланировано', relatedEntityId: 'd1' },
  { id: 'a2', type: 'Встреча', subject: 'Презентация проекта', date: '2023-11-16', status: 'Запланировано', relatedEntityId: 'd2' },
];

export const INITIAL_DOCS: DocumentItem[] = [
  { id: 'doc1', name: 'Спецификация_Проект_Альфа.pdf', type: 'PDF', size: '2.4 MB', updatedAt: '2023-11-01', author: 'Алексей М.', authorId: 'u2', source: 'Проект: ТЦ Риверсайд' },
  { id: 'doc2', name: 'План_Этажа_1.dwg', type: 'DWG', size: '14.5 MB', updatedAt: '2023-11-05', author: 'Светлана К.', authorId: 'u3', source: 'CRM: TechCorp' },
  { id: 'doc3', name: 'Бюджет_Кв4.xlsx', type: 'XLSX', size: '1.1 MB', updatedAt: '2023-11-10', author: 'Админ', authorId: 'u1', source: 'Внутренние' },
];

export const INITIAL_KB: Article[] = [
  { id: 'kb1', title: 'Стандарты AutoCAD', category: 'Инжиниринг', content: 'Необходимо соблюдать стандарты именования слоев...', updatedAt: '2023-09-15', type: 'WORK', author: 'Админ', authorId: 'u1' },
  { id: 'kb2', title: 'Процесс онбординга', category: 'HR', content: 'Новые сотрудники должны пройти инструктаж по ТБ в течение 3 дней...', updatedAt: '2023-10-20', type: 'WORK', author: 'Иван Д.', authorId: 'u4' },
  { id: 'kb3', title: 'Доступ к VPN', category: 'IT', content: 'Для подключения к защищенному серверу используйте клиент Cisco...', updatedAt: '2023-08-05', type: 'WORK', author: 'Админ', authorId: 'u1' },
  { id: 'kb4', title: 'Список книг', category: 'Развитие', content: 'Список рекомендованной литературы...', updatedAt: '2023-11-01', type: 'PERSONAL', author: 'Админ', authorId: 'u1' },
];

export const INITIAL_LOGS: SystemLog[] = [
  { id: 'l1', timestamp: '2023-11-11 09:15:00', user: 'Алексей М.', action: 'Обновил задачу t1', module: 'PROJECTS' },
  { id: 'l2', timestamp: '2023-11-11 10:30:25', user: 'Система', action: 'Резервное копирование завершено', module: 'SYSTEM' },
  { id: 'l3', timestamp: '2023-11-11 11:05:10', user: 'Светлана К.', action: 'Загрузила документ doc2', module: 'DOCUMENTS' },
];