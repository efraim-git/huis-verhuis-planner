import React, { useRef, useState } from 'react';
import {
  Check,
  Download,
  RotateCcw,
  Share,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { UI_COPY } from '../data/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Language } from '../types/planner';

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  houseName: string;
  onChangeLanguage: (lang: Language) => void;
  onChangeHouseName: (name: string) => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => boolean;
  onResetAll: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  open,
  onClose,
  language,
  houseName,
  onChangeLanguage,
  onChangeHouseName,
  onExportJson,
  onImportJson,
  onResetAll,
}) => {
  const t = UI_COPY[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const ok = onImportJson(text);
      setImportStatus(ok ? 'success' : 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => setImportStatus('error');
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.backupTitle}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-safe">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            {t.backupTitle}
          </h2>
          <button
            type="button"
            onClick={() => {
              setConfirmReset(false);
              setImportStatus('idle');
              onClose();
            }}
            aria-label={t.close}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* House Address */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              {t.houseAddressLabel}
            </label>
            <input
              type="text"
              value={houseName}
              onChange={(e) => onChangeHouseName(e.target.value)}
              placeholder={t.houseAddressPlaceholder}
              className="w-full min-h-[44px] rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          {/* Language Switcher */}
          <div>
            <span className="block text-xs font-medium text-stone-700 mb-1.5">
              {t.languageLabel}
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => onChangeLanguage('nl')}
                className={`min-h-[40px] rounded-lg text-sm font-medium transition cursor-pointer ${
                  language === 'nl'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Nederlands
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[40px] rounded-lg text-sm font-medium transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Install on iPhone / PWA */}
          {!isInstalled && (isInstallable || isIOS) && (
            <div className="rounded-2xl border border-stone-200 p-4 bg-[#F7F6F2] space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#1B4332]" />
                  <span className="text-sm font-medium text-stone-900">
                    {t.installAppTitle}
                  </span>
                </div>
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-medium hover:bg-[#143326] cursor-pointer"
                  >
                    {t.installAppButton}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide((v) => !v)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-800 cursor-pointer"
                  >
                    iPhone
                  </button>
                )}
              </div>
              {showIOSGuide && (
                <p className="text-xs text-stone-600 leading-relaxed flex items-start gap-2 pt-1">
                  <Share className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                  <span>{t.iosInstallSteps}</span>
                </p>
              )}
            </div>
          )}

          {/* Export & Import JSON */}
          <div className="space-y-3 pt-1 border-t border-stone-100">
            <button
              type="button"
              onClick={onExportJson}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-between gap-3 text-left transition cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">{t.exportJson}</p>
                <p className="text-xs text-stone-500">{t.exportDesc}</p>
              </div>
              <Download className="w-4 h-4 text-[#1B4332] shrink-0" />
            </button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-between gap-3 text-left transition cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{t.importJson}</p>
                  <p className="text-xs text-stone-500">{t.importDesc}</p>
                </div>
                <Upload className="w-4 h-4 text-[#1B4332] shrink-0" />
              </button>

              {importStatus === 'success' && (
                <p className="mt-2 text-xs font-medium text-[#1B4332] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.importSuccess}</span>
                </p>
              )}
              {importStatus === 'error' && (
                <p className="mt-2 text-xs font-medium text-red-700">
                  {t.importError}
                </p>
              )}
            </div>
          </div>

          {/* Reset to Default */}
          <div className="pt-3 border-t border-stone-100">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetButton}</span>
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-xs text-red-900 leading-relaxed">
                  {t.resetConfirmText}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-700 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAll();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                  >
                    {t.resetConfirmButton}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
