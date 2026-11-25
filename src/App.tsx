import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, MapPin, Star, VolumeX} from 'lucide-react';
import {AlertsView} from './components/AlertsView';
import {BottomNav} from './components/BottomNav';
import {OfflineIndicator} from './components/OfflineIndicator';
import {PrayerHeroCard} from './components/PrayerHeroCard';
import {PrayerScheduleList} from './components/PrayerScheduleList';
import {ProvincesView} from './components/ProvincesView';
import {PWAInstallButton} from './components/PWAInstallButton';
import {SettingsView} from './components/SettingsView';
import {TopBar} from './components/TopBar';
import {
  TURKISH_PROVINCES,
  findNearestProvince,
  formatPlaka,
  getProvinceByPlaka,
} from './data/turkishProvinces';
import {useAppSettings} from './hooks/useAppSettings';
import type {AppTab, ObligatoryPrayerKey} from './types/app';
import {
  ALL_PRAYER_KEYS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  formatTimeTR,
  getActivePrayerState,
  getDailyPrayerSchedule,
  getMultiDaySchedule,
} from './utils/prayerTimes';
import {
  playAlertChime,
  requestNotificationPermission,
  sendSystemNotification,
  triggerHapticFeedback,
} from './utils/soundAndNotifications';

export default function App() {
  const {
    settings,
    setSettings,
    setSelectedPlaka,
    toggleFavoritePlaka,
    togglePrayerNotification,
    toggleSilencePrayer,
  } = useAppSettings();

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [now, setNow] = useState<Date>(() => new Date());
  const [isSimulatingWarning, setIsSimulatingWarning] = useState(false);
  const [manualSilenceUntil, setManualSilenceUntil] = useState<number | null>(null);
  const [silenceDismissedKey, setSilenceDismissedKey] = useState<string | null>(null);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<string>('İzin Bekleniyor');
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const firedEventsRef = useRef<Set<string>>(new Set());

  // 1-second clock tick
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Monitor Geolocation permission state if Permissions API is available
  useEffect(() => {
    if (!('permissions' in navigator)) return;
    let mounted = true;
    navigator.permissions
      .query({name: 'geolocation'})
      .then((status) => {
        if (!mounted) return;
        const mapLabel = (s: PermissionState) =>
          s === 'granted' ? 'İzin Verildi' : s === 'denied' ? 'İzin Reddedildi' : 'İzin Bekleniyor';
        setLocationPermissionState(mapLabel(status.state));
        status.onchange = () => {
          if (mounted) setLocationPermissionState(mapLabel(status.state));
        };
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const selectedProvince = useMemo(
    () => getProvinceByPlaka(settings.selectedPlaka),
    [settings.selectedPlaka],
  );

  // Use exact GPS coordinates if enabled and detected near the currently selected province
  const usingExactCoords = Boolean(
    settings.location.useExactCoordinates &&
      settings.location.lastDetectedCoords &&
      settings.location.lastDetectedCoords.nearestPlaka === selectedProvince.plaka,
  );

  const activeLat = usingExactCoords
    ? settings.location.lastDetectedCoords!.lat
    : selectedProvince.lat;
  const activeLng = usingExactCoords
    ? settings.location.lastDetectedCoords!.lng
    : selectedProvince.lng;

  const todaySchedule = useMemo(
    () => getDailyPrayerSchedule(activeLat, activeLng, now),
    [activeLat, activeLng, now],
  );

  const weeklySchedule = useMemo(
    () => getMultiDaySchedule(activeLat, activeLng, 7, now),
    [activeLat, activeLng, now.toDateString()],
  );

  const activeState = useMemo(
    () => getActivePrayerState(activeLat, activeLng, now, settings.exitAlertMinutes),
    [activeLat, activeLng, now, settings.exitAlertMinutes],
  );

  // Compute active Auto-Silence state (either automatic after prayer entry OR manual test)
  const activeSilence = useMemo(() => {
    const nowMs = now.getTime();

    if (manualSilenceUntil && manualSilenceUntil > nowMs) {
      return {
        active: true,
        key: 'manual-test',
        prayerName: 'Test Sessiz Modu',
        remainingSeconds: Math.ceil((manualSilenceUntil - nowMs) / 1000),
      };
    }

    if (!settings.silenceMode.enabled) return null;

    const durationMs = settings.silenceMode.durationMinutes * 60 * 1000;
    for (const prayer of OBLIGATORY_PRAYERS) {
      if (!settings.silenceMode.prayers[prayer]) continue;
      const startMs = todaySchedule.times[prayer].getTime();
      const endMs = startMs + durationMs;
      const silenceKey = `${todaySchedule.dateKey}:${prayer}`;
      if (nowMs >= startMs && nowMs < endMs && silenceDismissedKey !== silenceKey) {
        return {
          active: true,
          key: silenceKey,
          prayerName: PRAYER_LABELS[prayer].name.split(' ')[0],
          remainingSeconds: Math.ceil((endMs - nowMs) / 1000),
        };
      }
    }
    return null;
  }, [
    now,
    manualSilenceUntil,
    settings.silenceMode,
    todaySchedule,
    silenceDismissedKey,
  ]);

  // Alert & Auto-Silence side-effect dispatcher
  useEffect(() => {
    const nowMs = now.getTime();
    const isSilencedNow = Boolean(activeSilence?.active);

    // 1. 5-minute before prayer exit alert
    if (
      settings.exitAlertEnabled &&
      activeState.activePrayer &&
      activeState.isExitWarningWindow &&
      settings.notifications[activeState.activePrayer].beforeExit
    ) {
      const prayerKey = activeState.activePrayer;
      const eventId = `${todaySchedule.dateKey}:${prayerKey}:exit:${settings.exitAlertMinutes}`;
      if (!firedEventsRef.current.has(eventId)) {
        firedEventsRef.current.add(eventId);
        const prayerName = PRAYER_LABELS[prayerKey].name;
        const exitStr = activeState.activeExitTime ? formatTimeTR(activeState.activeExitTime) : '';
        if (!isSilencedNow) {
          playAlertChime(settings.soundType);
        }
        triggerHapticFeedback(settings.vibrationEnabled);
        void sendSystemNotification(
          `${prayerName} Vakti Çıkıyor`,
          `${selectedProvince.name} için ${prayerName} vaktinin çıkmasına ${settings.exitAlertMinutes} dakika kaldı (Çıkış: ${exitStr}).`,
          eventId,
        );
      }
    }

    // 2. Per-prayer entry notification (within 60s of prayer entry)
    for (const key of ALL_PRAYER_KEYS) {
      const enterMs = todaySchedule.times[key].getTime();
      const diffMs = nowMs - enterMs;
      if (diffMs >= 0 && diffMs < 60_000) {
        if (settings.notifications[key].onEnter) {
          const eventId = `${todaySchedule.dateKey}:${key}:enter`;
          if (!firedEventsRef.current.has(eventId)) {
            firedEventsRef.current.add(eventId);
            const prayerName = PRAYER_LABELS[key].name;
            const willSilence =
              settings.silenceMode.enabled &&
              key !== 'sunrise' &&
              settings.silenceMode.prayers[key as ObligatoryPrayerKey];

            if (!willSilence && !isSilencedNow) {
              playAlertChime(settings.soundType);
            }
            triggerHapticFeedback(settings.vibrationEnabled);
            void sendSystemNotification(
              `${prayerName} Vakti Girdi`,
              willSilence
                ? `${selectedProvince.name} · ${formatTimeTR(todaySchedule.times[key])}. Otomatik sessiz mod (${settings.silenceMode.durationMinutes} dk) başlatıldı.`
                : `${selectedProvince.name} · ${formatTimeTR(todaySchedule.times[key])}`,
              eventId,
            );
          }
        }
      }
    }
  }, [
    now,
    activeState,
    todaySchedule,
    selectedProvince.name,
    settings,
    activeSilence?.active,
  ]);

  const handleDetectLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationMessage('Cihaz tarayıcısı konum servisini desteklemiyor.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationMessage('GPS konumunuz alınıyor...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        const {province, distanceKm} = findNearestProvince(latitude, longitude);
        setSettings((prev) => ({
          ...prev,
          selectedPlaka: province.plaka,
          location: {
            ...prev.location,
            lastDetectedCoords: {
              lat: latitude,
              lng: longitude,
              nearestPlaka: province.plaka,
              distanceKm,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
        setLocationPermissionState('İzin Verildi');
        setLocationMessage(
          `Konum algılandı: ${formatPlaka(province.plaka)} · ${province.name} (${distanceKm} km)`,
        );
        setIsDetectingLocation(false);
      },
      (error) => {
        let msg = 'Konum alınamadı.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Konum izni reddedildi. İl listesini kullanarak şehrinizi seçebilirsiniz.';
          setLocationPermissionState('İzin Reddedildi');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Cihaz konum bilgisi şu an kullanılamıyor.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Konum alma isteği zaman aşımına uğradı.';
        }
        setLocationMessage(msg);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, [setSettings]);

  // Optional auto-detect on startup when enabled in settings
  useEffect(() => {
    if (settings.location.autoDetectOnStart) {
      handleDetectLocation();
    }
    // Run only once on mount if enabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestNotificationPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  }, []);

  const handleTestExitWarning = useCallback(async () => {
    if (notificationPermission === 'default') {
      const perm = await requestNotificationPermission();
      setNotificationPermission(perm);
    }
    setIsSimulatingWarning(true);
    setActiveTab('today');
    playAlertChime(settings.soundType);
    triggerHapticFeedback(settings.vibrationEnabled);
    const activeName = activeState.activePrayer
      ? PRAYER_LABELS[activeState.activePrayer].name
      : 'Öğle';
    void sendSystemNotification(
      `Test · ${activeName} Vakti Çıkıyor`,
      `${selectedProvince.name} için ${activeName} vaktinin çıkmasına ${settings.exitAlertMinutes} dakika kaldı.`,
      `test-exit-${Date.now()}`,
    );
  }, [
    notificationPermission,
    settings.soundType,
    settings.vibrationEnabled,
    settings.exitAlertMinutes,
    activeState.activePrayer,
    selectedProvince.name,
  ]);

  const handleTestSilenceMode = useCallback(() => {
    const durationMs = settings.silenceMode.durationMinutes * 60 * 1000;
    setManualSilenceUntil(Date.now() + durationMs);
    setActiveTab('today');
    triggerHapticFeedback(settings.vibrationEnabled);
    void sendSystemNotification(
      'Namazda Otomatik Sessiz Mod Aktif',
      `${settings.silenceMode.durationMinutes} dakika boyunca uygulama sesleri susturuldu. Telefonunuzu Rahatsız Etmeyin moduna alabilirsiniz.`,
      `test-silence-${Date.now()}`,
    );
  }, [settings.silenceMode.durationMinutes, settings.vibrationEnabled]);

  const handleStopSilence = useCallback(() => {
    if (activeSilence?.key === 'manual-test') {
      setManualSilenceUntil(null);
    } else if (activeSilence?.key) {
      setSilenceDismissedKey(activeSilence.key);
    }
  }, [activeSilence]);

  const favoriteProvinces = useMemo(
    () => TURKISH_PROVINCES.filter((p) => settings.favoritePlakas.includes(p.plaka)),
    [settings.favoritePlakas],
  );

  return (
    <div className="min-h-screen bg-[#F6F7F5] dark:bg-[#0D120F] text-[#121914] dark:text-[#F1F5F2] transition-colors">
      <TopBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        selectedProvince={selectedProvince}
        onOpenProvincePicker={() => setActiveTab('provinces')}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-5 sm:pt-7 pb-24 lg:pb-12">
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Hero countdown + quick favorite cities + PWA install */}
            <div className="lg:col-span-7 space-y-5">
              <PrayerHeroCard
                now={now}
                province={selectedProvince}
                schedule={todaySchedule}
                activeState={activeState}
                exitAlertMinutes={settings.exitAlertMinutes}
                exitAlertEnabled={settings.exitAlertEnabled}
                isSimulatingWarning={isSimulatingWarning}
                onDismissWarning={() => setIsSimulatingWarning(false)}
                onDetectLocation={handleDetectLocation}
                isDetectingLocation={isDetectingLocation}
                usingExactCoords={usingExactCoords}
                activeSilence={activeSilence}
                onStopSilence={handleStopSilence}
              />

              {/* Quick Province Strip */}
              <section
                aria-label="Hızlı il geçişi"
                className="rounded-3xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <h2 className="text-sm font-bold text-[#121914] dark:text-[#F1F5F2]">
                      Kayıtlı İller
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('provinces')}
                    className="min-h-[38px] px-2.5 text-xs font-semibold text-[#0E6B4E] dark:text-[#2BB686] hover:underline cursor-pointer"
                  >
                    81 İli Gör
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {favoriteProvinces.map((prov) => {
                    const active = prov.plaka === selectedProvince.plaka;
                    return (
                      <button
                        key={prov.plaka}
                        type="button"
                        onClick={() => setSelectedPlaka(prov.plaka)}
                        className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'border-[#0E6B4E] bg-[#0E6B4E] text-white dark:border-[#2BB686] dark:bg-[#2BB686] dark:text-[#081C15]'
                            : 'border-[#E4E7E3] dark:border-[#232E27] bg-[#F6F7F5] dark:bg-[#0D120F] text-[#121914] dark:text-[#F1F5F2] hover:bg-[#EFF2EE] dark:hover:bg-[#1E2822]'
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {formatPlaka(prov.plaka)} · {prov.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Compact Quick Status Row: 5-Min Exit Alert + Silence Mode shortcut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="text-left rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-4 hover:border-[#C5CEC3] dark:hover:border-[#34433A] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#525C54] dark:text-[#A0ABA3]">
                      Çıkış Uyarısı
                    </span>
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        settings.exitAlertEnabled
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[#838D85]'
                      }`}
                    />
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-[#121914] dark:text-[#F1F5F2]">
                    {settings.exitAlertEnabled
                      ? `Vakit çıkmadan ${settings.exitAlertMinutes} dk önce`
                      : 'Kapalı'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#525C54] dark:text-[#A0ABA3]">
                    Uyarıları yönet ve test et
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="text-left rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-4 hover:border-[#C5CEC3] dark:hover:border-[#34433A] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#525C54] dark:text-[#A0ABA3]">
                      Otomatik Sessiz Mod
                    </span>
                    <VolumeX
                      className={`h-4 w-4 ${
                        settings.silenceMode.enabled
                          ? 'text-[#0E6B4E] dark:text-[#2BB686]'
                          : 'text-[#838D85]'
                      }`}
                    />
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-[#121914] dark:text-[#F1F5F2]">
                    {settings.silenceMode.enabled
                      ? `Açık (${settings.silenceMode.durationMinutes} dk)`
                      : 'Kapalı'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#525C54] dark:text-[#A0ABA3]">
                    Ayarlar ekranından yapılandır
                  </p>
                </button>
              </div>

              <PWAInstallButton variant="card" />
            </div>

            {/* Right column: Today's 6 prayer times + 7-day table */}
            <div className="lg:col-span-5">
              <PrayerScheduleList
                schedule={todaySchedule}
                weeklySchedule={weeklySchedule}
                activeState={activeState}
                notifications={settings.notifications}
                exitAlertMinutes={settings.exitAlertMinutes}
                onToggleExitAlertForPrayer={(prayer) =>
                  togglePrayerNotification(prayer, 'beforeExit')
                }
              />
            </div>
          </div>
        )}

        {activeTab === 'provinces' && (
          <ProvincesView
            now={now}
            selectedPlaka={settings.selectedPlaka}
            favoritePlakas={settings.favoritePlakas}
            onSelectProvince={(plaka) => {
              setSelectedPlaka(plaka);
              setActiveTab('today');
            }}
            onToggleFavorite={toggleFavoritePlaka}
            onDetectLocation={handleDetectLocation}
            isDetectingLocation={isDetectingLocation}
            locationMessage={locationMessage}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            province={selectedProvince}
            schedule={todaySchedule}
            exitAlertEnabled={settings.exitAlertEnabled}
            exitAlertMinutes={settings.exitAlertMinutes}
            notifications={settings.notifications}
            notificationPermission={notificationPermission}
            onRequestPermission={handleRequestNotificationPermission}
            onToggleMasterExitAlert={() =>
              setSettings((prev) => ({...prev, exitAlertEnabled: !prev.exitAlertEnabled}))
            }
            onChangeLeadMinutes={(minutes) =>
              setSettings((prev) => ({...prev, exitAlertMinutes: minutes}))
            }
            onTogglePrayerExitAlert={(prayer) =>
              togglePrayerNotification(prayer, 'beforeExit')
            }
            onTestExitWarning={handleTestExitWarning}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            selectedProvince={selectedProvince}
            onUpdateSettings={setSettings}
            onTogglePrayerNotification={togglePrayerNotification}
            onToggleSilencePrayer={toggleSilencePrayer}
            onDetectLocation={handleDetectLocation}
            isDetectingLocation={isDetectingLocation}
            locationPermissionState={locationPermissionState}
            locationMessage={locationMessage}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={handleRequestNotificationPermission}
            onPreviewSound={playAlertChime}
            onTestSilenceMode={handleTestSilenceMode}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        hasActiveWarning={
          isSimulatingWarning ||
          (settings.exitAlertEnabled && activeState.isExitWarningWindow)
        }
      />

      <OfflineIndicator />
    </div>
  );
}
