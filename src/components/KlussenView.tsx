import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Hammer,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { UI_COPY } from '../data/translations';
import { formatRangeLabel } from '../utils/dateRange';
import type {
  KlusExecutor,
  KlusItem,
  KlusStatus,
  Language,
  RoomItem,
} from '../types/planner';

interface KlussenViewProps {
  language: Language;
  rooms: RoomItem[];
  klussen: KlusItem[];
  onAddRoom: (name: string) => RoomItem;
  onDeleteRoom: (roomId: string) => void;
  onAddKlus: (klus: Omit<KlusItem, 'id'>) => void;
  onUpdateKlus: (id: string, updates: Partial<Omit<KlusItem, 'id'>>) => void;
  onDeleteKlus: (id: string) => void;
}

export const KlussenView: React.FC<KlussenViewProps> = ({
  language,
  rooms,
  klussen,
  onAddRoom,
  onDeleteRoom,
  onAddKlus,
  onUpdateKlus,
  onDeleteKlus,
}) => {
  const t = UI_COPY[language];
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [calcOpen, setCalcOpen] = useState(false);

  // Paint & Flooring Calculator State
  const [roomLength, setRoomLength] = useState('5.5');
  const [roomWidth, setRoomWidth] = useState('4.0');
  const [wallHeight, setWallHeight] = useState('2.6');
  const [coats, setCoats] = useState<1 | 2>(2);

  // Add Room Modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Add / Edit Klus Modal
  const [klusModalOpen, setKlusModalOpen] = useState(false);
  const [editingKlusId, setEditingKlusId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formRoomId, setFormRoomId] = useState(rooms[0]?.id ?? 'room-1');
  const [formExecutor, setFormExecutor] = useState<KlusExecutor>('diy');
  const [formContractorName, setFormContractorName] = useState('');
  const [formContractorPhone, setFormContractorPhone] = useState('');
  const [formPlannedDate, setFormPlannedDate] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formStatus, setFormStatus] = useState<KlusStatus>('planned');
  const [formEstCost, setFormEstCost] = useState('');
  const [formActCost, setFormActCost] = useState('');
  const [formNote, setFormNote] = useState('');

  const [confirmDeleteKlusId, setConfirmDeleteKlusId] = useState<string | null>(
    null
  );
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(
    null
  );

  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const calcStats = useMemo(() => {
    const l = Math.max(0, parseFloat(roomLength.replace(',', '.')) || 0);
    const w = Math.max(0, parseFloat(roomWidth.replace(',', '.')) || 0);
    const h = Math.max(0, parseFloat(wallHeight.replace(',', '.')) || 0);

    const netFloor = l * w;
    const floorWithWaste = netFloor * 1.1;
    const wallArea = 2 * (l + w) * h;
    const liters = (wallArea * coats) / 9;

    return {
      netFloor: netFloor.toFixed(1).replace('.', ','),
      floorWithWaste: floorWithWaste.toFixed(1).replace('.', ','),
      wallArea: wallArea.toFixed(1).replace('.', ','),
      liters: liters.toFixed(1).replace('.', ','),
    };
  }, [roomLength, roomWidth, wallHeight, coats]);

  const totals = useMemo(() => {
    let est = 0;
    let act = 0;
    let done = 0;
    for (const k of klussen) {
      est += Number(k.estimatedCost) || 0;
      act += Number(k.actualCost) || 0;
      if (k.status === 'done') done += 1;
    }
    return { est, act, done, total: klussen.length };
  }, [klussen]);

  const visibleRooms = useMemo(() => {
    if (selectedRoomFilter === 'all') return rooms;
    return rooms.filter((r) => r.id === selectedRoomFilter);
  }, [rooms, selectedRoomFilter]);

  const openAddKlus = (roomId?: string) => {
    setEditingKlusId(null);
    setFormTitle('');
    setFormRoomId(
      roomId ||
        (selectedRoomFilter !== 'all'
          ? selectedRoomFilter
          : rooms[0]?.id ?? 'room-1')
    );
    setFormExecutor('diy');
    setFormContractorName('');
    setFormContractorPhone('');
    setFormPlannedDate('');
    setFormDuration('');
    setFormStatus('planned');
    setFormEstCost('0');
    setFormActCost('0');
    setFormNote('');
    setKlusModalOpen(true);
  };

  const openEditKlus = (klus: KlusItem) => {
    setEditingKlusId(klus.id);
    setFormTitle(klus.title);
    setFormRoomId(klus.roomId);
    setFormExecutor(klus.executor);
    setFormContractorName(klus.contractorName || '');
    setFormContractorPhone(klus.contractorPhone || '');
    setFormPlannedDate(klus.plannedDate || '');
    setFormDuration(
      klus.durationDays && klus.durationDays >= 1 ? String(klus.durationDays) : ''
    );
    setFormStatus(klus.status);
    setFormEstCost(String(klus.estimatedCost));
    setFormActCost(String(klus.actualCost));
    setFormNote(klus.note || '');
    setKlusModalOpen(true);
  };

  const handleSaveKlus = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) return;

    const parsedDur = parseInt(formDuration, 10);
    const durationDays =
      !isNaN(parsedDur) && parsedDur >= 1 ? Math.min(365, parsedDur) : undefined;

    const payload: Omit<KlusItem, 'id'> = {
      roomId: formRoomId,
      title: cleanTitle,
      executor: formExecutor,
      contractorName:
        formExecutor === 'pro' ? formContractorName.trim() : undefined,
      contractorPhone:
        formExecutor === 'pro' ? formContractorPhone.trim() : undefined,
      plannedDate: formPlannedDate,
      durationDays,
      status: formStatus,
      estimatedCost: Math.max(0, Math.round(Number(formEstCost) || 0)),
      actualCost: Math.max(0, Math.round(Number(formActCost) || 0)),
      note: formNote.trim(),
    };

    if (editingKlusId) {
      onUpdateKlus(editingKlusId, payload);
    } else {
      onAddKlus(payload);
    }
    setKlusModalOpen(false);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRoomName.trim();
    if (!clean) return;
    const created = onAddRoom(clean);
    setNewRoomName('');
    setRoomModalOpen(false);
    setSelectedRoomFilter(created.id);
  };

  const cycleStatus = (klus: KlusItem) => {
    const next: KlusStatus =
      klus.status === 'planned'
        ? 'in_progress'
        : klus.status === 'in_progress'
          ? 'done'
          : 'planned';
    onUpdateKlus(klus.id, { status: next });
  };

  const getStatusLabel = (status: KlusStatus) => {
    if (status === 'done') return t.statusDone;
    if (status === 'in_progress') return t.statusInProgress;
    return t.statusPlanned;
  };

  return (
    <div className="space-y-5">
      {/* Top Overview + Actions */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900">
              {t.klussenTitle}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">{t.klussenSubtitle}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-mono font-semibold text-stone-900 tabular-nums">
                {totals.done}/{totals.total} {t.klussenDoneOf}
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="font-mono text-stone-700 tabular-nums">
                {t.budgetEstimated}: {euroFormatter.format(totals.est)}
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="font-mono font-medium text-[#1B4332] tabular-nums">
                {t.budgetActual}: {euroFormatter.format(totals.act)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {t.klussenBudgetSyncNote}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRoomModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addRoom}</span>
            </button>
            <button
              type="button"
              onClick={() => openAddKlus()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#143326] flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addKlus}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Collapsible Rekenhulp (Verf & Vloer Helper) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden">
        <button
          type="button"
          onClick={() => setCalcOpen((prev) => !prev)}
          aria-expanded={calcOpen}
          className="w-full min-h-[56px] px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] border border-stone-200/80 flex items-center justify-center shrink-0 text-[#1B4332]">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-semibold text-stone-900">
                {t.calcTitle}
              </h2>
              <p className="text-xs text-stone-500 truncate">{t.calcSubtitle}</p>
            </div>
          </div>
          {calcOpen ? (
            <ChevronUp className="w-5 h-5 text-stone-400 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
          )}
        </button>

        {calcOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-stone-100 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label className="block">
                <span className="block text-xs font-medium text-stone-600 mb-1">
                  {t.calcLength}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={roomLength}
                  onChange={(e) => setRoomLength(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-stone-600 mb-1">
                  {t.calcWidth}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-stone-600 mb-1">
                  {t.calcHeight}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-sm font-mono tabular-nums text-stone-900 focus:bg-white focus:border-[#1B4332] focus:outline-none"
                />
              </label>

              <div>
                <span className="block text-xs font-medium text-stone-600 mb-1">
                  {t.calcCoats}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl h-[44px]">
                  <button
                    type="button"
                    onClick={() => setCoats(1)}
                    className={`rounded-lg text-xs font-medium transition cursor-pointer ${
                      coats === 1
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600'
                    }`}
                  >
                    {t.calcOneCoat}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoats(2)}
                    className={`rounded-lg text-xs font-medium transition cursor-pointer ${
                      coats === 2
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600'
                    }`}
                  >
                    {t.calcTwoCoats}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F6F2] border border-stone-200/80 p-3.5">
                <p className="text-xs text-stone-500">{t.calcFloorResult}</p>
                <p className="mt-1 font-display text-xl font-bold text-stone-900 font-mono tabular-nums">
                  {calcStats.floorWithWaste} m²
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500 font-mono tabular-nums">
                  {t.calcFloorNote}: {calcStats.netFloor} m²
                </p>
              </div>

              <div className="rounded-xl bg-[#F7F6F2] border border-stone-200/80 p-3.5">
                <p className="text-xs text-stone-500">{t.calcPaintResult}</p>
                <p className="mt-1 font-display text-xl font-bold text-[#1B4332] font-mono tabular-nums">
                  ~{calcStats.liters} liter
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500 font-mono tabular-nums">
                  {calcStats.wallArea} m² · {t.calcPaintNote}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Horizontal Room Filter Strip */}
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-max pb-1">
          <button
            type="button"
            onClick={() => setSelectedRoomFilter('all')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
              selectedRoomFilter === 'all'
                ? 'bg-[#1B4332] text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            {t.allPhases} ({rooms.length})
          </button>
          {rooms.map((room) => {
            const roomJobs = klussen.filter((k) => k.roomId === room.id);
            const roomDone = roomJobs.filter((k) => k.status === 'done').length;
            const active = selectedRoomFilter === room.id;
            const label =
              language === 'en' && room.nameEn ? room.nameEn : room.name;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomFilter(room.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition cursor-pointer ${
                  active
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
                }`}
              >
                {label} · {roomDone}/{roomJobs.length}
              </button>
            );
          })}
        </div>
      </div>

      {/* Room-by-Room Renovation Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibleRooms.map((room) => {
          const roomJobs = klussen.filter((k) => k.roomId === room.id);
          const roomDone = roomJobs.filter((k) => k.status === 'done').length;
          const roomPct =
            roomJobs.length === 0
              ? 0
              : Math.round((roomDone / roomJobs.length) * 100);
          const roomEst = roomJobs.reduce(
            (sum, k) => sum + (Number(k.estimatedCost) || 0),
            0
          );
          const roomName =
            language === 'en' && room.nameEn ? room.nameEn : room.name;

          return (
            <section
              key={room.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base sm:text-lg font-semibold text-stone-900 truncate">
                      {roomName}
                    </h2>
                    {room.isCustom && (
                      <span className="text-xs text-stone-400">
                        {confirmDeleteRoomId === room.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRoom(room.id);
                              setConfirmDeleteRoomId(null);
                              if (selectedRoomFilter === room.id) {
                                setSelectedRoomFilter('all');
                              }
                            }}
                            className="text-red-700 font-medium hover:underline cursor-pointer"
                          >
                            {t.deleteTask}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteRoomId(room.id)}
                            aria-label={t.deleteTask}
                            className="p-1 text-stone-400 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-stone-500 font-mono tabular-nums">
                    <span>
                      {roomDone}/{roomJobs.length} {t.klussenDoneOf}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{euroFormatter.format(roomEst)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAddKlus(room.id)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-900 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Job' : 'Klus'}</span>
                </button>
              </div>

              <div className="mt-3 h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-[#1B4332] rounded-full transition-all duration-300"
                  style={{ width: `${roomPct}%` }}
                />
              </div>

              <div className="mt-4 space-y-2.5 flex-1">
                {roomJobs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-stone-400">
                    {language === 'en'
                      ? 'No jobs in this room yet.'
                      : 'Nog geen klussen in deze ruimte.'}
                  </p>
                ) : (
                  roomJobs.map((klus) => {
                    const isDone = klus.status === 'done';
                    const isInProgress = klus.status === 'in_progress';
                    const rangeLabel = klus.plannedDate
                      ? formatRangeLabel(
                          klus.plannedDate,
                          klus.durationDays,
                          language
                        )
                      : '';

                    return (
                      <article
                        key={klus.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          isDone
                            ? 'bg-stone-50/70 border-stone-200/60'
                            : 'bg-[#F7F6F2]/60 border-stone-200/80'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => cycleStatus(klus)}
                            aria-label={`${klus.title} — ${getStatusLabel(klus.status)}`}
                            className="min-h-[44px] min-w-[44px] -m-1.5 flex items-center justify-center shrink-0 rounded-xl hover:bg-stone-200/60 transition cursor-pointer"
                          >
                            <span
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                                isDone
                                  ? 'bg-[#1B4332] border-[#1B4332] text-white'
                                  : isInProgress
                                    ? 'bg-amber-600 border-amber-600 text-white'
                                    : 'bg-white border-stone-300 text-transparent'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : isInProgress ? (
                                <Hammer className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </span>
                          </button>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <h3
                              className={`text-sm font-medium leading-snug ${
                                isDone
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-900'
                              }`}
                            >
                              {klus.title}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                              <button
                                type="button"
                                onClick={() => cycleStatus(klus)}
                                className={`font-medium cursor-pointer hover:underline ${
                                  isDone
                                    ? 'text-[#1B4332]'
                                    : isInProgress
                                      ? 'text-amber-700'
                                      : 'text-stone-600'
                                }`}
                              >
                                {getStatusLabel(klus.status)}
                              </button>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                {klus.executor === 'diy' ? (
                                  <Wrench className="w-3 h-3" />
                                ) : (
                                  <User className="w-3 h-3" />
                                )}
                                <span>
                                  {klus.executor === 'diy'
                                    ? t.klusDiy
                                    : klus.contractorName || t.klusPro}
                                </span>
                              </span>

                              {rangeLabel && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 font-mono text-sky-800 font-medium tabular-nums">
                                    <Calendar className="w-3 h-3" />
                                    <span>{rangeLabel}</span>
                                  </span>
                                </>
                              )}

                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-stone-700">
                                {euroFormatter.format(
                                  klus.actualCost || klus.estimatedCost
                                )}
                                {klus.actualCost > 0 && klus.estimatedCost > 0
                                  ? ` / ${euroFormatter.format(klus.estimatedCost)}`
                                  : ''}
                              </span>
                            </div>

                            {klus.executor === 'pro' && klus.contractorPhone && (
                              <a
                                href={`tel:${klus.contractorPhone.replace(/\s+/g, '')}`}
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-mono text-[#1B4332] hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{klus.contractorPhone}</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditKlus(klus)}
                              aria-label={t.editKlus}
                              className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteKlusId === klus.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteKlus(klus.id);
                                  setConfirmDeleteKlusId(null);
                                }}
                                className="min-h-[36px] px-2 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer"
                              >
                                {t.deleteTask}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKlusId(klus.id)}
                                aria-label={t.deleteTask}
                                className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add Custom Room Modal */}
      {roomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {t.addRoom}
              </h2>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.roomNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Attic / Home Office'
                      : 'bijv. Zolder / Werkkamer'
                  }
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 cursor-pointer"
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

      {/* Add / Edit Klus Modal */}
      {klusModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <h2 className="font-display text-lg font-semibold text-stone-900">
                {editingKlusId ? t.editKlus : t.addKlus}
              </h2>
              <button
                type="button"
                onClick={() => setKlusModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKlus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.klusNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Paint walls, lay laminate flooring'
                      : 'bijv. Muren sauzen, laminaat leggen'
                  }
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.klusRoomLabel}
                </label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {language === 'en' && r.nameEn ? r.nameEn : r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.klusDateLabel}
                  </label>
                  <input
                    type="date"
                    value={formPlannedDate}
                    onChange={(e) => setFormPlannedDate(e.target.value)}
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

              {/* DIY vs Vakman Toggle */}
              <div>
                <span className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.klusWhoLabel}
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormExecutor('diy')}
                    className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                      formExecutor === 'diy'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600'
                    }`}
                  >
                    {t.klusDiy}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormExecutor('pro')}
                    className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                      formExecutor === 'pro'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600'
                    }`}
                  >
                    {t.klusPro}
                  </button>
                </div>
              </div>

              {formExecutor === 'pro' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      {t.klusContractorName}
                    </label>
                    <input
                      type="text"
                      value={formContractorName}
                      onChange={(e) => setFormContractorName(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">
                      {t.klusContractorPhone}
                    </label>
                    <input
                      type="tel"
                      value={formContractorPhone}
                      onChange={(e) => setFormContractorPhone(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <span className="block text-xs font-medium text-stone-700 mb-1.5">
                  {t.klusStatusLabel}
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl">
                  {(
                    [
                      { id: 'planned', label: t.statusPlanned },
                      { id: 'in_progress', label: t.statusInProgress },
                      { id: 'done', label: t.statusDone },
                    ] as { id: KlusStatus; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormStatus(st.id)}
                      className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                        formStatus === st.id
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Costs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.klusEstCost}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formEstCost}
                    onChange={(e) => setFormEstCost(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-mono tabular-nums text-stone-900 focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    {t.klusActCost}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formActCost}
                    onChange={(e) => setFormActCost(e.target.value)}
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

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setKlusModalOpen(false)}
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
