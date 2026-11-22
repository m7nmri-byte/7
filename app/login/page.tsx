"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthCard } from "@/components/AuthCard";
import { useSession } from "@/components/SessionProvider";
import { btnGhost } from "@/components/styles";

export default function LoginPage() {
  const { session, checking } = useSession();
  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-5 py-16 sm:px-8">
      {checking ? (
        <div
          aria-hidden
          className="h-80 w-full max-w-sm animate-pulse rounded-2xl border border-edge bg-card"
        />
      ) : session ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-edge bg-card p-6 text-center">
          <p className="text-sm text-muted">أنت مسجّل الدخول باسم</p>
          <p className="mark text-sm text-ink">{session.user.email}</p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Link href="/" className={`${btnGhost} text-center`}>
              الذهاب إلى الأدوات
            </Link>
            <button
              onClick={() => {
                void supabase.auth.signOut();
                router.refresh();
              }}
              className={`${btnGhost} text-muted`}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      ) : (
        <AuthCard />
      )}
    </main>
  );
}
