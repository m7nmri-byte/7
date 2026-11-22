import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusChip } from "@/components/StatusChip";
import { Wordmark } from "@/components/Wordmark";
import { getIdea, ideas, views } from "@/ideas";

/** لا تُقبل إلا الأفكار المعرّفة في السجل — أي مسار آخر 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return ideas.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lab/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const idea = getIdea(slug);
  if (!idea) return { title: "m7nmi" };
  return {
    title: `${idea.title} — m7nmi`,
    description: idea.summary,
  };
}

export default async function LabPage({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const idea = getIdea(slug);
  const View = views[slug];
  if (!idea || !View) notFound();

  return (
    <>
      <nav className="border-b border-line-soft">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5 sm:px-8">
          <Wordmark />
          <Link
            href="/"
            className="text-sm text-mist transition-colors hover:text-paper"
          >
            رجوع
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 sm:px-8 sm:py-20">
        <header className="mb-12 flex flex-col gap-4 sm:mb-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-normal sm:text-3xl">{idea.title}</h1>
            <StatusChip status={idea.status} />
          </div>

          <p className="max-w-prose leading-relaxed text-mist">{idea.summary}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
            <span className="latin">{idea.started}</span>
            {idea.tags.map((t) => (
              <span key={t} className="before:me-3 before:content-['·']">
                {t}
              </span>
            ))}
          </div>

          {idea.freedUrl && (
            <a
              href={idea.freedUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-sm text-gold underline-offset-4 hover:underline"
            >
              انتقلت إلى مشروع مستقل ↗
            </a>
          )}
        </header>

        <View />
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-8">
        <Link
          href="/"
          className="text-sm text-faint transition-colors hover:text-paper"
        >
          ← كل الأفكار
        </Link>
      </footer>
    </>
  );
}
