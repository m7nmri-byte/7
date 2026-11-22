import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIdea, ideas, views } from "@/ideas";

/** لا تُقبل إلا الأدوات المعرّفة في السجل — أي مسار آخر 404 */
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

  const base = `/lab/${slug}`;
  return {
    title: idea.title,
    description: idea.summary,
    // ملف تعريف خاص بالأداة: يجعلها تطبيقًا مستقلًا عند التثبيت
    manifest: `${base}/manifest.webmanifest`,
    icons: {
      icon: [{ url: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" }],
      apple: [{ url: `${base}/icon-192.png`, sizes: "192x192" }],
    },
    appleWebApp: {
      capable: true,
      title: idea.title,
      statusBarStyle: "black-translucent",
    },
  };
}

/**
 * الأداة تملأ الصفحة وحدها.
 * لا عنوان ولا وصف من الموقع فوقها: كل أداة موقع مستقل، وما يعرّف
 * بها يكون داخلها لا في إطار يسبقها.
 */
export default async function LabPage({ params }: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const View = views[slug];
  if (!getIdea(slug) || !View) notFound();

  return <View />;
}
