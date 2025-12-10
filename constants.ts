

import { Task, TaskStatus, Deal, DealStage, DocumentItem, Article, SystemLog, Company, Contact, CrmActivity, TeamMember, Project, AppPermissions } from './types';

// New: Permissions Matrix
export const INITIAL_PERMISSIONS: AppPermissions = {
    ADMIN: {
        CRM: { READ: true, CREATE: true, UPDATE: true, DELETE: true, EXPORT: true, IMPORT: true },
        PROJECTS: { READ: true, CREATE: true, UPDATE: true, DELETE: true },
        DOCUMENTS: { READ: true, CREATE: true, UPDATE: true, DELETE: true },
        SETTINGS: { READ: true, UPDATE: true }
    },
    MANAGER: {
        CRM: { READ: true, CREATE: true, UPDATE: true, DELETE: false, EXPORT: true, IMPORT: false },
        PROJECTS: { READ: true, CREATE: true, UPDATE: true, DELETE: false },
        DOCUMENTS: { READ: true, CREATE: true, UPDATE: true, DELETE: false },
        SETTINGS: { READ: false }
    },
    EMPLOYEE: {
        CRM: { READ: true, CREATE: true, UPDATE: false, DELETE: false, EXPORT: false, IMPORT: false },
        PROJECTS: { READ: true, CREATE: false, UPDATE: true, DELETE: false },
        DOCUMENTS: { READ: true, CREATE: true, UPDATE: false, DELETE: false },
        SETTINGS: { READ: false }
    }
};

// New: Projects with Access
export const INITIAL_PROJECTS: Project[] = [
    { id: 'p1', name: 'ТЦ Риверсайд', access: 'PUBLIC', allowedUsers: [] },
    { id: 'p2', name: 'Городской Мост', access: 'PUBLIC', allowedUsers: [] },
    { id: 'p3', name: 'Внутренние', access: 'PRIVATE', allowedUsers: ['u1', 'u2'] }, // Private to Admin & Manager
    { id: 'p4', name: 'Комплаенс', access: 'PUBLIC', allowedUsers: [] }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Схемы ОВК (HVAC)', description: 'Доработать схемы вентиляции для ТЦ Риверсайд.', assignee: 'Алексей М.', observer: 'Админ', dueDate: '2023-11-15', status: TaskStatus.IN_PROGRESS, priority: 'Высокий', project: 'ТЦ Риверсайд' },
  { id: 't1-1', title: 'Проверка воздуховодов', description: 'Подзадача для схем ОВК', assignee: 'Алексей М.', observer: 'Админ', dueDate: '2023-11-14', status: TaskStatus.TODO, priority: 'Средний', project: 'ТЦ Риверсайд', parentId: 't1' },
  { id: 't2', title: 'Проверка прочности конструкций', description: 'Расчет нагрузки на опорные балки.', assignee: 'Светлана К.', dueDate: '2023-11-20', status: TaskStatus.REVIEW, priority: 'Высокий', project: 'Городской Мост' },
  { id: 't3', title: 'Подготовка к встрече', description: 'Слайды для отчета за 4 квартал.', assignee: 'Иван Д.', dueDate: '2023-11-12', status: TaskStatus.TODO, priority: 'Средний', project: 'Внутренние' },
  { id: 't4', title: 'Обновление инструкций ТБ', description: 'Пересмотр руководства по безопасности 2024.', assignee: 'Михаил Р.', dueDate: '2023-10-01', status: TaskStatus.DONE, priority: 'Низкий', project: 'Комплаенс' },
];

