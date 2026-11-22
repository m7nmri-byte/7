"use client";

import { useEffect } from "react";

/** تسجيل عامل الخدمة — يتيح العمل بلا إنترنت وتثبيت الأدوات كتطبيقات */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
