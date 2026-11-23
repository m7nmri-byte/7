import type { DayHours, Settings } from "./types";

/** دقائق من منتصف الليل لنصّ "HH:MM" — القيمة المعطوبة تُعامل كصفر */
function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

/**
 * هل الوقت داخل فترة؟
 * الفترة التي تتجاوز منتصف الليل (٢٢:٠٠ إلى ٠٢:٠٠) تُقاس على شطرين،
 * وإلّا لأُغلق المطعم الليليّ في أنشط ساعاته.
 */
function inShift(now: number, open: string, close: string): boolean {
  const a = minutesOf(open);
  const b = minutesOf(close);
  if (a === b) return false;
  return a < b ? now >= a && now < b : now >= a || now < b;
}

export type OpenState = {
  /** مفتوح الآن فعلًا: المفتاح اليدوي ودوام اليوم معًا */
  open: boolean;
  /** يقبل طلبات: مفتوحٌ ومسموحٌ بالطلب */
  ordering: boolean;
  /** سبب الإغلاق، ليُقال للعميل بدل "مغلق" مجرّدة */
  reason: "manual" | "schedule" | "orders" | null;
  /** متى يفتح من جديد، إن كان الإغلاق بسبب الدوام */
  nextOpen: string | null;
};

const DAY_LABEL = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** أقرب فتحة قادمة، بحثًا في سبعة أيام — فإن لم يُفتح أسبوعًا فلا موعد */
function findNextOpen(hours: DayHours[], day: number, nowMin: number): string | null {
  for (let step = 0; step < 8; step++) {
    const d = (day + step) % 7;
    const rec = hours.find((h) => h.day === d);
    if (!rec || rec.closed) continue;

    const starts = rec.shifts
      .map((s) => minutesOf(s.open))
      .filter((m) => step > 0 || m > nowMin)
      .sort((x, y) => x - y);
    if (!starts.length) continue;

    const at = starts[0];
    const hh = String(Math.floor(at / 60)).padStart(2, "0");
    const mm = String(at % 60).padStart(2, "0");
    const when = step === 0 ? "اليوم" : step === 1 ? "غدًا" : DAY_LABEL[d];
    return `${when} ${hh}:${mm}`;
  }
  return null;
}

/**
 * حالة المطعم الآن.
 * الدوام يُحسب من `work_hours`، والمفتاح اليدوي `is_open` يغلق فوق الدوام
 * ولا يفتح خارجه — فالمدير يستطيع الإغلاق الطارئ، ولا يفتح بالخطأ
 * في وقت لا عمّال فيه. وبلا دوامٍ محفوظ يُعمل بالمفتاح وحده.
 */
export function openState(settings: Settings | null, now: Date = new Date()): OpenState {
  if (!settings) return { open: false, ordering: false, reason: "manual", nextOpen: null };

  if (!settings.is_open) {
    return { open: false, ordering: false, reason: "manual", nextOpen: null };
  }

  const hours = settings.work_hours ?? [];
  if (hours.length) {
    const day = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = hours.find((h) => h.day === day);

    /**
     * فترة الأمس الممتدة بعد منتصف الليل تُبقي المطعم مفتوحًا،
     * فالساعة الواحدة ليلًا تنتمي إلى دوام اليوم السابق لا إلى يومها.
     */
    const yesterday = hours.find((h) => h.day === (day + 6) % 7);
    const spillover = Boolean(
      yesterday &&
        !yesterday.closed &&
        yesterday.shifts.some(
          (s) => minutesOf(s.open) > minutesOf(s.close) && inShift(nowMin, s.open, s.close),
        ),
    );

    const withinToday = Boolean(
      today && !today.closed && today.shifts.some((s) => inShift(nowMin, s.open, s.close)),
    );

    if (!withinToday && !spillover) {
      return {
        open: false,
        ordering: false,
        reason: "schedule",
        nextOpen: findNextOpen(hours, day, nowMin),
      };
    }
  }

  if (!settings.allow_orders) {
    return { open: true, ordering: false, reason: "orders", nextOpen: null };
  }

  return { open: true, ordering: true, reason: null, nextOpen: null };
}

export const closedText = (s: OpenState): string => {
  if (s.reason === "manual") return "المطعم مغلق حاليًا";
  if (s.reason === "schedule")
    return s.nextOpen ? `مغلق الآن — يفتح ${s.nextOpen}` : "مغلق الآن";
  if (s.reason === "orders") return "الطلبات موقوفة مؤقتًا";
  return "";
};