export const INITIAL_COMPANIES: Company[] = [
  { 
    id: 'c1', 
    name: 'TechCorp Industries', 
    industry: 'Технологии', 
    phone: '+7 (495) 123-45-67', 
    secondPhone: '+7 (777) 111-22-33',
    email: 'info@techcorp.ru', 
    secondEmail: 'support@techcorp.ru',
    address: 'Москва, ул. Ленина, 1', 
    bin: '123456789012', 
    website: 'techcorp.ru', 
    director: 'Александр Технов',
    createdAt: '2023-01-15'
  },
  { 
    id: 'c2', 
    name: 'Департамент Градостроительства', 
    industry: 'Госсектор', 
    phone: '+7 (495) 987-65-43', 
    secondPhone: '',
    email: 'planning@city.ru', 
    secondEmail: '',
    address: 'Москва, пл. Революции, 5', 
    bin: '987654321098', 
    website: 'mos.ru',
    director: 'Сергей Собянин',
    createdAt: '2022-05-20'
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  { 
    id: 'ct1', 
    name: 'Алиса Смирнова', 
    companyId: 'c1', 
    organization: 'TechCorp Industries', 
    phone: '+7 (900) 111-22-33', 
    secondPhone: '+7 (701) 555-00-99',
    email: 'alice@techcorp.ru', 
    position: 'Директор по закупкам', 
    address: 'ул. Ленина, 1, оф. 20',
    lastContactDate: '2023-11-01'
  },
  { 
    id: 'ct2', 
    name: 'Боб Грин', 
    companyId: 'c2', 
    organization: 'Департамент Градостроительства', 
    phone: '+7 (900) 444-55-66', 
    secondPhone: '',
    email: 'bob@city.ru', 
    position: 'Главный инженер', 
    address: 'пл. Революции, 5',
    lastContactDate: '2023-10-25'
  },
];

export const INITIAL_DEALS: Deal[] = [
  { id: 'd1', clientName: 'TechCorp Industries', title: 'Вентиляция нового штаба', value: 15000000, stage: DealStage.NEGOTIATION, contactId: 'ct1', expectedClose: '2023-12-15', assignee: 'Алексей М.', projectId: 'ТЦ Риверсайд', statusComment: 'Ждем согласования сметы' },
  { id: 'd2', clientName: 'Деп. Градостроительства', title: 'Реновация моста', value: 450000000, stage: DealStage.CONTRACT, contactId: 'ct2', expectedClose: '2024-03-01', assignee: 'Светлана К.', projectId: 'Городской Мост', statusComment: 'Юристы проверяют договор' },
  { id: 'd3', clientName: 'Green Energy Co', title: 'Изыскания под солнечную ферму', value: 7500000, stage: DealStage.WON, contactId: 'ct2', expectedClose: '2023-10-01', assignee: 'Иван Д.', projectId: 'Внутренние', statusComment: 'Успешно завершено' },
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
  { 
      id: 'kb_mvp', 
      title: 'Презентация MVP: Engineering Centre HUB', 
      category: 'Стратегия', 
      content: '**Введение**\nEngineering Centre HUB — это единая цифровая экосистема, разработанная специально для нужд нашего центра. Это MVP (Минимально Жизнеспособный Продукт), который объединяет разрозненные процессы (продажи, проекты, документы) в одном окне, исключая потерю информации и повышая прозрачность работы.\n\n**Ключевой функционал:**\n- **CRM-система:** Полный цикл ведения сделки от заявки до договора. Kanban-доска, база компаний и контактов с историей взаимодействий.\n- **Управление проектами:** Гибкое управление задачами, статусы, приоритеты, подзадачи и привязка к исполнителям.\n- **Документооборот:** Централизованное хранение чертежей (DWG), смет (XLSX) и договоров (PDF) с быстрым поиском и фильтрацией.\n- **База знаний:** Корпоративная вики для стандартов, регламентов и онбординга сотрудников.\n- **Календарь:** Визуализация загрузки сотрудников, планирование встреч и звонков.\n\n**Дизайн и Стиль:**\n- **Концепция:** "Clean Corporate" — строгий, но современный интерфейс, сфокусированный на контенте.\n- **Технологии:** Адаптивный дизайн (Mobile/Desktop), поддержка Темной темы для работы в вечернее время, микро-анимации для улучшения UX.\n- **Брендинг:** Использование корпоративных цветов (Желтый/Черный) для повышения узнаваемости.\n\n**Преимущества:**\n- **Скорость:** Мгновенная загрузка и работа без перезагрузки страниц.\n- **Безопасность:** Разграничение прав доступа (Админ/Менеджер/Сотрудник) и приватные проекты.\n- **Автономность:** Независимость от зарубежных облачных сервисов (при локальном развертывании).\n\n**Недостатки MVP:**\n- Отсутствие прямой интеграции с 1С (на данном этапе).\n- Ручной ввод данных (нет автоматического парсинга почты).\n\n**План развития (Roadmap):**\n- **Q1 2024:** Интеграция с IP-телефонией (звонки из карточки клиента).\n- **Q2 2024:** Почтовый модуль (отправка КП и писем прямо из CRM).\n- **Q3 2024:** Двусторонняя синхронизация с 1С:Бухгалтерия для выставления счетов.\n- **Q4 2024:** AI-ассистент для генерации отчетов и саммари встреч.',
      updatedAt: new Date().toISOString(), 
      type: 'WORK', 
      author: 'Madi Seitzhapbar', 
      authorId: 'u1' 
  },
  { id: 'kb1', title: 'Стандарты AutoCAD', category: 'Инжиниринг', content: 'Необходимо соблюдать стандарты именования слоев...', updatedAt: '2023-09-15', type: 'WORK', author: 'Админ', authorId: 'u1' },
  { id: 'kb2', title: 'Процесс онбординга', category: 'HR', content: 'Новые сотрудники должны пройти инструктаж по ТБ в течение 3 дней...', updatedAt: '2023-10-20', type: 'WORK', author: 'Иван Д.', authorId: 'u4' },
  { id: 'kb3', title: 'Доступ к VPN', category: 'IT', content: 'Для подключения к защищенному серверу используйте клиент Cisco...', updatedAt: '2023-08-05', type: 'WORK', author: 'Админ', authorId: 'u1' },
  { id: 'kb4', title: 'Список книг', category: 'Развитие', content: 'Список рекомендованной литературы...', updatedAt: '2023-11-01', type: 'PERSONAL', author: 'Админ', authorId: 'u1' },
];

export const INITIAL_TEAM: TeamMember[] = [
  { id: 'u1', name: 'Madi Seitzhapbar', email: 'madi@engineering-centre.com', role: 'ADMIN', department: 'Управление', status: 'ACTIVE' },
  { id: 'u2', name: 'Алексей М.', email: 'alex@engineering-centre.com', role: 'MANAGER', department: 'Инженерия', status: 'ACTIVE' },
  { id: 'u3', name: 'Светлана К.', email: 'svetlana@engineering-centre.com', role: 'EMPLOYEE', department: 'Проектирование', status: 'ACTIVE' },
  { id: 'u4', name: 'Иван Д.', email: 'ivan@engineering-centre.com', role: 'EMPLOYEE', department: 'HR', status: 'INVITED' },
];

export const INITIAL_LOGS: SystemLog[] = [
  { id: 'l1', timestamp: '2023-11-11 09:15:00', user: 'Алексей М.', action: 'Обновил задачу t1', module: 'PROJECTS' },
  { id: 'l2', timestamp: '2023-11-11 10:30:25', user: 'Система', action: 'Резервное копирование завершено', module: 'SYSTEM' },
  { id: 'l3', timestamp: '2023-11-11 11:05:10', user: 'Светлана К.', action: 'Загрузила документ doc2', module: 'DOCUMENTS' },
];
