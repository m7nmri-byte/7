import { createHash } from "node:crypto";

/**
 * توقيع رفع إلى Cloudinary.
 *
 * الرفع يتم من المتصفح مباشرة إلى Cloudinary — لا يمرّ الملف بخادمنا
 * فلا يستهلك حدوده. وما يصدر من هنا توقيعٌ قصير الأجل لا المفتاح
 * السري نفسه، فيبقى السر على الخادم وحده.
 */

/**
 * فحص شكل بيانات الاعتماد قبل استعمالها.
 *
 * لوحة Cloudinary تعرض المفتاح والسرّ مخفيَّين («3847…»)، ومن نسخ
 * المعروض بدل الحقيقي حُفظت عنده النقاط. وكان الخادم يوقّع بها ثم
 * يردّ Cloudinary «Invalid api_key 3847…» في وجه المستخدم — رسالةٌ
 * لا تدلّ على موضع العلّة. فيُكشف هنا، بعبارةٍ تقول ما يُصلحه.
 */
function badCredential(name: string, value: string): string | null {
  if (value.includes("…") || value.includes("...")) {
    return `${name} محفوظ مخفيًّا (فيه نقاط) — انسخ القيمة الكاملة من Cloudinary`;
  }
  if (value !== value.trim()) {
    return `${name} حوله مسافة زائدة`;
  }
  return null;
}

export async function POST(req: Request) {
  const cloud = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  const key = (process.env.CLOUDINARY_API_KEY ?? "").trim();
  const secret = (process.env.CLOUDINARY_API_SECRET ?? "").trim();

  if (!cloud || !key || !secret) {
    return Response.json(
      { error: "إعدادات Cloudinary غير مكتملة على الخادم" },
      { status: 500 },
    );
  }

  const problem =
    badCredential("مفتاح Cloudinary", key) ??
    badCredential("سرّ Cloudinary", secret) ??
    (/^\d{12,}$/.test(key) ? null : "مفتاح Cloudinary ليس رقمًا كاملًا — انسخه من جديد") ??
    (secret.length >= 20 ? null : "سرّ Cloudinary أقصر مما ينبغي — انسخه من جديد");

  if (problem) {
    return Response.json({ error: problem }, { status: 500 });
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
