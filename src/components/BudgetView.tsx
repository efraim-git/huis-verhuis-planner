import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Hammer,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { UI_COPY } from '../data/translations';
import type {
  ExpenseCategoryGroup,
  ExpenseItem,
  KlusItem,
  Language,
} from '../types/planner';

interface BudgetViewProps {
  language: Language;
  expenses: ExpenseItem[];
  klussen: KlusItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpense: (
    id: string,
    updates: Partial<Omit<ExpenseItem, 'id'>>
  ) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToKlussen: () => void;
}

type ExpenseFilter = 'all' | 'kk' | 'moving' | 'paid' | 'unpaid';

export const BudgetView: React.FC<BudgetViewProps> = ({
  language,
  expenses,
  klussen,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onNavigateToKlussen,
}) => {
  const t = UI_COPY[language];
  const [filter, setFilter] = useState<ExpenseFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formGroup, setFormGroup] = useState<ExpenseCategoryGroup>('kk');
  const [formEstimated, setFormEstimated] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formPaid, setFormPaid] = useState(false);
  const [formNote, setFormNote] = useState('');

  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  // Live rollup from Klussen & Verbouwen module
  const klussenTotals = useMemo(() => {
    let estimated = 0;
    let actual = 0;
    let doneCount = 0;
    for (const k of klussen) {
      estimated += Number(k.estimatedCost) || 0;
      actual += Number(k.actualCost) || 0;
      if (k.status === 'done') doneCount += 1;
    }
    return { estimated, actual, doneCount, totalCount: klussen.length };
  }, [klussen]);

  const totals = useMemo(() => {
    let estimated = klussenTotals.estimated;
    let actual = klussenTotals.actual;
    let paidCount = 0;
    for (const exp of expenses) {
      estimated += Number(exp.estimated) || 0;
      actual += Number(exp.actual) || 0;
      if (exp.paid) paidCount += 1;
    }
    const diff = estimated - actual;
    return { estimated, actual, diff, paidCount };
  }, [expenses, klussenTotals]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (filter === 'kk') return exp.group === 'kk';
      if (filter === 'moving') return exp.group === 'moving';
      if (filter === 'paid') return exp.paid;
      if (filter === 'unpaid') return !exp.paid;
      return true;
    });
  }, [expenses, filter]);

  const groupedSections = useMemo(() => {
    const groups: {
      key: ExpenseCategoryGroup;
      label: string;
      items: ExpenseItem[];
      includeKlussenRollup: boolean;
    }[] = [
      {
        key: 'kk',
        label: t.kkGroupName,
        items: filteredExpenses.filter((e) => e.group === 'kk'),
        includeKlussenRollup: false,
      },
      {
        key: 'moving',
        label: t.movingGroupName,
        items: filteredExpenses.filter((e) => e.group === 'moving'),
        includeKlussenRollup:
          (filter === 'all' || filter === 'moving') && klussen.length > 0,
      },
    ];
    return groups.filter((g) => g.items.length > 0 || g.includeKlussenRollup);
  }, [filteredExpenses, filter, klussen.length, t.kkGroupName, t.movingGroupName]);

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormGroup(filter === 'moving' ? 'moving' : 'kk');
    setFormEstimated('0');
    setFormActual('0');
    setFormPaid(false);
    setFormNote('');
    setModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setEditingId(item.id);
    setFormTitle(language === 'en' && item.titleEn ? item.titleEn : item.title);
    setFormGroup(item.group);
    setFormEstimated(String(item.estimated));
    setFormActual(String(item.actual));
    setFormPaid(item.paid);
    setFormNote(item.note);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) return;
    const est = Math.max(0, Math.round(Number(formEstimated) || 0));
    const act = Math.max(0, Math.round(Number(formActual) || 0));

    if (editingId) {
      onUpdateExpense(editingId, {
        ...(language === 'en' ? { titleEn: cleanTitle } : { title: cleanTitle }),
        group: formGroup,
        estimated: est,
        actual: act,
        paid: formPaid,
        note: formNote.trim(),
      });
    } else {
      onAddExpense({
        title: cleanTitle,
        group: formGroup,
        estimated: est,
        actual: act,
        paid: formPaid,
        note: formNote.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleQuickAmountChange = (
    id: string,
    field: 'estimated' | 'actual',
    rawVal: string
  ) => {
    const cleaned = rawVal.replace(/[^\d]/g, '');
    const numeric = cleaned === '' ? 0 : parseInt(cleaned, 10);
    onUpdateExpense(id, { [field]: numeric });
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Financial Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <p className="text-xs font-medium text-stone-500">{t.budgetEstimated}</p>
          <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
            {euroFormatter.format(totals.estimated)}
          </p>
          <p className="mt-1.5 text-xs text-stone-500 tabular-nums">
            {expenses.length} {language === 'en' ? 'items' : 'kostenposten'} +{' '}
            {klussenTotals.totalCount}{' '}
            {language === 'en' ? 'renovation jobs' : 'klussen'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <p className="text-xs font-medium text-stone-500">{t.budgetActual}</p>
          <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#1B4332] font-mono tabular-nums">
            {euroFormatter.format(totals.actual)}
          </p>
          <p className="mt-1.5 text-xs text-stone-500 tabular-nums">
            {totals.paidCount}/{expenses.length} {t.budgetPaidCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <p className="text-xs font-medium text-stone-500">{t.budgetDiff}</p>
          <p
            className={`mt-1.5 font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
              totals.diff < 0 ? 'text-amber-700' : 'text-stone-900'
            }`}
          >
            {totals.diff >= 0 ? '' : '-'}
            {euroFormatter.format(Math.abs(totals.diff))}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            {totals.diff >= 0 ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-[#1B4332]" />
                <span className="text-[#1B4332]">{t.budgetUnder}</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-amber-700">{t.budgetOver}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl w-max">
            {(
              [
                { id: 'all', label: t.groupAll },
                { id: 'kk', label: t.groupKk },
                { id: 'moving', label: t.groupMoving },
                { id: 'paid', label: t.groupPaid },
                { id: 'unpaid', label: t.groupUnpaid },
              ] as { id: ExpenseFilter; label: string }[]
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] active:scale-[0.98] transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Categorized Expense Cards */}
      <div className="space-y-6">
        {groupedSections.map((section) => {
          const groupEst =
            section.items.reduce((s, i) => s + (Number(i.estimated) || 0), 0) +
            (section.includeKlussenRollup ? klussenTotals.estimated : 0);
          const groupAct =
            section.items.reduce((s, i) => s + (Number(i.actual) || 0), 0) +
            (section.includeKlussenRollup ? klussenTotals.actual : 0);

          return (
            <section key={section.key} className="space-y-2.5">
              <header className="px-1 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900">
                  {section.label}
                </h2>
                <p className="text-xs font-mono text-stone-500 tabular-nums">
                  {euroFormatter.format(groupAct)} / {euroFormatter.format(groupEst)}
                </p>
              </header>

              <div className="bg-white rounded-2xl border border-stone-200/90 divide-y divide-stone-100 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                {/* Live Synced Klussen Rollup Row */}
                {section.includeKlussenRollup && (
                  <div className="p-3.5 sm:p-4 bg-[#F7F6F2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0 mt-0.5">
                        <Hammer className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-stone-900">
                          {t.budgetKlussenSyncedTitle}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {t.budgetKlussenSyncedDesc} · {klussenTotals.doneCount}/
                          {klussenTotals.totalCount} {t.klussenDoneOf}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                      <div className="flex items-center gap-4 font-mono tabular-nums text-sm">
                        <div className="text-right">
                          <span className="block text-[11px] font-sans text-stone-500">
                            {t.estimatedLabel}
                          </span>
                          <span className="font-medium text-stone-800">
                            {euroFormatter.format(klussenTotals.estimated)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] font-sans text-stone-500">
                            {t.actualLabel}
                          </span>
                          <span className="font-semibold text-[#1B4332]">
                            {euroFormatter.format(klussenTotals.actual)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onNavigateToKlussen}
                        className="min-h-[40px] px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-[#1B4332] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{t.budgetOpenKlussen}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {section.items.map((item) => {
                  const title =
                    language === 'en' && item.titleEn ? item.titleEn : item.title;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* Paid 44px Checkbox */}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateExpense(item.id, { paid: !item.paid })
                          }
                          aria-label={`${title} — ${t.paidLabel}`}
                          aria-pressed={item.paid}
                          className="min-h-[44px] min-w-[44px] -m-1 flex items-center justify-center shrink-0 rounded-xl hover:bg-stone-100/70 transition cursor-pointer"
                        >
                          <span
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                              item.paid
                                ? 'bg-[#1B4332] border-[#1B4332] text-white'
                                : 'bg-white border-stone-300 text-transparent hover:border-[#1B4332]'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        </button>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <h3
                            className={`text-[15px] font-medium leading-snug ${
                              item.paid ? 'text-stone-600' : 'text-stone-900'
                            }`}
                          >
                            {title}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                            <span
                              className={
                                item.paid
                                  ? 'text-[#1B4332] font-medium'
                                  : 'text-stone-500'
                              }
                            >
                              {item.paid ? t.paidLabel : t.groupUnpaid}
                            </span>
                            {item.note && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate max-w-[260px] sm:max-w-md">
                                  {item.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inline Editable Euro Inputs + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pl-10 sm:pl-0">
                        <div className="grid grid-cols-2 gap-2 flex-1 sm:flex-initial">
                          <label className="block">
                            <span className="block text-[11px] text-stone-500 mb-0.5">
                              {t.estimatedLabel}
                            </span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">
                                €
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.estimated === 0 ? '' : String(item.estimated)}
                                placeholder="0"
                                onChange={(e) =>
                                  handleQuickAmountChange(
                                    item.id,
                                    'estimated',
                                    e.target.value
                                  )
                                }
                                className="w-full sm:w-28 min-h-[40px] pl-6 pr-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/70 text-right text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                              />
                            </div>
                          </label>

                          <label className="block">
                            <span className="block text-[11px] text-stone-500 mb-0.5">
                              {t.actualLabel}
                            </span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">
                                €
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.actual === 0 ? '' : String(item.actual)}
                                placeholder="0"
                                onChange={(e) =>
                                  handleQuickAmountChange(
                                    item.id,
                                    'actual',
                                    e.target.value
                                  )
                                }
                                className="w-full sm:w-28 min-h-[40px] pl-6 pr-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50/70 text-right text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                              />
                            </div>
                          </label>
                        </div>

                        <div className="flex items-center shrink-0 pt-4 sm:pt-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            aria-label={t.editExpense}
                            className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {confirmDeleteId === item.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteExpense(item.id);
                                setConfirmDeleteId(null);
                              }}
                              className="min-h-[40px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                            >
                              {t.deleteTask}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={t.deleteTask}
                              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add / Edit Expense Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {editingId ? t.editExpense : t.addExpense}
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

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.expenseTitleLabel}
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
                  {t.expenseGroupLabel}
                </label>
                <select
                  value={formGroup}
                  onChange={(e) =>
                    setFormGroup(e.target.value as ExpenseCategoryGroup)
                  }
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                >
                  <option value="kk">{t.kkGroupName}</option>
                  <option value="moving">{t.movingGroupName}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.estimatedLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formEstimated}
                    onChange={(e) => setFormEstimated(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono tabular-nums text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.actualLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formActual}
                    onChange={(e) => setFormActual(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono tabular-nums text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPaid}
                  onChange={(e) => setFormPaid(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#1B4332]"
                />
                <span className="text-sm text-stone-800">{t.markPaid}</span>
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
