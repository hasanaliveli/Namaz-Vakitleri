import {CalculationMethod, Coordinates, PrayerTimes, Qibla} from 'adhan';
import type {
  ActivePrayerState,
  DailyPrayerSchedule,
  ObligatoryPrayerKey,
  PrayerKey,
} from '../types/app';

export const TURKEY_TIMEZONE = 'Europe/Istanbul';

export const PRAYER_LABELS: Record<PrayerKey, {name: string; exitLabel: string; shortNote: string}> = {
  fajr: {name: 'İmsak (Sabah)', exitLabel: 'Güneş doğuşuna kadar', shortNote: 'Sabah namazı başlangıcı'},
  sunrise: {name: 'Güneş', exitLabel: 'Sabah vaktinin çıkışı', shortNote: 'Sabah namazı vakti biter'},
  dhuhr: {name: 'Öğle', exitLabel: 'İkindiye kadar', shortNote: 'Öğle namazı vakti'},
  asr: {name: 'İkindi', exitLabel: 'Akşama kadar', shortNote: 'İkindi namazı vakti'},
  maghrib: {name: 'Akşam', exitLabel: 'Yatsıya kadar', shortNote: 'Akşam namazı vakti'},
  isha: {name: 'Yatsı', exitLabel: 'İmsak vaktine kadar', shortNote: 'Yatsı namazı vakti'},
};

export const OBLIGATORY_PRAYERS: ObligatoryPrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const ALL_PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function getTurkeyCalendarDate(now: Date = new Date()): {year: number; month: number; day: number} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TURKEY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value ?? now.getFullYear());
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? now.getMonth() + 1);
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? now.getDate());

  return {year, month, day};
}

