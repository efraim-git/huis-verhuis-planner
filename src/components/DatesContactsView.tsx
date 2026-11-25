import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { UI_COPY } from '../data/translations';
import type { ContactPerson, Language, MilestoneDate } from '../types/planner';

interface DatesContactsViewProps {
  language: Language;
  milestones: MilestoneDate[];
  contacts: ContactPerson[];
  onAddMilestone: (milestone: Omit<MilestoneDate, 'id'>) => void;
  onUpdateMilestone: (
    id: string,
    updates: Partial<Omit<MilestoneDate, 'id'>>
  ) => void;
  onDeleteMilestone: (id: string) => void;
  onAddContact: (contact: Omit<ContactPerson, 'id'>) => void;
  onUpdateContact: (
    id: string,
    updates: Partial<Omit<ContactPerson, 'id'>>
  ) => void;
  onDeleteContact: (id: string) => void;
}

function getDaysDiffFromToday(dateStr: string): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  return Math.round(
    (target.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function computeDutchCoolingOffEnd(signingDateStr: string): string {
  const [y, m, d] = signingDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  let workingDays = 0;
  let totalDays = 0;
  while (
    totalDays < 3 ||
    workingDays < 2 ||
    date.getDay() === 0 ||
    date.getDay() === 6
  ) {
    date.setDate(date.getDate() + 1);
    totalDays += 1;
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      workingDays += 1;
    }
  }
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export const DatesContactsView: React.FC<DatesContactsViewProps> = ({
  language,
  milestones,
  contacts,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const t = UI_COPY[language];

  // Milestone Modal
  const [msModalOpen, setMsModalOpen] = useState(false);
  const [editingMsId, setEditingMsId] = useState<string | null>(null);
  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msTimeNote, setMsTimeNote] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [confirmDeleteMsId, setConfirmDeleteMsId] = useState<string | null>(
    null
  );

  // Contact Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [confirmDeleteContactId, setConfirmDeleteContactId] = useState<
    string | null
  >(null);

  const signingMilestone = milestones.find((m) => m.id === 'ms-1');
  const coolingOffMilestone = milestones.find((m) => m.id === 'ms-2');

  const openAddMilestone = () => {
    setEditingMsId(null);
    setMsTitle('');
    setMsDate('');
    setMsTimeNote('');
    setMsDescription('');
    setMsModalOpen(true);
  };

  const openEditMilestone = (ms: MilestoneDate) => {
    setEditingMsId(ms.id);
    setMsTitle(language === 'en' && ms.labelEn ? ms.labelEn : ms.label);
    setMsDate(ms.date);
    setMsTimeNote(ms.timeNote);
    setMsDescription(
      language === 'en' && ms.descriptionEn ? ms.descriptionEn : ms.description
    );
    setMsModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = msTitle.trim();
    if (!cleanTitle) return;
    if (editingMsId) {
      onUpdateMilestone(editingMsId, {
        ...(language === 'en'
          ? { labelEn: cleanTitle, descriptionEn: msDescription.trim() }
          : { label: cleanTitle, description: msDescription.trim() }),
        date: msDate,
        timeNote: msTimeNote.trim(),
      });
    } else {
      onAddMilestone({
        label: cleanTitle,
        description: msDescription.trim(),
        date: msDate,
        timeNote: msTimeNote.trim(),
      });
    }
    setMsModalOpen(false);
  };

  const openAddContact = () => {
    setEditingContactId(null);
    setFormRole('');
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setContactModalOpen(true);
  };

  const openEditContact = (contact: ContactPerson) => {
    setEditingContactId(contact.id);
    setFormRole(
      language === 'en' && contact.roleEn ? contact.roleEn : contact.role
    );
    setFormName(contact.name);
    setFormCompany(contact.company);
    setFormPhone(contact.phone);
    setFormEmail(contact.email);
    setFormNotes(contact.notes);
    setContactModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRole.trim()) return;
    if (editingContactId) {
      onUpdateContact(editingContactId, {
        ...(language === 'en'
          ? { roleEn: formRole.trim() }
          : { role: formRole.trim() }),
        name: formName.trim(),
        company: formCompany.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        notes: formNotes.trim(),
      });
    } else {
      onAddContact({
        role: formRole.trim(),
        name: formName.trim(),
        company: formCompany.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        notes: formNotes.trim(),
      });
    }
    setContactModalOpen(false);
  };

  const renderCountdownText = (diff: number | null) => {
    if (diff === null) {
      return (
        <span className="text-xs text-stone-400 font-medium">{t.setDate}</span>
      );
    }
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332]">
          <Clock className="w-3.5 h-3.5" />
          <span>{t.todayLabel}</span>
        </span>
      );
    }
    if (diff === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
          <Clock className="w-3.5 h-3.5" />
          <span>{t.tomorrowLabel}</span>
        </span>
      );
    }
    if (diff > 1) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums ${
            diff <= 7 ? 'text-amber-700' : 'text-[#1B4332]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            {language === 'en'
              ? `In ${diff} ${t.daysRemaining}`
              : `Over ${diff} ${t.daysRemaining}`}
          </span>
        </span>
      );
    }
    return (
      <span className="text-xs font-mono text-stone-400 tabular-nums">
        {Math.abs(diff)} {t.daysAgo}
      </span>
    );
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-8 lg:space-y-0">
      {/* Left Column: Key Milestones */}
      <section className="lg:col-span-6 space-y-3.5">
        <header className="px-1 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900">
              {t.keyDatesTitle}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{t.keyDatesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={openAddMilestone}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMilestone}</span>
          </button>
        </header>

        <div className="space-y-3">
          {milestones.map((ms) => {
            const diff = getDaysDiffFromToday(ms.date);
            const label = language === 'en' && ms.labelEn ? ms.labelEn : ms.label;
            const desc =
              language === 'en' && ms.descriptionEn
                ? ms.descriptionEn
                : ms.description;

            return (
              <article
                key={ms.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-stone-900 leading-snug">
                        {label}
                      </h3>
                      <div className="shrink-0">{renderCountdownText(diff)}</div>
                    </div>
                    {desc && (
                      <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                    )}
                  </div>

                  <div className="flex items-center shrink-0 -mr-1.5 -mt-1">
                    <button
                      type="button"
                      onClick={() => openEditMilestone(ms)}
                      aria-label={t.editMilestone}
                      className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteMsId === ms.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteMilestone(ms.id);
                          setConfirmDeleteMsId(null);
                        }}
                        className="min-h-[36px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer"
                      >
                        {t.deleteTask}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMsId(ms.id)}
                        aria-label={t.deleteTask}
                        className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={ms.date}
                      onChange={(e) =>
                        onUpdateMilestone(ms.id, { date: e.target.value })
                      }
                      aria-label={label}
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-sm font-mono text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={ms.timeNote}
                    onChange={(e) =>
                      onUpdateMilestone(ms.id, { timeNote: e.target.value })
                    }
                    placeholder={t.timeNotePlaceholder}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                  />
                </div>

                {ms.id === 'ms-2' &&
                  signingMilestone?.date &&
                  !coolingOffMilestone?.date && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMilestone('ms-2', {
                          date: computeDutchCoolingOffEnd(signingMilestone.date),
                        })
                      }
                      className="mt-2.5 min-h-[36px] text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
                    >
                      {t.calcCoolingOff} →
                    </button>
                  )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Right Column: Contacts */}
      <section className="lg:col-span-6 space-y-3.5">
        <header className="px-1 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900">
              {t.contactsTitle}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{t.contactsSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={openAddContact}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addContact}</span>
          </button>
        </header>

        <div className="space-y-3">
          {contacts.map((contact) => {
            const role =
              language === 'en' && contact.roleEn
                ? contact.roleEn
                : contact.role;
            const hasDetails =
              contact.name || contact.company || contact.phone || contact.email;

            return (
              <article
                key={contact.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#1B4332]">{role}</p>
                    <h3 className="text-[15px] font-semibold text-stone-900 mt-0.5 truncate">
                      {contact.name ||
                        contact.company ||
                        (language === 'en'
                          ? 'Tap edit to add details'
                          : 'Tik op bewerken om gegevens toe te voegen')}
                    </h3>
                    {contact.name && contact.company && (
                      <p className="text-xs text-stone-500 truncate">
                        {contact.company}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditContact(contact)}
                      aria-label={t.editContact}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {contact.isCustom &&
                      (confirmDeleteContactId === contact.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteContact(contact.id);
                            setConfirmDeleteContactId(null);
                          }}
                          className="min-h-[40px] px-2.5 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer"
                        >
                          {t.deleteTask}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteContactId(contact.id)}
                          aria-label={t.deleteTask}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ))}
                  </div>
                </div>

                {contact.notes && (
                  <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                    {contact.notes}
                  </p>
                )}

                {hasDetails && (contact.phone || contact.email) && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2.5">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-900 text-xs font-medium inline-flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#1B4332]" />
                        <span className="font-mono">{contact.phone}</span>
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-900 text-xs font-medium inline-flex items-center gap-1.5 transition min-w-0 max-w-full"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#1B4332] shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Milestone Add / Edit Modal */}
      {msModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {editingMsId ? t.editMilestone : t.addMilestone}
              </h2>
              <button
                type="button"
                onClick={() => setMsModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.milestoneTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Kitchen delivery, Structural inspection'
                      : 'bijv. Oplevering keuken, Bouwkundige keuring'
                  }
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.milestoneDateLabel}
                  </label>
                  <input
                    type="date"
                    value={msDate}
                    onChange={(e) => setMsDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.milestoneNoteLabel}
                  </label>
                  <input
                    type="text"
                    value={msTimeNote}
                    onChange={(e) => setMsTimeNote(e.target.value)}
                    placeholder={t.timeNotePlaceholder}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={msDescription}
                  onChange={(e) => setMsDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMsModalOpen(false)}
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

      {/* Contact Edit / Add Modal */}
      {contactModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {editingContactId ? t.editContact : t.addContact}
              </h2>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.roleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.companyLabel}
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
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
