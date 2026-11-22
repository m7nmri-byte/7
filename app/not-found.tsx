import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-32 sm:px-8">
      <Wordmark size="lg" />
      <span className="h-px w-16 bg-gold/60" />
      <p className="text-mist">لا يوجد شيء هنا.</p>
      <Link
        href="/"
        className="text-sm text-gold underline-offset-4 hover:underline"
      >
        العودة إلى الفهرس
      </Link>
    </main>
  );
}
