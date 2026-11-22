"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Ctx = { session: Session | null; checking: boolean };

const SessionContext = createContext<Ctx>({ session: null, checking: true });

/**
 * جلسة واحدة لكل الموقع.
 * الدخول يتم في الموقع الأساسي مرة واحدة، وتقرأ منه الأدوات الداخلية
 * بدل أن يكون لكل أداة شاشة دخول خاصة بها.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Ctx>({ session: null, checking: true });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setValue({ session: data.session, checking: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setValue({ session, checking: false });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export const useSession = () => useContext(SessionContext);
