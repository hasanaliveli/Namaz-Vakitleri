import React from 'react';
import {
  Bell,
  LocateFixed,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  AlertSoundType,
  AppSettings,
  ObligatoryPrayerKey,
  PrayerKey,
  Province,
  ThemePreference,
} from '../types/app';
import {
  ALL_PRAYER_KEYS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
} from '../utils/prayerTimes';
import {formatPlaka} from '../data/turkishProvinces';
import {PWAInstallButton} from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  selectedProvince: Province;
  onUpdateSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onTogglePrayerNotification: (prayer: PrayerKey, field: 'onEnter' | 'beforeExit') => void;
  onToggleSilencePrayer: (prayer: ObligatoryPrayerKey) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  locationPermissionState: string;
  locationMessage: string | null;
  notificationPermission: NotificationPermission | 'unsupported';
  onRequestNotificationPermission: () => void;
  onPreviewSound: (type: AlertSoundType) => void;
  onTestSilenceMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  selectedProvince,
  onUpdateSettings,
  onTogglePrayerNotification,
  onToggleSilencePrayer,
  onDetectLocation,
  isDetectingLocation,
  locationPermissionState,
  locationMessage,
  notificationPermission,
  onRequestNotificationPermission,
  onPreviewSound,
  onTestSilenceMode,
}) => {
  const setSoundType = (soundType: AlertSoundType) => {
    onUpdateSettings((prev) => ({...prev, soundType}));
    onPreviewSound(soundType);
  };

  const setTheme = (theme: ThemePreference) => {
    onUpdateSettings((prev) => ({...prev, theme}));
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#121914] dark:text-[#F1F5F2]">
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-[#525C54] dark:text-[#A0ABA3]">
          Vakit bazlı bildirimler, otomatik sessiz mod ve Android konum tercihlerinizi yönetin.
        </p>
      </div>

      {/* Section 1: Android Location Auto-Detection */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E6B4E]/10 text-[#0E6B4E] dark:bg-[#2BB686]/15 dark:text-[#2BB686]">
              <LocateFixed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121914] dark:text-[#F1F5F2]">
                Konum ve Otomatik Şehir Tespiti
              </h2>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                Cihaz konum izni ile bulunduğunuz ili otomatik bulur ve vakitleri günceller.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isDetectingLocation}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E6B4E] hover:bg-[#0B573F] dark:bg-[#2BB686] dark:hover:bg-[#249E74] text-white dark:text-[#081C15] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <LocateFixed className={`h-4 w-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>{isDetectingLocation ? 'Tespit Ediliyor...' : 'Şehrimi Şimdi Bul'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-[#F6F7F5] dark:bg-[#0D120F] p-3.5 text-xs text-[#525C54] dark:text-[#A0ABA3] space-y-1">
            <p>
              <strong className="text-[#121914] dark:text-[#F1F5F2]">Aktif Şehir:</strong>{' '}
              {formatPlaka(selectedProvince.plaka)} · {selectedProvince.name}
            </p>
            <p>
              <strong className="text-[#121914] dark:text-[#F1F5F2]">Konum İzni:</strong>{' '}
              {locationPermissionState}
            </p>
            {settings.location.lastDetectedCoords && (
              <p className="font-mono-tabular">
                Son GPS: {settings.location.lastDetectedCoords.lat.toFixed(4)},{' '}
                {settings.location.lastDetectedCoords.lng.toFixed(4)} (Merkeze{' '}
                {settings.location.lastDetectedCoords.distanceKm} km)
              </p>
            )}
            {locationMessage && (
              <p className="font-medium text-[#0E6B4E] dark:text-[#2BB686] pt-1">
                {locationMessage}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Uygulama açılışında konumu otomatik kontrol et
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
                Seyahat ederken bulunduğunuz ile göre vakitler otomatik yenilenir.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.location.autoDetectOnStart}
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    autoDetectOnStart: !prev.location.autoDetectOnStart,
                  },
                }))
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                settings.location.autoDetectOnStart
                  ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                  : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.location.autoDetectOnStart ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#EFF2EE] dark:border-[#232E27]">
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                İlçe/konum için tam GPS koordinatı kullan
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
                Açıkken vakitler il merkezi yerine cihazınızın tam enlem/boylamına göre hesaplanır.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.location.useExactCoordinates}
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    useExactCoordinates: !prev.location.useExactCoordinates,
                  },
                }))
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                settings.location.useExactCoordinates
                  ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                  : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.location.useExactCoordinates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Per-Prayer Notification Controls */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E6B4E]/10 text-[#0E6B4E] dark:bg-[#2BB686]/15 dark:text-[#2BB686]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121914] dark:text-[#F1F5F2]">
                Her Vakit İçin Ayrı Bildirimler
              </h2>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                Her vakit için giriş bildirimi ve çıkışa {settings.exitAlertMinutes} dakika kala uyarısını ayrı ayrı açıp kapatın.
              </p>
            </div>
          </div>

          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={onRequestNotificationPermission}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0E6B4E]/30 dark:border-[#2BB686]/30 text-xs font-semibold text-[#0E6B4E] dark:text-[#2BB686] hover:bg-[#0E6B4E]/10 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Bildirim İzni Ver
            </button>
          )}
        </div>

        <div className="mt-2 divide-y divide-[#EFF2EE] dark:divide-[#232E27]">
          {ALL_PRAYER_KEYS.map((prayer) => {
            const pref = settings.notifications[prayer];
            const hasExitOption = prayer !== 'sunrise';

            return (
              <div
                key={prayer}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                    {PRAYER_LABELS[prayer].name}
                  </p>
                  <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
                    {PRAYER_LABELS[prayer].shortNote}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
                    <span className="text-xs font-medium text-[#525C54] dark:text-[#A0ABA3]">
                      Vakit girişi
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pref.onEnter}
                      aria-label={`${PRAYER_LABELS[prayer].name} vakit girişi bildirimi`}
                      onClick={() => onTogglePrayerNotification(prayer, 'onEnter')}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        pref.onEnter
                          ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                          : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pref.onEnter ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {hasExitOption && (
                    <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
                      <span className="text-xs font-medium text-[#525C54] dark:text-[#A0ABA3]">
                        {settings.exitAlertMinutes} dk kala
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pref.beforeExit}
                        aria-label={`${PRAYER_LABELS[prayer].name} çıkışa ${settings.exitAlertMinutes} dk kala uyarısı`}
                        onClick={() => onTogglePrayerNotification(prayer, 'beforeExit')}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          pref.beforeExit
                            ? 'bg-amber-600 dark:bg-amber-500'
                            : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pref.beforeExit ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Automatic Silence Mode on Prayer Entry */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E6B4E]/10 text-[#0E6B4E] dark:bg-[#2BB686]/15 dark:text-[#2BB686]">
              <VolumeX className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121914] dark:text-[#F1F5F2]">
                Namazda Otomatik Sessiz Mod
              </h2>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
                Namaz vakti girdiğinde cihazı/uygulama seslerini otomatik olarak sessiz moda geçirir.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.silenceMode.enabled}
            aria-label="Namaz vakti geldiğinde otomatik sessize al"
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                silenceMode: {
                  ...prev.silenceMode,
                  enabled: !prev.silenceMode.enabled,
                },
              }))
            }
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              settings.silenceMode.enabled
                ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.silenceMode.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Silence Duration */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Sessiz Mod Süresi
              </p>
              <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
                Vakit girdikten sonra ne kadar süre sessizde kalsın
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFF2EE] dark:bg-[#0D120F]">
              {[15, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      silenceMode: {...prev.silenceMode, durationMinutes: mins},
                    }))
                  }
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    settings.silenceMode.durationMinutes === mins
                      ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                      : 'text-[#525C54] dark:text-[#A0ABA3]'
                  }`}
                >
                  {mins} dk
                </button>
              ))}
            </div>
          </div>

          {/* Per-prayer silence toggles */}
          <div>
            <p className="text-xs font-semibold text-[#525C54] dark:text-[#A0ABA3] mb-2">
              Otomatik sessiz mod uygulanacak vakitler
            </p>
            <div className="flex flex-wrap gap-2">
              {OBLIGATORY_PRAYERS.map((prayer) => {
                const active = settings.silenceMode.prayers[prayer];
                return (
                  <button
                    key={prayer}
                    type="button"
                    onClick={() => onToggleSilencePrayer(prayer)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-[#0E6B4E] bg-[#0E6B4E]/10 text-[#0E6B4E] dark:border-[#2BB686] dark:bg-[#2BB686]/15 dark:text-[#2BB686]'
                        : 'border-[#E4E7E3] dark:border-[#232E27] text-[#525C54] dark:text-[#A0ABA3]'
                    }`}
                  >
                    {PRAYER_LABELS[prayer].name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F6F7F5] dark:bg-[#0D120F] p-3.5">
            <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] leading-relaxed">
              Web/PWA modunda vakit girdiğinde uygulama içi tüm sesler susturulur ve telefonun{' '}
              <strong>Rahatsız Etmeyin (DND)</strong> moduna alınması için sessiz bildirim gönderilir.
            </p>
            <button
              type="button"
              onClick={onTestSilenceMode}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] text-xs font-semibold text-[#121914] dark:text-[#F1F5F2] hover:bg-[#EFF2EE] dark:hover:bg-[#1E2822] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sessiz Modu Test Et
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Sound, Vibration & Theme */}
      <section className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-[#E4E7E3] dark:border-[#232E27]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E6B4E]/10 text-[#0E6B4E] dark:bg-[#2BB686]/15 dark:text-[#2BB686]">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121914] dark:text-[#F1F5F2]">
              Ses, Titreşim ve Görünüm
            </h2>
            <p className="text-xs text-[#525C54] dark:text-[#A0ABA3] mt-0.5">
              Uyarı zil tonunu ve gündüz/gece temasını belirleyin.
            </p>
          </div>
        </div>

        {/* Sound type */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">Uyarı Sesi</p>
            <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
              Seçtiğiniz ses önizleme olarak çalınır
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFF2EE] dark:bg-[#0D120F]">
            {(
              [
                {id: 'gentle', label: 'Huzurlu Zil'},
                {id: 'double', label: 'Çift Uyarı'},
                {id: 'silent', label: 'Sessiz'},
              ] as {id: AlertSoundType; label: string}[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSoundType(opt.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  settings.soundType === opt.id
                    ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                    : 'text-[#525C54] dark:text-[#A0ABA3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#EFF2EE] dark:border-[#232E27]">
          <div>
            <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
              Android Titreşim Uyarısı
            </p>
            <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
              5 dakika uyarısında cihazı titreştir
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.vibrationEnabled}
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                vibrationEnabled: !prev.vibrationEnabled,
              }))
            }
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              settings.vibrationEnabled
                ? 'bg-[#0E6B4E] dark:bg-[#2BB686]'
                : 'bg-[#D4DAD2] dark:bg-[#2E3B33]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Theme */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFF2EE] dark:border-[#232E27]">
          <div>
            <p className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">Tema</p>
            <p className="text-xs text-[#525C54] dark:text-[#A0ABA3]">
              Açık, koyu veya sistem görünümü
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFF2EE] dark:bg-[#0D120F]">
            {(
              [
                {id: 'light', label: 'Açık', Icon: Sun},
                {id: 'dark', label: 'Koyu', Icon: Moon},
                {id: 'system', label: 'Sistem', Icon: Monitor},
              ] as const
            ).map(({id, label, Icon}) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  settings.theme === id
                    ? 'bg-white dark:bg-[#1E2822] text-[#121914] dark:text-[#F1F5F2] shadow-xs'
                    : 'text-[#525C54] dark:text-[#A0ABA3]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Install App on Android */}
      <PWAInstallButton variant="card" />
    </div>
  );
};
