import type {
  KlusItem,
  Language,
  MilestoneDate,
  RoomItem,
  TaskItem,
} from '../types/planner';
import { PHASES } from '../data/defaultData';

export function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysYmd(dateStr: string, days: number): string {
  const d = parseYmd(dateStr);
  d.setDate(d.getDate() + days);
  return formatYmd(d);
}

export function getEffectiveDuration(durationDays?: number): number {
  if (!durationDays || !Number.isFinite(durationDays)) return 1;
  return Math.max(1, Math.min(365, Math.floor(durationDays)));
}

export function getDateRangeEnd(startDateStr: string, durationDays?: number): string {
  const dur = getEffectiveDuration(durationDays);
  return addDaysYmd(startDateStr, dur - 1);
}

export function expandDateRange(startDateStr: string, durationDays?: number): string[] {
  if (!startDateStr) return [];
  const dur = getEffectiveDuration(durationDays);
  const result: string[] = [];
  for (let i = 0; i < dur; i++) {
    result.push(addDaysYmd(startDateStr, i));
  }
  return result;
}

export function diffDaysYmd(aStr: string, bStr: string): number {
  const a = parseYmd(aStr);
  const b = parseYmd(bStr);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatRangeLabel(
  startDateStr: string,
  durationDays: number | undefined,
  language: Language
): string {
  if (!startDateStr) return '';
  const dur = getEffectiveDuration(durationDays);
  const locale = language === 'en' ? 'en-GB' : 'nl-NL';
  const start = parseYmd(startDateStr);

  if (dur <= 1) {
    return start.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const end = parseYmd(getDateRangeEnd(startDateStr, dur));
  const startFmt = start.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
  const endFmt = end.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
  const unit = language === 'en' ? 'days' : 'dagen';
  return `${startFmt} – ${endFmt} (${dur} ${unit})`;
}

function escapeIcsText(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

export function buildIcsCalendar(params: {
  houseName: string;
  language: Language;
  milestones: MilestoneDate[];
  tasks: TaskItem[];
  klussen: KlusItem[];
  rooms: RoomItem[];
}): { ics: string; eventCount: number } {
  const { houseName, language, milestones, tasks, klussen, rooms } = params;
  const nowStamp =
    new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Huis & Verhuis Planner//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(houseName ? `Verhuizing: ${houseName}` : 'Huis & Verhuis Planner')}`,
  ];

  let eventCount = 0;

  // 1. Milestones
  for (const ms of milestones) {
    if (!ms.date) continue;
    const title = language === 'en' && ms.labelEn ? ms.labelEn : ms.label;
    const descParts = [
      language === 'en' ? 'Milestone' : 'Belangrijke mijlpaal',
      ms.timeNote ? `${language === 'en' ? 'Time/Note' : 'Tijd/Notitie'}: ${ms.timeNote}` : '',
      language === 'en' && ms.descriptionEn ? ms.descriptionEn : ms.description,
      houseName ? `${language === 'en' ? 'Address' : 'Adres'}: ${houseName}` : '',
    ].filter(Boolean);

    const startIcs = toIcsDate(ms.date);
    const endIcs = toIcsDate(addDaysYmd(ms.date, 1));

    lines.push(
      'BEGIN:VEVENT',
      `UID:milestone-${ms.id}@huisverhuisplanner`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${startIcs}`,
      `DTEND;VALUE=DATE:${endIcs}`,
      `SUMMARY:${escapeIcsText(`★ ${title}`)}`,
      `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
      'END:VEVENT'
    );
    eventCount += 1;
  }

  // 2. Checklist Tasks with dates
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const title = language === 'en' && task.titleEn ? task.titleEn : task.title;
    const phase = PHASES.find((p) => p.id === task.phaseId);
    const phaseName = phase
      ? `${language === 'en' ? phase.shortLabelEn : phase.shortLabelNl}: ${
          language === 'en' ? phase.titleEn : phase.titleNl
        }`
      : '';
    const dur = getEffectiveDuration(task.durationDays);
    const startIcs = toIcsDate(task.dueDate);
    const endIcs = toIcsDate(addDaysYmd(task.dueDate, dur));

    const descParts = [
      phaseName,
      task.timingNote ? `${language === 'en' ? 'Timing' : 'Moment'}: ${task.timingNote}` : '',
      task.note ? `${language === 'en' ? 'Note' : 'Notitie'}: ${task.note}` : '',
      task.details,
    ].filter(Boolean);

    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@huisverhuisplanner`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${startIcs}`,
      `DTEND;VALUE=DATE:${endIcs}`,
      `SUMMARY:${escapeIcsText(task.completed ? `✓ ${title}` : title)}`,
      `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
      'END:VEVENT'
    );
    eventCount += 1;
  }

  // 3. Klussen with dates
  for (const klus of klussen) {
    if (!klus.plannedDate) continue;
    const room = rooms.find((r) => r.id === klus.roomId);
    const roomName = room
      ? language === 'en' && room.nameEn
        ? room.nameEn
        : room.name
      : '';
    const dur = getEffectiveDuration(klus.durationDays);
    const startIcs = toIcsDate(klus.plannedDate);
    const endIcs = toIcsDate(addDaysYmd(klus.plannedDate, dur));

    const who =
      klus.executor === 'diy'
        ? language === 'en'
          ? 'DIY (Self)'
          : 'Zelf doen (DIY)'
        : `${language === 'en' ? 'Contractor' : 'Vakman'}: ${
            klus.contractorName || '-'
          }${klus.contractorPhone ? ` (${klus.contractorPhone})` : ''}`;

    const descParts = [
      roomName ? `${language === 'en' ? 'Room' : 'Ruimte'}: ${roomName}` : '',
      who,
      klus.note ? `${language === 'en' ? 'Note' : 'Notitie'}: ${klus.note}` : '',
    ].filter(Boolean);

    lines.push(
      'BEGIN:VEVENT',
      `UID:klus-${klus.id}@huisverhuisplanner`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${startIcs}`,
      `DTEND;VALUE=DATE:${endIcs}`,
      `SUMMARY:${escapeIcsText(roomName ? `${roomName}: ${klus.title}` : klus.title)}`,
      `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
      'END:VEVENT'
    );
    eventCount += 1;
  }

  lines.push('END:VCALENDAR');
  return { ics: lines.join('\r\n'), eventCount };
}
