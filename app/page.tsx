import Link from "next/link";
import { ideas } from "@/ideas";

export default function Home() {
  const list = [...ideas].sort((a, b) => b.started.localeCompare(a.started));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-12">
      <header className="mb-10 flex flex-col items-center gap-5 py-10 sm:mb-14 sm:py-16">
        <h1 className="mark text-center text-3xl font-extralight tracking-[0.35em] text-ink sm:text-5xl sm:tracking-[0.45em]">
          M7NMRI
        </h1>
        <span className="h-px w-16 bg-brand/50" />
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-edge py-20 text-center">
          <p className="text-sm text-muted">لا توجد أدوات بعد.</p>
          <p className="text-xs text-faint">تظهر هنا فور إضافتها.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((idea) => (
            <li key={idea.slug}>
              <Link
                href={`/lab/${idea.slug}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-edge bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/20 sm:p-6"
              >
                <h2 className="text-lg font-medium transition-colors group-hover:text-brand">
                  {idea.title}
                </h2>

                <p className="flex-1 text-sm leading-relaxed text-muted">{idea.summary}</p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                  <span className="mark">{idea.started}</span>
                  {idea.tags.map((t) => (
                    <span key={t} className="before:me-2 before:content-['·']">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
