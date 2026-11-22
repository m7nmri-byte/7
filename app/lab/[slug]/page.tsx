import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusChip } from "@/components/StatusChip";
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
  if (!idea) return {};
  return { title: idea.title, description: idea.summary };
}

export default async function LabPage({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const idea = getIdea(slug);
  const View = views[slug];
  if (!idea || !View) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10 flex flex-col gap-4 border-b border-edge pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">{idea.title}</h1>
          <StatusChip status={idea.status} />
        </div>

        <p className="max-w-prose leading-relaxed text-muted">{idea.summary}</p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
          <span className="mark">{idea.started}</span>
          {idea.tags.map((t) => (
            <span key={t} className="before:me-2 before:content-['·']">
              {t}
            </span>
          ))}
        </div>

        {idea.freedUrl && (
          <a
            href={idea.freedUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-full bg-clay-soft px-4 py-2 text-sm font-medium text-clay transition-opacity hover:opacity-80"
          >
            انتقلت إلى مشروع مستقل ↗
          </a>
        )}
      </header>

      <View />
    </main>
  );
}
