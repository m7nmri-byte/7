"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const KEY = "m7nmri.appScope";

/**
 * يحبس التطبيق المثبَّت داخل نطاقه.
 *
 * ملف التعريف يمنع فتح ما هو خارج النطاق داخل نافذة التطبيق، لكنه لا
 * يمنع انتقالًا داخليًا يقع خارجه. هذا الحارس يردّ أي انتقال كهذا إلى
 * جذر الأداة، فلا يرى من ثبّت «نشاط» شيئًا من الموقع الأساسي.
 */
export function StandaloneGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let scope: string | null = null;
    try {
      scope = sessionStorage.getItem(KEY);
    } catch {
      /* التخزين ممنوع */
    }

    // أول تحميل: النطاق هو الأداة التي أُقلع منها
    if (!scope) {
      const match = /^\/lab\/[^/]+/.exec(pathname);
      if (!match) return;
      scope = match[0];
      try {
        sessionStorage.setItem(KEY, scope);
      } catch {
        /* لا بأس */
      }
      return;
    }

    if (!pathname.startsWith(scope)) router.replace(scope);
  }, [pathname, router]);

  return null;
}
