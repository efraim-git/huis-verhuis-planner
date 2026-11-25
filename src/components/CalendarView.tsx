import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  GanttChart,
  Hammer,
  List,
  Star,
  X,
} from 'lucide-react';
import { PHASES } from '../data/defaultData';
import { UI_COPY } from '../data/translations';
import {
  addDaysYmd,
  buildIcsCalendar,
  diffDaysYmd,
  expandDateRange,
  formatRangeLabel,
  formatYmd,
  getDateRangeEnd,
  getEffectiveDuration,
  parseYmd,
} from '../utils/dateRange';
import type {
  KlusItem,
  Language,
  MilestoneDate,
  RoomItem,
  TaskItem,
  ViewTab,
} from '../types/planner';

interface CalendarViewProps {
  language: Language;
  houseName: string;
  milestones: MilestoneDate[];
  tasks: TaskItem[];
  klussen: KlusItem[];
  rooms: RoomItem[];
  onToggleTask: (id: string) => void;
  onToggleKlusDone: (klus: KlusItem) => void;
  onNavigate: (tab: ViewTab) => void;
}

type CalendarKind = 'milestone' | 'task' | 'klus';

interface UnifiedItem {
  id: string;
  kind: CalendarKind;
  startDate: string;
  endDate: string;
  durationDays: number;
  title: string;
  subtitle: string;
  completed?: boolean;
  sourceTask?: TaskItem;
  sourceKlus?: KlusItem;
  sourceMilestone?: MilestoneDate;
}

interface DayAppearance {
  item: UnifiedItem;
  dayIndex: number; // 1-based day index within span
}

