"use client";

import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { btnPrimary } from "@/components/styles";
import { NashatApp } from "./App";

export default function Nashat() {
  const { session, checking } = useSession();

  if (checking) {
    return (
      <div aria-hidden className="h-72 animate-pulse rounded-2xl border border-edge bg-card" />
    );
  }

  // الدخول يتم في الموقع الأساسي، لا داخل الأداة
  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-edge p-10 text-center">
        <p className="text-sm text-muted">هذه الأداة تحفظ بياناتك وتزامنها بين أجهزتك.</p>
        <p className="text-xs text-faint">سجّل الدخول مرة واحدة في الموقع لتستخدمها.</p>
        <Link href="/login" className={`${btnPrimary} mt-2`}>
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return <NashatApp session={session} />;
}
