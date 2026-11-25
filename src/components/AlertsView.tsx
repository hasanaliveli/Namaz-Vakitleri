import React from 'react';
import {Bell, BellRing, CheckCircle2, Play, ShieldAlert} from 'lucide-react';
import type {
  DailyPrayerSchedule,
  ObligatoryPrayerKey,
  PerPrayerNotifications,
  Province,
} from '../types/app';
import {OBLIGATORY_PRAYERS, PRAYER_LABELS, formatTimeTR} from '../utils/prayerTimes';

interface AlertsViewProps {
  province: Province;
  schedule: DailyPrayerSchedule;
  exitAlertEnabled: boolean;
  exitAlertMinutes: number;
  notifications: PerPrayerNotifications;
  notificationPermission: NotificationPermission | 'unsupported';
  onRequestPermission: () => void;
  onToggleMasterExitAlert: () => void;
  onChangeLeadMinutes: (minutes: number) => void;
  onTogglePrayerExitAlert: (prayer: ObligatoryPrayerKey) => void;
  onTestExitWarning: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  province,
  schedule,
  exitAlertEnabled,
  exitAlertMinutes,
  notifications,
  notificationPermission,
  onRequestPermission,
  onToggleMasterExitAlert,
  onChangeLeadMinutes,
  onTogglePrayerExitAlert,
  onTestExitWarning,
}) => {
  return (
    <div className="space-y-6">
      {/* Header & Permission Card */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#121914] dark:text-[#F1F5F2]">
              Vakit Çıkış Uyarıları
            </h1>
            <p className="mt-1 text-sm text-[#525C54] dark:text-[#A0ABA3]">
              Namaz vaktinin çıkmasına {exitAlertMinutes} dakika kala sesli, titreşimli ve sistem bildirimli uyarı alın.
            </p>
          </div>
          <button
            type="button"
            onClick={onTestExitWarning}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-4 w-4" />
            <span>{exitAlertMinutes} Dk Uyarısını Test Et</span>
          </button>
        </div>

        {/* Browser / Android Notification Permission Status */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] bg-[#F6F7F5] dark:bg-[#0D120F] p-4">
          <div className="flex items-start gap-3">
            {notificationPermission === 'granted' ? (
              <CheckCircle2 className="h-5 w-5 text-[#0E6B4E] dark:text-[#2BB686] shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                {notificationPermission === 'granted'
                  ? 'Android / Sistem Bildirim İzni Açık'
                  : notificationPermission === 'denied'
                    ? 'Bildirim İzni Engellendi'
                    : notificationPermission === 'unsupported'
                      ? 'Tarayıcı Bildirimi Desteklenmiyor'
                      : 'Bildirim İzni Bekleniyor'}
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                {notificationPermission === 'granted'
                  ? 'Vakit çıkmadan önce cihazınıza doğrudan bildirim gönderilecek.'
                  : notificationPermission === 'denied'
                    ? 'Bildirimleri açmak için tarayıcı adres çubuğundaki kilit simgesinden izin verin.'
                    : 'Arka planda ve ekran kilitliyken uyarı almak için bildirim izni verin.'}
              </p>
            </div>
          </div>

          {notificationPermission === 'default' && (
            <button
              type="button"
              onClick={onRequestPermission}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E6B4E] dark:bg-[#2BB686] text-white dark:text-[#081C15] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Bildirim İzni Ver
            </button>
          )}
        </div>

        {/* Master Toggle + Lead Time Selector */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] p-4">
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Vakit Çıkış Uyarısı
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                Tüm seçili vakitler için çıkış öncesi hatırlatma
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={exitAlertEnabled}
              onClick={onToggleMasterExitAlert}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                exitAlertEnabled
                  ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                  : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  exitAlertEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] p-4">
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Uyarı Süresi
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                Vaktin çıkmasına kaç dakika kala uyarılsın
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFF2EE] dark:bg-[#0D120F]">
              {[5, 10, 15].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => onChangeLeadMinutes(min)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    exitAlertMinutes === min
                      ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                      : 'text-[#525C54] dark:text-[#A0ABA3]'
                  }`}
                >
                  {min} dk
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Alert Schedule for Selected Province */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
          <h2 className="text-lg font-bold text-[#121914] dark:text-[#F1F5F2]">
            {province.name} · Bugünkü Uyarı Takvimi
          </h2>
          <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
            Her namaz vaktinin tam çıkış saati ve uyarının çalacağı saat
          </p>
        </div>

        <ul className="divide-y divide-[#EFF2EE] dark:divide-[#232E27] mt-1">
          {OBLIGATORY_PRAYERS.map((prayer) => {
            const exitDate = schedule.exits[prayer];
            const alertDate = new Date(exitDate.getTime() - exitAlertMinutes * 60 * 1000);
            const isEnabled = exitAlertEnabled && notifications[prayer].beforeExit;

            return (
              <li key={prayer} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BellRing
                      className={`h-4 w-4 shrink-0 ${
                        isEnabled
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[#838D85] dark:text-[#66736A]'
                      }`}
                    />
                    <span className="text-sm sm:text-base font-semibold text-[#121914] dark:text-[#F1F5F2]">
                      {PRAYER_LABELS[prayer].name}
                    </span>
                  </div>
                  <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-1">
                    Vakit çıkışı: <strong className="font-mono-tabular">{formatTimeTR(exitDate)}</strong>{' '}
                    · Uyarı saati:{' '}
                    <strong className="font-mono-tabular text-amber-700 dark:text-amber-300">
                      {formatTimeTR(alertDate)}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications[prayer].beforeExit}
                  disabled={!exitAlertEnabled}
                  onClick={() => onTogglePrayerExitAlert(prayer)}
                  aria-label={`${PRAYER_LABELS[prayer].name} için ${exitAlertMinutes} dk kala uyarı`}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-45 ${
                    notifications[prayer].beforeExit
                      ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                      : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      notifications[prayer].beforeExit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
