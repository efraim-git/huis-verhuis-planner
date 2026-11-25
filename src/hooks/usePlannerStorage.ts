import { useEffect, useState, useCallback } from 'react';
import {
  createDefaultPlannerData,
  DEFAULT_KLUSSEN,
  DEFAULT_ROOMS,
} from '../data/defaultData';
import type {
  ContactPerson,
  ExpenseItem,
  KlusItem,
  Language,
  MilestoneDate,
  PlannerData,
  RoomItem,
  TaskItem,
} from '../types/planner';

const STORAGE_KEY = 'huis_verhuis_planner_v1';

function loadInitialData(): PlannerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultPlannerData();
    const parsed = JSON.parse(raw) as Partial<PlannerData>;
    const defaults = createDefaultPlannerData();
    if (
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.expenses) ||
      !Array.isArray(parsed.milestones) ||
      !Array.isArray(parsed.contacts)
    ) {
      return defaults;
    }
    return {
      version: 2,
      language: parsed.language === 'en' ? 'en' : 'nl',
      houseName: typeof parsed.houseName === 'string' ? parsed.houseName : '',
      tasks: parsed.tasks.map((t) => ({
        ...t,
        dueDate: typeof t.dueDate === 'string' ? t.dueDate : '',
        durationDays:
          typeof t.durationDays === 'number' && t.durationDays >= 1
            ? t.durationDays
            : undefined,
      })),
      expenses: parsed.expenses,
      milestones: parsed.milestones,
      contacts: parsed.contacts,
      rooms:
        Array.isArray(parsed.rooms) && parsed.rooms.length > 0
          ? parsed.rooms
          : DEFAULT_ROOMS.map((r) => ({ ...r })),
      klussen: Array.isArray(parsed.klussen)
        ? parsed.klussen.map((k) => ({
            ...k,
            durationDays:
              typeof k.durationDays === 'number' && k.durationDays >= 1
                ? k.durationDays
                : undefined,
          }))
        : DEFAULT_KLUSSEN.map((k) => ({ ...k })),
    };
  } catch {
    return createDefaultPlannerData();
  }
}