function getIsoWeekNumber(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const DAY_COL_WIDTH = 50;

export const CalendarView: React.FC<CalendarViewProps> = ({
  language,
  houseName,
  milestones,
  tasks,
  klussen,
  rooms,
  onToggleTask,
  onToggleKlusDone,
  onNavigate,
}) => {
  const t = UI_COPY[language];
  const todayStr = useMemo(() => formatYmd(new Date()), []);
  const todayDate = useMemo(() => parseYmd(todayStr), [todayStr]);

  const [viewMode, setViewMode] = useState<'month' | 'block' | 'list'>('month');
  const [cursorMonth, setCursorMonth] = useState<Date>(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Blokkenschema filter & active selected block
  const [blockFilter, setBlockFilter] = useState<'all' | CalendarKind>('all');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // ICS Export Feedback
  const [icsFeedback, setIcsFeedback] = useState<'none' | 'success' | 'empty'>(
    'none'
  );

  // Master list of all dated unified items
  const allItems = useMemo(() => {
    const items: UnifiedItem[] = [];

    for (const ms of milestones) {
      if (!ms.date) continue;
      const title = language === 'en' && ms.labelEn ? ms.labelEn : ms.label;
      const desc =
        language === 'en' && ms.descriptionEn ? ms.descriptionEn : ms.description;
      items.push({
        id: `ms-${ms.id}`,
        kind: 'milestone',
        startDate: ms.date,
        endDate: ms.date,
        durationDays: 1,
        title,
        subtitle: [ms.timeNote, desc].filter(Boolean).join(' · '),
        sourceMilestone: ms,
      });
    }

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const dur = getEffectiveDuration(task.durationDays);
      const title = language === 'en' && task.titleEn ? task.titleEn : task.title;
      const phase = PHASES.find((p) => p.id === task.phaseId);
      const phaseShort = phase
        ? language === 'en'
          ? phase.shortLabelEn
          : phase.shortLabelNl
        : '';
      const timing =
        language === 'en' && task.timingNoteEn
          ? task.timingNoteEn
          : task.timingNote;
      items.push({
        id: `task-${task.id}`,
        kind: 'task',
        startDate: task.dueDate,
        endDate: getDateRangeEnd(task.dueDate, dur),
        durationDays: dur,
        title,
        subtitle: [phaseShort, timing].filter(Boolean).join(' · '),
        completed: task.completed,
        sourceTask: task,
      });
    }

    for (const klus of klussen) {
      if (!klus.plannedDate) continue;
      const dur = getEffectiveDuration(klus.durationDays);
      const room = rooms.find((r) => r.id === klus.roomId);
      const roomName = room
        ? language === 'en' && room.nameEn
          ? room.nameEn
          : room.name
        : '';
      const who =
        klus.executor === 'diy'
          ? t.klusDiy
          : klus.contractorName || t.klusPro;
      items.push({
        id: `klus-${klus.id}`,
        kind: 'klus',
        startDate: klus.plannedDate,
        endDate: getDateRangeEnd(klus.plannedDate, dur),
        durationDays: dur,
        title: klus.title,
        subtitle: [roomName, who].filter(Boolean).join(' · '),
        completed: klus.status === 'done',
        sourceKlus: klus,
      });
    }

    const kindRank: Record<CalendarKind, number> = {
      milestone: 0,
      task: 1,
      klus: 2,
    };

    items.sort((a, b) => {
      const cmp = a.startDate.localeCompare(b.startDate);
      if (cmp !== 0) return cmp;
      return kindRank[a.kind] - kindRank[b.kind];
    });

    return items;
  }, [milestones, tasks, klussen, rooms, language, t.klusDiy, t.klusPro]);

  // Expand items across EVERY day in their duration for Monthly Grid & Day Agenda
  const appearancesByDate = useMemo(() => {
    const map: Record<string, DayAppearance[]> = {};
    for (const item of allItems) {
      const spanDates = expandDateRange(item.startDate, item.durationDays);
      spanDates.forEach((dStr, idx) => {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push({ item, dayIndex: idx + 1 });
      });
    }
    return map;
  }, [allItems]);

  // Chronological Agenda List grouped by startDate (or every date? Grouping by startDate with full range badge avoids repetitive duplicates in Agenda List!)
  const agendaGroups = useMemo(() => {
    const map: Record<string, UnifiedItem[]> = {};
    for (const item of allItems) {
      if (!map[item.startDate]) map[item.startDate] = [];
      map[item.startDate].push(item);
    }
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((dateStr) => ({ dateStr, items: map[dateStr] }));
  }, [allItems]);

  // Monthly Grid cells
  const calendarDays = useMemo(() => {
    const year = cursorMonth.getFullYear();
    const month = cursorMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const totalCells = Math.ceil((startOffset + totalDaysInMonth) / 7) * 7;

    const cells: { dateStr: string; dayNum: number; inMonth: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(year, month, 1 - startOffset + i);
      cells.push({
        dateStr: formatYmd(cellDate),
        dayNum: cellDate.getDate(),
        inMonth: cellDate.getMonth() === month,
      });
    }
    return cells;
  }, [cursorMonth]);

  // Blokkenschema timeline days & filtered items
  const filteredBlockItems = useMemo(() => {
    if (blockFilter === 'all') return allItems;
    return allItems.filter((item) => item.kind === blockFilter);
  }, [allItems, blockFilter]);

  const timelineDays = useMemo(() => {
    let minDate = addDaysYmd(todayStr, -4);
    let maxDate = addDaysYmd(todayStr, 30);

    for (const item of filteredBlockItems) {
      const padBefore = addDaysYmd(item.startDate, -3);
      const padAfter = addDaysYmd(item.endDate, 5);
      if (padBefore < minDate) minDate = padBefore;
      if (padAfter > maxDate) maxDate = padAfter;
    }

    // Cap maximum timeline span to 180 days around window so DOM stays snappy
    const totalSpan = Math.min(180, Math.max(28, diffDaysYmd(minDate, maxDate) + 1));
    const days: {
      dateStr: string;
      dayNum: number;
      weekdayLabel: string;
      monthLabel: string;
      weekNum: number;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    const locale = language === 'en' ? 'en-GB' : 'nl-NL';
    for (let i = 0; i < totalSpan; i++) {
      const dStr = addDaysYmd(minDate, i);
      const dt = parseYmd(dStr);
      const dow = dt.getDay();
      days.push({
        dateStr: dStr,
        dayNum: dt.getDate(),
        weekdayLabel: dt
          .toLocaleDateString(locale, { weekday: 'short' })
          .replace('.', '')
          .slice(0, 2),
        monthLabel: dt.toLocaleDateString(locale, { month: 'short' }),
        weekNum: getIsoWeekNumber(dt),
        isWeekend: dow === 0 || dow === 6,
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [filteredBlockItems, todayStr, language]);

  const timelineStartStr = timelineDays[0]?.dateStr ?? todayStr;
  const todayTimelineIndex = timelineDays.findIndex((d) => d.isToday);

  const selectedBlockItem = useMemo(
    () => allItems.find((i) => i.id === activeBlockId) ?? null,
    [allItems, activeBlockId]
  );

  const weekdays =
    language === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const monthTitle = cursorMonth.toLocaleDateString(
    language === 'en' ? 'en-GB' : 'nl-NL',
    { month: 'long', year: 'numeric' }
  );

  const jumpToTodayMonth = () => {
    setCursorMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    setSelectedDate(todayStr);
  };

  const scrollTimelineToToday = () => {
    if (!timelineScrollRef.current || todayTimelineIndex < 0) return;
    const targetLeft = Math.max(0, (todayTimelineIndex - 2) * DAY_COL_WIDTH);
    timelineScrollRef.current.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
  };

  const handleExportIcs = () => {
    const { ics, eventCount } = buildIcsCalendar({
      houseName,
      language,
      milestones,
      tasks,
      klussen,
      rooms,
    });
    if (eventCount === 0) {
      setIcsFeedback('empty');
      return;
    }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'huis-verhuis-agenda.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIcsFeedback('success');
  };

  const formatFullDate = (dateStr: string) => {
    const dt = parseYmd(dateStr);
    return dt.toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const selectedDayAppearances = appearancesByDate[selectedDate] ?? [];

  const renderEntryCard = (
    item: UnifiedItem,
    dayIndex?: number
  ) => {
    const rangeText =
      item.durationDays > 1
        ? formatRangeLabel(item.startDate, item.durationDays, language)
        : '';
    const dayProgressText =
      dayIndex && item.durationDays > 1
        ? t.calendarDayProgress
            .replace('{day}', String(dayIndex))
            .replace('{total}', String(item.durationDays))
        : '';

    if (item.kind === 'milestone') {
      return (
        <div
          key={`${item.id}-${dayIndex ?? 'list'}`}
          className="bg-amber-50/70 rounded-2xl border border-amber-300/70 p-3.5 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Star className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-amber-800">
                {t.calendarMilestoneTag}
              </p>
              <h4 className="text-[15px] font-semibold text-stone-900 leading-snug">
                {item.title}
              </h4>
              {item.subtitle && (
                <p className="text-xs text-stone-600 mt-0.5">{item.subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('dates')}
            className="min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-amber-900 hover:bg-white/80 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>{t.calendarJumpToTab}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (item.kind === 'task' && item.sourceTask) {
      const task = item.sourceTask;
      return (
        <div
          key={`${item.id}-${dayIndex ?? 'list'}`}
          className="bg-white rounded-2xl border border-stone-200/90 p-3.5 flex items-start justify-between gap-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              aria-label={item.title}
              aria-pressed={task.completed}
              className="min-h-[44px] min-w-[44px] -m-1 flex items-center justify-center shrink-0 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-[#1B4332] border-[#1B4332] text-white'
                    : 'bg-white border-stone-300 text-transparent'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-medium text-[#1B4332]">
                {t.calendarTaskTag}
                {dayProgressText ? ` · ${dayProgressText}` : ''}
              </p>
              <h4
                className={`text-[15px] font-medium leading-snug ${
                  task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                }`}
              >
                {item.title}
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {[rangeText, item.subtitle].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('checklist')}
            className="min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>{t.calendarJumpToTab}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (item.kind === 'klus' && item.sourceKlus) {
      const klus = item.sourceKlus;
      const done = klus.status === 'done';
      return (
        <div
          key={`${item.id}-${dayIndex ?? 'list'}`}
          className="bg-white rounded-2xl border border-stone-200/90 p-3.5 flex items-start justify-between gap-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onToggleKlusDone(klus)}
              aria-label={item.title}
              aria-pressed={done}
              className="min-h-[44px] min-w-[44px] -m-1 flex items-center justify-center shrink-0 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                  done
                    ? 'bg-sky-800 border-sky-800 text-white'
                    : 'bg-white border-stone-300 text-transparent'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-medium text-sky-800 inline-flex items-center gap-1">
                <Hammer className="w-3 h-3" />
                <span>
                  {t.calendarKlusTag}
                  {dayProgressText ? ` · ${dayProgressText}` : ''}
                </span>
              </p>
              <h4
                className={`text-[15px] font-medium leading-snug ${
                  done ? 'line-through text-stone-400' : 'text-stone-900'
                }`}
              >
                {item.title}
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {[rangeText, item.subtitle].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('klussen')}
            className="min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>{t.calendarJumpToTab}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header + .ics Export + 3-Way View Toggle */}
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900">
              {t.calendarTitle}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">{t.calendarSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleExportIcs}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs sm:text-sm font-medium hover:bg-[#143326] active:scale-[0.98] transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>
              {t.calendarExportIcs} ({allItems.length})
            </span>
          </button>
        </div>

        {/* ICS Feedback Banner */}
        {icsFeedback !== 'none' && (
          <div
            className={`rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 text-xs sm:text-sm ${
              icsFeedback === 'success'
                ? 'bg-[#ECFDF5] border-[#1B4332]/25 text-[#1B4332]'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <p className="leading-relaxed">
              {icsFeedback === 'success'
                ? t.calendarExportIcsHint
                : t.calendarExportIcsEmpty}
            </p>
            <button
              type="button"
              onClick={() => setIcsFeedback('none')}
              aria-label={t.close}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3-Way View Switcher */}
        <div
          className="inline-flex items-center p-1 bg-stone-200/70 rounded-xl w-full sm:w-auto self-start"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'month'}
            onClick={() => setViewMode('month')}
            className={`flex-1 sm:flex-initial min-h-[40px] px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span>{t.calendarMonthView}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'block'}
            onClick={() => setViewMode('block')}
            className={`flex-1 sm:flex-initial min-h-[40px] px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              viewMode === 'block'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GanttChart className="w-4 h-4 shrink-0" />
            <span>{t.calendarBlockView}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial min-h-[40px] px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="w-4 h-4 shrink-0" />
            <span>{t.calendarListView}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Maandoverzicht (Monthly Calendar Grid) */}
      {viewMode === 'month' && (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-5 lg:space-y-0">
          <section className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-center justify-between gap-2 pb-4">
              <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900 capitalize">
                {monthTitle}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={jumpToTodayMonth}
                  className="min-h-[40px] px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  {t.calendarToday}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCursorMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  aria-label="Vorige maand"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCursorMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  aria-label="Volgende maand"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-medium text-stone-400 pb-2">
              {weekdays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => {
                const apps = appearancesByDate[cell.dateStr] ?? [];
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayStr;

                const hasMilestone = apps.some(
                  (a) => a.item.kind === 'milestone'
                );
                const hasTask = apps.some((a) => a.item.kind === 'task');
                const hasKlus = apps.some((a) => a.item.kind === 'klus');
                const hasMultiDay = apps.some((a) => a.item.durationDays > 1);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[48px] sm:min-h-[56px] rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#1B4332] text-white font-semibold'
                        : isToday
                          ? 'bg-[#ECFDF5] text-[#1B4332] font-semibold border border-[#1B4332]/30'
                          : hasMultiDay && cell.inMonth
                            ? 'bg-stone-100/80 text-stone-900 hover:bg-stone-200/70'
                            : cell.inMonth
                              ? 'text-stone-900 hover:bg-stone-100'
                              : 'text-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-mono tabular-nums">
                      {cell.dayNum}
                    </span>

                    <div className="flex items-center gap-1 h-1.5">
                      {hasMilestone && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-amber-600'
                          }`}
                        />
                      )}
                      {hasTask && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[#1B4332]'
                          }`}
                        />
                      )}
                      {hasKlus && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-sky-200' : 'bg-sky-700'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>{t.calendarMilestoneTag}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
                <span>{t.calendarTaskTag}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-700" />
                <span>{t.calendarKlusTag}</span>
              </span>
            </div>
          </section>

          <section className="lg:col-span-5 space-y-3">
            <header className="px-1">
              <h3 className="font-display text-base font-semibold text-stone-900 capitalize">
                {formatFullDate(selectedDate)}
              </h3>
            </header>

            {selectedDayAppearances.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 text-center text-sm text-stone-500">
                {t.calendarNoItemsDay}
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayAppearances.map(({ item, dayIndex }) =>
                  renderEntryCard(item, dayIndex)
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* VIEW 2: Blokkenschema (Visual Timeline / Gantt Block Schedule) */}
      {viewMode === 'block' && (
        <div className="space-y-4">
          {/* Quick Filter Strip + Today Scroll Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="inline-flex items-center p-1 bg-stone-200/70 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {(
                [
                  { id: 'all', label: t.calendarBlockAll },
                  { id: 'milestone', label: t.calendarMilestoneTag },
                  { id: 'task', label: t.calendarTaskTag },
                  { id: 'klus', label: t.calendarKlusTag },
                ] as { id: 'all' | CalendarKind; label: string }[]
              ).map((f) => {
                const active = blockFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBlockFilter(f.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={scrollTimelineToToday}
              className="min-h-[40px] px-3.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap"
            >
              {t.calendarToday} →
            </button>
          </div>

          {filteredBlockItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-8 text-center text-sm text-stone-500">
              {t.calendarBlockEmpty}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden">
              <div
                ref={timelineScrollRef}
                className="overflow-x-auto"
              >
                <div
                  style={{ width: `${timelineDays.length * DAY_COL_WIDTH}px` }}
                  className="relative select-none"
                >
                  {/* Week & Day Header */}
                  <div className="sticky top-0 z-10 bg-stone-50 border-b border-stone-200">
                    <div className="flex">
                      {timelineDays.map((day, idx) => {
                        const showMonthOrWeek =
                          idx === 0 ||
                          day.dayNum === 1 ||
                          day.weekdayLabel.toLowerCase() === 'ma' ||
                          day.weekdayLabel.toLowerCase() === 'mo';
                        return (
                          <div
                            key={day.dateStr}
                            style={{ width: `${DAY_COL_WIDTH}px` }}
                            className={`shrink-0 py-2 px-1 text-center border-r border-stone-100 ${
                              day.isToday
                                ? 'bg-[#ECFDF5] text-[#1B4332]'
                                : day.isWeekend
                                  ? 'bg-stone-100/60 text-stone-500'
                                  : 'text-stone-600'
                            }`}
                          >
                            <div className="text-[10px] font-mono text-stone-400 h-3.5 truncate">
                              {showMonthOrWeek
                                ? day.dayNum === 1 || idx === 0
                                  ? day.monthLabel
                                  : `W${day.weekNum}`
                                : ''}
                            </div>
                            <div className="text-[10px] uppercase tracking-tight">
                              {day.weekdayLabel}
                            </div>
                            <div
                              className={`text-xs font-mono tabular-nums mt-0.5 ${
                                day.isToday ? 'font-bold text-[#1B4332]' : 'font-medium text-stone-900'
                              }`}
                            >
                              {day.dayNum}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tracks */}
                  <div className="relative divide-y divide-stone-100">
                    {/* Background Vertical Day Gridlines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineDays.map((day) => (
                        <div
                          key={`bg-${day.dateStr}`}
                          style={{ width: `${DAY_COL_WIDTH}px` }}
                          className={`h-full shrink-0 border-r border-stone-100/80 ${
                            day.isToday
                              ? 'bg-[#ECFDF5]/45'
                              : day.isWeekend
                                ? 'bg-stone-50/60'
                                : ''
                          }`}
                        />
                      ))}
                    </div>

                    {filteredBlockItems.map((item) => {
                      const rawStartOffset = diffDaysYmd(
                        timelineStartStr,
                        item.startDate
                      );
                      const clampedStart = Math.max(0, rawStartOffset);
                      const clampedEnd = Math.min(
                        timelineDays.length - 1,
                        rawStartOffset + item.durationDays - 1
                      );
                      if (clampedEnd < 0 || clampedStart >= timelineDays.length) {
                        return null;
                      }
                      const visibleSpan = Math.max(
                        1,
                        clampedEnd - clampedStart + 1
                      );
                      const leftPx = clampedStart * DAY_COL_WIDTH + 3;
                      const barWidthPx = visibleSpan * DAY_COL_WIDTH - 6;
                      const isWideEnoughForText = visibleSpan >= 3;
                      const isSelected = activeBlockId === item.id;

                      const blockStyle =
                        item.kind === 'milestone'
                          ? 'bg-amber-100 border border-amber-400 text-amber-950'
                          : item.kind === 'task'
                            ? item.completed
                              ? 'bg-stone-200 text-stone-600 line-through'
                              : 'bg-[#1B4332] text-white'
                            : item.completed
                              ? 'bg-stone-200 text-stone-600 line-through'
                              : 'bg-sky-800 text-white';

                      return (
                        <div
                          key={`track-${item.id}`}
                          className="relative h-[52px] flex items-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveBlockId(isSelected ? null : item.id)
                            }
                            style={{
                              left: `${leftPx}px`,
                              width: `${barWidthPx}px`,
                            }}
                            className={`absolute h-[36px] rounded-xl px-2.5 flex items-center gap-1.5 text-xs font-medium shadow-xs transition cursor-pointer ${blockStyle} ${
                              isSelected ? 'ring-2 ring-stone-900 ring-offset-1' : ''
                            }`}
                          >
                            {item.kind === 'milestone' && (
                              <Star className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {item.kind === 'klus' && (
                              <Hammer className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {item.kind === 'task' && (
                              <Check className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {isWideEnoughForText ? (
                              <span className="truncate">{item.title}</span>
                            ) : (
                              item.durationDays > 1 && (
                                <span className="font-mono text-[11px] tabular-nums">
                                  {item.durationDays}d
                                </span>
                              )
                            )}
                          </button>

                          {/* Readable external label for 1-2 day blocks */}
                          {!isWideEnoughForText && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveBlockId(isSelected ? null : item.id)
                              }
                              style={{
                                left: `${leftPx + barWidthPx + 8}px`,
                              }}
                              className={`absolute text-xs font-medium whitespace-nowrap max-w-[220px] truncate cursor-pointer hover:underline ${
                                item.completed
                                  ? 'text-stone-400 line-through'
                                  : 'text-stone-800'
                              }`}
                            >
                              {item.title}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/70 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-300 border border-amber-500" />
                  <span>{t.calendarMilestoneTag}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#1B4332]" />
                  <span>{t.calendarTaskTag}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-800" />
                  <span>{t.calendarKlusTag}</span>
                </span>
                <span className="text-stone-400 ml-auto">
                  {language === 'en'
                    ? 'Tap any block for details'
                    : 'Tik op een blok voor details'}
                </span>
              </div>
            </div>
          )}

          {/* Selected Block Inspector */}
          {selectedBlockItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-medium text-stone-500">
                  {formatRangeLabel(
                    selectedBlockItem.startDate,
                    selectedBlockItem.durationDays,
                    language
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveBlockId(null)}
                  className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
              {renderEntryCard(selectedBlockItem)}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Chronologische Agenda Lijst */}
      {viewMode === 'list' && (
        <section className="space-y-5">
          {agendaGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-8 text-center text-sm text-stone-500">
              {t.calendarNoUpcoming}
            </div>
          ) : (
            agendaGroups.map(({ dateStr, items }) => {
              const isPast = dateStr < todayStr;
              return (
                <div key={dateStr} className="space-y-2.5">
                  <header className="px-1 flex items-baseline justify-between gap-2">
                    <h2
                      className={`font-display text-sm sm:text-base font-semibold capitalize ${
                        dateStr === todayStr
                          ? 'text-[#1B4332]'
                          : isPast
                            ? 'text-stone-400'
                            : 'text-stone-900'
                      }`}
                    >
                      {dateStr === todayStr ? `${t.calendarToday} · ` : ''}
                      {formatFullDate(dateStr)}
                    </h2>
                    <span className="text-xs font-mono text-stone-400 tabular-nums">
                      {items.length}
                    </span>
                  </header>
                  <div className="space-y-2.5">
                    {items.map((item) => renderEntryCard(item))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
};
