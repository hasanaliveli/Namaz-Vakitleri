import React, {useState} from 'react';
import {Bell, BellOff} from 'lucide-react';
import type {
  ActivePrayerState,
  DailyPrayerSchedule,
  ObligatoryPrayerKey,
  PerPrayerNotifications,
  PrayerKey,
} from '../types/app';
import {
  ALL_PRAYER_KEYS,
  PRAYER_LABELS,
  formatShortDateTR,
  formatTimeTR,
} from '../utils/prayerTimes';

interface PrayerScheduleListProps {
  schedule: DailyPrayerSchedule;
  weeklySchedule: DailyPrayerSchedule[];
  activeState: ActivePrayerState;
  notifications: PerPrayerNotifications;
  exitAlertMinutes: number;
  onToggleExitAlertForPrayer: (prayer: PrayerKey) => void;
}

export const PrayerScheduleList: React.FC<PrayerScheduleListProps> = ({
  schedule,
  weeklySchedule,
  activeState,
  notifications,
  exitAlertMinutes,
  onToggleExitAlertForPrayer,
}) => {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

  return (
    <section
      aria-label="Günlük ve haftalık namaz vakitleri"
      className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
        <div>
          <h2 className="text-lg font-bold text-[#121914] dark:text-[#F1F5F2]">
            {viewMode === 'today' ? 'Günün Vakitleri' : '7 Günlük İmsakiye'}
          </h2>
          <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
            {viewMode === 'today'
              ? `Diyanet uyumlu · Çıkışa ${exitAlertMinutes} dk kala uyarı simgesinden yönetebilirsiniz`
              : 'Önümüzdeki 7 günün vakit giriş saatleri'}
          </p>
        </div>

        {/* Segmented toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFF2EE] dark:bg-[#0D120F]">
          <button
            type="button"
            onClick={() => setViewMode('today')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'today'
                ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                : 'text-[#525C54] dark:text-[#A0ABA3] hover:text-[#121914] dark:hover:text-[#F1F5F2]'
            }`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                : 'text-[#525C54] dark:text-[#A0ABA3] hover:text-[#121914] dark:hover:text-[#F1F5F2]'
            }`}
          >
            7 Günlük
          </button>
        </div>
      </div>

      {viewMode === 'today' ? (
        <ul className="divide-y divide-[#EFF2EE] dark:divide-[#232E27] mt-1">
          {ALL_PRAYER_KEYS.map((key) => {
            const isCurrent =
              activeState.activePrayer === key ||
              (activeState.isDuhaInterval && key === 'sunrise');
            const isObligatory = key !== 'sunrise';
            const exitTime = isObligatory
              ? schedule.exits[key as ObligatoryPrayerKey]
              : null;
            const pref = notifications[key];

            return (
              <li
                key={key}
                className={`flex items-center justify-between gap-3 py-3.5 px-2 -mx-2 rounded-2xl transition-colors ${
                  isCurrent ? 'bg-[#0E6B4E]/8 dark:bg-[#2BB686]/12 px-3' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm sm:text-base font-semibold ${
                        isCurrent
                          ? 'text-[#0E6B4E] dark:text-[#2BB686]'
                          : 'text-[#121914] dark:text-[#F1F5F2]'
                      }`}
                    >
                      {PRAYER_LABELS[key].name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-[#0E6B4E] dark:text-[#2BB686]">
                        · Şu an
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                    {exitTime
                      ? `Çıkış: ${formatTimeTR(exitTime)} (${PRAYER_LABELS[key].exitLabel})`
                      : PRAYER_LABELS[key].shortNote}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-lg sm:text-xl font-bold font-mono-tabular ${
                      isCurrent
                        ? 'text-[#0E6B4E] dark:text-[#2BB686]'
                        : 'text-[#121914] dark:text-[#F1F5F2]'
                    }`}
                  >
                    {formatTimeTR(schedule.times[key])}
                  </span>

                  {isObligatory ? (
                    <button
                      type="button"
                      onClick={() => onToggleExitAlertForPrayer(key)}
                      aria-label={`${PRAYER_LABELS[key].name} çıkış uyarısını ${pref.beforeExit ? 'kapat' : 'aç'}`}
                      title={`Çıkışa ${exitAlertMinutes} dk kala uyarı: ${pref.beforeExit ? 'Açık' : 'Kapalı'}`}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                        pref.beforeExit
                          ? 'border-[#0E6B4E]/25 bg-[#0E6B4E]/10 text-[#0E6B4E] dark:border-[#2BB686]/30 dark:bg-[#2BB686]/15 dark:text-[#2BB686]'
                          : 'border-[#E4E7E3] dark:border-[#232E27] text-[#838D85] dark:text-[#66736A] hover:bg-[#EFF2EE] dark:hover:bg-[#1C2520]'
                      }`}
                    >
                      {pref.beforeExit ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="min-w-[44px]" aria-hidden="true" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7E3] dark:border-[#232E27] text-xs font-semibold text-[#525C54] dark:text-[#A0ABA3]">
                <th className="py-2.5 pr-3">Tarih</th>
                <th className="py-2.5 px-2">İmsak</th>
                <th className="py-2.5 px-2">Güneş</th>
                <th className="py-2.5 px-2">Öğle</th>
                <th className="py-2.5 px-2">İkindi</th>
                <th className="py-2.5 px-2">Akşam</th>
                <th className="py-2.5 pl-2">Yatsı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF2EE] dark:divide-[#232E27] text-xs sm:text-sm">
              {weeklySchedule.map((day, idx) => {
                const anchorDate = day.times.dhuhr;
                return (
                  <tr
                    key={day.dateKey}
                    className={idx === 0 ? 'bg-[#0E6B4E]/6 dark:bg-[#2BB686]/10 font-semibold' : ''}
                  >
                    <td className="py-3 pr-3 whitespace-nowrap text-[#121914] dark:text-[#F1F5F2]">
                      {idx === 0 ? 'Bugün' : formatShortDateTR(anchorDate)}
                    </td>
                    {ALL_PRAYER_KEYS.map((key) => (
                      <td
                        key={key}
                        className="py-3 px-2 font-mono-tabular text-[#121914] dark:text-[#F1F5F2] whitespace-nowrap"
                      >
                        {formatTimeTR(day.times[key])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
