import { ImageResponse } from "next/og";
import { getIdea, iconSvg, ideas } from "@/ideas";

export const dynamicParams = false;
const SIZE = 512;

export function generateStaticParams() {
  return ideas.map(({ slug }) => ({ slug }));
}

/** أيقونة الأداة كصورة PNG — تُولَّد من تعريفها في السجل */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const idea = getIdea(slug);
  if (!idea) return new Response("Not found", { status: 404 });

  const svg = iconSvg(idea.icon, SIZE);
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: idea.icon.bg,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={SIZE} height={SIZE} alt="" />
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
