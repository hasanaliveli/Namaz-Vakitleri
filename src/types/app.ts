export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type ObligatoryPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type TurkishRegion =
  | 'Marmara'
  | 'Ege'
  | 'İç Anadolu'
  | 'Akdeniz'
  | 'Karadeniz'
  | 'Doğu Anadolu'
  | 'Güneydoğu Anadolu';

export interface Province {
  plaka: number;
  name: string;
  region: TurkishRegion;
  lat: number;
  lng: number;
}

export interface PrayerNotificationPreference {
  onEnter: boolean;
  beforeExit: boolean;
}

export type PerPrayerNotifications = Record<PrayerKey, PrayerNotificationPreference>;

export type AlertSoundType = 'gentle' | 'double' | 'silent';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface SilenceModeSettings {
  enabled: boolean;
  durationMinutes: number;
  prayers: Record<ObligatoryPrayerKey, boolean>;
}

export interface LocationSettings {
  autoDetectOnStart: boolean;
  useExactCoordinates: boolean;
  lastDetectedCoords: {
    lat: number;
    lng: number;
    nearestPlaka: number;
    distanceKm: number;
    updatedAt: string;
  } | null;
}

export interface AppSettings {
  selectedPlaka: number;
  favoritePlakas: number[];
  exitAlertEnabled: boolean;
  exitAlertMinutes: number;
  soundType: AlertSoundType;
  vibrationEnabled: boolean;
  notifications: PerPrayerNotifications;
  silenceMode: SilenceModeSettings;
  location: LocationSettings;
  theme: ThemePreference;
}

export type AppTab = 'today' | 'provinces' | 'alerts' | 'settings';

export interface ActivePrayerState {
  /** Currently active obligatory prayer (null only between sunrise and dhuhr) */
  activePrayer: ObligatoryPrayerKey | null;
  /** The prayer/time slot that comes next */
  nextPrayer: PrayerKey;
  /** Time when the active obligatory prayer exits (null between sunrise and dhuhr) */
  activeExitTime: Date | null;
  /** Time when the next prayer enters */
  nextEnterTime: Date;
  /** Time when the current active prayer started */
  activeStartTime: Date | null;
  /** Seconds remaining until active prayer exits (or until next prayer enters if between sunrise & dhuhr) */
  remainingSeconds: number;
  /** Total duration in seconds of the current window (for progress bar/ring) */
  totalWindowSeconds: number;
  /** Whether we are in the exit warning window (e.g., <= 5 min before active prayer exits) */
  isExitWarningWindow: boolean;
  /** Whether we are in Kuşluk (between Güneş and Öğle) */
  isDuhaInterval: boolean;
}

export interface DailyPrayerSchedule {
  dateKey: string;
  gregorianLabel: string;
  hijriLabel: string;
  times: Record<PrayerKey, Date>;
  exits: Record<ObligatoryPrayerKey, Date>;
  qiblaAngle: number;
}
