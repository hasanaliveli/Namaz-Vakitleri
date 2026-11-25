import React from 'react';
import {AlertTriangle, BellOff, Compass, LocateFixed, VolumeX} from 'lucide-react';
import type {ActivePrayerState, DailyPrayerSchedule, Province} from '../types/app';
import {
  PRAYER_LABELS,
  formatCountdown,
  formatFullClockTR,
  formatMinutesSeconds,
  formatTimeTR,
} from '../utils/prayerTimes';
import {formatPlaka} from '../data/turkishProvinces';

interface PrayerHeroCardProps {
  now: Date;
  province: Province;
  schedule: DailyPrayerSchedule;
  activeState: ActivePrayerState;
  exitAlertMinutes: number;
  exitAlertEnabled: boolean;
  isSimulatingWarning: boolean;
  onDismissWarning: () => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  usingExactCoords: boolean;
  activeSilence: {
    active: boolean;
    prayerName: string;
    remainingSeconds: number;
  } | null;
  onStopSilence: () => void;
}

export const PrayerHeroCard: React.FC<PrayerHeroCardProps> = ({
  now,
  province,
  schedule,
  activeState,
  exitAlertMinutes,
  exitAlertEnabled,
  isSimulatingWarning,
  onDismissWarning,
  onDetectLocation,
  isDetectingLocation,
  usingExactCoords,
  activeSilence,
  onStopSilence,
}) => {
  const showWarning =
    isSimulatingWarning || (exitAlertEnabled && activeState.isExitWarningWindow);

  const displayRemainingSeconds = isSimulatingWarning
    ? Math.min(285, exitAlertMinutes * 60 - 12)
    : activeState.remainingSeconds;

  const progressRatio = isSimulatingWarning
    ? 0.94
    : Math.min(
        1,
        Math.max(0, 1 - activeState.remainingSeconds / activeState.totalWindowSeconds),
      );

  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const activeName = activeState.activePrayer
    ? PRAYER_LABELS[activeState.activePrayer].name
    : 'Kuşluk Vakti';

  const targetTimeText = activeState.activeExitTime
    ? formatTimeTR(activeState.activeExitTime)
    : formatTimeTR(activeState.nextEnterTime);

  const headlineLabel = showWarning
    ? `${activeState.activePrayer ? PRAYER_LABELS[activeState.activePrayer].name : 'Öğle'} vaktinin çıkmasına az kaldı`
    : activeState.isDuhaInterval
      ? 'Öğle vaktine kalan süre'
      : `${activeName} vaktinin çıkmasına kalan`;

  return (
    <section
      aria-label="Aktif vakit özeti"
      className={`rounded-3xl border p-5 sm:p-7 transition-colors duration-200 ${
        showWarning
          ? 'border-amber-500/50 bg-amber-50/90 dark:border-amber-500/40 dark:bg-amber-950/35'
          : 'border-[#E4E7E3] bg-white dark:border-[#232E27] dark:bg-[#151C18]'
      }`}
    >
      {/* Metadata row - clean unboxed text with separators */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#525C54] dark:text-[#A0ABA3]">
          <span className="font-semibold text-[#121914] dark:text-[#F1F5F2]">
            {formatPlaka(province.plaka)} · {province.name}
          </span>
          {usingExactCoords && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#0E6B4E] dark:text-[#2BB686] font-medium">GPS konumu</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{province.region}</span>
          <span aria-hidden="true">·</span>
          <span>{schedule.gregorianLabel}</span>
          {schedule.hijriLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{schedule.hijriLabel}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isDetectingLocation}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-[#0E6B4E] dark:text-[#2BB686] hover:bg-[#0E6B4E]/10 dark:hover:bg-[#2BB686]/15 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <LocateFixed className={`h-4 w-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
          <span>{isDetectingLocation ? 'Konum aranıyor...' : 'Konumumla Güncelle'}</span>
        </button>
      </div>

      {/* Urgent 5-minute exit warning banner */}
      {showWarning && (
        <div
          role="alert"
          className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-100/80 dark:bg-amber-900/40 px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                Vakit çıkış uyarısı ({exitAlertMinutes} dk kala)
              </p>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 mt-0.5 tabular-nums">
                {activeState.activePrayer ? PRAYER_LABELS[activeState.activePrayer].name : 'Öğle'}{' '}
                vaktinin çıkmasına{' '}
                <strong>{formatMinutesSeconds(displayRemainingSeconds)}</strong> kaldı.
              </p>
            </div>
          </div>
          {isSimulatingWarning && (
            <button
              type="button"
              onClick={onDismissWarning}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-900 text-white dark:bg-amber-400 dark:text-amber-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BellOff className="h-4 w-4" />
              <span>Test Uyarısını Kapat</span>
            </button>
          )}
        </div>
      )}

      {/* Active Auto-Silence banner */}
      {activeSilence?.active && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#0E6B4E]/30 bg-[#0E6B4E]/10 dark:border-[#2BB686]/30 dark:bg-[#2BB686]/15 px-4 py-3">
          <div className="flex items-center gap-3">
            <VolumeX className="h-5 w-5 text-[#0E6B4E] dark:text-[#2BB686] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Namazda Otomatik Sessiz Mod Aktif ({activeSilence.prayerName})
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] tabular-nums">
                Uygulama sesleri susturuldu · Kalan süre: {formatMinutesSeconds(activeSilence.remainingSeconds)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStopSilence}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0E6B4E]/30 dark:border-[#2BB686]/30 text-xs font-semibold text-[#0E6B4E] dark:text-[#2BB686] hover:bg-[#0E6B4E]/10 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sessiz Modu Bitir
          </button>
        </div>
      )}

      {/* Main countdown + Progress ring */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#525C54] dark:text-[#A0ABA3]">
            {headlineLabel}
          </p>
          <div
            className={`mt-1.5 text-4xl sm:text-5xl font-bold tracking-tight font-mono-tabular ${
              showWarning
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-[#121914] dark:text-[#F1F5F2]'
            }`}
          >
            {formatCountdown(displayRemainingSeconds)}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#525C54] dark:text-[#A0ABA3]">
            <span>
              Şu anki saat:{' '}
              <strong className="font-mono-tabular text-[#121914] dark:text-[#F1F5F2]">
                {formatFullClockTR(now)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activeState.isDuhaInterval ? 'Öğle girişi:' : 'Vakit çıkışı:'}{' '}
              <strong className="font-mono-tabular text-[#121914] dark:text-[#F1F5F2]">
                {targetTimeText}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-[#0E6B4E] dark:text-[#2BB686]" />
              Kıble{' '}
              <strong className="font-mono-tabular text-[#121914] dark:text-[#F1F5F2]">
                {schedule.qiblaAngle}°
              </strong>
            </span>
          </div>
        </div>

        {/* SVG Progress Ring */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative h-28 w-28 flex items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-[#E4E7E3] dark:text-[#232E27]"
              />
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className={`transition-all duration-300 ${
                  showWarning
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-[#0E6B4E] dark:text-[#2BB686]'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-[#525C54] dark:text-[#A0ABA3]">
                Vakit
              </span>
              <span className="text-sm font-bold text-[#121914] dark:text-[#F1F5F2] max-w-[74px] truncate">
                {activeState.activePrayer ? PRAYER_LABELS[activeState.activePrayer].name.split(' ')[0] : 'Kuşluk'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFF2EE] dark:bg-[#232E27]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              showWarning
                ? 'bg-amber-600 dark:bg-amber-400'
                : 'bg-[#0E6B4E] dark:bg-[#2BB686]'
            }`}
            style={{width: `${Math.round(progressRatio * 100)}%`}}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[#525C54] dark:text-[#A0ABA3]">
          <span>
            {activeState.activeStartTime
              ? `Başlangıç: ${formatTimeTR(activeState.activeStartTime)}`
              : 'Güneş doğdu'}
          </span>
          <span>
            {exitAlertEnabled
              ? `Çıkışa ${exitAlertMinutes} dk kala uyarı açık`
              : 'Çıkış uyarısı kapalı'}
          </span>
        </div>
      </div>
    </section>
  );
};
