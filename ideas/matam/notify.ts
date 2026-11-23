"use client";

/**
 * تنبيه المطبخ بوصول طلب.
 * ثلاث طبقات لأن كلًا منها قد تُحجَب: صوت، وإشعار نظام، ووميض في
 * عنوان التبويب. الصوت مُولَّد برمجيًا فلا يحتاج ملفًا ولا تحميلًا.
 */

let ctx: AudioContext | null = null;

function tone(freq: number, startAt: number, duration: number, gain: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(0, startAt);
  vol.gain.linearRampToValueAtTime(gain, startAt + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(vol).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

/** نغمتان صاعدتان: تُسمع في ضجيج المطبخ ولا تُزعج */
export function chime() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    tone(880, t, 0.22, 0.16);
    tone(1318, t + 0.16, 0.3, 0.14);
  } catch {
    /* الصوت ممنوع قبل تفاعل المستخدم — تبقى الطبقتان الأخريان */
  }
}

/** يلزم تفاعل واحد من المستخدم قبل أن يسمح المتصفح بالصوت */
export function primeAudio() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    /* لا بأس */
  }
}

export async function askNotifyPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export function systemNotice(title: string, body: string) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, tag: "matam-order", renotify: true } as NotificationOptions);
  } catch {
    /* بعض المتصفحات تمنعه خارج عامل الخدمة */
  }
}

/* ---------- وميض عنوان التبويب ---------- */

let flashTimer: ReturnType<typeof setInterval> | null = null;
let original = "";

export function flashTitle(text: string) {
  if (typeof document === "undefined") return;
  if (!flashTimer) original = document.title;
  stopFlash(false);
  let on = false;
  flashTimer = setInterval(() => {
    document.title = on ? original : text;
    on = !on;
  }, 1100);
}

export function stopFlash(restore = true) {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  if (restore && original) document.title = original;
}
