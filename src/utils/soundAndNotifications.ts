import type {AlertSoundType} from '../types/app';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playAlertChime(type: AlertSoundType): void {
  if (type === 'silent') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playNote = (freq: number, startOffset: number, duration: number, peakGain: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startOffset);

    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.05);
  };

  if (type === 'gentle') {
    // Warm pentatonic chime (E5 -> G#5 -> B5)
    playNote(659.25, 0, 0.7, 0.16);
    playNote(830.61, 0.18, 0.85, 0.14);
    playNote(987.77, 0.36, 1.1, 0.12);
  } else if (type === 'double') {
    // Clear double bell alert for 5-min exit urgency
    playNote(783.99, 0, 0.45, 0.22);
    playNote(1046.5, 0.14, 0.55, 0.18);
    playNote(783.99, 0.55, 0.45, 0.22);
    playNote(1046.5, 0.69, 0.75, 0.18);
  }
}

export function triggerHapticFeedback(enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate([240, 120, 240, 120, 360]);
  } catch {
    // Ignore on unsupported browsers
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function sendSystemNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    tag,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    requireInteraction: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}
