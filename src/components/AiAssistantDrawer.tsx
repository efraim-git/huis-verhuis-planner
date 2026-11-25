import React, { useState } from 'react';
import {
  Check,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { PHASES } from '../data/defaultData';
import { UI_COPY } from '../data/translations';
import type {
  AiAssistResponse,
  AiSuggestedTask,
  Language,
  PhaseId,
  TaskItem,
} from '../types/planner';

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  completionPercent: number;
  upcomingDateLabel?: string;
  onAddSuggestedTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
}

const VALID_PHASES: PhaseId[] = ['fase-1', 'fase-2', 'fase-3', 'fase-4', 'fase-5'];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  open,
  onClose,
  language,
  completionPercent,
  upcomingDateLabel,
  onAddSuggestedTask,
}) => {
  const t = UI_COPY[language];
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAssistResponse | null>(null);
  const [addedIndices, setAddedIndices] = useState<Record<number, boolean>>({});

  if (!open) return null;

  const askQuestion = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || loading) return;

    setQuestion(clean);
    setLoading(true);
    setError(null);
    setAddedIndices({});

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          lang: language,
          context: {
            completionPercent,
            upcomingDate: upcomingDateLabel,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Er ging iets mis bij het ophalen van advies.');
      }
      setResult(data as AiAssistResponse);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : language === 'en'
            ? 'Could not reach the assistant.'
            : 'Kon de assistent niet bereiken.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  const handleAddTask = (suggestion: AiSuggestedTask, idx: number) => {
    if (addedIndices[idx]) return;
    const phaseId: PhaseId = VALID_PHASES.includes(suggestion.phaseId)
      ? suggestion.phaseId
      : 'fase-1';

    onAddSuggestedTask({
      phaseId,
      title: suggestion.title,
      timingNote: suggestion.timingNote || (language === 'en' ? 'Flexible' : 'Flexibel'),
      details: suggestion.details || '',
      note: '',
      urgent: Boolean(suggestion.urgent),
    });
    setAddedIndices((prev) => ({ ...prev, [idx]: true }));
  };

  const getPhaseName = (phaseId: PhaseId) => {
    const found = PHASES.find((p) => p.id === phaseId);
    if (!found) return 'Fase 1';
    return language === 'en' ? found.shortLabelEn : found.shortLabelNl;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={t.aiTitle}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-none sm:rounded-l-2xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-full h-auto sm:h-full pb-safe">
        {/* Drag handle on mobile */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1B4332] shrink-0" />
              <h2 className="font-display text-lg font-semibold text-stone-900 truncate">
                {t.aiTitle}
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{t.aiSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Starter Prompts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">
              {language === 'en' ? 'Quick questions' : 'Veelgestelde vragen'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {t.aiStarters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={loading}
                  onClick={() => askQuestion(starter)}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-stone-50/70 hover:bg-stone-100 text-left text-xs sm:text-sm text-stone-800 transition cursor-pointer disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="py-6 flex items-center justify-center gap-2.5 text-sm text-stone-600">
              <Loader2 className="w-4 h-4 animate-spin text-[#1B4332]" />
              <span>{t.aiThinking}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F7F6F2] border border-stone-200/80 p-4 text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                {result.answer}
              </div>

              {Array.isArray(result.suggestedTasks) &&
                result.suggestedTasks.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-stone-700">
                      {t.aiSuggestedTasks}
                    </h3>
                    {result.suggestedTasks.map((task, idx) => {
                      const added = !!addedIndices[idx];
                      return (
                        <div
                          key={`${task.title}-${idx}`}
                          className="rounded-xl border border-stone-200 p-3.5 bg-white space-y-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {task.title}
                            </p>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {getPhaseName(task.phaseId)} · {task.timingNote}
                              {task.urgent ? ` · ${t.urgentLabel}` : ''}
                            </p>
                            {task.details && (
                              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                {task.details}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={added}
                            onClick={() => handleAddTask(task, idx)}
                            className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              added
                                ? 'bg-stone-100 text-[#1B4332]'
                                : 'bg-[#1B4332] text-white hover:bg-[#143326]'
                            }`}
                          >
                            {added ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.aiAdded}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t.aiAddToChecklist}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Sticky Input Footer */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-stone-100 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="flex-1 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#1B4332] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label={t.aiSend}
            className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-[#1B4332] text-white flex items-center justify-center hover:bg-[#143326] disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
