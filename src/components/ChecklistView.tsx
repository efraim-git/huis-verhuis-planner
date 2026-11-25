import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { PHASES } from '../data/defaultData';
import { UI_COPY } from '../data/translations';
import {
  diffDaysYmd,
  formatRangeLabel,
  formatYmd,
  getDateRangeEnd,
} from '../utils/dateRange';
import type {
  Language,
  MilestoneDate,
  PhaseId,
  TaskItem,
  TaskStatusFilter,
} from '../types/planner';

interface ChecklistViewProps {
  language: Language;
  tasks: TaskItem[];
  milestones: MilestoneDate[];
  houseName: string;
  onToggleTask: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<TaskItem, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
  onNavigateToDates: () => void;
}

function getDateBadgeStatus(
  dateStr: string,
  durationDays: number | undefined,
  completed: boolean,
  language: Language
) {
  if (!dateStr) return null;
  const todayStr = formatYmd(new Date());
  const endStr = getDateRangeEnd(dateStr, durationDays);
  const formatted = formatRangeLabel(dateStr, durationDays, language);

  let statusText = '';
  let tone: 'overdue' | 'today' | 'soon' | 'normal' = 'normal';

  if (!completed) {
    if (endStr < todayStr) {
      statusText = language === 'en' ? 'Overdue' : 'Verlopen';
      tone = 'overdue';
    } else if (dateStr <= todayStr && todayStr <= endStr) {
      statusText = language === 'en' ? 'Today' : 'Vandaag';
      tone = 'today';
    } else {
      const diff = diffDaysYmd(todayStr, dateStr);
      if (diff <= 7) {
        statusText = language === 'en' ? `In ${diff}d` : `Over ${diff}d`;
        tone = 'soon';
      }
    }
  }

  return { formatted, statusText, tone };
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  language,
  tasks,
  milestones,
  houseName,
  onToggleTask,
  onUpdateNote,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onNavigateToDates,
}) => {
  const t = UI_COPY[language];
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Task Modal (Add or Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPhase, setFormPhase] = useState<PhaseId>('fase-1');
  const [formTiming, setFormTiming] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formUrgent, setFormUrgent] = useState(false);

  const totalCount = tasks.length;
  const doneCount = useMemo(() => tasks.filter((item) => item.completed).length, [tasks]);
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const phaseCounts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {
      all: { total: totalCount, done: doneCount },
    };
    for (const phase of PHASES) {
      map[phase.id] = { total: 0, done: 0 };
    }
    for (const task of tasks) {
      const entry = map[task.phaseId];
      if (entry) {
        entry.total += 1;
        if (task.completed) entry.done += 1;
      }
    }
    return map;
  }, [tasks, totalCount, doneCount]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedPhase !== 'all' && task.phaseId !== selectedPhase) return false;
      if (statusFilter === 'todo' && task.completed) return false;
      if (statusFilter === 'done' && !task.completed) return false;
      if (statusFilter === 'urgent' && (!task.urgent || task.completed)) return false;
      return true;
    });
  }, [tasks, selectedPhase, statusFilter]);

  const groupedPhases = useMemo(() => {
    const phasesToShow =
      selectedPhase === 'all'
        ? PHASES
        : PHASES.filter((p) => p.id === selectedPhase);
    return phasesToShow
      .map((phase) => ({
        phase,
        items: filteredTasks.filter((task) => task.phaseId === phase.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredTasks, selectedPhase]);

  const nextMilestone = useMemo(() => {
    const todayStr = formatYmd(new Date());
    const upcoming = milestones
      .filter((m) => m.date && m.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [milestones]);

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormPhase(selectedPhase === 'all' ? 'fase-1' : selectedPhase);
    setFormTiming('');
    setFormDueDate('');
    setFormDuration('');
    setFormDetails('');
    setFormUrgent(false);
    setModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setFormTitle(language === 'en' && task.titleEn ? task.titleEn : task.title);
    setFormPhase(task.phaseId);
    setFormTiming(
      language === 'en' && task.timingNoteEn ? task.timingNoteEn : task.timingNote
    );
    setFormDueDate(task.dueDate || '');
    setFormDuration(
      task.durationDays && task.durationDays >= 1 ? String(task.durationDays) : ''
    );
    setFormDetails(
      language === 'en' && task.detailsEn ? task.detailsEn : task.details
    );
    setFormUrgent(task.urgent);
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) return;

    const parsedDur = parseInt(formDuration, 10);
    const durationDays =
      !isNaN(parsedDur) && parsedDur >= 1 ? Math.min(365, parsedDur) : undefined;

    if (editingTaskId) {
      onUpdateTask(editingTaskId, {
        phaseId: formPhase,
        ...(language === 'en'
          ? {
              titleEn: cleanTitle,
              timingNoteEn: formTiming.trim(),
              detailsEn: formDetails.trim(),
            }
          : {
              title: cleanTitle,
              timingNote: formTiming.trim(),
              details: formDetails.trim(),
            }),
        dueDate: formDueDate,
        durationDays,
        urgent: formUrgent,
      });
    } else {
      onAddTask({
        phaseId: formPhase,
        title: cleanTitle,
        timingNote: formTiming.trim() || (language === 'en' ? 'Flexible' : 'Flexibel'),
        dueDate: formDueDate,
        durationDays,
        details: formDetails.trim(),
        note: '',
        urgent: formUrgent,
      });
    }
    setModalOpen(false);
  };

  const getTaskText = (task: TaskItem) => ({
    title: language === 'en' && task.titleEn ? task.titleEn : task.title,
    timing:
      language === 'en' && task.timingNoteEn
        ? task.timingNoteEn
        : task.timingNote,
    details:
      language === 'en' && task.detailsEn ? task.detailsEn : task.details,
  });

  const getPhaseLabel = (phaseId: PhaseId) => {
    const found = PHASES.find((p) => p.id === phaseId);
    if (!found) return '';
    return language === 'en' ? found.shortLabelEn : found.shortLabelNl;
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
      {/* Left Desktop Sidebar / Mobile Overview Card */}
      <aside className="lg:col-span-4 lg:sticky lg:top-[76px] space-y-5 mb-5 lg:mb-0">
        <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-500 truncate">
                {houseName ? houseName : t.subtitleDefault}
              </p>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <span className="font-display text-3xl font-bold tracking-tight text-stone-900 tabular-nums">
                  {pct}%
                </span>
                <span className="text-sm text-stone-600 tabular-nums">
                  {doneCount} / {totalCount} {t.tasksDoneOf}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] active:scale-[0.98] transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addTask}</span>
            </button>
          </div>

          <div
            className="mt-4 h-2.5 w-full rounded-full bg-stone-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#1B4332] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {nextMilestone && (
            <button
              type="button"
              onClick={onNavigateToDates}
              className="mt-4 pt-3.5 border-t border-stone-100 w-full flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-xs text-stone-500">
                  {language === 'en' ? 'Next milestone' : 'Eerstvolgende mijlpaal'}
                </span>
                <p className="text-sm font-medium text-stone-900 truncate group-hover:text-[#1B4332] transition-colors">
                  {language === 'en' && nextMilestone.labelEn
                    ? nextMilestone.labelEn
                    : nextMilestone.label}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-[#1B4332] tabular-nums shrink-0 ml-3">
                {new Date(nextMilestone.date + 'T00:00:00').toLocaleDateString(
                  language === 'en' ? 'en-GB' : 'nl-NL',
                  { day: 'numeric', month: 'short' }
                )}
              </span>
            </button>
          )}
        </section>

        {/* Desktop Vertical Phase Selector */}
        <nav
          aria-label="Fasen"
          className="hidden lg:block bg-white rounded-2xl border border-stone-200/90 p-2 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left text-sm transition cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-[#1B4332] text-white font-medium'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span>{t.allPhases}</span>
            <span
              className={`text-xs font-mono tabular-nums ${
                selectedPhase === 'all' ? 'text-stone-200' : 'text-stone-500'
              }`}
            >
              {phaseCounts.all.done}/{phaseCounts.all.total}
            </span>
          </button>

          <div className="mt-1 space-y-1">
            {PHASES.map((phase) => {
              const count = phaseCounts[phase.id];
              const active = selectedPhase === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {language === 'en' ? phase.shortLabelEn : phase.shortLabelNl}:{' '}
                      {language === 'en' ? phase.titleEn : phase.titleNl}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        active ? 'text-stone-200' : 'text-stone-500'
                      }`}
                    >
                      {language === 'en' ? phase.timeframeEn : phase.timeframeNl}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      active ? 'text-stone-200' : 'text-stone-500'
                    }`}
                  >
                    {count.done}/{count.total}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Column */}
      <div className="lg:col-span-8 space-y-4">
        {/* Mobile Horizontal Scrollable Phase Tabs */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 w-max pb-1">
            <button
              type="button"
              onClick={() => setSelectedPhase('all')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
                selectedPhase === 'all'
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
              }`}
            >
              {t.allPhases} ({phaseCounts.all.done}/{phaseCounts.all.total})
            </button>
            {PHASES.map((phase) => {
              const count = phaseCounts[phase.id];
              const active = selectedPhase === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-[#1B4332] text-white shadow-sm'
                      : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
                  }`}
                >
                  {language === 'en' ? phase.shortLabelEn : phase.shortLabelNl} ·{' '}
                  {count.done}/{count.total}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center p-1 bg-stone-200/70 rounded-xl w-full sm:w-auto"
            role="tablist"
          >
            {(
              [
                { id: 'all', label: t.filterAll },
                { id: 'todo', label: t.filterTodo },
                { id: 'done', label: t.filterDone },
                { id: 'urgent', label: t.filterUrgent },
              ] as { id: TaskStatusFilter; label: string }[]
            ).map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {groupedPhases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-8 text-center">
            <p className="text-sm text-stone-600">{t.noTasksMatch}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedPhase('all');
                setStatusFilter('all');
              }}
              className="mt-3 min-h-[44px] px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-800 hover:bg-stone-50 transition cursor-pointer"
            >
              {t.showAllTasks}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedPhases.map(({ phase, items }) => (
              <section key={phase.id} className="space-y-2.5">
                <header className="px-1 flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900 text-balance">
                      {language === 'en' ? phase.shortLabelEn : phase.shortLabelNl}:{' '}
                      {language === 'en' ? phase.titleEn : phase.titleNl}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {language === 'en' ? phase.timeframeEn : phase.timeframeNl}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-stone-500 tabular-nums shrink-0">
                    {phaseCounts[phase.id].done}/{phaseCounts[phase.id].total}
                  </span>
                </header>

                <div className="space-y-2.5">
                  {items.map((task) => {
                    const { title, timing, details } = getTaskText(task);
                    const isExpanded = !!expandedTaskIds[task.id];
                    const hasNote = task.note.trim().length > 0;
                    const dateBadge = getDateBadgeStatus(
                      task.dueDate || '',
                      task.durationDays,
                      task.completed,
                      language
                    );

                    return (
                      <article
                        key={task.id}
                        className={`bg-white rounded-2xl border transition-colors shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${
                          task.completed
                            ? 'border-stone-200/60 bg-stone-50/70'
                            : 'border-stone-200/90'
                        }`}
                      >
                        <div className="p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                          <button
                            type="button"
                            onClick={() => onToggleTask(task.id)}
                            aria-label={
                              task.completed
                                ? `${title} (${t.filterDone})`
                                : `${title} (${t.filterTodo})`
                            }
                            aria-pressed={task.completed}
                            className="min-h-[44px] min-w-[44px] -m-1 flex items-center justify-center shrink-0 rounded-xl hover:bg-stone-100/70 active:scale-95 transition cursor-pointer"
                          >
                            <span
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                                task.completed
                                  ? 'bg-[#1B4332] border-[#1B4332] text-white'
                                  : 'bg-white border-stone-300 text-transparent hover:border-[#1B4332]'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </span>
                          </button>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(task.id)}
                              className="w-full text-left cursor-pointer group"
                            >
                              <h3
                                className={`text-[15px] sm:text-base font-medium leading-snug transition-colors ${
                                  task.completed
                                    ? 'line-through text-stone-400'
                                    : 'text-stone-900 group-hover:text-[#1B4332]'
                                }`}
                              >
                                {title}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                                {selectedPhase === 'all' && (
                                  <>
                                    <span>{getPhaseLabel(task.phaseId)}</span>
                                    <span aria-hidden="true">·</span>
                                  </>
                                )}
                                <span>{timing}</span>

                                {dateBadge && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span
                                      className={`inline-flex items-center gap-1 font-mono font-medium tabular-nums ${
                                        dateBadge.tone === 'overdue'
                                          ? 'text-red-700'
                                          : dateBadge.tone === 'today' ||
                                              dateBadge.tone === 'soon'
                                            ? 'text-amber-700'
                                            : 'text-[#1B4332]'
                                      }`}
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{dateBadge.formatted}</span>
                                      {dateBadge.statusText && (
                                        <span>({dateBadge.statusText})</span>
                                      )}
                                    </span>
                                  </>
                                )}

                                {task.urgent && !task.completed && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>{t.urgentLabel}</span>
                                    </span>
                                  </>
                                )}
                                {hasNote && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1 text-[#1B4332] font-medium">
                                      <StickyNote className="w-3.5 h-3.5" />
                                      <span>
                                        {language === 'en' ? 'Note saved' : 'Notitie'}
                                      </span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpand(task.id)}
                            aria-expanded={isExpanded}
                            aria-label={t.detailsTips}
                            className="min-h-[44px] min-w-[44px] -m-1 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100/70 transition shrink-0 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-stone-100 space-y-3.5">
                            {details && (
                              <div className="pt-2.5 text-sm text-stone-600 leading-relaxed">
                                <span className="font-medium text-stone-800 block text-xs mb-1">
                                  {t.detailsTips}
                                </span>
                                {details}
                              </div>
                            )}

                            {/* Start Date + Duration (days) */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-6">
                                <label
                                  htmlFor={`date-${task.id}`}
                                  className="block text-xs font-medium text-stone-700 mb-1.5"
                                >
                                  {t.dueDateLabel}
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      id={`date-${task.id}`}
                                      type="date"
                                      value={task.dueDate || ''}
                                      onChange={(e) =>
                                        onUpdateTask(task.id, {
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-sm font-mono text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                                    />
                                  </div>
                                  {task.dueDate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateTask(task.id, {
                                          dueDate: '',
                                          durationDays: undefined,
                                        })
                                      }
                                      className="min-h-[44px] px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer whitespace-nowrap"
                                    >
                                      {t.clearDate}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="sm:col-span-6">
                                <label
                                  htmlFor={`dur-${task.id}`}
                                  className="block text-xs font-medium text-stone-700 mb-1.5"
                                >
                                  {t.durationLabel}
                                </label>
                                <input
                                  id={`dur-${task.id}`}
                                  type="number"
                                  min="1"
                                  max="365"
                                  inputMode="numeric"
                                  placeholder={t.durationPlaceholder}
                                  value={
                                    task.durationDays && task.durationDays >= 1
                                      ? String(task.durationDays)
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                      onUpdateTask(task.id, {
                                        durationDays: undefined,
                                      });
                                    } else {
                                      const n = parseInt(raw, 10);
                                      if (!isNaN(n) && n >= 1) {
                                        onUpdateTask(task.id, {
                                          durationDays: Math.min(365, n),
                                        });
                                      }
                                    }
                                  }}
                                  className="w-full sm:max-w-[140px] min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`note-${task.id}`}
                                className="block text-xs font-medium text-stone-700 mb-1.5"
                              >
                                {t.noteLabel}
                              </label>
                              <textarea
                                id={`note-${task.id}`}
                                rows={2}
                                value={task.note}
                                onChange={(e) => onUpdateNote(task.id, e.target.value)}
                                placeholder={t.notePlaceholder}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#1B4332] focus:outline-none transition"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>{t.editTask}</span>
                              </button>

                              {confirmDeleteId === task.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteTask(task.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition cursor-pointer"
                                  >
                                    {t.deleteTask}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                                  >
                                    {t.cancel}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(task.id)}
                                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.deleteTask}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {editingTaskId ? t.editTask : t.addTask}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.taskTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.taskPhaseLabel}
                </label>
                <select
                  value={formPhase}
                  onChange={(e) => setFormPhase(e.target.value as PhaseId)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                >
                  {PHASES.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {language === 'en' ? phase.shortLabelEn : phase.shortLabelNl}:{' '}
                      {language === 'en' ? phase.titleEn : phase.titleNl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.dueDateLabel}
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.durationLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    inputMode="numeric"
                    placeholder={t.durationPlaceholder}
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono tabular-nums text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.taskTimingLabel}
                </label>
                <input
                  type="text"
                  value={formTiming}
                  onChange={(e) => setFormTiming(e.target.value)}
                  placeholder={t.taskTimingPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.taskDetailsLabel}
                </label>
                <textarea
                  rows={3}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formUrgent}
                  onChange={(e) => setFormUrgent(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#1B4332]"
                />
                <span className="text-sm text-stone-800">{t.taskUrgentToggle}</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
