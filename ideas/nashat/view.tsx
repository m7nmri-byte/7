"use client";

import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { NashatApp } from "./App";

/** غلاف الأداة: هويتها البصرية وترويستها، مستقلّة عن الموقع */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-nashat className="flex min-h-dvh flex-col bg-n-bg text-n-text">
      <header className="border-b border-n-line">
        <div className="mx-auto flex w-full max-w-3xl items-baseline gap-3 px-5 py-4 sm:px-8">
          <h1 className="text-lg font-semibold">نشاط</h1>
          <span className="text-xs text-n-faint">سجلّ العمل اليومي</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 sm:px-8">{children}</main>
    </div>
  );
}

export default function Nashat() {
  const { session, checking } = useSession();

  if (checking)
    return (
      <Shell>
        <div aria-hidden className="h-72 animate-pulse rounded-2xl border border-n-line bg-n-surface" />
      </Shell>
    );

  // الدخول يتم في الموقع الأساسي، لا داخل الأداة
  if (!session)
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-n-line p-10 text-center">
          <p className="text-sm text-n-dim">هذه الأداة تحفظ بياناتك وتزامنها بين أجهزتك.</p>
          <p className="text-xs text-n-faint">سجّل الدخول مرة واحدة في الموقع لتستخدمها.</p>
          <Link
            href="/login"
            className="mt-2 rounded-xl bg-n-accent px-5 py-2.5 text-sm font-medium text-[#0b1419] transition-opacity hover:opacity-90"
          >
            تسجيل الدخول
          </Link>
        </div>
      </Shell>
    );

  return (
    <Shell>
      <NashatApp session={session} />
    </Shell>
  );
}
