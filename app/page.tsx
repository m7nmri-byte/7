import Link from "next/link";
import { StatusChip } from "@/components/StatusChip";
import { Wordmark } from "@/components/Wordmark";
import { ideas } from "@/ideas";

const SINCE = "2026";

export default function Home() {
  const list = [...ideas].sort((a, b) => b.started.localeCompare(a.started));

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 sm:px-8">
        {/* الترويسة */}
        <header className="flex flex-col gap-6 pt-24 pb-16 sm:pt-36 sm:pb-24">
          <Wordmark size="lg" />
          <span className="h-px w-16 bg-gold/60" />
        </header>

        {/* الفهرس */}
        <section aria-label="الأفكار">
          <ul className="border-t border-line-soft">
            {list.map((idea, i) => (
              <li key={idea.slug}>
                <Link
                  href={`/lab/${idea.slug}`}
                  className="group grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-b border-line-soft py-7 transition-colors hover:bg-ink-raised sm:gap-x-8 sm:px-3"
                >
                  <span className="latin pt-1 text-xs text-faint transition-colors group-hover:text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <h2 className="text-lg font-normal text-paper transition-colors group-hover:text-gold sm:text-xl">
                        {idea.title}
                      </h2>
                      <StatusChip status={idea.status} />
                    </div>

                    <p className="max-w-prose text-sm leading-relaxed text-mist">
                      {idea.summary}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                      <span className="latin">{idea.started}</span>
                      {idea.tags.map((t) => (
                        <span key={t} className="before:me-3 before:content-['·']">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {list.length === 0 && (
            <p className="py-16 text-center text-sm text-faint">لا شيء بعد.</p>
          )}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8">
        <p className="latin text-xs text-faint">
          {SINCE}
        </p>
      </footer>
    </>
  );
}
