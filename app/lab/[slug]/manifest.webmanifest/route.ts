import { getIdea, ideas } from "@/ideas";

export const dynamicParams = false;

export function generateStaticParams() {
  return ideas.map(({ slug }) => ({ slug }));
}

/**
 * ملف تعريف مستقل لكل أداة.
 * ما يجعل النظام يراها تطبيقًا قائمًا بذاته هو اختلاف id و scope
 * و start_url — فتُثبَّت كل أداة بأيقونتها واسمها، من الموقع نفسه.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const idea = getIdea(slug);
  if (!idea) return new Response("Not found", { status: 404 });

  const base = `/lab/${slug}`;

  return Response.json({
    id: base,
    name: idea.title,
    short_name: idea.title,
    description: idea.summary,
    start_url: base,
    scope: base,
    display: "standalone",
    orientation: idea.orientation ?? "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: idea.appBg ?? idea.icon.bg,
    theme_color: idea.appBg ?? idea.icon.bg,
    icons: [
      {
        src: `${base}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  });
}
