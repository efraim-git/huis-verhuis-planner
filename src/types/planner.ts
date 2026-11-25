export type Language = 'nl' | 'en';

export type ViewTab = 'checklist' | 'kalender' | 'klussen' | 'budget' | 'dates';

export type PhaseId = 'fase-1' | 'fase-2' | 'fase-3' | 'fase-4' | 'fase-5';

export type TaskStatusFilter = 'all' | 'todo' | 'done' | 'urgent';

export type ExpenseCategoryGroup = 'kk' | 'moving';

export type KlusExecutor = 'diy' | 'pro';

export type KlusStatus = 'planned' | 'in_progress' | 'done';

export interface PhaseMeta {
  id: PhaseId;
  shortLabelNl: string;
  shortLabelEn: string;
  titleNl: string;
  titleEn: string;
  timeframeNl: string;
  timeframeEn: string;
}

export interface TaskItem {
  id: string;
  phaseId: PhaseId;
  title: string;
  titleEn?: string;
  timingNote: string;
  timingNoteEn?: string;
  dueDate?: string; // YYYY-MM-DD or ''
  durationDays?: number; // >= 1, optional
  details: string;
  detailsEn?: string;
  note: string;
  completed: boolean;
  urgent: boolean;
  isCustom?: boolean;
}

export interface RoomItem {
  id: string;
  name: string;
  nameEn?: string;
  isCustom?: boolean;
}

export interface KlusItem {
  id: string;
  roomId: string;
  title: string;
  executor: KlusExecutor;
  contractorName?: string;
  contractorPhone?: string;
  plannedDate: string; // YYYY-MM-DD or ''
  durationDays?: number; // >= 1, optional
  status: KlusStatus;
  estimatedCost: number;
  actualCost: number;
  note?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  titleEn?: string;
  group: ExpenseCategoryGroup;
  estimated: number;
  actual: number;
  paid: boolean;
  note: string;
  isCustom?: boolean;
}

export interface MilestoneDate {
  id: string;
  label: string;
  labelEn?: string;
  description: string;
  descriptionEn?: string;
  date: string; // YYYY-MM-DD or ''
  timeNote: string;
  isCustom?: boolean;
}

export interface ContactPerson {
  id: string;
  role: string;
  roleEn?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
  isCustom?: boolean;
}

export interface PlannerData {
  version: number;
  language: Language;
  houseName: string;
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  milestones: MilestoneDate[];
  contacts: ContactPerson[];
  rooms: RoomItem[];
  klussen: KlusItem[];
}

export interface AiSuggestedTask {
  title: string;
  phaseId: PhaseId;
  timingNote: string;
  details: string;
  urgent: boolean;
}

export interface AiAssistResponse {
  answer: string;
  suggestedTasks: AiSuggestedTask[];
}
