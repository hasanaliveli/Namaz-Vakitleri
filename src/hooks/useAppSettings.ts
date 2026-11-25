import {useCallback, useEffect, useState} from 'react';
import type {AppSettings, ObligatoryPrayerKey, PrayerKey} from '../types/app';

const STORAGE_KEY = 'vakit_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  selectedPlaka: 34, // İstanbul default
  favoritePlakas: [34, 6, 35], // İstanbul, Ankara, İzmir
  exitAlertEnabled: true,
  exitAlertMinutes: 5,
  soundType: 'double',
  vibrationEnabled: true,
  notifications: {
    fajr: {onEnter: true, beforeExit: true},
    sunrise: {onEnter: false, beforeExit: false},
    dhuhr: {onEnter: true, beforeExit: true},
    asr: {onEnter: true, beforeExit: true},
    maghrib: {onEnter: true, beforeExit: true},
    isha: {onEnter: true, beforeExit: true},
  },
  silenceMode: {
    enabled: false,
    durationMinutes: 20,
    prayers: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    },
  },
  location: {
    autoDetectOnStart: false,
    useExactCoordinates: false,
    lastDetectedCoords: null,
  },
  theme: 'system',
};

function loadInitialSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications ?? {}),
      },
      silenceMode: {
        ...DEFAULT_SETTINGS.silenceMode,
        ...(parsed.silenceMode ?? {}),
        prayers: {
          ...DEFAULT_SETTINGS.silenceMode.prayers,
          ...(parsed.silenceMode?.prayers ?? {}),
        },
      },
      location: {
        ...DEFAULT_SETTINGS.location,
        ...(parsed.location ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const shouldUseDark =
        settings.theme === 'dark' || (settings.theme === 'system' && mediaQuery.matches);
      root.classList.toggle('dark', shouldUseDark);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  const setSelectedPlaka = useCallback((plaka: number) => {
    setSettings((prev) => ({...prev, selectedPlaka: plaka}));
  }, []);

  const toggleFavoritePlaka = useCallback((plaka: number) => {
    setSettings((prev) => {
      const exists = prev.favoritePlakas.includes(plaka);
      const nextFavs = exists
        ? prev.favoritePlakas.filter((p) => p !== plaka)
        : [...prev.favoritePlakas, plaka];
      return {...prev, favoritePlakas: nextFavs};
    });
  }, []);

  const togglePrayerNotification = useCallback(
    (prayer: PrayerKey, field: 'onEnter' | 'beforeExit') => {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [prayer]: {
            ...prev.notifications[prayer],
            [field]: !prev.notifications[prayer][field],
          },
        },
      }));
    },
    [],
  );

  const toggleSilencePrayer = useCallback((prayer: ObligatoryPrayerKey) => {
    setSettings((prev) => ({
      ...prev,
      silenceMode: {
        ...prev.silenceMode,
        prayers: {
          ...prev.silenceMode.prayers,
          [prayer]: !prev.silenceMode.prayers[prayer],
        },
      },
    }));
  }, []);

  return {
    settings,
    setSettings,
    setSelectedPlaka,
    toggleFavoritePlaka,
    togglePrayerNotification,
    toggleSilencePrayer,
  };
}