export function usePlannerStorage() {
  const [data, setData] = useState<PlannerData>(loadInitialData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed saving planner data to localStorage:', err);
    }
  }, [data]);

  const setLanguage = useCallback((language: Language) => {
    setData((prev) => ({ ...prev, language }));
  }, []);

  const setHouseName = useCallback((houseName: string) => {
    setData((prev) => ({ ...prev, houseName }));
  }, []);

  // Tasks
  const toggleTask = useCallback((taskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, []);

  const updateTaskNote = useCallback((taskId: string, note: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, note } : t)),
    }));
  }, []);

  const addTask = useCallback(
    (task: Omit<TaskItem, 'id' | 'completed'>) => {
      const newTask: TaskItem = {
        ...task,
        dueDate: task.dueDate ?? '',
        durationDays:
          task.durationDays && task.durationDays >= 1
            ? Math.floor(task.durationDays)
            : undefined,
        id: `task-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completed: false,
        isCustom: true,
      };
      setData((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
      return newTask;
    },
    []
  );

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Omit<TaskItem, 'id'>>) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }));
    },
    []
  );

  const deleteTask = useCallback((taskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  // Rooms & Klussen
  const addRoom = useCallback((name: string) => {
    const newRoom: RoomItem = {
      id: `room-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      isCustom: true,
    };
    setData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
    return newRoom;
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
      klussen: prev.klussen.filter((k) => k.roomId !== roomId),
    }));
  }, []);

  const addKlus = useCallback((klus: Omit<KlusItem, 'id'>) => {
    const newKlus: KlusItem = {
      ...klus,
      durationDays:
        klus.durationDays && klus.durationDays >= 1
          ? Math.floor(klus.durationDays)
          : undefined,
      id: `klus-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setData((prev) => ({
      ...prev,
      klussen: [...prev.klussen, newKlus],
    }));
    return newKlus;
  }, []);

  const updateKlus = useCallback(
    (klusId: string, updates: Partial<Omit<KlusItem, 'id'>>) => {
      setData((prev) => ({
        ...prev,
        klussen: prev.klussen.map((k) =>
          k.id === klusId ? { ...k, ...updates } : k
        ),
      }));
    },
    []
  );

  const deleteKlus = useCallback((klusId: string) => {
    setData((prev) => ({
      ...prev,
      klussen: prev.klussen.filter((k) => k.id !== klusId),
    }));
  }, []);

  // Expenses
  const addExpense = useCallback((expense: Omit<ExpenseItem, 'id'>) => {
    const newExpense: ExpenseItem = {
      ...expense,
      id: `exp-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isCustom: true,
    };
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }));
  }, []);

  const updateExpense = useCallback(
    (expenseId: string, updates: Partial<Omit<ExpenseItem, 'id'>>) => {
      setData((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) =>
          e.id === expenseId ? { ...e, ...updates } : e
        ),
      }));
    },
    []
  );

  const deleteExpense = useCallback((expenseId: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  }, []);

  // Milestones
  const addMilestone = useCallback(
    (milestone: Omit<MilestoneDate, 'id'>) => {
      const newMilestone: MilestoneDate = {
        ...milestone,
        id: `ms-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        isCustom: true,
      };
      setData((prev) => ({
        ...prev,
        milestones: [...prev.milestones, newMilestone],
      }));
      return newMilestone;
    },
    []
  );

  const updateMilestone = useCallback(
    (milestoneId: string, updates: Partial<Omit<MilestoneDate, 'id'>>) => {
      setData((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId ? { ...m, ...updates } : m
        ),
      }));
    },
    []
  );

  const deleteMilestone = useCallback((milestoneId: string) => {
    setData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== milestoneId),
    }));
  }, []);

  // Contacts
  const addContact = useCallback((contact: Omit<ContactPerson, 'id'>) => {
    const newContact: ContactPerson = {
      ...contact,
      id: `cnt-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isCustom: true,
    };
    setData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, newContact],
    }));
  }, []);

  const updateContact = useCallback(
    (contactId: string, updates: Partial<Omit<ContactPerson, 'id'>>) => {
      setData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) =>
          c.id === contactId ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const deleteContact = useCallback((contactId: string) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== contactId),
    }));
  }, []);

  // Backup & Reset
  const exportBackup = useCallback(() => {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huis-verhuis-planner-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const importBackup = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<PlannerData>;
      if (
        !parsed ||
        !Array.isArray(parsed.tasks) ||
        !Array.isArray(parsed.expenses) ||
        !Array.isArray(parsed.milestones) ||
        !Array.isArray(parsed.contacts)
      ) {
        return false;
      }
      setData({
        version: 2,
        language: parsed.language === 'en' ? 'en' : 'nl',
        houseName: typeof parsed.houseName === 'string' ? parsed.houseName : '',
        tasks: parsed.tasks.map((t) => ({
          ...t,
          dueDate: typeof t.dueDate === 'string' ? t.dueDate : '',
          durationDays:
            typeof t.durationDays === 'number' && t.durationDays >= 1
              ? t.durationDays
              : undefined,
        })),
        expenses: parsed.expenses,
        milestones: parsed.milestones,
        contacts: parsed.contacts,
        rooms:
          Array.isArray(parsed.rooms) && parsed.rooms.length > 0
            ? parsed.rooms
            : DEFAULT_ROOMS.map((r) => ({ ...r })),
        klussen: Array.isArray(parsed.klussen)
          ? parsed.klussen.map((k) => ({
              ...k,
              durationDays:
                typeof k.durationDays === 'number' && k.durationDays >= 1
                  ? k.durationDays
                  : undefined,
            }))
          : DEFAULT_KLUSSEN.map((k) => ({ ...k })),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setData((prev) => ({
      ...createDefaultPlannerData(),
      language: prev.language,
    }));
  }, []);

  return {
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
  };
}