export function formatTurkeyDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatTimeTR(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatFullClockTR(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatGregorianDateTR(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(date);
}

export function formatShortDateTR(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

export function formatHijriDateTR(date: Date): string {
  try {
    return new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', {
      timeZone: TURKEY_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutesSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes === 0) {
    return `${seconds} sn`;
  }
  return `${minutes} dk ${String(seconds).padStart(2, '0')} sn`;
}

function buildAdhanTimes(lat: number, lng: number, year: number, month: number, day: number): PrayerTimes {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Turkey();
  const dateObj = new Date(year, month - 1, day);
  return new PrayerTimes(coords, dateObj, params);
}

function addDaysToCalendar(year: number, month: number, day: number, deltaDays: number): {
  year: number;
  month: number;
  day: number;
} {
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function getDailyPrayerSchedule(lat: number, lng: number, referenceDate: Date = new Date()): DailyPrayerSchedule {
  const {year, month, day} = getTurkeyCalendarDate(referenceDate);
  const tomorrow = addDaysToCalendar(year, month, day, 1);

  const todayPt = buildAdhanTimes(lat, lng, year, month, day);
  const tomorrowPt = buildAdhanTimes(lat, lng, tomorrow.year, tomorrow.month, tomorrow.day);

  const times: Record<PrayerKey, Date> = {
    fajr: todayPt.fajr,
    sunrise: todayPt.sunrise,
    dhuhr: todayPt.dhuhr,
    asr: todayPt.asr,
    maghrib: todayPt.maghrib,
    isha: todayPt.isha,
  };

  const exits: Record<ObligatoryPrayerKey, Date> = {
    fajr: todayPt.sunrise,
    dhuhr: todayPt.asr,
    asr: todayPt.maghrib,
    maghrib: todayPt.isha,
    isha: tomorrowPt.fajr,
  };

  // Use noon UTC on the target Turkey date for clean date formatting
  const labelAnchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return {
    dateKey: formatTurkeyDateKey(year, month, day),
    gregorianLabel: formatGregorianDateTR(labelAnchor),
    hijriLabel: formatHijriDateTR(labelAnchor),
    times,
    exits,
    qiblaAngle: Math.round(Qibla(new Coordinates(lat, lng))),
  };
}

export function getMultiDaySchedule(
  lat: number,
  lng: number,
  days: number = 7,
  startDate: Date = new Date(),
): DailyPrayerSchedule[] {
  const base = getTurkeyCalendarDate(startDate);
  const result: DailyPrayerSchedule[] = [];

  for (let i = 0; i < days; i++) {
    const target = addDaysToCalendar(base.year, base.month, base.day, i);
    const anchor = new Date(Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0));
    result.push(getDailyPrayerSchedule(lat, lng, anchor));
  }

  return result;
}

export function getActivePrayerState(
  lat: number,
  lng: number,
  now: Date,
  exitAlertMinutes: number = 5,
): ActivePrayerState {
  const {year, month, day} = getTurkeyCalendarDate(now);
  const yesterday = addDaysToCalendar(year, month, day, -1);
  const tomorrow = addDaysToCalendar(year, month, day, 1);

  const yesterdayPt = buildAdhanTimes(lat, lng, yesterday.year, yesterday.month, yesterday.day);
  const todayPt = buildAdhanTimes(lat, lng, year, month, day);
  const tomorrowPt = buildAdhanTimes(lat, lng, tomorrow.year, tomorrow.month, tomorrow.day);

  const nowMs = now.getTime();
  const alertWindowSec = exitAlertMinutes * 60;

  let activePrayer: ObligatoryPrayerKey | null = null;
  let nextPrayer: PrayerKey = 'fajr';
  let activeStartTime: Date | null = null;
  let activeExitTime: Date | null = null;
  let nextEnterTime: Date = todayPt.fajr;
  let isDuhaInterval = false;

  if (nowMs < todayPt.fajr.getTime()) {
    // Between midnight and İmsak: yesterday's Yatsı is still active and exits at today's İmsak
    activePrayer = 'isha';
    nextPrayer = 'fajr';
    activeStartTime = yesterdayPt.isha;
    activeExitTime = todayPt.fajr;
    nextEnterTime = todayPt.fajr;
  } else if (nowMs < todayPt.sunrise.getTime()) {
    activePrayer = 'fajr';
    nextPrayer = 'sunrise';
    activeStartTime = todayPt.fajr;
    activeExitTime = todayPt.sunrise;
    nextEnterTime = todayPt.sunrise;
  } else if (nowMs < todayPt.dhuhr.getTime()) {
    // Between Sunrise and Dhuhr (Kuşluk / Duha)
    activePrayer = null;
    nextPrayer = 'dhuhr';
    activeStartTime = todayPt.sunrise;
    activeExitTime = null;
    nextEnterTime = todayPt.dhuhr;
    isDuhaInterval = true;
  } else if (nowMs < todayPt.asr.getTime()) {
    activePrayer = 'dhuhr';
    nextPrayer = 'asr';
    activeStartTime = todayPt.dhuhr;
    activeExitTime = todayPt.asr;
    nextEnterTime = todayPt.asr;
  } else if (nowMs < todayPt.maghrib.getTime()) {
    activePrayer = 'asr';
    nextPrayer = 'maghrib';
    activeStartTime = todayPt.asr;
    activeExitTime = todayPt.maghrib;
    nextEnterTime = todayPt.maghrib;
  } else if (nowMs < todayPt.isha.getTime()) {
    activePrayer = 'maghrib';
    nextPrayer = 'isha';
    activeStartTime = todayPt.maghrib;
    activeExitTime = todayPt.isha;
    nextEnterTime = todayPt.isha;
  } else {
    // Between today's Isha and midnight
    activePrayer = 'isha';
    nextPrayer = 'fajr';
    activeStartTime = todayPt.isha;
    activeExitTime = tomorrowPt.fajr;
    nextEnterTime = tomorrowPt.fajr;
  }

  const targetMs = (activeExitTime ?? nextEnterTime).getTime();
  const remainingSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const startMs = (activeStartTime ?? todayPt.sunrise).getTime();
  const totalWindowSeconds = Math.max(1, Math.floor((targetMs - startMs) / 1000));

  const isExitWarningWindow =
    activePrayer !== null &&
    activeExitTime !== null &&
    remainingSeconds > 0 &&
    remainingSeconds <= alertWindowSec;

  return {
    activePrayer,
    nextPrayer,
    activeExitTime,
    nextEnterTime,
    activeStartTime,
    remainingSeconds,
    totalWindowSeconds,
    isExitWarningWindow,
    isDuhaInterval,
  };
}
