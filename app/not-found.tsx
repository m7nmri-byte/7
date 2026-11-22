import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-5 px-5 py-28 text-center sm:px-8">
      <span className="mark text-5xl font-semibold text-faint">404</span>
      <p className="text-muted">لا يوجد شيء هنا.</p>
      <Link
        href="/"
        className="rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        العودة للرئيسية
      </Link>
    </main>
  );
}
