"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLive } from "../matam/hooks";

type SplashImage = { id: string; image_url: string; sort_order: number; is_active: boolean };

async function load(): Promise<SplashImage[]> {
  const { data, error } = await supabase.from("matam_splash").select("*").order("sort_order");
  /** شاشة ترحيب لا شرط تشغيل: تعذّر جلبها يعني ألّا تظهر، لا أن يتعطّل شيء */
  if (error) return [];
  return (data ?? []) as SplashImage[];
}

const SEEN_KEY = "matam.splashSeen";
const PER_IMAGE_MS = 2200;

/**
 * شاشة الإقلاع: صور ترحيب تُعرض مرّة عند أول فتح على هذا الجهاز.
 *
 * كانت الصور تُرفع من الإدارة ولا تُعرض في أي مكان — شاشة كاملة
 * بلا مكانٍ تظهر فيه. وتُعرض مرّة واحدة لا في كل فتحة: تكرارها
 * يحول بين الزبون وقائمة الطعام كل مرّة.
 */
export function Splash() {
  const { data } = useLive("matam_splash", load);
  const images = (data ?? []).filter((s) => s.is_active && s.image_url);

  /**
   * «هل رآها هذا الجهاز؟» تُقرأ مرّة عند التركيب لا في تأثير،
   * فلا يُشعل القرار تصييرًا متتابعًا.
   */
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [i, setI] = useState(0);

  const open = !seen && images.length > 0;

  const close = useCallback(() => {
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* لا بأس */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setI((n) => {
        if (n + 1 >= images.length) {
          close();
          return n;
        }
        return n + 1;
      });
    }, PER_IMAGE_MS);
    return () => clearInterval(id);
  }, [open, images.length, close]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col overflow-hidden rounded-[inherit] bg-m-bg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[Math.min(i, images.length - 1)].image_url}
        alt=""
        className="size-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-5">
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((s, n) => (
              <span
                key={s.id}
                className="h-1 w-6 rounded-full transition-colors"
                style={{ backgroundColor: n === i ? "#ffffff" : "rgba(255,255,255,0.35)" }}
              />
            ))}
          </div>
        )}
        <button
          onClick={close}
          className="rounded-xl bg-[#ffffff] px-5 py-2.5 text-sm font-semibold text-[#111111]"
        >
          ابدأ الطلب
        </button>
      </div>
    </div>
  );
}
