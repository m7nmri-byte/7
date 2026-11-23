import { createHash } from "node:crypto";

/**
 * توقيع رفع إلى Cloudinary.
 *
 * الرفع يتم من المتصفح مباشرة إلى Cloudinary — لا يمرّ الملف بخادمنا
 * فلا يستهلك حدوده. وما يصدر من هنا توقيعٌ قصير الأجل لا المفتاح
 * السري نفسه، فيبقى السر على الخادم وحده.
 */
export async function POST(req: Request) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    return Response.json(
      { error: "إعدادات Cloudinary غير مكتملة على الخادم" },
      { status: 500 },
    );
  }

  let folder = "matam";
  try {
    const body = (await req.json()) as { folder?: string };
    if (typeof body.folder === "string" && /^[a-z0-9_/-]{1,40}$/i.test(body.folder)) {
      folder = body.folder;
    }
  } catch {
    /* بلا جسم — نكتفي بالمجلّد الافتراضي */
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // التوقيع: الوسائط مرتّبة أبجديًا ثم السرّ، بخوارزمية sha1 كما يشترط Cloudinary
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  return Response.json({
    cloudName: cloud,
    apiKey: key,
    timestamp,
    folder,
    signature,
  });
}
