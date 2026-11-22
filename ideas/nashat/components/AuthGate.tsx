"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { btnPrimary, field } from "./ui";

/** ترجمة أخطاء Supabase إلى عربية مفهومة */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "هذا البريد مسجّل مسبقًا — سجّل الدخول بدلًا من إنشاء حساب";
  if (m.includes("password") && m.includes("6"))
    return "كلمة المرور قصيرة — استخدم 6 أحرف على الأقل";
  if (m.includes("valid email") || m.includes("invalid email"))
    return "صيغة البريد الإلكتروني غير صحيحة";
  if (m.includes("email not confirmed"))
    return "لم يُفعّل هذا البريد بعد — افتح رسالة التفعيل في بريدك";
  if (m.includes("rate limit") || m.includes("too many"))
    return "محاولات كثيرة متتابعة — انتظر قليلًا ثم أعد المحاولة";
  return "حدث خطأ غير متوقع، حاول مرة أخرى";
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, checking };
}

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setNote(null);
    if (!email.trim() || !pass) {
      setError("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }
    if (mode === "signup" && pass !== pass2) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setBusy(true);
    const res =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
        : await supabase.auth.signUp({ email: email.trim(), password: pass });
    setBusy(false);

    if (res.error) {
      setError(friendlyError(res.error.message));
      return;
    }
    if (mode === "signup" && !res.data.session) {
      setNote("أُنشئ الحساب — افتح بريدك وفعّل الرابط ثم سجّل الدخول");
      setMode("login");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-edge bg-card p-6">
      <h2 className="text-lg font-semibold">نشاط</h2>
      <p className="mb-2 text-xs leading-relaxed text-muted">
        {mode === "login"
          ? "سجّل الدخول لمزامنة مهامك عبر أجهزتك"
          : "أنشئ حسابًا لحفظ مهامك ومزامنتها"}
      </p>

      <input
        type="email"
        className={field}
        placeholder="البريد الإلكتروني"
        autoComplete="email"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <input
        type="password"
        className={field}
        placeholder="كلمة المرور"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        dir="ltr"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {mode === "signup" && (
        <input
          type="password"
          className={field}
          placeholder="تأكيد كلمة المرور"
          autoComplete="new-password"
          dir="ltr"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      )}

      {error && (
        <p className="rounded-lg bg-[#2b1f1d] px-3 py-2 text-xs text-[#e08a7a]">{error}</p>
      )}
      {note && (
        <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">{note}</p>
      )}

      <button onClick={submit} disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
      </button>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
          setNote(null);
          setPass2("");
        }}
        className="text-xs text-muted transition-colors hover:text-ink"
      >
        {mode === "login"
          ? "ليس لديك حساب؟ إنشاء حساب جديد"
          : "لديك حساب بالفعل؟ تسجيل الدخول"}
      </button>
    </div>
  );
}
