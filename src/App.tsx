/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckSquare,
  Download,
  Euro,
  Hammer,
  MessageSquare,
  WifiOff,
} from 'lucide-react';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { BackupModal } from './components/BackupModal';
import { BudgetView } from './components/BudgetView';
import { CalendarView } from './components/CalendarView';
import { ChecklistView } from './components/ChecklistView';
import { DatesContactsView } from './components/DatesContactsView';
import { KlussenView } from './components/KlussenView';
import { UI_COPY } from './data/translations';
import { usePlannerStorage } from './hooks/usePlannerStorage';
import { useOnlineStatus } from './hooks/usePWAInstall';
import type { KlusItem, ViewTab } from './types/planner';

export default function App() {
  const {
    data,
    setLanguage,
    setHouseName,
    toggleTask,
    updateTaskNote,
    addTask,
    updateTask,
    deleteTask,
    addRoom,
    deleteRoom,
    addKlus,
    updateKlus,
    deleteKlus,
    addExpense,
    updateExpense,
    deleteExpense,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addContact,
    updateContact,
    deleteContact,
    exportBackup,
    importBackup,
    resetToDefault,
  } = usePlannerStorage();

  const isOnline = useOnlineStatus();
  const t = UI_COPY[data.language];

  const [activeView, setActiveView] = useState<ViewTab>('checklist');
  const [aiOpen, setAiOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const { doneCount, totalCount, pct } = useMemo(() => {
    const total = data.tasks.length;
    const done = data.tasks.filter((item) => item.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { doneCount: done, totalCount: total, pct: percent };
  }, [data.tasks]);

  const upcomingDateLabel = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const next = data.milestones
      .filter((m) => m.date && m.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!next) return undefined;
    const label =
      data.language === 'en' && next.labelEn ? next.labelEn : next.label;
    return `${label} (${next.date})`;
  }, [data.milestones, data.language]);

  const handleToggleKlusDone = (klus: KlusItem) => {
    updateKlus(klus.id, {
      status: klus.status === 'done' ? 'planned' : 'done',
    });
  };

  const navItems: {
    id: ViewTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'checklist', label: t.navChecklist, icon: CheckSquare },
    { id: 'kalender', label: t.navCalendar, icon: Calendar },
    { id: 'klussen', label: t.navKlussen, icon: Hammer },
    { id: 'budget', label: t.navBudget, icon: Euro },
    { id: 'dates', label: t.navDates, icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-stone-900 flex flex-col">
      {/* Sticky Top Header (52px height — keeps mobile sticky area < 15%) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveView('checklist')}
            className="font-display text-[15px] sm:text-base font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.appName}
          </button>

          <nav
            aria-label="Hoofdnavigatie"
            className="hidden md:flex items-center gap-5 lg:gap-6"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`min-h-[44px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#1B4332] text-[#1B4332]'
                      : 'border-transparent text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="md:hidden text-xs font-mono font-medium text-stone-500 tabular-nums mr-1">
              {pct}% ({doneCount}/{totalCount})
            </span>

            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              aria-label={t.backupButton}
              className="min-h-[44px] min-w-[44px] sm:px-3 rounded-xl text-stone-700 hover:bg-stone-100 flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.backupButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-medium hover:bg-[#143326] active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.aiButton}</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>

        <div className="h-[2px] w-full bg-stone-100">
          <div
            className="h-full bg-[#1B4332] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12">
        {!isOnline && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-amber-900">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              {data.language === 'en'
                ? 'Offline mode — all your local changes are saved automatically.'
                : 'Offline modus — al je wijzigingen worden lokaal opgeslagen.'}
            </span>
          </div>
        )}

        {activeView === 'checklist' && (
          <ChecklistView
            language={data.language}
            tasks={data.tasks}
            milestones={data.milestones}
            houseName={data.houseName}
            onToggleTask={toggleTask}
            onUpdateNote={updateTaskNote}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onNavigateToDates={() => setActiveView('dates')}
          />
        )}

        {activeView === 'kalender' && (
          <CalendarView
            language={data.language}
            houseName={data.houseName}
            milestones={data.milestones}
            tasks={data.tasks}
            klussen={data.klussen}
            rooms={data.rooms}
            onToggleTask={toggleTask}
            onToggleKlusDone={handleToggleKlusDone}
            onNavigate={(tab) => setActiveView(tab)}
          />
        )}

        {activeView === 'klussen' && (
          <KlussenView
            language={data.language}
            rooms={data.rooms}
            klussen={data.klussen}
            onAddRoom={addRoom}
            onDeleteRoom={deleteRoom}
            onAddKlus={addKlus}
            onUpdateKlus={updateKlus}
            onDeleteKlus={deleteKlus}
          />
        )}

        {activeView === 'budget' && (
          <BudgetView
            language={data.language}
            expenses={data.expenses}
            klussen={data.klussen}
            onAddExpense={addExpense}
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
            onNavigateToKlussen={() => setActiveView('klussen')}
          />
        )}

        {activeView === 'dates' && (
          <DatesContactsView
            language={data.language}
            milestones={data.milestones}
            contacts={data.contacts}
            onAddMilestone={addMilestone}
            onUpdateMilestone={updateMilestone}
            onDeleteMilestone={deleteMilestone}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobiele navigatie"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/90 pb-safe"
      >
        <div className="grid grid-cols-5 h-[56px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#1B4332] font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className="w-[19px] h-[19px]" />
                <span className="text-[10px] tracking-tight whitespace-nowrap truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        language={data.language}
        completionPercent={pct}
        upcomingDateLabel={upcomingDateLabel}
        onAddSuggestedTask={(task) => {
          addTask(task);
        }}
      />

      {/* Backup & Settings Modal */}
      <BackupModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        language={data.language}
        houseName={data.houseName}
        onChangeLanguage={setLanguage}
        onChangeHouseName={setHouseName}
        onExportJson={exportBackup}
        onImportJson={importBackup}
        onResetAll={resetToDefault}
      />
    </div>
  );
}
